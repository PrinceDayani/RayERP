/**
 * Data migration: convert Employee._id refs to User._id refs across the
 * operational rail (project reporting, projects, tasks, resources, files,
 * timeline). Built to be safe to re-run.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/migrateEmployeeRefsToUser.ts
 *   # add --dry-run to preview without writing
 *
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

interface Counts {
  scanned: number;
  remapped: number;
  skippedMissing: number;
  alreadyUser: number;
}

async function buildEmployeeUserMap(db: mongoose.Connection): Promise<Map<string, string>> {
  const employees = await db.collection('employees').find({}, { projection: { _id: 1, user: 1 } }).toArray();
  const map = new Map<string, string>();
  for (const e of employees) {
    if (e.user) map.set(e._id.toString(), e.user.toString());
  }
  return map;
}

// Returns the User._id (string) that an old Employee._id maps to, or null.
// If the id is already a known User._id (set passed in), returns it unchanged.
function resolveId(rawId: any, empToUser: Map<string, string>, knownUserIds: Set<string>): { resolved: string | null; alreadyUser: boolean } {
  if (!rawId) return { resolved: null, alreadyUser: false };
  const idStr = rawId.toString();
  if (knownUserIds.has(idStr)) return { resolved: idStr, alreadyUser: true };
  const mapped = empToUser.get(idStr);
  return { resolved: mapped || null, alreadyUser: false };
}

async function loadKnownUserIds(db: mongoose.Connection): Promise<Set<string>> {
  const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray();
  return new Set(users.map(u => u._id.toString()));
}

async function remapField(
  db: mongoose.Connection,
  collection: string,
  field: string,
  empToUser: Map<string, string>,
  knownUserIds: Set<string>,
  isArray = false,
  counts: Counts
): Promise<void> {
  const cursor = db.collection(collection).find({ [field]: { $exists: true, $ne: null } });
  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    counts.scanned++;
    const current = doc[field];
    if (isArray) {
      if (!Array.isArray(current) || current.length === 0) continue;
      const newArr: any[] = [];
      let changed = false;
      let anyUser = false;
      for (const v of current) {
        const { resolved, alreadyUser } = resolveId(v, empToUser, knownUserIds);
        if (alreadyUser) anyUser = true;
        if (resolved) {
          if (resolved !== v?.toString()) changed = true;
          newArr.push(new mongoose.Types.ObjectId(resolved));
        } else {
          counts.skippedMissing++;
        }
      }
      if (anyUser && !changed) counts.alreadyUser++;
      if (changed && !DRY_RUN) {
        await db.collection(collection).updateOne({ _id: doc._id }, { $set: { [field]: newArr } });
        counts.remapped++;
      } else if (changed) {
        counts.remapped++;
      }
    } else {
      const { resolved, alreadyUser } = resolveId(current, empToUser, knownUserIds);
      if (alreadyUser) { counts.alreadyUser++; continue; }
      if (!resolved) { counts.skippedMissing++; continue; }
      if (resolved === current?.toString()) continue;
      if (!DRY_RUN) {
        await db.collection(collection).updateOne({ _id: doc._id }, { $set: { [field]: new mongoose.Types.ObjectId(resolved) } });
      }
      counts.remapped++;
    }
  }
}

async function renameField(
  db: mongoose.Connection,
  collection: string,
  oldName: string,
  newName: string,
  empToUser: Map<string, string>,
  knownUserIds: Set<string>,
  counts: Counts
): Promise<void> {
  const cursor = db.collection(collection).find({ [oldName]: { $exists: true } });
  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    counts.scanned++;
    const current = doc[oldName];
    const { resolved, alreadyUser } = resolveId(current, empToUser, knownUserIds);
    if (alreadyUser) {
      if (!DRY_RUN) {
        await db.collection(collection).updateOne({ _id: doc._id }, {
          $set: { [newName]: current },
          $unset: { [oldName]: '' }
        });
      }
      counts.alreadyUser++;
      continue;
    }
    if (!resolved) {
      counts.skippedMissing++;
      continue;
    }
    if (!DRY_RUN) {
      await db.collection(collection).updateOne({ _id: doc._id }, {
        $set: { [newName]: new mongoose.Types.ObjectId(resolved) },
        $unset: { [oldName]: '' }
      });
    }
    counts.remapped++;
  }
}

async function remapNestedArrayField(
  db: mongoose.Connection,
  collection: string,
  arrayField: string,
  innerOldKey: string,
  innerNewKey: string,
  empToUser: Map<string, string>,
  knownUserIds: Set<string>,
  counts: Counts
): Promise<void> {
  const cursor = db.collection(collection).find({ [`${arrayField}.${innerOldKey}`]: { $exists: true } });
  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    counts.scanned++;
    const arr = doc[arrayField] || [];
    const newArr: any[] = [];
    let changed = false;
    for (const item of arr) {
      const ref = item?.[innerOldKey];
      if (!ref) { newArr.push(item); continue; }
      const { resolved, alreadyUser } = resolveId(ref, empToUser, knownUserIds);
      if (!resolved && !alreadyUser) {
        counts.skippedMissing++;
        newArr.push(item);
        continue;
      }
      const { [innerOldKey]: _, ...rest } = item;
      newArr.push({ ...rest, [innerNewKey]: new mongoose.Types.ObjectId(alreadyUser ? ref.toString() : resolved!) });
      changed = true;
    }
    if (changed && !DRY_RUN) {
      await db.collection(collection).updateOne({ _id: doc._id }, { $set: { [arrayField]: newArr } });
      counts.remapped++;
    } else if (changed) {
      counts.remapped++;
    }
  }
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection;

  console.log(`Connected to ${db.name}. DRY_RUN=${DRY_RUN}`);
  const empToUser = await buildEmployeeUserMap(db);
  const knownUserIds = await loadKnownUserIds(db);
  console.log(`Found ${empToUser.size} employee → user mappings.`);
  console.log(`Found ${knownUserIds.size} existing User._ids.`);

  const tasks: Array<[string, () => Promise<void>]> = [];
  const mk = (label: string, op: () => Promise<void>) => tasks.push([label, op]);

  // DailyReport
  mk('DailyReport.reportedBy', () => remapField(db, 'dailyreports', 'reportedBy', empToUser, knownUserIds, false, counts.dailyReport));
  mk('DailyReport.acknowledgedBy', () => remapField(db, 'dailyreports', 'acknowledgedBy', empToUser, knownUserIds, false, counts.dailyReport));
  mk('DailyReport.blockers[].resolvedBy', () => remapNestedArrayField(db, 'dailyreports', 'blockers', 'resolvedBy', 'resolvedBy', empToUser, knownUserIds, counts.dailyReport));

  // FinancialEntry
  mk('FinancialEntry.reportedBy', () => remapField(db, 'financialentries', 'reportedBy', empToUser, knownUserIds, false, counts.financialEntry));
  mk('FinancialEntry.approvedBy', () => remapField(db, 'financialentries', 'approvedBy', empToUser, knownUserIds, false, counts.financialEntry));

  // ReportingSchedule
  mk('ReportingSchedule.escalateTo', () => remapField(db, 'reportingschedules', 'escalateTo', empToUser, knownUserIds, false, counts.reportingSchedule));
  mk('ReportingSchedule.requiredFrom[].employee → user', () => remapNestedArrayField(db, 'reportingschedules', 'requiredFrom', 'employee', 'user', empToUser, knownUserIds, counts.reportingSchedule));

  // Project
  mk('Project.team[]', () => remapField(db, 'projects', 'team', empToUser, knownUserIds, true, counts.project));
  mk('Project.managers[]', () => remapField(db, 'projects', 'managers', empToUser, knownUserIds, true, counts.project));

  // ProjectPermission (rename employee → user)
  mk('ProjectPermission.employee → user', () => renameField(db, 'projectpermissions', 'employee', 'user', empToUser, knownUserIds, counts.projectPermission));

  // Task
  mk('Task.assignedTo', () => remapField(db, 'tasks', 'assignedTo', empToUser, knownUserIds, false, counts.task));
  mk('Task.assignedBy', () => remapField(db, 'tasks', 'assignedBy', empToUser, knownUserIds, false, counts.task));
  mk('Task.watchers[]', () => remapField(db, 'tasks', 'watchers', empToUser, knownUserIds, true, counts.task));
  mk('Task.comments[].user', () => remapNestedArrayField(db, 'tasks', 'comments', 'user', 'user', empToUser, knownUserIds, counts.task));
  mk('Task.comments[].mentions[]: per-comment array remap', async () => {
    const docs = await db.collection('tasks').find({ 'comments.mentions': { $exists: true } }).toArray();
    for (const doc of docs) {
      const comments = doc.comments || [];
      let changed = false;
      for (const c of comments) {
        if (!c?.mentions?.length) continue;
        const newMentions: any[] = [];
        for (const m of c.mentions) {
          const { resolved, alreadyUser } = resolveId(m, empToUser, knownUserIds);
          if (alreadyUser) newMentions.push(m);
          else if (resolved) { newMentions.push(new mongoose.Types.ObjectId(resolved)); changed = true; }
        }
        c.mentions = newMentions;
      }
      counts.task.scanned++;
      if (changed && !DRY_RUN) {
        await db.collection('tasks').updateOne({ _id: doc._id }, { $set: { comments } });
      }
      if (changed) counts.task.remapped++;
    }
  });
  mk('Task.checklist[].completedBy', () => remapNestedArrayField(db, 'tasks', 'checklist', 'completedBy', 'completedBy', empToUser, knownUserIds, counts.task));
  mk('Task.timeEntries[].user', () => remapNestedArrayField(db, 'tasks', 'timeEntries', 'user', 'user', empToUser, knownUserIds, counts.task));
  mk('Task.attachments[].uploadedBy', () => remapNestedArrayField(db, 'tasks', 'attachments', 'uploadedBy', 'uploadedBy', empToUser, knownUserIds, counts.task));

  // ResourceAllocation (rename employee → user)
  mk('ResourceAllocation.employee → user', () => renameField(db, 'resourceallocations', 'employee', 'user', empToUser, knownUserIds, counts.resourceAllocation));

  // Timeline
  mk('Timeline.user', () => remapField(db, 'timelines', 'user', empToUser, knownUserIds, false, counts.timeline));

  // FileShare
  mk('FileShare.sharedBy', () => remapField(db, 'fileshares', 'sharedBy', empToUser, knownUserIds, false, counts.fileShare));
  mk('FileShare.sharedWith[]', () => remapField(db, 'fileshares', 'sharedWith', empToUser, knownUserIds, true, counts.fileShare));
  mk('FileShare.viewedBy[].employee → user', () => remapNestedArrayField(db, 'fileshares', 'viewedBy', 'employee', 'user', empToUser, knownUserIds, counts.fileShare));
  mk('FileShare.downloadedBy[].employee → user', () => remapNestedArrayField(db, 'fileshares', 'downloadedBy', 'employee', 'user', empToUser, knownUserIds, counts.fileShare));

  const newCounts = (): Counts => ({ scanned: 0, remapped: 0, skippedMissing: 0, alreadyUser: 0 });
  const counts = {
    dailyReport: newCounts(),
    financialEntry: newCounts(),
    reportingSchedule: newCounts(),
    project: newCounts(),
    projectPermission: newCounts(),
    task: newCounts(),
    resourceAllocation: newCounts(),
    timeline: newCounts(),
    fileShare: newCounts(),
  };

  for (const [label, op] of tasks) {
    process.stdout.write(`→ ${label} ... `);
    await op();
    console.log('done');
  }

  console.log('\n=== Summary ===');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`${k}: scanned=${v.scanned} remapped=${v.remapped} alreadyUser=${v.alreadyUser} skippedMissing=${v.skippedMissing}`);
  }
  if (DRY_RUN) console.log('\nDRY RUN — no writes performed. Re-run without --dry-run to apply.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
