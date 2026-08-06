/**
 * Imports the "Book1 Staff" workbook (staff register) into the ERP HR rail:
 *   - one row -> User + Employee (1:1 via Employee.user)
 *   - posting columns   -> workLocation / projectAssignment / department
 *   - salary columns    -> Employee.salary (annualised) + compensation + salaryHistory
 *   - statutory columns -> bankDetails + statutory (UAN, PF/ESIC applicability)
 *   - reporting column  -> reportingAuthority (text) + manager (resolved Employee ref)
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/importStaffWorkbook.ts --file "<path.xlsx>" --parse-only
 *   npx ts-node --transpile-only src/scripts/importStaffWorkbook.ts --file "<path.xlsx>" --dry-run
 *   npx ts-node --transpile-only src/scripts/importStaffWorkbook.ts --file "<path.xlsx>"
 *
 * --parse-only validates the workbook and the name matching without opening a
 * database connection; --dry-run adds the reads needed to report merges.
 *
 * Idempotent: staff are matched on the deterministic <slug>@staff.rayerp.local
 * address, then on a scored name match against employees the project-workbook
 * import already created, so re-runs update in place instead of duplicating.
 * Reads MONGO_URI from env.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import Employee, { EMPLOYMENT_CATEGORIES, EmploymentCategory, ISalaryRevision } from '../models/Employee';
import User from '../models/User';
import { Role } from '../models/Role';

dotenv.config();

const PARSE_ONLY = process.argv.includes('--parse-only');
const DRY_RUN = process.argv.includes('--dry-run') || PARSE_ONLY;
const fileFlag = process.argv.indexOf('--file');
// --inspect <name fragment> prints the mapped document for matching rows.
const inspectFlag = process.argv.indexOf('--inspect');
const INSPECT = inspectFlag !== -1 ? process.argv[inspectFlag + 1]?.toLowerCase() : undefined;
const FILE = fileFlag !== -1 ? process.argv[fileFlag + 1] : undefined;
if (!FILE) throw new Error('Missing --file <path to workbook.xlsx>');

const SHEET = 'Sheet1';
const HEADER_ROW = 2;
const STAFF_EMAIL_DOMAIN = 'staff.rayerp.local';

/**
 * Register rows whose pay must not be loaded, by serial number in column 1.
 * Their directory details (name, posting, contact) are still imported; only the
 * salary, compensation and payroll periods are skipped. 33 and 66 are the staff
 * carried as excluded on the monthly salary sheet, 89-93 are the KPMG contract
 * staff, who are payrolled separately.
 */
const NO_PAYROLL = new Set([33, 66, 89, 90, 91, 92, 93]);

// Column positions in the staff register.
const COL = {
  serialNo: 1, name: 2, designation: 3, location: 4, project: 5, reportsTo: 6,
  qualification: 7, category: 8,
  march: 9, incrementAmount: 10, incrementPercent: 11, april: 12, may: 13, june: 14,
  tds: 15, pf: 16, ptax: 17, esic: 18, netSalary: 19,
  contact: 20, dob: 21, doj: 22, asOf: 23, relieving: 24,
  bankAccount: 25, bankName: 26, ifsc: 27, uan: 28,
  experienceInCompany: 29, totalExperience: 30,
} as const;

// The four monthly salary columns and the period each one stands for.
const SALARY_PERIODS: { col: number; label: string; effectiveFrom: string }[] = [
  { col: COL.march, label: 'March-26', effectiveFrom: '2026-03-01' },
  { col: COL.april, label: 'April-26', effectiveFrom: '2026-04-01' },
  { col: COL.may, label: 'May-26', effectiveFrom: '2026-05-01' },
  { col: COL.june, label: 'June-26', effectiveFrom: '2026-06-01' },
];

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
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[, ₹]/g, ''));
  return isNaN(n) || !isFinite(n) ? null : n;
};

const date = (s: string): Date | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? undefined : d;
};

const emailSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

// "9619844232 - 9869912867" -> ['9619844232', '9869912867']
const phones = (s: string): string[] =>
  (s.match(/\d[\d\s]{5,}/g) ?? []).map(p => p.replace(/\s+/g, '')).filter(Boolean);

// --- name matching -----------------------------------------------------------
// The register writes the same person several ways ("Kajal Thakkar" in the
// reporting column, "Kajal Bhadreshbhai Thakkar" in the name column), so
// reporting lines and pre-existing records are matched on scored name tokens
// rather than string equality.

const tokens = (name: string): string[] =>
  name
    .toLowerCase()
    .replace(/[^a-z\s]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);

const levenshtein1 = (a: string, b: string): boolean => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

// Two name tokens refer to the same word: identical, one an abbreviation of the
// other ("ankur" / "ankurkumar"), or a single-character typo ("dongre"/"dongare").
const tokenMatch = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return a.length >= 5 && b.length >= 5 && levenshtein1(a, b);
};

// Only tokens this long carry enough signal to identify a person.
const SIGNIFICANT = 4;

const nameScore = (query: string[], candidate: string[]): number => {
  let score = 0;
  for (const q of query) {
    if (!candidate.some(c => tokenMatch(q, c))) continue;
    score += q.length >= SIGNIFICANT ? 2 : 1;
  }
  // At least one long token must line up, or "C. C." would match anyone.
  const hasStrong = query.some(q => q.length >= SIGNIFICANT && candidate.some(c => tokenMatch(q, c)));
  return hasStrong ? score : 0;
};

/**
 * How well a register row accounts for an already-stored name.
 *
 * `confident` is the bar for merging two records, and it is deliberately
 * strict: every meaningful word of the stored name must be accounted for, and
 * any initials must be consistent. "Nikhi Sheth" therefore does not merge into
 * "Biswal Nikhilkumar Mohanbhai" on the forename alone. A missed merge leaves a
 * duplicate a human can fix; a wrong merge fuses two people's payroll records.
 */
const matchQuality = (rowName: string, existingName: string): { score: number; confident: boolean } => {
  const rowT = tokens(rowName);
  const exT = tokens(existingName);
  const score = nameScore(exT, rowT);
  if (score === 0) return { score: 0, confident: false };

  const exSignificant = exT.filter(t => t.length >= SIGNIFICANT);
  const exInitials = exT.filter(t => t.length === 1);
  const allSignificantMatched =
    exSignificant.length > 0 && exSignificant.every(t => rowT.some(r => tokenMatch(t, r)));
  const initialsConsistent =
    exInitials.length === 0 || exInitials.some(i => rowT.some(r => r[0] === i));

  return { score, confident: allSignificantMatched && initialsConsistent };
};

/** Highest-scoring candidate, or null when nothing matched or the best is tied. */
function bestMatch<T>(query: string, candidates: T[], nameOf: (c: T) => string): T | null {
  const q = tokens(query);
  if (!q.length) return null;
  let best: T | null = null;
  let bestScore = 0;
  let tied = false;
  for (const c of candidates) {
    const score = nameScore(q, tokens(nameOf(c)));
    if (score > bestScore) { bestScore = score; best = c; tied = false; }
    else if (score > 0 && score === bestScore) tied = true;
  }
  return bestScore > 0 && !tied ? best : null;
}

// --- parsing -----------------------------------------------------------------

interface StaffRow {
  rowNumber: number;
  name: string;
  designation: string;
  workLocation: string;
  posting: string;      // raw "Project Name" cell
  reportsTo: string;
  qualification: string;
  category: string;
  incrementAmount: number | null;
  incrementPercent: number | null;
  tds: number | null;
  pf: number | null;
  ptax: number | null;
  esic: number | null;
  netSalary: number | null;
  salaries: { label: string; effectiveFrom: Date; monthlyGross: number }[];
  serialNo: number | null;
  phone?: string;
  alternatePhone?: string;
  experienceInCompany: string;
  dateOfBirth?: Date;
  hireDate?: Date;
  asOf?: Date;
  dateOfRelieving?: Date;
  bankAccount: string;
  bankName: string;
  ifsc: string;
  uan: string;
  totalExperienceYears: number | null;
}

// "Admin Department", "Project Department (VMC)" name a department; anything
// else in that column is a site or project posting.
const DEPARTMENT_LABEL = /department/i;

function parseStaff(wb: ExcelJS.Workbook): StaffRow[] {
  const ws = wb.getWorksheet(SHEET);
  if (!ws) throw new Error(`Sheet "${SHEET}" not found in workbook`);

  const rows: StaffRow[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= HEADER_ROW) return;
    const name = txt(row.getCell(COL.name)).replace(/\s+/g, ' ').trim();
    if (!name || /^name$/i.test(name)) return;

    // Every month the register states is kept, including repeats and the
    // zeros that mark "not yet on payroll" — the sheet is a payroll record and
    // a month with no change is still a month that was paid.
    const salaries: StaffRow['salaries'] = [];
    for (const period of SALARY_PERIODS) {
      const amount = num(txt(row.getCell(period.col)));
      if (amount === null) continue;
      salaries.push({
        label: period.label,
        effectiveFrom: new Date(`${period.effectiveFrom}T00:00:00.000Z`),
        monthlyGross: amount,
      });
    }

    const percent = num(txt(row.getCell(COL.incrementPercent)));
    const contactNumbers = phones(txt(row.getCell(COL.contact)));

    rows.push({
      rowNumber,
      name,
      designation: txt(row.getCell(COL.designation)).replace(/\s+/g, ' ').trim(),
      workLocation: txt(row.getCell(COL.location)).replace(/\s+/g, ' ').trim(),
      posting: txt(row.getCell(COL.project)).replace(/\s+/g, ' ').trim(),
      reportsTo: txt(row.getCell(COL.reportsTo)).replace(/\s+/g, ' ').trim(),
      qualification: txt(row.getCell(COL.qualification)).replace(/\s+/g, ' ').trim(),
      category: txt(row.getCell(COL.category)).replace(/\s+/g, ' ').trim(),
      incrementAmount: num(txt(row.getCell(COL.incrementAmount))),
      // The sheet stores a fraction; the model stores whole percent.
      incrementPercent: percent === null ? null : Math.round(percent * 10000) / 100,
      tds: num(txt(row.getCell(COL.tds))),
      pf: num(txt(row.getCell(COL.pf))),
      ptax: num(txt(row.getCell(COL.ptax))),
      esic: num(txt(row.getCell(COL.esic))),
      netSalary: num(txt(row.getCell(COL.netSalary))),
      salaries,
      serialNo: num(txt(row.getCell(COL.serialNo))),
      phone: contactNumbers[0],
      alternatePhone: contactNumbers[1],
      experienceInCompany: txt(row.getCell(COL.experienceInCompany)).replace(/\s+/g, ' ').trim(),
      dateOfBirth: date(txt(row.getCell(COL.dob))),
      hireDate: date(txt(row.getCell(COL.doj))),
      asOf: date(txt(row.getCell(COL.asOf))),
      dateOfRelieving: date(txt(row.getCell(COL.relieving))),
      bankAccount: txt(row.getCell(COL.bankAccount)).replace(/\s+/g, ''),
      bankName: txt(row.getCell(COL.bankName)).replace(/\s+/g, ' ').trim(),
      ifsc: txt(row.getCell(COL.ifsc)).replace(/\s+/g, '').toUpperCase(),
      uan: txt(row.getCell(COL.uan)).replace(/\s+/g, ''),
      totalExperienceYears: num(txt(row.getCell(COL.totalExperience))),
    });
  });
  return rows;
}

// --- mapping -----------------------------------------------------------------

const report = {
  parsed: 0,
  created: 0,
  updatedByEmail: 0,
  mergedByName: [] as string[],
  reviewCandidates: [] as string[],
  managersResolved: 0,
  reportingLines: [] as string[],
  unresolvedAuthorities: new Map<string, number>(),
  departmentLabels: new Set<string>(),
  missingHireDate: [] as string[],
  missingSalary: [] as string[],
  payrollSkipped: [] as string[],
  relieved: [] as string[],
};

function buildUpdate(row: StaffRow) {
  // Trailing zeros mean "not on payroll that month", so the live figure is the
  // most recent month that actually carries an amount.
  const paid = row.salaries.filter(s => s.monthlyGross > 0);
  const current = paid.length ? paid[paid.length - 1].monthlyGross : null;
  const isDepartment = DEPARTMENT_LABEL.test(row.posting);
  const category = (EMPLOYMENT_CATEGORIES as readonly string[]).includes(row.category)
    ? (row.category as EmploymentCategory)
    : undefined;

  if (isDepartment) report.departmentLabels.add(row.posting);
  if (!row.hireDate) report.missingHireDate.push(row.name);
  if (NO_PAYROLL.has(row.serialNo ?? -1)) report.payrollSkipped.push(`#${row.serialNo} ${row.name}`);
  else if (current === null) report.missingSalary.push(row.name);
  if (row.dateOfRelieving) report.relieved.push(row.name);

  const update: Record<string, any> = {
    position: row.designation || undefined,
    workLocation: row.workLocation || undefined,
    // "n/a" is how the register marks a person with no posting.
    projectAssignment: row.posting && !/^n\/?a$/i.test(row.posting) ? row.posting : undefined,
    reportingAuthority: row.reportsTo || undefined,
    qualification: row.qualification || undefined,
    employmentCategory: category,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth,
    dateOfRelieving: row.dateOfRelieving,
    totalExperienceYears: row.totalExperienceYears ?? undefined,
    alternatePhone: row.alternatePhone,
    experienceInCompany: row.experienceInCompany || undefined,
    registerSerialNo: row.serialNo ?? undefined,
    // A relieving date means the person has left, whatever the sheet's ordering.
    status: row.dateOfRelieving ? 'inactive' : 'active',
  };

  if (isDepartment) {
    update.department = row.posting;
    update.departments = [row.posting];
  }

  if (current !== null && !NO_PAYROLL.has(row.serialNo ?? -1)) {
    // `salary` stays the annual gross the rest of the ERP already assumes;
    // the register's monthly figures live in `compensation`.
    update.salary = current * 12;
    update.compensation = {
      monthlyGross: current,
      monthlyNet: row.netSalary ?? undefined,
      incrementAmount: row.incrementAmount ?? undefined,
      incrementPercent: row.incrementPercent ?? undefined,
      tds: row.tds ?? undefined,
      providentFund: row.pf ?? undefined,
      professionalTax: row.ptax ?? undefined,
      esic: row.esic ?? undefined,
      effectiveFrom: row.asOf ?? paid[paid.length - 1].effectiveFrom,
    };
    // The register carries a single deduction snapshot, stated "as of" the
    // Current Mount date, so it describes the last month it lists. Attaching it
    // to that period keeps the figures with the month they were paid in;
    // earlier months get the gross only, which is all the register states.
    const lastPaid = paid[paid.length - 1];
    const deductions = {
      tds: row.tds ?? undefined,
      providentFund: row.pf ?? undefined,
      professionalTax: row.ptax ?? undefined,
      esic: row.esic ?? undefined,
    };
    const hasDeductions = Object.values(deductions).some(v => v !== undefined);

    update.salaryHistory = row.salaries.map<ISalaryRevision>(s => {
      const isLast = s.label === lastPaid.label;
      return {
        effectiveFrom: s.effectiveFrom,
        label: s.label,
        monthlyGross: s.monthlyGross,
        ...(isLast ? {
          grossPaid: s.monthlyGross,
          netPaid: row.netSalary ?? undefined,
          ...(hasDeductions ? { deductions } : {}),
        } : {}),
        reason: 'Staff register import',
        recordedAt: new Date(),
      };
    });
  }

  if (row.bankAccount || row.bankName || row.ifsc) {
    update.bankDetails = {
      accountNumber: row.bankAccount || undefined,
      bankName: row.bankName || undefined,
      ifscCode: row.ifsc || undefined,
    };
  }

  // Applicability follows the deduction actually taken, not the category label:
  // the register carries both and they do not always agree.
  update.statutory = {
    uanNumber: row.uan || undefined,
    pfApplicable: (row.pf ?? 0) > 0,
    esicApplicable: (row.esic ?? 0) > 0,
  };

  for (const key of Object.keys(update)) {
    if (update[key] === undefined) delete update[key];
  }
  return update;
}

// --- import ------------------------------------------------------------------

interface Resolved {
  row: StaffRow;
  employeeId: mongoose.Types.ObjectId | null; // null in dry-run for new records
  name: string;
}

/**
 * Folds the register's periods into whatever salary history the employee
 * already has, instead of replacing the array: later payroll runs (a monthly
 * salary sheet) must survive a re-import of the register. `compensation` is
 * only moved when the register is at least as recent as what is stored, so a
 * re-run cannot roll a live figure back to an older month.
 */
async function mergeSalary(id: mongoose.Types.ObjectId, update: Record<string, any>) {
  if (!update.salaryHistory) return {};
  const doc: any = await Employee.findById(id).select('salaryHistory compensation salary').lean();
  const existing: ISalaryRevision[] = doc?.salaryHistory ?? [];
  const incoming: ISalaryRevision[] = update.salaryHistory;

  const byLabel = new Map<string, ISalaryRevision>();
  for (const rev of existing) byLabel.set(rev.label ?? String(rev.effectiveFrom), rev);
  for (const rev of incoming) {
    const key = rev.label ?? String(rev.effectiveFrom);
    // Keep any richer detail a later payroll run already recorded.
    const prev = byLabel.get(key);
    byLabel.set(key, prev ? { ...prev, ...rev, deductions: rev.deductions ?? prev.deductions } : rev);
  }
  const salaryHistory = [...byLabel.values()]
    .sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime());

  const storedAt = doc?.compensation?.effectiveFrom ? new Date(doc.compensation.effectiveFrom).getTime() : -Infinity;
  const incomingAt = update.compensation?.effectiveFrom ? new Date(update.compensation.effectiveFrom).getTime() : -Infinity;
  if (incomingAt < storedAt) {
    // Stored figures are newer; keep them, but restore any field the register
    // supplies and the newer sheet did not carry (increment amount/percent).
    const restored = { ...update.compensation, ...pruneUndefined(doc.compensation) };
    return { salaryHistory, compensation: restored, salary: doc.salary ?? update.salary };
  }
  return { salaryHistory };
}

const pruneUndefined = (o: Record<string, any> = {}) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));

async function upsertStaff(rows: StaffRow[], pendingRoleId: mongoose.Types.ObjectId | null): Promise<Resolved[]> {
  console.log('\n-- Staff --');

  if (PARSE_ONLY) {
    for (const row of rows) buildUpdate(row);
    report.created = rows.length;
    console.log(`  ${rows.length} rows mapped (no database consulted)`);
    return rows.map(row => ({ row, employeeId: null, name: row.name }));
  }

  // Records the project-workbook import created, available for name merging.
  const importedStaff = await Employee.find({ email: new RegExp(`@${STAFF_EMAIL_DOMAIN}$`) })
    .select('_id firstName lastName email');
  const resolved: Resolved[] = [];
  let seq = await Employee.countDocuments();

  // Exact-address matches are certain, so they are settled first and their
  // stored records are taken out of contention for name merging.
  const byEmail = new Map<number, any>();
  const claimed = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const email = `${emailSlug(row.name)}@${STAFF_EMAIL_DOMAIN}`;
    const hit = await Employee.findOne({ email }).select('_id firstName lastName email');
    if (!hit) continue;
    byEmail.set(index, hit);
    claimed.add(String(hit._id));
    report.updatedByEmail++;
  }

  // Score every remaining row against every unclaimed record and assign the
  // strongest pairs first, so "Rohit Anilkumar" wins the stored "Anilkumar
  // Rohit" over the merely surname-sharing "Rohit Kanubhai Ganeshbhai".
  const pairs: { index: number; existing: any; score: number; confident: boolean }[] = [];
  for (const [index, row] of rows.entries()) {
    if (byEmail.has(index)) continue;
    for (const existing of importedStaff) {
      const { score, confident } = matchQuality(row.name, `${existing.firstName} ${existing.lastName}`);
      if (score > 0) pairs.push({ index, existing, score, confident });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const byName = new Map<number, any>();
  for (const pair of pairs) {
    if (!pair.confident) continue;
    if (byName.has(pair.index) || claimed.has(String(pair.existing._id))) continue;
    byName.set(pair.index, pair.existing);
    claimed.add(String(pair.existing._id));
    report.mergedByName.push(
      `${rows[pair.index].name}  <-  ${pair.existing.firstName} ${pair.existing.lastName} (${pair.existing.email})`
    );
  }

  // Near-misses become a duplicate plus a note, never a silent merge.
  for (const pair of pairs) {
    if (pair.confident || byName.has(pair.index) || claimed.has(String(pair.existing._id))) continue;
    if (report.reviewCandidates.some(r => r.startsWith(`${rows[pair.index].name} `))) continue;
    report.reviewCandidates.push(
      `${rows[pair.index].name}  ~?~  ${pair.existing.firstName} ${pair.existing.lastName} (${pair.existing.email})`
    );
  }

  for (const [index, row] of rows.entries()) {
    const email = `${emailSlug(row.name)}@${STAFF_EMAIL_DOMAIN}`;
    const update = buildUpdate(row);
    const [firstName, ...rest] = row.name.split(/\s+/);
    const lastName = rest.join(' ');

    const existing = byEmail.get(index) ?? byName.get(index);

    if (existing) {
      resolved.push({ row, employeeId: existing._id, name: row.name });
      if (DRY_RUN) continue;
      // Excluded rows keep their directory entry but must carry no pay, so a
      // re-run also clears figures an earlier import may have written.
      const clearPay = NO_PAYROLL.has(row.serialNo ?? -1);
      const merged = clearPay ? {} : await mergeSalary(existing._id, update);
      await Employee.updateOne({ _id: existing._id }, {
        $set: { firstName, lastName, ...update, ...merged },
        ...(clearPay ? { $unset: { salary: '', compensation: '', salaryHistory: '' } } : {}),
      });
      await User.updateOne({ _id: (await Employee.findById(existing._id).select('user'))!.user }, {
        $set: { name: row.name },
      });
      continue;
    }

    report.created++;
    if (DRY_RUN) {
      resolved.push({ row, employeeId: null, name: row.name });
      continue;
    }

    const user = await User.create({
      name: row.name,
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: pendingRoleId,
      status: 'inactive',
    });
    seq++;
    const employee = await Employee.create({
      employeeId: `EMP-STF-${String(seq).padStart(3, '0')}`,
      firstName,
      lastName,
      email,
      // The register omits a joining date for a handful of recent hires.
      hireDate: row.hireDate ?? row.salaries.find(s => s.monthlyGross > 0)?.effectiveFrom ?? new Date(),
      user: user._id,
      ...update,
    });
    resolved.push({ row, employeeId: employee._id, name: row.name });
  }

  console.log(`  ${report.created} to create, ${report.updatedByEmail} matched by email, ` +
    `${report.mergedByName.length} merged by name`);
  return resolved;
}

async function resolveManagers(resolved: Resolved[]) {
  console.log('\n-- Reporting lines --');
  // Match against every row in the register, not just the ones already
  // persisted, so a dry-run reports the same links a real run would make.
  const roster = resolved.map((r, index) => ({ ...r, index }));

  for (const entry of roster) {
    const { row, employeeId } = entry;
    if (!row.reportsTo) continue;
    const match = bestMatch(row.reportsTo, roster, r => r.name);
    // A row cannot report to itself; the register does this where a team
    // leader's own line names their department head by surname.
    if (!match || match.index === entry.index) {
      report.unresolvedAuthorities.set(row.reportsTo, (report.unresolvedAuthorities.get(row.reportsTo) ?? 0) + 1);
      continue;
    }
    report.managersResolved++;
    report.reportingLines.push(`${row.name}  ->  ${match.name}   [register: "${row.reportsTo}"]`);
    if (DRY_RUN || !employeeId || !match.employeeId) continue;
    await Employee.updateOne({ _id: employeeId }, { $set: { manager: match.employeeId } });
  }

  console.log(`  ${report.managersResolved} reporting lines linked to an Employee record`);
  console.log(`  ${report.unresolvedAuthorities.size} authority names kept as text only`);
}

async function run() {
  let pendingRoleId: mongoose.Types.ObjectId | null = null;

  if (PARSE_ONLY) {
    console.log('PARSE ONLY — no database connection, no writes.');
  } else {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
    console.log(`Connected to database "${mongoose.connection.db?.databaseName}"`);
    if (DRY_RUN) console.log('DRY RUN — no writes will be performed.');

    const pendingRole = await Role.findOne({ name: 'Pending' }).select('_id');
    if (!pendingRole) throw new Error('Pending role not found.');
    pendingRoleId = pendingRole._id;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE!);

  const rows = parseStaff(wb);
  report.parsed = rows.length;
  console.log(`\nParsed ${rows.length} staff rows from "${SHEET}"`);

  if (INSPECT) {
    for (const row of rows.filter(r => r.name.toLowerCase().includes(INSPECT))) {
      console.log(`\n-- row ${row.rowNumber}: ${row.name} --`);
      console.log(JSON.stringify(buildUpdate(row), null, 2));
    }
  }

  const resolved = await upsertStaff(rows, pendingRoleId);
  await resolveManagers(resolved);

  console.log('\n================ SUMMARY ================');
  console.log(`Rows parsed        ${report.parsed}`);
  console.log(`Employees created  ${report.created}`);
  console.log(`Updated by email   ${report.updatedByEmail}`);
  console.log(`Merged by name     ${report.mergedByName.length}`);
  for (const m of report.mergedByName) console.log(`    ${m}`);
  if (report.reviewCandidates.length) {
    console.log(`\nPossible duplicates — NOT merged, review manually (${report.reviewCandidates.length}):`);
    for (const r of report.reviewCandidates) console.log(`    ${r}`);
  }
  console.log(`\nManagers linked    ${report.managersResolved}`);
  for (const l of report.reportingLines) console.log(`    ${l}`);

  if (report.unresolvedAuthorities.size) {
    console.log('\nReporting authorities with no matching staff record (kept as text):');
    for (const [name, count] of [...report.unresolvedAuthorities].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${name} (${count} row${count === 1 ? '' : 's'})`);
    }
  }
  if (report.departmentLabels.size) {
    console.log('\nDepartment labels taken from the register:');
    for (const d of [...report.departmentLabels].sort()) console.log(`    ${d}`);
  }
  if (report.missingHireDate.length) {
    console.log(`\nNo joining date in the register (${report.missingHireDate.length}):`);
    for (const n of report.missingHireDate) console.log(`    ${n}`);
  }
  if (report.payrollSkipped.length) {
    console.log(`\nPay NOT loaded — excluded rows (${report.payrollSkipped.length}):`);
    for (const n of report.payrollSkipped) console.log(`    ${n}`);
  }
  if (report.missingSalary.length) {
    console.log(`\nNo salary figure in the register (${report.missingSalary.length}):`);
    for (const n of report.missingSalary) console.log(`    ${n}`);
  }
  if (report.relieved.length) {
    console.log(`\nMarked inactive — relieving date present (${report.relieved.length}):`);
    for (const n of report.relieved) console.log(`    ${n}`);
  }
  console.log('========================================');

  if (!PARSE_ONLY) await mongoose.disconnect();
}

run().catch(async err => {
  console.error(err);
  if (!PARSE_ONLY) await mongoose.disconnect();
  process.exit(1);
});
