/**
 * Data migration: populate Task.durationDays and Task.scheduledStart for
 * tasks that predate those fields.
 *
 * durationDays  derived from estimatedHours at an 8-hour working day.
 * scheduledStart left alone unless --with-start is passed, in which case
 *               tasks with a dueDate but no scheduledStart get a start
 *               inferred by subtracting the derived duration from dueDate.
 *
 * Both fields are optional and the critical-path engine already falls back to
 * estimatedHours at runtime, so this backfill is optional. It exists so
 * planners can edit a stored schedule rather than an implied one.
 *
 * Safe to re-run: only documents still missing the field are touched.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/backfillTaskSchedule.ts --dry-run
 *   # drop --dry-run to apply, add --with-start to also infer scheduledStart
 *
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const WITH_START = process.argv.includes('--with-start');

const HOURS_PER_WORKING_DAY = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const deriveDurationDays = (estimatedHours: number | undefined | null): number =>
  estimatedHours && estimatedHours > 0
    ? Math.max(1, Math.ceil(estimatedHours / HOURS_PER_WORKING_DAY))
    : 1;

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection;
  const tasks = db.collection('tasks');

  const counts = {
    scanned: 0,
    durationBackfilled: 0,
    durationAlreadySet: 0,
    startBackfilled: 0,
    startSkippedNoDueDate: 0
  };

  const cursor = tasks.find(
    {},
    { projection: { _id: 1, estimatedHours: 1, durationDays: 1, scheduledStart: 1, dueDate: 1 } }
  );

  const operations: any[] = [];

  while (await cursor.hasNext()) {
    const task: any = await cursor.next();
    counts.scanned++;

    const update: any = {};

    if (task.durationDays === undefined || task.durationDays === null) {
      update.durationDays = deriveDurationDays(task.estimatedHours);
      counts.durationBackfilled++;
    } else {
      counts.durationAlreadySet++;
    }

    if (WITH_START && !task.scheduledStart) {
      if (task.dueDate) {
        const days = update.durationDays ?? task.durationDays ?? deriveDurationDays(task.estimatedHours);
        const start = new Date(new Date(task.dueDate).getTime() - days * MS_PER_DAY);
        start.setHours(0, 0, 0, 0);
        update.scheduledStart = start;
        counts.startBackfilled++;
      } else {
        counts.startSkippedNoDueDate++;
      }
    }

    if (Object.keys(update).length > 0) {
      operations.push({ updateOne: { filter: { _id: task._id }, update: { $set: update } } });
    }
  }

  if (!DRY_RUN && operations.length > 0) {
    // Chunked so a large collection does not build one oversized batch.
    const CHUNK = 500;
    for (let i = 0; i < operations.length; i += CHUNK) {
      await tasks.bulkWrite(operations.slice(i, i + CHUNK));
    }
  }

  console.log('\nTask schedule backfill');
  console.log('----------------------');
  console.log(`scanned                  ${counts.scanned}`);
  console.log(`durationDays to write    ${counts.durationBackfilled}`);
  console.log(`durationDays already set ${counts.durationAlreadySet}`);
  if (WITH_START) {
    console.log(`scheduledStart to write  ${counts.startBackfilled}`);
    console.log(`skipped (no dueDate)     ${counts.startSkippedNoDueDate}`);
  } else {
    console.log('scheduledStart           skipped (pass --with-start to infer)');
  }
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
