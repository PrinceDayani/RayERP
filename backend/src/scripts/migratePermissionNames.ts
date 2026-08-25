/**
 * Data migration: rewrite legacy snake_case permission strings to the dotted
 * names the routes actually check, on both Role.permissions and
 * Department.permissions. Legacy names matched nothing in requirePermission,
 * so every holder was silently denied. Safe to re-run.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/migratePermissionNames.ts
 *   # add --dry-run to preview without writing
 *
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

// Legacy name -> catalog name. Anything not listed is left untouched, so a
// role carrying an already-correct dotted name is a no-op.
const RENAMES: Record<string, string> = {
  view_activity: 'activities.view',
  view_all_activities: 'activities.view_all',
  revert_activities: 'activities.revert',
  view_audit_logs: 'audit.view',
  view_users: 'users.view',
  create_user: 'users.create',
  update_user: 'users.edit',
  delete_user: 'users.delete',
  manage_roles: 'roles.manage',
  system_settings: 'settings.edit',
  view_logs: 'logs.view',
  view_reports: 'reports.view',
  export_data: 'data.export',
  view_projects: 'projects.view',
  create_project: 'projects.create',
  update_project: 'projects.edit',
  delete_project: 'projects.delete',
  manage_projects: 'projects.manage_team'
  // view_customers / create_customer / update_customer / delete_customer are
  // deliberately absent: no route gates on a customer permission, so they have
  // no catalog equivalent and are dropped rather than renamed to a dead name.
};

interface Counts {
  scanned: number;
  changed: number;
  renamed: number;
  dropped: number;
}

const newCounts = (): Counts => ({ scanned: 0, changed: 0, renamed: 0, dropped: 0 });

// Rewrites one permission array. Unknown legacy-shaped names (snake_case with
// no mapping) are dropped: they can never match a check, and leaving them in
// keeps dead entries in the permission picker.
function rewrite(permissions: any, counts: Counts): { next: string[]; changed: boolean } {
  const current: string[] = Array.isArray(permissions) ? permissions.filter((p: any) => typeof p === 'string') : [];
  const next: string[] = [];
  let changed = current.length !== (Array.isArray(permissions) ? permissions.length : 0);

  for (const perm of current) {
    if (perm === '*' || perm.includes('.')) {
      next.push(perm);
      continue;
    }
    const mapped = RENAMES[perm];
    if (mapped) {
      next.push(mapped);
      counts.renamed++;
    } else {
      counts.dropped++;
    }
    changed = true;
  }

  const deduped = Array.from(new Set(next));
  if (deduped.length !== next.length) changed = true;
  return { next: deduped, changed };
}

async function migrateCollection(
  db: mongoose.Connection,
  collection: string,
  counts: Counts,
  protectedNames: string[] = []
) {
  const docs = await db
    .collection(collection)
    .find({}, { projection: { _id: 1, name: 1, permissions: 1 } })
    .toArray();

  for (const doc of docs) {
    counts.scanned++;
    // Root holds ['*'] and its schema hooks reject modification.
    if (protectedNames.includes(String(doc.name).toLowerCase())) continue;

    const { next, changed } = rewrite(doc.permissions, counts);
    if (!changed) continue;

    counts.changed++;
    console.log(`  ${collection}/${doc.name}: ${JSON.stringify(doc.permissions)} -> ${JSON.stringify(next)}`);
    if (!DRY_RUN) {
      await db.collection(collection).updateOne({ _id: doc._id }, { $set: { permissions: next } });
    }
  }
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection;

  const roleCounts = newCounts();
  const deptCounts = newCounts();

  console.log('→ roles');
  await migrateCollection(db, 'roles', roleCounts, ['root']);
  console.log('→ departments');
  await migrateCollection(db, 'departments', deptCounts);

  console.log('\n=== Summary ===');
  for (const [label, c] of [['roles', roleCounts], ['departments', deptCounts]] as [string, Counts][]) {
    console.log(`${label}: scanned=${c.scanned} changed=${c.changed} renamed=${c.renamed} dropped=${c.dropped}`);
  }
  if (DRY_RUN) console.log('\nDRY RUN — no writes performed. Re-run without --dry-run to apply.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
