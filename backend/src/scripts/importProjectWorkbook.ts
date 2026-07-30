/**
 * Imports the "Project List ... Works Order Lists" workbook into the ERP:
 *   - client organisations          -> Contact (contactType 'client')
 *   - site engineers / team leaders -> User + Employee (HR rail, 1:1 via Employee.user)
 *   - PMC / DPR / Consultancy / TPI / Misc. Works rows -> Project
 *   - VMC Water Supply and BMC Bhavnagar rows          -> Project + Budget (stage fees)
 *   - WASMO villages, grouped by district              -> Project + Budget (villages)
 *   - VMC outstanding bills                            -> FinancialEntry ('invoice-raised')
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/importProjectWorkbook.ts --file "<path.xlsx>" --dry-run
 *   npx ts-node --transpile-only src/scripts/importProjectWorkbook.ts --file "<path.xlsx>"
 *
 * Idempotent: projects are matched on name+client, contacts on name, employees on
 * email, financial entries on project+description+amount. Reads MONGO_URI from env.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import Project from '../models/Project';
import Budget from '../models/Budget';
import Contact from '../models/Contact';
import Employee from '../models/Employee';
import FinancialEntry from '../models/FinancialEntry';
import User from '../models/User';
import { Role } from '../models/Role';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const MARK_COMPLETED = process.argv.includes('--mark-completed');
const FIX_WASMO = process.argv.includes('--fix-wasmo');
const fileFlag = process.argv.indexOf('--file');
const FILE = fileFlag !== -1 ? process.argv[fileFlag + 1] : undefined;
if (!FILE) throw new Error('Missing --file <path to workbook.xlsx>');

// Rows with no parseable work-order date get this start/end date and a marker tag.
const FALLBACK_DATE = new Date('2026-07-30T00:00:00.000Z');
const UNKNOWN_DATE_TAG = 'date-unknown';
const IMPORT_TAG = 'workbook-import';
const STAFF_EMAIL_DOMAIN = 'staff.rayerp.local';
const RECEIVABLES_PROJECT = 'Vadodara Municipal Corporation - Outstanding Receivables';

// --- cell helpers ------------------------------------------------------------

const txt = (cell: ExcelJS.Cell): string => {
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const f = v as ExcelJS.CellFormulaValue & { richText?: { text: string }[] };
    if (f.result instanceof Date) return f.result.toISOString().slice(0, 10);
    if (f.result !== undefined && f.result !== null) return String(f.result).trim();
    if (f.richText) return f.richText.map(t => t.text).join('').trim();
    return (cell.text || '').trim();
  }
  return String(v).trim();
};

const num = (s: string): number | null => {
  const n = parseFloat(String(s).replace(/[, ₹]/g, ''));
  return isNaN(n) ? null : n;
};

// "184/2025\n\nDate-24.06.2025" -> { wo: '184/2025', date: Date }
const parseWorkOrder = (s: string): { wo: string; date: Date | null } => {
  if (!s) return { wo: '', date: null };
  const m = s.match(/Date[-\s:]*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/i);
  const date = m ? new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00.000Z`) : null;
  const wo = s.replace(/Date[-\s:]*[\d.\/-]+/i, '').replace(/\s+/g, ' ').trim();
  return { wo, date: date && !isNaN(date.getTime()) ? date : null };
};

// "07.07.23" -> Date
const parseShortDate = (s: string): Date | null => {
  const m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (!m) return null;
  const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
  const d = new Date(`${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
};

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

// --- staff name classification ----------------------------------------------

// Contractor firms and free-text notes that must not become Employee records.
const FIRM_PATTERN = /(const\.|construction|infracon|\binfra\b|engineering|water works|benchmark|project handle)/i;

// People whose names are written in caps and would otherwise read as firms.
const PERSON_OVERRIDES = new Set(['c m jadeja']);

const isFirmOrNote = (raw: string): boolean => {
  // Drop the parenthetical employer first — "Karanbhai Rada (K K Engineering)"
  // is a person, not a firm.
  const s = raw.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return true;
  if (PERSON_OVERRIDES.has(s.toLowerCase())) return false;
  if (FIRM_PATTERN.test(s)) return true;
  // All-caps entries in these columns are firm names, not people.
  if (s === s.toUpperCase() && /[A-Z]{3}/.test(s)) return true;
  return false;
};

// "Ankit Gurbani\n(EDEN Infratructure)" -> ['Ankit Gurbani']
// "Dhvani Rathod / Rinkal Master"       -> ['Dhvani Rathod', 'Rinkal Master']
const splitPeople = (raw: string): string[] =>
  raw
    .replace(/\([^)]*\)/g, ' ')
    .split('/')
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 1 && p.length < 40);

const emailSlug = (name: string) =>
  name
    .replace(/\bsir\b/gi, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

// --- report ------------------------------------------------------------------

const report = {
  contacts: { created: 0, skipped: 0 },
  staff: { created: 0, skipped: 0, firmsIgnored: new Set<string>() },
  projects: { created: 0, skipped: 0, duplicatesInFile: 0, noDate: 0, clientRepaired: 0, refreshed: 0 },
  budgets: { created: 0, skipped: 0, refreshed: 0 },
  financialEntries: { created: 0, skipped: 0 },
};

// --- parsing -----------------------------------------------------------------

interface RegisterRow {
  sheet: string;
  name: string;
  client: string;
  siteEngineer: string;
  teamLeader: string;
  workOrder: string;
  startDate: Date | null;
  cost: number | null;
  fee: number | null;       // amount, or a rate below 1 (see feeRate)
  totalFee: number | null;  // "Total Consultancy Fee" — the computed amount
  copy: string;             // "Original" / "Zerox"
  link: string;
  tenderId: string;
}

interface RegisterCols {
  name: number; client: number; se: number; tl: number; wo: number;
  cost: number; fee: number; totalFee?: number; copy?: number; link?: number; tenderId?: number;
}

const REGISTERS: Record<string, RegisterCols> = {
  'PMC': { name: 2, client: 3, se: 4, tl: 5, wo: 6, cost: 7, fee: 8, totalFee: 9, copy: 10, link: 11 },
  'DPR': { name: 2, client: 3, se: 4, tl: 5, wo: 7, cost: 8, fee: 9, copy: 10, link: 11, tenderId: 6 },
  'Consultancy Services': { name: 2, client: 3, se: 4, tl: 5, wo: 6, cost: 7, fee: 8, copy: 9, link: 10 },
  'TPI': { name: 2, client: 3, se: 4, tl: 5, wo: 6, cost: 7, fee: 8, totalFee: 9, copy: 10, link: 11 },
  'Misc. Works': { name: 2, client: 3, se: 4, tl: 5, wo: 6, cost: 7, fee: 8, copy: 9, link: 10 },
};

const cellAt = (row: ExcelJS.Row, col?: number) => (col ? txt(row.getCell(col)) : '');

function parseRegisters(wb: ExcelJS.Workbook): RegisterRow[] {
  const rows: RegisterRow[] = [];
  for (const [sheet, c] of Object.entries(REGISTERS)) {
    const ws = wb.getWorksheet(sheet);
    if (!ws) continue;
    // Continuation sub-items leave the client cell blank; it carries down
    // from the last row that named one.
    let lastClient = '';
    ws.eachRow((row, rn) => {
      if (rn < 4) return;
      const name = txt(row.getCell(c.name));
      const cellClient = txt(row.getCell(c.client));
      if (cellClient) lastClient = cellClient;
      const client = cellClient || lastClient;
      // merged section-title rows repeat the same text across the row
      if (!name || name === cellClient) return;
      if (/^(sr\.? ?no|project name)$/i.test(name)) return;
      const { wo, date } = parseWorkOrder(txt(row.getCell(c.wo)));
      rows.push({
        sheet,
        name,
        client,
        siteEngineer: txt(row.getCell(c.se)),
        teamLeader: txt(row.getCell(c.tl)),
        workOrder: wo,
        startDate: date,
        cost: num(txt(row.getCell(c.cost))),
        fee: num(txt(row.getCell(c.fee))),
        totalFee: c.totalFee ? num(txt(row.getCell(c.totalFee))) : null,
        copy: cellAt(row, c.copy),
        link: cellAt(row, c.link),
        tenderId: cellAt(row, c.tenderId),
      });
    });
  }
  return rows;
}

interface StageRow {
  name: string;
  client: string;
  workOrder: string;
  startDate: Date | null;
  cost: number | null;
  fee: number | null;
  received: number | null;
  stages: { name: string; amount: number }[];
}

function parseVmc(wb: ExcelJS.Workbook): StageRow[] {
  const ws = wb.getWorksheet('VMC - Water Supply ');
  if (!ws) return [];
  const labels: string[] = [];
  const header = ws.getRow(2);
  for (let i = 7; i <= 13; i++) labels.push(txt(header.getCell(i)) || `Stage ${i - 6}`);
  const out: StageRow[] = [];
  ws.eachRow((row, rn) => {
    if (rn < 5) return;
    const name = txt(row.getCell(2));
    if (!name) return;
    const stages: { name: string; amount: number }[] = [];
    for (let i = 7; i <= 13; i++) {
      const a = num(txt(row.getCell(i)));
      if (a) stages.push({ name: labels[i - 7].slice(0, 90), amount: a });
    }
    const woDate = txt(row.getCell(4));
    out.push({
      name,
      client: 'Vadodara Municipal Corporation',
      workOrder: txt(row.getCell(3)),
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(woDate) ? new Date(`${woDate}T00:00:00.000Z`) : null,
      cost: num(txt(row.getCell(5))),
      fee: num(txt(row.getCell(6))),
      received: num(txt(row.getCell(14))),
      stages,
    });
  });
  return out;
}

function parseBmc(wb: ExcelJS.Workbook): StageRow[] {
  const ws = wb.getWorksheet('BMC Status (Bhavnagar)');
  if (!ws) return [];
  const out: StageRow[] = [];
  ws.eachRow((row, rn) => {
    if (rn < 4) return;
    const name = txt(row.getCell(3));
    if (!name || /project name/i.test(name)) return;
    // merged cells repeat values; collect distinct stage amounts from cols 11..21
    const stages: { name: string; amount: number }[] = [];
    const seen = new Set<number>();
    for (let i = 11; i <= 21; i++) {
      const a = num(txt(row.getCell(i)));
      if (a && !seen.has(a)) {
        seen.add(a);
        stages.push({ name: `Stage ${stages.length + 1}`, amount: a });
      }
    }
    out.push({
      name,
      client: 'Bhavnagar Municipal Corporation',
      workOrder: '',
      startDate: null,
      cost: num(txt(row.getCell(6))),
      fee: num(txt(row.getCell(9))),
      received: null,
      stages,
    });
  });
  return out;
}

interface WasmoVillage {
  village: string;
  cost: number;
  stages: { name: string; amount: number }[];
  completion: string;
  sdAmount: string;
  from3A: string;
}

interface WasmoDistrict {
  district: string;
  villages: WasmoVillage[];
}

function parseWasmo(wb: ExcelJS.Workbook): WasmoDistrict[] {
  const ws = wb.getWorksheet('WASMO - Bill Status');
  if (!ws) return [];
  // Row 2 names the 8 billing stages in columns 5..12.
  const header = ws.getRow(2);
  const stageLabels: string[] = [];
  for (let i = 5; i <= 12; i++) stageLabels.push(txt(header.getCell(i)) || `Stage ${i - 4}`);

  const byDistrict = new Map<string, WasmoVillage[]>();
  let current = '';
  ws.eachRow((row, rn) => {
    if (rn < 4) return;
    // District names are written inconsistently ("DEVBHUMI\nDWARKA" vs
    // "DEVBHUMI DWARKA"); collapse whitespace so both fold into one district.
    // The sheet also repeats its header mid-way — "District" is not a district.
    const d = txt(row.getCell(1)).replace(/\s+/g, ' ').trim();
    if (d && !/^district$/i.test(d)) current = d;
    const village = txt(row.getCell(3)).replace(/\s+/g, ' ').trim();
    if (!village || !current || /^village$/i.test(village)) return;
    const stages: { name: string; amount: number }[] = [];
    for (let i = 5; i <= 12; i++) {
      const a = num(txt(row.getCell(i)));
      if (a) stages.push({ name: stageLabels[i - 5].slice(0, 90), amount: a });
    }
    byDistrict.set(current, [
      ...(byDistrict.get(current) || []),
      {
        village,
        cost: num(txt(row.getCell(4))) || 0,
        stages,
        completion: txt(row.getCell(13)),
        sdAmount: txt(row.getCell(14)),
        from3A: txt(row.getCell(15)),
      },
    ]);
  });
  return [...byDistrict.entries()].map(([district, villages]) => ({ district, villages }));
}

interface OutstandingBill {
  date: Date | null;
  name: string;
  amount: number;
  remarks: string;
}

function parseOutstanding(wb: ExcelJS.Workbook): OutstandingBill[] {
  const ws = wb.getWorksheet('VMC Outstanding Details');
  if (!ws) return [];
  const out: OutstandingBill[] = [];
  ws.eachRow((row, rn) => {
    if (rn < 4) return;
    const name = txt(row.getCell(3));
    const amount = num(txt(row.getCell(4)));
    if (!name || !amount) return;
    out.push({ date: parseShortDate(txt(row.getCell(2))), name, amount, remarks: txt(row.getCell(5)) });
  });
  return out;
}

// --- import ------------------------------------------------------------------

async function upsertContacts(clients: string[], actorId: mongoose.Types.ObjectId) {
  console.log('\n-- Client contacts --');
  for (const name of clients) {
    const existing = await Contact.findOne({ name }).select('_id');
    if (existing) { report.contacts.skipped++; continue; }
    report.contacts.created++;
    if (DRY_RUN) continue;
    await Contact.create({
      name,
      phone: 'N/A',
      company: name,
      contactType: 'client',
      visibilityLevel: 'universal',
      status: 'active',
      notes: 'Imported from the Project List workbook. Phone not supplied in source.',
      createdBy: actorId,
    });
  }
  console.log(`  ${report.contacts.created} to create, ${report.contacts.skipped} already present`);
}

// Returns name -> User._id for engineers/team leaders that are real people.
async function upsertStaff(rawNames: string[], pendingRoleId: mongoose.Types.ObjectId) {
  console.log('\n-- Site engineers / team leaders --');
  const people = new Set<string>();
  for (const raw of rawNames) {
    if (isFirmOrNote(raw)) { report.staff.firmsIgnored.add(raw.replace(/\s+/g, ' ').trim()); continue; }
    for (const p of splitPeople(raw)) people.add(p);
  }

  const map = new Map<string, mongoose.Types.ObjectId>();
  let seq = await Employee.countDocuments();
  for (const name of [...people].sort()) {
    const email = `${emailSlug(name)}@${STAFF_EMAIL_DOMAIN}`;
    const existing = await User.findOne({ email }).select('_id');
    if (existing) { report.staff.skipped++; map.set(name, existing._id); continue; }
    report.staff.created++;
    if (DRY_RUN) continue;
    const [firstName, ...rest] = name.split(/\s+/);
    const lastName = rest.filter(w => !/^sir$/i.test(w)).join(' ');
    const user = await User.create({
      name,
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: pendingRoleId,
      status: 'inactive',
    });
    seq++;
    await Employee.create({
      employeeId: `EMP-IMP-${String(seq).padStart(3, '0')}`,
      firstName,
      lastName: lastName || undefined,
      email,
      hireDate: FALLBACK_DATE,
      status: 'inactive',
      user: user._id,
    });
    map.set(name, user._id);
  }
  console.log(`  ${report.staff.created} to create, ${report.staff.skipped} already present`);
  console.log(`  ${report.staff.firmsIgnored.size} contractor firms / notes kept as project tags only`);
  return map;
}

interface ProjectSpec {
  name: string;
  client: string;
  description: string;
  startDate: Date | null;
  budget: number;
  contractValue: number;
  received: number;
  tags: string[];
  team: mongoose.Types.ObjectId[];
  stages: { name: string; amount: number; items?: { name: string; amount: number }[] }[];
}

async function upsertProjects(specs: ProjectSpec[], actorId: mongoose.Types.ObjectId) {
  console.log('\n-- Projects --');
  const seen = new Set<string>();
  for (const s of specs) {
    const key = `${normalize(s.name)}|${normalize(s.client)}`;
    if (seen.has(key)) { report.projects.duplicatesInFile++; continue; }
    seen.add(key);

    let existing = await Project.findOne({ name: s.name, client: s.client }).select('_id');
    if (!existing && s.client) {
      // Repair rows imported before the client forward-fill existed.
      const orphan = await Project.findOne({
        name: s.name,
        tags: IMPORT_TAG,
        $or: [{ client: null }, { client: '' }],
      }).select('_id');
      if (orphan) {
        report.projects.clientRepaired++;
        if (!DRY_RUN) await Project.updateOne({ _id: orphan._id }, { $set: { client: s.client } });
        existing = orphan;
      }
    }
    if (existing) {
      report.projects.skipped++;
      await refreshProject(existing._id, s);
      if (s.stages.length) await upsertStageBudget(existing._id, s, actorId);
      continue;
    }
    report.projects.created++;
    const start = s.startDate || FALLBACK_DATE;
    if (!s.startDate) report.projects.noDate++;
    if (DRY_RUN) { if (s.stages.length) report.budgets.created++; continue; }

    const project = await Project.create({
      name: s.name,
      description: s.description,
      client: s.client,
      status: 'active',
      startDate: start,
      endDate: start,
      budget: s.budget,
      currency: 'INR',
      owner: actorId,
      managers: [actorId],
      team: s.team,
      tags: [...new Set([IMPORT_TAG, ...s.tags, ...(s.startDate ? [] : [UNKNOWN_DATE_TAG])])],
      financialProgress: {
        totalContractValue: s.contractValue,
        totalPaymentsReceived: s.received,
      },
    });
    if (s.stages.length) await upsertStageBudget(project._id, s, actorId);
  }
  console.log(`  ${report.projects.created} to create, ${report.projects.skipped} already present`);
  console.log(`  ${report.projects.duplicatesInFile} duplicate rows collapsed, ${report.projects.noDate} without a work-order date`);
  console.log(`  ${report.projects.clientRepaired} existing projects had a missing client filled in`);
  console.log(`  ${report.projects.refreshed} existing projects refreshed from the workbook`);
}

// Brings an already-imported project up to date with the workbook: corrects the
// contract value, and adds description lines and tags gained since first import.
async function refreshProject(projectId: mongoose.Types.ObjectId, s: ProjectSpec) {
  const current = await Project.findById(projectId).select('description tags financialProgress');
  if (!current) return;
  const wantTags = [...new Set([IMPORT_TAG, ...s.tags, ...(current.tags || []).filter(t => t === UNKNOWN_DATE_TAG)])];
  const changed =
    current.description !== s.description ||
    (current.financialProgress?.totalContractValue ?? 0) !== s.contractValue ||
    wantTags.some(t => !(current.tags || []).includes(t));
  if (!changed) return;
  report.projects.refreshed++;
  if (DRY_RUN) return;
  await Project.updateOne({ _id: projectId }, {
    $set: {
      description: s.description,
      'financialProgress.totalContractValue': s.contractValue,
    },
    $addToSet: { tags: { $each: wantTags } },
  });
}

const stageCategories = (s: ProjectSpec) =>
  s.stages.map(st => ({
    name: st.name,
    type: 'special' as const,
    allocatedAmount: st.amount,
    spentAmount: 0,
    currency: 'INR',
    items: (st.items || []).map(it => ({
      name: it.name,
      quantity: 1,
      unitCost: it.amount,
      totalCost: it.amount,
    })),
  }));

async function upsertStageBudget(
  projectId: mongoose.Types.ObjectId,
  s: ProjectSpec,
  actorId: mongoose.Types.ObjectId
) {
  const total = s.stages.reduce((t, x) => t + x.amount, 0);
  const existing = await Budget.findOne({ projectId, budgetType: 'project' }).select('_id totalBudget categories');
  if (existing) {
    const itemCount = (existing.categories || []).reduce((t, c) => t + (c.items?.length || 0), 0);
    const wantItems = s.stages.reduce((t, x) => t + (x.items?.length || 0), 0);
    if (Math.abs((existing.totalBudget || 0) - total) < 1 && itemCount === wantItems) {
      report.budgets.skipped++;
      return;
    }
    report.budgets.refreshed++;
    if (!DRY_RUN) {
      await Budget.updateOne({ _id: existing._id }, {
        $set: { totalBudget: total, categories: stageCategories(s), currency: 'INR' },
      });
    }
    return;
  }
  report.budgets.created++;
  if (DRY_RUN) return;
  await Budget.create({
    projectId,
    projectName: s.name,
    budgetName: `${s.name} - fee stages`.slice(0, 120),
    budgetType: 'project',
    fiscalYear: (s.startDate || FALLBACK_DATE).getUTCFullYear(),
    fiscalPeriod: 'FY',
    totalBudget: total,
    actualSpent: 0,
    currency: 'INR',
    status: 'active',
    createdBy: actorId,
    categories: stageCategories(s),
  });
}

async function importOutstanding(bills: OutstandingBill[], actorId: mongoose.Types.ObjectId) {
  console.log('\n-- VMC outstanding bills --');
  let projectId: mongoose.Types.ObjectId | undefined;
  const existingProject = await Project.findOne({ name: RECEIVABLES_PROJECT }).select('_id');
  if (existingProject) projectId = existingProject._id;
  else if (!DRY_RUN) {
    const p = await Project.create({
      name: RECEIVABLES_PROJECT,
      description: 'Outstanding client bills imported from the VMC Outstanding Details sheet.',
      client: 'Vadodara Municipal Corporation',
      status: 'active',
      startDate: FALLBACK_DATE,
      endDate: FALLBACK_DATE,
      budget: bills.reduce((t, b) => t + b.amount, 0),
      currency: 'INR',
      owner: actorId,
      managers: [actorId],
      tags: [IMPORT_TAG, 'receivables'],
    });
    projectId = p._id;
    report.projects.created++;
  }

  for (const b of bills) {
    if (projectId) {
      const dup = await FinancialEntry.findOne({ project: projectId, description: b.name, amount: b.amount }).select('_id');
      if (dup) { report.financialEntries.skipped++; continue; }
    }
    report.financialEntries.created++;
    if (DRY_RUN || !projectId) continue;
    await FinancialEntry.create({
      project: projectId,
      entryType: 'invoice-raised',
      amount: b.amount,
      currency: 'INR',
      description: b.name,
      vendorOrClient: 'Vadodara Municipal Corporation',
      date: b.date || FALLBACK_DATE,
      reportedBy: actorId,
      category: 'other',
      status: 'pending',
      ...(b.remarks ? { referenceNumber: b.remarks.slice(0, 80) } : {}),
    });
  }
  console.log(`  ${report.financialEntries.created} to create, ${report.financialEntries.skipped} already present`);
}

// A name first classified as a contractor but later recognised as a person keeps
// a stale "contractor:<name>" tag; swap it for team membership.
async function repairContractorTags(staffMap: Map<string, mongoose.Types.ObjectId>) {
  console.log('\n-- Contractor tag repair --');
  let fixed = 0;
  for (const [name, userId] of staffMap) {
    const tag = `contractor:${name}`;
    const stale = await Project.find({ tags: tag }).select('_id');
    for (const p of stale) {
      fixed++;
      if (DRY_RUN) continue;
      await Project.updateOne({ _id: p._id }, { $pull: { tags: tag }, $addToSet: { team: userId } });
    }
  }
  console.log(`  ${fixed} project(s) re-tagged from contractor to team member`);
}

// Imported projects that carried a real work-order date are historical, finished
// work; those with a placeholder date are left alone for review.
async function markCompleted() {
  console.log('\n-- Mark completed --');
  // The receivables container tracks unpaid bills and stays open.
  const filter = {
    tags: { $all: [IMPORT_TAG], $nin: [UNKNOWN_DATE_TAG, 'receivables'] },
    status: { $ne: 'completed' },
  };
  const n = await Project.countDocuments(filter);
  console.log(`  ${n} project(s) with a real work-order date -> status 'completed', progress 100`);
  if (!DRY_RUN && n) {
    const res = await Project.updateMany(filter, { $set: { status: 'completed', progress: 100 } });
    console.log(`  modified ${res.modifiedCount}`);
  }
}

// Repairs WASMO projects written before district names were whitespace-normalised,
// and reports the bogus project created from the sheet's repeated header row.
async function cleanupWasmoArtifacts() {
  console.log('\n-- WASMO artifact cleanup --');
  const wonky = await Project.find({ tags: 'WASMO', name: /\s\s|\n/ }).select('_id name tags');
  for (const p of wonky) {
    const clean = p.name.replace(/\s+/g, ' ').trim();
    const oldTag = (p.tags || []).find(t => t.startsWith('district:'));
    const newTag = oldTag ? `district:${oldTag.slice(9).replace(/\s+/g, ' ').trim()}` : null;
    console.log(`  rename "${p.name.replace(/\n/g, '\\n')}" -> "${clean}"`);
    if (DRY_RUN) continue;
    await Project.updateOne({ _id: p._id }, { $set: { name: clean } });
    if (oldTag && newTag && oldTag !== newTag) {
      await Project.updateOne({ _id: p._id }, { $pull: { tags: oldTag } });
      await Project.updateOne({ _id: p._id }, { $addToSet: { tags: newTag } });
    }
  }

  const bogus = await Project.findOne({ name: 'WASMO Water Supply Scheme - District' }).select('_id name');
  if (bogus) {
    if (FIX_WASMO) {
      await Budget.deleteMany({ projectId: bogus._id });
      await Project.deleteOne({ _id: bogus._id });
      console.log(`  deleted bogus header-row project "${bogus.name}" and its budget`);
    } else {
      console.log(`  FOUND bogus header-row project "${bogus.name}" (${bogus._id}) — pass --fix-wasmo to delete it`);
    }
  }
  if (!wonky.length && !bogus) console.log('  nothing to clean');
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
  console.log(`Connected to database "${mongoose.connection.db?.databaseName}"`);
  if (DRY_RUN) console.log('DRY RUN — no writes will be performed.');

  const actor = await User.findOne({ email: 'root@caa.ca' }).select('_id');
  if (!actor) throw new Error('Root user root@caa.ca not found.');
  const pendingRole = await Role.findOne({ name: 'Pending' }).select('_id');
  if (!pendingRole) throw new Error('Pending role not found.');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE!);

  const registers = parseRegisters(wb);
  const vmc = parseVmc(wb);
  const bmc = parseBmc(wb);
  const wasmo = parseWasmo(wb);
  const bills = parseOutstanding(wb);

  console.log(`\nParsed: ${registers.length} register rows, ${vmc.length} VMC, ${bmc.length} BMC, ` +
    `${wasmo.length} WASMO districts (${wasmo.reduce((t, d) => t + d.villages.length, 0)} villages), ${bills.length} bills`);

  const clients = [...new Set([
    ...registers.map(r => r.client),
    'Vadodara Municipal Corporation',
    'Bhavnagar Municipal Corporation',
    'WASMO',
  ].filter(Boolean))];
  await upsertContacts(clients, actor._id);

  const staffMap = await upsertStaff(
    registers.flatMap(r => [r.siteEngineer, r.teamLeader]).filter(Boolean),
    pendingRole._id
  );

  const resolveTeam = (r: RegisterRow) => {
    const ids: mongoose.Types.ObjectId[] = [];
    for (const raw of [r.siteEngineer, r.teamLeader].filter(Boolean)) {
      if (isFirmOrNote(raw)) continue;
      for (const p of splitPeople(raw)) {
        const id = staffMap.get(p);
        if (id && !ids.some(x => String(x) === String(id))) ids.push(id);
      }
    }
    return ids;
  };
  const firmTags = (r: RegisterRow) =>
    [r.siteEngineer, r.teamLeader]
      .filter(v => v && isFirmOrNote(v))
      .map(v => `contractor:${v.replace(/\s+/g, ' ').trim()}`);

  const specs: ProjectSpec[] = [
    ...registers.map(r => {
      // The fee column holds a percentage on some sheets (0.0058 = 0.58%) and a
      // rupee amount on others. Only values >= 1 are amounts; the real amount for
      // rate rows lives in "Total Consultancy Fee".
      const feeIsRate = r.fee !== null && r.fee < 1;
      const feeRate = feeIsRate ? r.fee : null;
      const contractValue = r.totalFee ?? (feeIsRate ? 0 : r.fee ?? 0);
      return {
        name: r.name,
        client: r.client,
        description: [r.name, `Client: ${r.client}`, r.workOrder ? `Work Order: ${r.workOrder}` : '',
          r.tenderId ? `Tender ID: ${r.tenderId}` : '',
          r.siteEngineer ? `Site Engineer: ${r.siteEngineer.replace(/\s+/g, ' ')}` : '',
          r.teamLeader ? `Team Leader: ${r.teamLeader.replace(/\s+/g, ' ')}` : '',
          feeRate !== null ? `Consultancy fee rate: ${(feeRate * 100).toFixed(2)}%` : '',
          r.link ? `Document link: ${r.link}` : ''].filter(Boolean).join('\n'),
        startDate: r.startDate,
        budget: r.cost || 0,
        contractValue,
        received: 0,
        tags: [r.sheet, ...firmTags(r), ...(r.copy ? [`wo-copy:${r.copy}`] : [])],
        team: resolveTeam(r),
        stages: [],
      };
    }),
    ...[...vmc, ...bmc].map(v => ({
      name: v.name,
      client: v.client,
      description: [v.name, `Client: ${v.client}`, v.workOrder ? `Work Order: ${v.workOrder}` : ''].filter(Boolean).join('\n'),
      startDate: v.startDate,
      budget: v.cost || 0,
      contractValue: v.fee || 0,
      received: v.received || 0,
      tags: [v.client === 'Vadodara Municipal Corporation' ? 'VMC Water Supply' : 'BMC Bhavnagar'],
      team: [],
      stages: v.stages,
    })),
    ...wasmo.map(d => {
      // project.budget carries the scheme cost; the budget record carries Ray's
      // fee, one category per village holding its 8 billing stages.
      const status = d.villages
        .filter(v => v.completion || v.sdAmount || v.from3A)
        .map(v => `  ${v.village}: ` + [
          v.completion ? `completed ${v.completion}` : '',
          v.sdAmount ? `SD ${v.sdAmount}` : '',
          v.from3A ? `From 3A ${v.from3A}` : '',
        ].filter(Boolean).join(', '));
      return {
        name: `WASMO Water Supply Scheme - ${d.district}`,
        client: 'WASMO',
        description: [
          `WASMO water supply scheme covering ${d.villages.length} village(s) in ${d.district} district.`,
          status.length ? `Village status:\n${status.join('\n')}` : '',
        ].filter(Boolean).join('\n'),
        startDate: null,
        budget: d.villages.reduce((t, v) => t + v.cost, 0),
        contractValue: d.villages.reduce((t, v) => t + v.stages.reduce((s, x) => s + x.amount, 0), 0),
        received: 0,
        tags: ['WASMO', `district:${d.district}`],
        team: [],
        stages: d.villages.map(v => ({
          name: v.village,
          amount: v.stages.reduce((t, x) => t + x.amount, 0),
          items: v.stages,
        })),
      };
    }),
  ];

  await cleanupWasmoArtifacts();
  await upsertProjects(specs, actor._id);
  await importOutstanding(bills, actor._id);
  await repairContractorTags(staffMap);
  if (MARK_COMPLETED) await markCompleted();

  console.log('\n=== Summary ===');
  console.log(`Contacts          ${report.contacts.created} created, ${report.contacts.skipped} skipped`);
  console.log(`Users+Employees   ${report.staff.created} created, ${report.staff.skipped} skipped`);
  console.log(`Projects          ${report.projects.created} created, ${report.projects.skipped} skipped`);
  console.log(`Budgets           ${report.budgets.created} created, ${report.budgets.refreshed} refreshed, ${report.budgets.skipped} skipped`);
  console.log(`Financial entries ${report.financialEntries.created} created, ${report.financialEntries.skipped} skipped`);
  if (report.staff.firmsIgnored.size) {
    console.log('\nContractor firms / notes NOT made into employees:');
    for (const f of [...report.staff.firmsIgnored].sort()) console.log(`  - ${f}`);
  }
  if (DRY_RUN) console.log('\nDRY RUN — re-run without --dry-run to apply.');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
