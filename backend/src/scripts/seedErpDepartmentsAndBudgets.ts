/**
 * Completes the "Ray Infrastructures ERP" workbook import beyond tasks:
 *   - the 4 departments the workbook is organised around
 *   - the Dashboard revenue targets (Y1 Rs 25 Cr / Y2 Rs 60 Cr / Y3 Rs 100 Cr)
 *     as fiscal-year budgets on the Strategic Roadmap project
 *   - folds the "MD/CEO" owner placeholder into the real MD user and
 *     re-attributes the announcements he posted
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/seedErpDepartmentsAndBudgets.ts --dry-run
 *   npx ts-node --transpile-only src/scripts/seedErpDepartmentsAndBudgets.ts
 *
 * Idempotent: every step checks for the target state first and reports a skip.
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from '../models/Department';
import Budget from '../models/Budget';
import Project from '../models/Project';
import Broadcast from '../models/Broadcast';
import User from '../models/User';
import { ROADMAP_PROJECT_NAME } from '../services/erpWorkbookImportService';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const CRORE = 10_000_000;

// Descriptions describe what each workbook sheet actually tracks — nothing inferred beyond that.
const DEPARTMENTS = [
  { name: 'Finance', description: 'Cash flow and expense log, client invoicing and payment tracking.' },
  { name: 'HR & Admin', description: 'Employee directory, recruitment pipeline and leave tracking.' },
  { name: 'BD & Tendering', description: 'Tender and EoI pipeline: submissions, estimated value and win rate tracking.' },
  { name: 'Technical & Projects', description: 'Client project register: ownership, schedule, progress and status.' },
];

const DEPARTMENT_LOCATION = 'Head Office';

// Dashboard "REVENUE TARGET TRACKER" rows. Target -> totalBudget, actual -> actualSpent.
const REVENUE_TARGETS = [
  { fiscalYear: 2026, fiscalPeriod: 'FY26-27', crore: 25, label: 'Year 1' },
  { fiscalYear: 2027, fiscalPeriod: 'FY27-28', crore: 60, label: 'Year 2' },
  { fiscalYear: 2028, fiscalPeriod: 'FY28-29', crore: 100, label: 'Year 3' },
];

const MD_PLACEHOLDER_EMAIL = 'md-ceo@roles.rayerp.local';
const MD_NAME = 'ATUL';
const MD_EMAIL = 'atul@rayinfra.in';

// Announcements whose "Posted By" column reads ATUL.
const MD_ANNOUNCEMENTS = [
  'planig to Dising Exibition in Dilhi at 06 to 08 Augsst we plan to dising teem participat with Arpitbhai',
  'Card rider machin purchase, discution with dhavalbhai & prince',
];

async function seedDepartments() {
  console.log('\n-- Departments --');
  for (const dept of DEPARTMENTS) {
    const existing = await Department.findOne({ name: dept.name }).select('_id');
    if (existing) {
      console.log(`  skip    ${dept.name} (already exists, ${existing._id})`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  create  ${dept.name} — location "${DEPARTMENT_LOCATION}"`);
      continue;
    }
    const created = await Department.create({
      name: dept.name,
      description: dept.description,
      location: DEPARTMENT_LOCATION,
      budget: 0,
      status: 'active',
    });
    console.log(`  created ${dept.name} (${created._id})`);
  }
}

async function seedRevenueBudgets(actorId: mongoose.Types.ObjectId) {
  console.log('\n-- Revenue target budgets --');
  const project = await Project.findOne({ name: ROADMAP_PROJECT_NAME }).select('_id name');
  if (!project) {
    console.log(`  SKIPPED — project "${ROADMAP_PROJECT_NAME}" not found. Run importErpWorkbook.ts first.`);
    return;
  }

  for (const target of REVENUE_TARGETS) {
    const existing = await Budget.findOne({
      projectId: project._id,
      fiscalYear: target.fiscalYear,
      budgetType: 'project',
    }).select('_id');
    if (existing) {
      console.log(`  skip    ${target.fiscalPeriod} (already exists, ${existing._id})`);
      continue;
    }
    const totalBudget = target.crore * CRORE;
    if (DRY_RUN) {
      console.log(`  create  ${target.fiscalPeriod} — Rs ${target.crore} Cr (${totalBudget})`);
      continue;
    }
    const created = await Budget.create({
      projectId: project._id,
      projectName: project.name,
      budgetName: `${target.label} Revenue Target (${target.fiscalPeriod})`,
      budgetType: 'project',
      fiscalYear: target.fiscalYear,
      fiscalPeriod: target.fiscalPeriod,
      totalBudget,
      actualSpent: 0,
      currency: 'INR',
      status: 'active',
      createdBy: actorId,
    });
    console.log(`  created ${target.fiscalPeriod} — Rs ${target.crore} Cr (${created._id})`);
  }
}

// Returns the MD user id so the announcements can be re-attributed to it.
async function foldMdPlaceholder(): Promise<mongoose.Types.ObjectId | null> {
  console.log('\n-- MD identity --');
  const already = await User.findOne({ email: MD_EMAIL }).select('_id name');
  if (already) {
    console.log(`  skip    ${MD_EMAIL} already present (${already._id})`);
    return already._id;
  }
  const placeholder = await User.findOne({ email: MD_PLACEHOLDER_EMAIL }).select('_id name');
  if (!placeholder) {
    console.log(`  SKIPPED — neither ${MD_EMAIL} nor ${MD_PLACEHOLDER_EMAIL} found.`);
    return null;
  }
  console.log(`  update  ${placeholder._id}: "${placeholder.name}" <${MD_PLACEHOLDER_EMAIL}> -> "${MD_NAME}" <${MD_EMAIL}>`);
  if (!DRY_RUN) {
    await User.updateOne({ _id: placeholder._id }, { $set: { name: MD_NAME, email: MD_EMAIL } });
  }
  return placeholder._id;
}

async function reattributeAnnouncements(mdId: mongoose.Types.ObjectId | null) {
  console.log('\n-- Announcement authorship --');
  if (!mdId) {
    console.log('  SKIPPED — no MD user to attribute to.');
    return;
  }
  for (const content of MD_ANNOUNCEMENTS) {
    const broadcast = await Broadcast.findOne({ content }).select('_id sender');
    if (!broadcast) {
      console.log(`  missing "${content.slice(0, 45)}..." — no matching broadcast`);
      continue;
    }
    if (String(broadcast.sender) === String(mdId)) {
      console.log(`  skip    ${broadcast._id} (already attributed to ${MD_NAME})`);
      continue;
    }
    console.log(`  update  ${broadcast._id}: sender ${broadcast.sender} -> ${mdId}`);
    if (!DRY_RUN) {
      await Broadcast.updateOne({ _id: broadcast._id }, { $set: { sender: mdId } });
    }
  }
}

async function resolveActor(): Promise<mongoose.Types.ObjectId> {
  const root = await User.findOne({ email: 'root@caa.ca' }).select('_id');
  if (root) return root._id;
  throw new Error('Root user not found — cannot set budget createdBy.');
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
  console.log(`Connected to database "${mongoose.connection.db?.databaseName}"`);
  if (DRY_RUN) console.log('DRY RUN — no writes will be performed.');

  const actorId = await resolveActor();
  await seedDepartments();
  await seedRevenueBudgets(actorId);
  const mdId = await foldMdPlaceholder();
  await reattributeAnnouncements(mdId);

  if (DRY_RUN) console.log('\nDRY RUN complete — re-run without --dry-run to apply.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
