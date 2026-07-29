/**
 * One-time seed: imports the "Ray_Infrastructures_ERP.xlsx" workbook data
 * (2026-07-28 snapshot, embedded below) into Tasks, the roadmap Project and
 * Broadcasts. Safe to re-run — existing rows are matched by title/content
 * and skipped.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/importErpWorkbook.ts --dry-run
 *   npx ts-node --transpile-only src/scripts/importErpWorkbook.ts [--actor you@company.com]
 *
 * Without --actor, tasks fall back to the Root user as assigner. Owners that
 * match no existing user are listed at the end for manual reassignment.
 * Reads MONGO_URI from the environment.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { Role } from '../models/Role';
import { importErpData, ErpWorkbookData } from '../services/erpWorkbookImportService';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const actorFlag = process.argv.indexOf('--actor');
const ACTOR_EMAIL = actorFlag !== -1 ? process.argv[actorFlag + 1] : undefined;

const DATA: ErpWorkbookData = {
  "roadmapTasks": [
    {
      "title": "Finalize JD for BD & Tendering Manager -- post on Naukri/LinkedIn/consultants same day",
      "phase": "Phase 0 - Week 1",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 2",
      "targetDate": "2026-07-27",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Finalize JD for HR-cum-Admin Manager -- post same day",
      "phase": "Phase 0 - Week 1",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 2",
      "targetDate": "2026-07-27",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Register on GeM + all relevant e-procurement portals for tender alerts",
      "phase": "Phase 0 - Week 1",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 3",
      "targetDate": "2026-07-30",
      "priority": "High",
      "status": "In Progress",
      "notes": null
    },
    {
      "title": "Pull together existing project completion certificates, turnover statements, registrations into one folder",
      "phase": "Phase 0 - Week 1",
      "owner": "Accounts",
      "deadlineLabel": "Day 5",
      "targetDate": "2026-07-30",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Shortlist 5 recruitment consultants/portals for aggressive candidate sourcing",
      "phase": "Phase 0 - Week 1",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 5",
      "targetDate": "2026-07-30",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Interview and close BD & Tendering Manager -- do not let this drag past Week 2",
      "phase": "Phase 0 - Week 2",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 12",
      "targetDate": "2026-08-06",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Interview and close HR-cum-Admin Manager",
      "phase": "Phase 0 - Week 2",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 12",
      "targetDate": "2026-08-06",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Identify first 10 live EoIs matching our sectors (water infra, bridges, PMC, TPI, DPR)",
      "phase": "Phase 0 - Week 2",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 14",
      "targetDate": "2026-08-08",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "List 8-10 target technical experts to empanel on bench (names, contact, rate)",
      "phase": "Phase 0 - Week 2",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 14",
      "targetDate": "2026-08-08",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "BD & Tendering Manager on-boarded and briefed on full sector strategy",
      "phase": "Phase 0 - Week 3",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 18",
      "targetDate": "2026-08-12",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "HR-cum-Admin Manager on-boarded; HRMS/payroll tool selected and live",
      "phase": "Phase 0 - Week 3",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 18",
      "targetDate": "2026-08-12",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "First 3 EoIs submitted",
      "phase": "Phase 0 - Week 3",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 21",
      "targetDate": "2026-08-15",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Tender tracking sheet/CRM live and shared with MD daily",
      "phase": "Phase 0 - Week 3",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 21",
      "targetDate": "2026-08-15",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "5 more EoIs submitted (cumulative 8+)",
      "phase": "Phase 0 - Week 4",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 28",
      "targetDate": "2026-08-22",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "First 3 bench experts formally empanelled with signed CVs",
      "phase": "Phase 0 - Week 4",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 28",
      "targetDate": "2026-08-22",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "30-Day Review with MD/CEO -- pipeline count, gaps, next hire trigger",
      "phase": "Phase 0 - Week 4",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 30",
      "targetDate": "2026-08-24",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Hire Tendering Executive (documentation/submission support)",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 45",
      "targetDate": "2026-09-08",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Hire Technical Proposal Writer / DPR specialist",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 50",
      "targetDate": "2026-09-13",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Company qualification dossier finalized as a reusable, always-ready template",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "Tendering Exec",
      "deadlineLabel": "Day 45",
      "targetDate": "2026-09-08",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Standard methodology template (ToR understanding, work plan, innovation) built and tested on live bid",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "Proposal Writer",
      "deadlineLabel": "Day 55",
      "targetDate": "2026-09-18",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "10 more EoIs submitted (cumulative 20+)",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 60",
      "targetDate": "2026-09-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Bench expanded to 5-6 empanelled experts",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 60",
      "targetDate": "2026-09-23",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "First win confirmed and under execution",
      "phase": "Phase 1 (Day 31-60)",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 60",
      "targetDate": "2026-09-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Hire Compliance & Documentation Officer",
      "phase": "Phase 2 (Day 61-90)",
      "owner": "HR-cum-Admin Mgr",
      "deadlineLabel": "Day 75",
      "targetDate": "2026-10-08",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Monthly BD/Tendering review meeting instituted with MD -- non-negotiable, same date every month",
      "phase": "Phase 2 (Day 61-90)",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 75",
      "targetDate": "2026-10-08",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "10-15 more EoIs submitted (cumulative 30-35 for Year 1 pace)",
      "phase": "Phase 2 (Day 61-90)",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 90",
      "targetDate": "2026-10-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "2-3 wins confirmed and under execution",
      "phase": "Phase 2 (Day 61-90)",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Day 90",
      "targetDate": "2026-10-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "90-Day Review: hiring pace vs. plan, pipeline vs. Rs 25 Cr target, course-correct if behind",
      "phase": "Phase 2 (Day 61-90)",
      "owner": "MD/CEO",
      "deadlineLabel": "Day 90",
      "targetDate": "2026-10-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "BD & Tendering Manager + HR-cum-Admin Manager hired and functional",
      "phase": "Year 1 Q1",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 3",
      "targetDate": "2026-10-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "30-35 EoIs submitted cumulative",
      "phase": "Year 1 Q1",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 3",
      "targetDate": "2026-10-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "1-2 wins in execution",
      "phase": "Year 1 Q1",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 3",
      "targetDate": "2026-10-23",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Tendering Executive + Proposal Writer hired",
      "phase": "Year 1 Q2",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 6",
      "targetDate": "2027-01-21",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Cumulative wins: 3-4",
      "phase": "Year 1 Q2",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 6",
      "targetDate": "2027-01-21",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Bench at 6-8 empanelled experts",
      "phase": "Year 1 Q2",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 6",
      "targetDate": "2027-01-21",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Compliance/Documentation Officer hired",
      "phase": "Year 1 Q3",
      "owner": "HR-cum-Admin Mgr",
      "deadlineLabel": "Month 9",
      "targetDate": "2027-04-21",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "2 BD Executives hired for regional coverage",
      "phase": "Year 1 Q3",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 9",
      "targetDate": "2027-04-21",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Cumulative wins: 6",
      "phase": "Year 1 Q3",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 9",
      "targetDate": "2027-04-21",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Dedicated HR Executive + Admin Executive hired (split from combined role)",
      "phase": "Year 1 Q4",
      "owner": "HR-cum-Admin Mgr",
      "deadlineLabel": "Month 12",
      "targetDate": "2027-07-20",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Cumulative wins: 6-8 -- Rs 25 Cr contracted/executed",
      "phase": "Year 1 Q4",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 12",
      "targetDate": "2027-07-20",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Year 2 org design finalized in writing",
      "phase": "Year 1 Q4",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 12",
      "targetDate": "2027-07-20",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Contracts & Legal Associate hired",
      "phase": "Year 2 H1",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 15",
      "targetDate": "2027-10-18",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Costing & Estimation Analyst hired",
      "phase": "Year 2 H1",
      "owner": "Finance Head",
      "deadlineLabel": "Month 15",
      "targetDate": "2027-10-18",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Quality/Technical Review Lead hired",
      "phase": "Year 2 H1",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 18",
      "targetDate": "2028-01-16",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "50-60 EoIs submitted cumulative for the year",
      "phase": "Year 2 H1",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 18",
      "targetDate": "2028-01-16",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Rs 25-30 Cr in-hand contracts confirmed",
      "phase": "Year 2 H1",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 18",
      "targetDate": "2028-01-16",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Regional BD Rep hired for 2nd geography (e.g. UAE/other state)",
      "phase": "Year 2 H2",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Month 21",
      "targetDate": "2028-04-15",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Bench expanded to 10-12 experts; 2-3 converted to full-time",
      "phase": "Year 2 H2",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 24",
      "targetDate": "2028-07-14",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Cumulative wins: 12-15 -- Rs 60 Cr contracted/executed",
      "phase": "Year 2 H2",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 24",
      "targetDate": "2028-07-14",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Department heads formalized: BD, Tendering, HR, Admin, Technical, Finance",
      "phase": "Year 3 H1",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 27",
      "targetDate": "2028-10-12",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "ISO/QMS certification process started",
      "phase": "Year 3 H1",
      "owner": "Technical Head",
      "deadlineLabel": "Month 30",
      "targetDate": "2029-01-10",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Rs 45-55 Cr in-hand contracts confirmed",
      "phase": "Year 3 H1",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 30",
      "targetDate": "2029-01-10",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Full departmental structure operational and independently running without daily MD intervention",
      "phase": "Year 3 H2",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 33",
      "targetDate": "2029-04-10",
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "ISO/QMS certification completed",
      "phase": "Year 3 H2",
      "owner": "Technical Head",
      "deadlineLabel": "Month 33",
      "targetDate": "2029-04-10",
      "priority": "Medium",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Cumulative wins: 16-20 -- Rs 100 Cr contracted/executed",
      "phase": "Year 3 H2",
      "owner": "MD/CEO",
      "deadlineLabel": "Month 36",
      "targetDate": "2029-07-09",
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Scan all portals for new relevant EoIs",
      "phase": "Weekly Non-Negotiable",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Every Monday",
      "targetDate": null,
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Update tender tracker with status of every live bid",
      "phase": "Weekly Non-Negotiable",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Every Friday",
      "targetDate": null,
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Report pipeline count + wins to MD",
      "phase": "Weekly Non-Negotiable",
      "owner": "BD & Tendering Mgr",
      "deadlineLabel": "Every Friday",
      "targetDate": null,
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "Check hiring pipeline against plan",
      "phase": "Weekly Non-Negotiable",
      "owner": "HR-cum-Admin Mgr",
      "deadlineLabel": "Every Friday",
      "targetDate": null,
      "priority": "High",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "WATCH: Phase 0 hire (BD & Tendering Mgr or HR-cum-Admin Mgr) not closed by Day 20 -- escalate within 48 hrs",
      "phase": "Kill Criteria",
      "owner": "MD/CEO",
      "deadlineLabel": "Ongoing watch",
      "targetDate": null,
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "WATCH: Fewer than 5 EoIs submitted by Day 21 -- escalate within 48 hrs",
      "phase": "Kill Criteria",
      "owner": "MD/CEO",
      "deadlineLabel": "Ongoing watch",
      "targetDate": null,
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "WATCH: No win confirmed by Day 90 -- escalate within 48 hrs",
      "phase": "Kill Criteria",
      "owner": "MD/CEO",
      "deadlineLabel": "Ongoing watch",
      "targetDate": null,
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "WATCH: Any quarterly cumulative win count falls >25% behind Year 1 target -- escalate within 48 hrs",
      "phase": "Kill Criteria",
      "owner": "MD/CEO",
      "deadlineLabel": "Ongoing watch",
      "targetDate": null,
      "priority": "Critical",
      "status": "Not Started",
      "notes": null
    },
    {
      "title": "WATCH: Monthly BD/Tendering review meeting skipped for any reason -- escalate within 48 hrs",
      "phase": "Kill Criteria",
      "owner": "MD/CEO",
      "deadlineLabel": "Ongoing watch",
      "targetDate": null,
      "priority": "High",
      "status": "Not Started",
      "notes": null
    }
  ],
  "dailyTasks": [
    {
      "dateAdded": "2026-07-28",
      "title": "Tendar software - discussion with dhavalbhai",
      "department": "BD & Tendering",
      "assignedTo": null,
      "priority": "High",
      "dueDate": "2026-07-30",
      "status": null,
      "notes": "DISCUSSION DS & ANKUR GHAI"
    },
    {
      "dateAdded": "2026-07-28",
      "title": "Vendor & client card scan machine",
      "department": "BD & Tendering",
      "assignedTo": null,
      "priority": "Medium",
      "dueDate": "2026-07-30",
      "status": null,
      "notes": "dhavalbhai & prince"
    }
  ],
  "announcements": [
    {
      "date": "2026-07-28",
      "text": "planig to Dising Exibition in Dilhi at 06 to 08 Augsst we plan to dising teem participat with Arpitbhai",
      "postedBy": "ATUL"
    },
    {
      "date": null,
      "text": "DISCUTION WITH DHAVALBHAI (husikhi rshiyo chu mate lakhvama bhul thse sudhrine vachvu)",
      "postedBy": null
    },
    {
      "date": "2026-07-28",
      "text": "Card rider machin purchase, discution with dhavalbhai & prince",
      "postedBy": "ATUL"
    }
  ]
};

async function resolveActor(): Promise<mongoose.Types.ObjectId> {
  if (ACTOR_EMAIL) {
    const user = await User.findOne({ email: ACTOR_EMAIL.toLowerCase() }).select('_id');
    if (!user) throw new Error(`--actor user not found: ${ACTOR_EMAIL}`);
    return user._id;
  }
  const rootRole = await Role.findOne({ name: /^root$/i }).select('_id');
  if (rootRole) {
    const rootUser = await User.findOne({ role: rootRole._id }).select('_id');
    if (rootUser) return rootUser._id;
  }
  throw new Error('No Root user found. Pass --actor <email> of an existing user.');
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
  console.log('Connected to database');

  const actorId = await resolveActor();
  const report = await importErpData(DATA, actorId, { dryRun: DRY_RUN });

  console.log('\n=== ERP workbook import report ===');
  console.log(`Project "${report.project.name}": ${report.project.action}`);
  console.log(`Roadmap tasks:  ${report.roadmapTasks.created} created, ${report.roadmapTasks.skipped} skipped (already present)`);
  console.log(`Daily tasks:    ${report.dailyTasks.created} created, ${report.dailyTasks.skipped} skipped`);
  console.log(`Announcements:  ${report.announcements.created} created, ${report.announcements.skipped} skipped`);

  const matches = Object.entries(report.ownerMatches);
  if (matches.length) {
    console.log('\nOwner labels matched to users:');
    for (const [label, name] of matches) console.log(`  ${label}  ->  ${name}`);
  }
  if (report.unmatchedOwners.length) {
    console.log('\nOwner labels with NO matching user (tasks assigned to the actor instead,');
    console.log('original owner kept as an "owner:<label>" tag for reassignment):');
    for (const label of report.unmatchedOwners) console.log(`  - ${label}`);
  }
  if (DRY_RUN) console.log('\nDRY RUN — no writes performed. Re-run without --dry-run to apply.');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
