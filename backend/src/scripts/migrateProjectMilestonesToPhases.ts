/**
 * Data migration: move Project.milestones[] into a ProjectPhase document.
 *
 * Milestone subdocument _ids are preserved verbatim, because
 * MilestoneBilling.milestoneId stores them as strings — changing them would
 * orphan every existing billing record.
 *
 * Two stages, so there is a rollback window:
 *   1. default   — create the phases, leave Project.milestones intact
 *   2. --finalize — unset Project.milestones on projects already migrated
 *
 * Safe to re-run at any stage.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/migrateProjectMilestonesToPhases.ts --dry-run
 *   npx ts-node --transpile-only src/scripts/migrateProjectMilestonesToPhases.ts
 *   npx ts-node --transpile-only src/scripts/migrateProjectMilestonesToPhases.ts --finalize
 *
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const FINALIZE = process.argv.includes('--finalize');

// Marks phases this script created, so re-runs are no-ops
const MIGRATION_TAG = 'migrated-milestones';

const PROJECT_STATUS_TO_PHASE: Record<string, string> = {
  planning: 'draft',
  active: 'in-progress',
  'on-hold': 'on-hold',
  completed: 'completed',
  cancelled: 'cancelled'
};

interface Counts {
  projectsScanned: number;
  projectsWithMilestones: number;
  phasesCreated: number;
  milestonesMoved: number;
  alreadyMigrated: number;
  skippedNoOwner: number;
  finalized: number;
}

async function migrate(db: mongoose.Connection, counts: Counts): Promise<Set<string>> {
  const projects = db.collection('projects');
  const phases = db.collection('projectphases');

  const migratedMilestoneIds = new Set<string>();

  const cursor = projects.find(
    { milestones: { $exists: true, $ne: [] } },
    { projection: { _id: 1, name: 1, status: 1, startDate: 1, endDate: 1, budget: 1, owner: 1, milestones: 1 } }
  );

  while (await cursor.hasNext()) {
    const project: any = await cursor.next();
    counts.projectsScanned++;

    if (!Array.isArray(project.milestones) || project.milestones.length === 0) continue;
    counts.projectsWithMilestones++;

    for (const m of project.milestones) {
      if (m?._id) migratedMilestoneIds.add(m._id.toString());
    }

    const existing = await phases.findOne({ project: project._id, tags: MIGRATION_TAG });
    if (existing) {
      counts.alreadyMigrated++;
      continue;
    }

    // createdBy is required on ProjectPhase; the project owner is the only
    // defensible author for a backfilled row
    if (!project.owner) {
      counts.skippedNoOwner++;
      console.warn(`  ! project ${project._id} ("${project.name}") has no owner; skipped`);
      continue;
    }

    const highest = await phases
      .find({ project: project._id }, { projection: { order: 1 } })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const order = highest.length ? (highest[0].order ?? 0) + 1 : 0;

    const now = new Date();
    const doc = {
      project: project._id,
      name: 'Phase 1',
      description: 'Created by milestone migration; holds the project\'s original milestones.',
      order,
      status: PROJECT_STATUS_TO_PHASE[project.status] || 'draft',
      startDate: project.startDate,
      endDate: project.endDate,
      budget: typeof project.budget === 'number' ? project.budget : 0,
      spentBudget: 0,
      progress: 0,
      autoCalculateProgress: true,
      milestones: project.milestones,
      deliverables: [],
      dependsOn: [],
      reviewDepartments: [],
      reviewRound: 0,
      reviewSummary: [],
      owner: project.owner,
      createdBy: project.owner,
      tags: [MIGRATION_TAG],
      createdAt: now,
      updatedAt: now
    };

    if (!DRY_RUN) {
      await phases.insertOne(doc);
    }
    counts.phasesCreated++;
    counts.milestonesMoved += project.milestones.length;
  }

  return migratedMilestoneIds;
}

async function finalize(db: mongoose.Connection, counts: Counts): Promise<void> {
  const projects = db.collection('projects');
  const phases = db.collection('projectphases');

  const migratedProjectIds = await phases.distinct('project', { tags: MIGRATION_TAG });
  if (!migratedProjectIds.length) return;

  const filter = {
    _id: { $in: migratedProjectIds },
    milestones: { $exists: true }
  };

  counts.finalized = await projects.countDocuments(filter);
  if (!DRY_RUN && counts.finalized > 0) {
    await projects.updateMany(filter, { $unset: { milestones: '' } });
  }
}

/**
 * Confirms every MilestoneBilling row still points at a milestone that exists
 * after the move. A non-zero orphan count means the migration must not be
 * finalized.
 */
async function verifyBillingLinks(
  db: mongoose.Connection,
  migratedMilestoneIds: Set<string>
): Promise<{ total: number; matched: number; orphans: string[] }> {
  const billings = await db
    .collection('milestonebillings')
    .find({}, { projection: { milestoneId: 1 } })
    .toArray();

  const phaseMilestoneIds = new Set<string>(migratedMilestoneIds);
  const phaseDocs = await db
    .collection('projectphases')
    .find({}, { projection: { 'milestones._id': 1 } })
    .toArray();
  for (const p of phaseDocs) {
    for (const m of (p as any).milestones || []) {
      if (m?._id) phaseMilestoneIds.add(m._id.toString());
    }
  }

  const orphans: string[] = [];
  let matched = 0;
  for (const b of billings) {
    const id = (b as any).milestoneId;
    if (!id) continue;
    if (phaseMilestoneIds.has(String(id))) matched++;
    else orphans.push(String(id));
  }

  return { total: billings.length, matched, orphans };
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection;

  const counts: Counts = {
    projectsScanned: 0,
    projectsWithMilestones: 0,
    phasesCreated: 0,
    milestonesMoved: 0,
    alreadyMigrated: 0,
    skippedNoOwner: 0,
    finalized: 0
  };

  console.log(`Mode: ${FINALIZE ? 'FINALIZE' : 'MIGRATE'}${DRY_RUN ? ' (dry run)' : ''}\n`);

  const migratedMilestoneIds = await migrate(db, counts);

  if (FINALIZE) {
    await finalize(db, counts);
  }

  const billing = await verifyBillingLinks(db, migratedMilestoneIds);

  console.log('=== Summary ===');
  console.log(`projects scanned:         ${counts.projectsScanned}`);
  console.log(`projects with milestones: ${counts.projectsWithMilestones}`);
  console.log(`phases created:           ${counts.phasesCreated}`);
  console.log(`milestones moved:         ${counts.milestonesMoved}`);
  console.log(`already migrated:         ${counts.alreadyMigrated}`);
  console.log(`skipped (no owner):       ${counts.skippedNoOwner}`);
  if (FINALIZE) {
    console.log(`projects to unset:        ${counts.finalized}`);
  }

  console.log('\n=== MilestoneBilling link check ===');
  console.log(`billing records:          ${billing.total}`);
  console.log(`resolving to a milestone: ${billing.matched}`);
  console.log(`orphaned:                 ${billing.orphans.length}`);
  if (billing.orphans.length) {
    console.log(`orphaned milestoneIds:    ${billing.orphans.slice(0, 20).join(', ')}${billing.orphans.length > 20 ? ' …' : ''}`);
    console.log('\nWARNING: orphaned billing links found. Do NOT run --finalize until these are resolved.');
  }

  if (DRY_RUN) console.log('\nDRY RUN — no writes performed.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
