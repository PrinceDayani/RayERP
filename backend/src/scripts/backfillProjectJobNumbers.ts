/**
 * Data migration: allocate Project.jobNumber and Project.baseline for projects
 * that predate the job register.
 *
 * jobNumber  assigned in creation order as <prefix>-<year>-<00001>, where the
 *            year is taken from the project's own createdAt so the register
 *            reads chronologically rather than all landing in the current year.
 * baseline   seeded from the project's current startDate / endDate / budget,
 *            marked source 'manual'. Projects already carrying a baseline are
 *            left alone so a tender-awarded position is never overwritten.
 *
 * The InvoiceSequence counters are advanced to match, so numbers allocated
 * here cannot collide with numbers the API allocates afterwards.
 *
 * Safe to re-run: only documents still missing the field are touched.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/backfillProjectJobNumbers.ts --dry-run
 *   # drop --dry-run to apply, add --prefix=XYZ to use a prefix other than JOB
 *
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const prefixArg = process.argv.find(arg => arg.startsWith('--prefix='));
const PREFIX = (prefixArg ? prefixArg.split('=')[1] : 'JOB').trim().toUpperCase();

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  if (!/^[A-Z0-9-]{1,10}$/.test(PREFIX)) {
    console.error(`Invalid prefix "${PREFIX}". Use 1-10 characters of A-Z, 0-9 or "-".`);
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection;
  const projects = db.collection('projects');
  const sequences = db.collection('invoicesequences');

  const counts = {
    scanned: 0,
    jobNumberBackfilled: 0,
    jobNumberAlreadySet: 0,
    baselineBackfilled: 0,
    baselineAlreadySet: 0
  };

  // Start each year's counter above whatever is already in use, so a partial
  // previous run does not produce a duplicate.
  const highestByYear = new Map<number, number>();
  const existing = projects.find(
    { jobNumber: { $type: 'string' } },
    { projection: { jobNumber: 1 } }
  );
  while (await existing.hasNext()) {
    const doc: any = await existing.next();
    const match = /^([A-Z0-9-]+)-(\d{4})-(\d+)$/.exec(String(doc.jobNumber || ''));
    if (!match || match[1] !== PREFIX) continue;
    const year = Number(match[2]);
    const serial = Number(match[3]);
    if (serial > (highestByYear.get(year) || 0)) highestByYear.set(year, serial);
  }

  // Soft-deleted projects still hold their number, so they are included here.
  const cursor = projects
    .find({}, { projection: { _id: 1, jobNumber: 1, baseline: 1, startDate: 1, endDate: 1, budget: 1, createdAt: 1 } })
    .sort({ createdAt: 1 });

  const operations: any[] = [];

  while (await cursor.hasNext()) {
    const project: any = await cursor.next();
    counts.scanned++;

    const update: any = {};

    if (!project.jobNumber) {
      const year = new Date(project.createdAt || Date.now()).getFullYear();
      const next = (highestByYear.get(year) || 0) + 1;
      highestByYear.set(year, next);
      update.jobNumber = `${PREFIX}-${year}-${String(next).padStart(5, '0')}`;
      counts.jobNumberBackfilled++;
    } else {
      counts.jobNumberAlreadySet++;
    }

    if (!project.baseline) {
      update.baseline = {
        startDate: project.startDate,
        endDate: project.endDate,
        contractValue: project.budget || 0,
        source: 'manual',
        capturedAt: new Date()
      };
      counts.baselineBackfilled++;
    } else {
      counts.baselineAlreadySet++;
    }

    if (Object.keys(update).length > 0) {
      operations.push({ updateOne: { filter: { _id: project._id }, update: { $set: update } } });
    }
  }

  if (!DRY_RUN && operations.length > 0) {
    await projects.bulkWrite(operations, { ordered: false });

    // Advance the shared counter so the API continues from where this left off.
    for (const [year, highest] of highestByYear) {
      const current = await sequences.findOne({ prefix: PREFIX, year, month: null });
      if (!current || (current.currentNumber || 0) < highest) {
        await sequences.updateOne(
          { prefix: PREFIX, year, month: null },
          { $set: { currentNumber: highest, lastGeneratedAt: new Date() } },
          { upsert: true }
        );
      }
    }
  }

  console.log('\nProject job number backfill');
  console.log('---------------------------');
  console.log(`prefix                   ${PREFIX}`);
  console.log(`scanned                  ${counts.scanned}`);
  console.log(`jobNumber to write       ${counts.jobNumberBackfilled}`);
  console.log(`jobNumber already set    ${counts.jobNumberAlreadySet}`);
  console.log(`baseline to write        ${counts.baselineBackfilled}`);
  console.log(`baseline already set     ${counts.baselineAlreadySet}`);
  console.log(`documents to update      ${operations.length}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN — no writes performed. Re-run without --dry-run to apply.');
  }

  await mongoose.disconnect();
}

run().catch(async err => {
  console.error('Backfill failed:', err?.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
