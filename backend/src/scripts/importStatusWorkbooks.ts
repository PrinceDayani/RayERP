/**
 * Applies a project-status manifest (built from the September 2026 status
 * workbooks and the Bhavnagar ongoing-works PDF) to the ERP:
 *   - missing client organisations          -> Contact (contactType 'client')
 *   - staff named in the sheets but absent   -> User + Employee (inactive)
 *   - new works                              -> Project (+ Task for listed sub-works)
 *   - works already in the ERP               -> status, progress and team updated; budget,
 *                                               dates, city and client link filled only when empty;
 *                                               a dated status block appended to the description
 *   - staff sheet                            -> Employee workLocation / position / projectAssignment
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/importStatusWorkbooks.ts --manifest <manifest.json> --dry-run
 *   npx ts-node --transpile-only src/scripts/importStatusWorkbooks.ts --manifest <manifest.json> --backup <backup.json>
 *   npx ts-node --transpile-only src/scripts/importStatusWorkbooks.ts --revert --backup <backup.json>
 *
 * Idempotent: created records carry the manifest importTag and are matched on it;
 * the description block is appended once per project. Reads MONGO_URI from env.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import Project from '../models/Project';
import Task from '../models/Task';
import Contact from '../models/Contact';
import Employee from '../modules/hr/employees/Employee';
import User from '../models/User';
import { Role } from '../models/Role';

dotenv.config();

const arg = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const DRY_RUN = process.argv.includes('--dry-run');
const REVERT = process.argv.includes('--revert');
const MANIFEST = arg('--manifest');
const BACKUP = arg('--backup');
if (REVERT && !BACKUP) throw new Error('--revert needs --backup <file>');
if (!REVERT && !MANIFEST) throw new Error('Missing --manifest <file>');
if (!REVERT && !DRY_RUN && !BACKUP) throw new Error('A real run needs --backup <file> so it can be reverted');

const STAFF_EMAIL_DOMAIN = 'staff.rayerp.local';
const IMPORT_DATE = new Date('2026-09-15T00:00:00.000Z');
const UNKNOWN_DATE_TAG = 'date-unknown';

interface ManifestTask { title: string; description: string; status: string; assignee: string }
interface ManifestProject {
  src: string[];
  action: 'create' | 'update';
  matchId?: string | null;
  name: string;
  client: string | null;
  city?: string | null;
  country?: string;
  category: string;
  status: string;
  progress?: number | null;
  budget?: number | null;
  contractValue?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  team: string[];
  contractors: string[];
  notes: string[];
  tasks: ManifestTask[];
}
interface ManifestStaff { src: string; employeeId: string; workLocation?: string; position?: string; projectAssignment?: string }
interface Manifest {
  importTag: string;
  newStaff: string[];
  clients: string[];
  projects: ManifestProject[];
  staff: ManifestStaff[];
  log: string[];
}

interface Backup {
  importTag: string;
  createdContacts: string[];
  createdUsers: string[];
  createdEmployees: string[];
  createdProjects: string[];
  createdTasks: string[];
  projects: Record<string, unknown>[];
  employees: Record<string, unknown>[];
}

const report = {
  contacts: { created: 0, present: 0 },
  staff: { created: 0, present: 0 },
  projects: { created: 0, present: 0, updated: 0, unchanged: 0, noDate: 0 },
  tasks: { created: 0, present: 0 },
  employees: { updated: 0, unchanged: 0 },
};

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
const day = (s?: string | null) => (s ? new Date(`${s}T00:00:00.000Z`) : null);

async function upsertContacts(m: Manifest, actorId: mongoose.Types.ObjectId, backup: Backup) {
  console.log('\n-- Client contacts --');
  const ids = new Map<string, mongoose.Types.ObjectId>();
  for (const name of m.clients) {
    const existing = await Contact.findOne({ name }).select('_id');
    if (existing) { report.contacts.present++; ids.set(name, existing._id); continue; }
    report.contacts.created++;
    console.log(`  + ${name}`);
    if (DRY_RUN) continue;
    const c = await Contact.create({
      name,
      phone: 'N/A',
      company: name,
      contactType: 'client',
      isCustomer: true,
      visibilityLevel: 'universal',
      status: 'active',
      tags: [m.importTag],
      notes: 'Imported from the project status workbooks. Phone not supplied in source.',
      createdBy: actorId,
    });
    backup.createdContacts.push(String(c._id));
    ids.set(name, c._id);
  }
  console.log(`  ${report.contacts.created} to create, ${report.contacts.present} already present`);
  return ids;
}

// Returns employee ref (EMP id or NEW:<name>) -> User._id
async function resolveStaff(m: Manifest, pendingRoleId: mongoose.Types.ObjectId, backup: Backup) {
  console.log('\n-- Staff --');
  const refs = new Set<string>([
    ...m.projects.flatMap(p => [...p.team, ...p.tasks.map(t => t.assignee)]),
    ...m.staff.map(s => s.employeeId),
  ]);
  const map = new Map<string, mongoose.Types.ObjectId>();
  const missing: string[] = [];
  for (const ref of refs) {
    if (ref.startsWith('NEW:')) continue;
    const e = await Employee.findOne({ employeeId: ref }).select('user');
    if (e?.user) map.set(ref, e.user as mongoose.Types.ObjectId);
    else missing.push(ref);
  }
  if (missing.length) throw new Error(`Employees not found: ${missing.join(', ')}`);

  const all = await Employee.find({ employeeId: /^EMP-IMP-\d+$/ }).select('employeeId').lean();
  let seq = Math.max(0, ...all.map(e => parseInt(e.employeeId.slice(8), 10)));
  for (const name of m.newStaff) {
    const email = `${slug(name)}@${STAFF_EMAIL_DOMAIN}`;
    const existing = await User.findOne({ email }).select('_id');
    if (existing) { report.staff.present++; map.set(`NEW:${name}`, existing._id); continue; }
    report.staff.created++;
    seq++;
    const employeeId = `EMP-IMP-${String(seq).padStart(3, '0')}`;
    console.log(`  + ${name} (${employeeId}, ${email}, inactive)`);
    if (DRY_RUN) continue;
    const [firstName, ...rest] = name.split(/\s+/);
    const user = await User.create({
      name,
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: pendingRoleId,
      status: 'inactive',
    });
    backup.createdUsers.push(String(user._id));
    const emp = await Employee.create({
      employeeId,
      firstName,
      lastName: rest.join(' ') || undefined,
      email,
      hireDate: IMPORT_DATE,
      status: 'inactive',
      user: user._id,
    });
    backup.createdEmployees.push(String(emp._id));
    map.set(`NEW:${name}`, user._id);
  }
  console.log(`  ${map.size} staff resolved; ${report.staff.created} to create, ${report.staff.present} already present`);
  return map;
}

function statusBlock(m: Manifest, p: ManifestProject) {
  return [
    `--- Status update (${m.importTag}) ---`,
    ...p.notes,
    ...(p.contractors.length ? [`Agency: ${p.contractors.join(', ')}`] : []),
    `Source: ${p.src.join(', ')}`,
  ].join('\n');
}

async function importProjects(
  m: Manifest,
  actorId: mongoose.Types.ObjectId,
  staff: Map<string, mongoose.Types.ObjectId>,
  contacts: Map<string, mongoose.Types.ObjectId>,
  backup: Backup
) {
  console.log('\n-- Projects --');
  for (const p of m.projects) {
    const team = [...new Set(p.team.map(r => String(staff.get(r) ?? '')))]
      .filter(Boolean)
      .map(id => new mongoose.Types.ObjectId(id));
    const contractorTags = p.contractors.map(c => `contractor:${c}`);
    const block = statusBlock(m, p);
    const manualProgress = p.progress !== null && p.progress !== undefined;

    let projectId: mongoose.Types.ObjectId | undefined;
    if (p.action === 'update') {
      const cur = await Project.findById(p.matchId);
      if (!cur) throw new Error(`Matched project ${p.matchId} (${p.src.join(', ')}) not found`);
      projectId = cur._id;
      const set: Record<string, unknown> = { status: p.status };
      if (manualProgress) Object.assign(set, { progress: p.progress, autoCalculateProgress: false });
      if (!cur.budget && p.budget) set.budget = p.budget;
      if (!cur.financialProgress?.totalContractValue && p.contractValue) set['financialProgress.totalContractValue'] = p.contractValue;
      const placeholderDates = (cur.tags || []).includes(UNKNOWN_DATE_TAG);
      const start = day(p.startDate);
      const end = day(p.endDate) || start;
      if (placeholderDates && start) Object.assign(set, { startDate: start, endDate: end! < start ? start : end });
      if (!cur.siteLocation?.city && (p.city || p.country)) set.siteLocation = { city: p.city || undefined, country: p.country || 'India' };
      if (!cur.clientContact && p.client && contacts.get(p.client)) set.clientContact = contacts.get(p.client);
      const hasBlock = (cur.description || '').includes(`--- Status update (${m.importTag}) ---`);
      if (!hasBlock) set.description = `${cur.description || ''}\n\n${block}`.trim();
      const newTeam = team.filter(id => !(cur.team || []).some(t => String(t) === String(id)));
      const newTags = [m.importTag, ...contractorTags].filter(t => !(cur.tags || []).includes(t));

      const changed = cur.status !== p.status || (manualProgress && cur.progress !== p.progress) ||
        Object.keys(set).some(k => !['status', 'progress', 'autoCalculateProgress'].includes(k)) || newTeam.length || newTags.length;
      console.log(`  ~ [${p.src[0]}] -> "${cur.name.slice(0, 70)}" status ${cur.status}->${p.status}` +
        `${manualProgress ? `, progress ${cur.progress}->${p.progress}` : ''}${set.budget ? `, budget 0->${p.budget}` : ''}` +
        `${set.startDate ? ', dates filled' : ''}${newTeam.length ? `, +${newTeam.length} team` : ''}`);
      if (!changed) { report.projects.unchanged++; continue; }
      report.projects.updated++;
      if (!DRY_RUN) {
        if (!backup.projects.some(b => String(b._id) === String(cur._id))) {
          backup.projects.push({
            _id: String(cur._id), status: cur.status, progress: cur.progress, autoCalculateProgress: cur.autoCalculateProgress,
            budget: cur.budget, 'financialProgress.totalContractValue': cur.financialProgress?.totalContractValue ?? 0, startDate: cur.startDate, endDate: cur.endDate, siteLocation: cur.siteLocation ?? null,
            clientContact: cur.clientContact ?? null, description: cur.description, team: (cur.team || []).map(String), tags: cur.tags,
          });
          fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
        }
        await Project.updateOne({ _id: cur._id }, {
          $set: set,
          ...(placeholderDates && start ? { $pull: { tags: UNKNOWN_DATE_TAG } } : {}),
        });
        await Project.updateOne({ _id: cur._id }, { $addToSet: { team: { $each: team }, tags: { $each: [m.importTag, ...contractorTags] } } });
      }
    } else {
      const existing = await Project.findOne({ name: p.name, client: p.client, tags: m.importTag }).select('_id');
      if (existing) { report.projects.present++; projectId = existing._id; }
      else {
        report.projects.created++;
        const start = day(p.startDate);
        const end = day(p.endDate);
        if (!start) report.projects.noDate++;
        console.log(`  + [${p.src[0]}] "${p.name.slice(0, 80)}" (${p.client ?? 'no client'}, ${p.status}${manualProgress ? `, ${p.progress}%` : ''})`);
        if (!DRY_RUN) {
          const created = await Project.create({
            name: p.name,
            description: block,
            client: p.client || undefined,
            clientContact: p.client ? contacts.get(p.client) : undefined,
            projectCategory: p.category,
            status: p.status,
            progress: manualProgress ? p.progress : 0,
            autoCalculateProgress: !manualProgress,
            startDate: start || IMPORT_DATE,
            endDate: end && start && end >= start ? end : start || IMPORT_DATE,
            budget: p.budget || 0,
            currency: 'INR',
            owner: actorId,
            managers: [actorId],
            team,
            siteLocation: p.city || p.country ? { city: p.city || undefined, country: p.country || 'India' } : undefined,
            tags: [...new Set([m.importTag, ...contractorTags, ...(start ? [] : [UNKNOWN_DATE_TAG])])],
            ...(p.contractValue ? { financialProgress: { totalContractValue: p.contractValue } } : {}),
          });
          projectId = created._id;
          backup.createdProjects.push(String(created._id));
          fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
        }
      }
    }

    for (const t of p.tasks) {
      const assignee = staff.get(t.assignee);
      if (projectId) {
        const dup = await Task.findOne({ project: projectId, title: t.title, 'tags.name': m.importTag }).select('_id');
        if (dup) { report.tasks.present++; continue; }
      }
      report.tasks.created++;
      if (DRY_RUN || !projectId) continue;
      const task = await Task.create({
        title: t.title,
        description: t.description,
        taskType: 'project',
        assignmentType: 'assigned',
        project: projectId,
        assignedTo: assignee,
        assignedBy: actorId,
        status: t.status,
        tags: [{ name: m.importTag }],
      });
      backup.createdTasks.push(String(task._id));
      fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
    }
  }
  console.log(`  ${report.projects.created} to create (${report.projects.noDate} without dates -> ${UNKNOWN_DATE_TAG}), ` +
    `${report.projects.present} created previously, ${report.projects.updated} existing to update, ${report.projects.unchanged} unchanged`);
  console.log(`  tasks: ${report.tasks.created} to create, ${report.tasks.present} already present`);
}

async function updateEmployees(m: Manifest, backup: Backup) {
  console.log('\n-- Employee assignments --');
  // Several manifest rows can target one employee; merge them in order.
  const merged = new Map<string, ManifestStaff>();
  for (const s of m.staff) {
    const prev = merged.get(s.employeeId);
    if (!prev) { merged.set(s.employeeId, { ...s }); continue; }
    prev.projectAssignment = [prev.projectAssignment, s.projectAssignment].filter(Boolean).join('; ');
    if (s.position) prev.position = s.position;
  }
  for (const s of merged.values()) {
    const e = await Employee.findOne({ employeeId: s.employeeId });
    if (!e) throw new Error(`Employee ${s.employeeId} not found`);
    const set: Record<string, string> = {};
    if (s.workLocation && e.workLocation !== s.workLocation) set.workLocation = s.workLocation;
    // Append rather than replace: the register's earlier assignment text stays.
    if (s.projectAssignment && !(e.projectAssignment || '').includes(s.projectAssignment)) {
      set.projectAssignment = [e.projectAssignment, s.projectAssignment].filter(Boolean).join('; ');
    }
    if (s.position && (e.position || '').toLowerCase() !== s.position.toLowerCase()) set.position = s.position;
    if (!Object.keys(set).length) { report.employees.unchanged++; continue; }
    report.employees.updated++;
    console.log(`  ~ ${s.employeeId} ${e.firstName} ${e.lastName}: ${Object.entries(set)
      .map(([k, v]) => `${k} "${(e as unknown as Record<string, string>)[k] ?? ''}" -> "${v.slice(0, 60)}"`).join(', ')}`);
    if (DRY_RUN) continue;
    backup.employees.push({ _id: String(e._id), workLocation: e.workLocation ?? null, projectAssignment: e.projectAssignment ?? null, position: e.position ?? null });
    fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
    await Employee.updateOne({ _id: e._id }, { $set: set });
  }
  console.log(`  ${report.employees.updated} to update, ${report.employees.unchanged} unchanged`);
}

async function revert(b: Backup) {
  console.log(`Reverting ${b.importTag}`);
  const ids = (a: string[]) => a.map(id => new mongoose.Types.ObjectId(id));
  console.log(`  tasks deleted: ${(await Task.deleteMany({ _id: { $in: ids(b.createdTasks) } })).deletedCount}`);
  console.log(`  projects deleted: ${(await Project.deleteMany({ _id: { $in: ids(b.createdProjects) } })).deletedCount}`);
  for (const p of b.projects) {
    const { _id, ...prev } = p;
    await Project.updateOne({ _id }, { $set: prev });
  }
  console.log(`  projects restored: ${b.projects.length}`);
  for (const e of b.employees) {
    const { _id, ...prev } = e;
    await Employee.updateOne({ _id }, { $set: prev });
  }
  console.log(`  employees restored: ${b.employees.length}`);
  console.log(`  employees deleted: ${(await Employee.deleteMany({ _id: { $in: ids(b.createdEmployees) } })).deletedCount}`);
  console.log(`  users deleted: ${(await User.deleteMany({ _id: { $in: ids(b.createdUsers) } })).deletedCount}`);
  console.log(`  contacts deleted: ${(await Contact.deleteMany({ _id: { $in: ids(b.createdContacts) } })).deletedCount}`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
  console.log(`Connected to database "${mongoose.connection.db?.databaseName}"`);

  if (REVERT) {
    await revert(JSON.parse(fs.readFileSync(BACKUP!, 'utf8')));
    return;
  }
  if (DRY_RUN) console.log('DRY RUN — no writes will be performed.');

  const m: Manifest = JSON.parse(fs.readFileSync(MANIFEST!, 'utf8'));
  const actor = await User.findOne({ email: 'root@caa.ca' }).select('_id');
  if (!actor) throw new Error('Root user root@caa.ca not found.');
  const pendingRole = await Role.findOne({ name: 'Pending' }).select('_id');
  if (!pendingRole) throw new Error('Pending role not found.');

  const backup: Backup = {
    importTag: m.importTag, createdContacts: [], createdUsers: [], createdEmployees: [],
    createdProjects: [], createdTasks: [], projects: [], employees: [],
  };
  if (!DRY_RUN && fs.existsSync(BACKUP!)) throw new Error(`Backup file ${BACKUP} already exists; choose a new path`);

  const contacts = await upsertContacts(m, actor._id, backup);
  const staff = await resolveStaff(m, pendingRole._id, backup);
  await importProjects(m, actor._id, staff, contacts, backup);
  await updateEmployees(m, backup);

  console.log('\n-- Source corrections applied while building the manifest --');
  m.log.forEach(l => console.log(`  ${l}`));
  if (!DRY_RUN) fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
}

run()
  .then(() => mongoose.disconnect())
  .catch(async err => {
    console.error(err instanceof Error ? err.message : err);
    await mongoose.disconnect();
    process.exit(1);
  });
