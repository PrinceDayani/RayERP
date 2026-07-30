// backend/src/services/erpWorkbookImportService.ts
// Imports the "Ray Infrastructures ERP" Excel workbook (Daily Tasks,
// Strategic Roadmap, Announcements sheets) into Tasks, a roadmap Project,
// and Broadcasts. Shared by the one-time seed script
// (scripts/importErpWorkbook.ts) and the upload endpoint
// (controllers/dataImportController.ts). Idempotent: existing rows are
// matched by title/content and skipped.
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';
import Broadcast from '../models/Broadcast';
import User from '../models/User';

export interface RoadmapRow {
  title: string;
  phase: string | null;
  owner: string | null;
  deadlineLabel: string | null;
  targetDate: string | null; // YYYY-MM-DD
  priority: string | null;
  status: string | null;
  notes: string | null;
}

export interface DailyTaskRow {
  dateAdded: string | null;
  title: string;
  department: string | null;
  assignedTo: string | null;
  priority: string | null;
  dueDate: string | null;
  status: string | null;
  notes: string | null;
}

export interface AnnouncementRow {
  date: string | null;
  text: string;
  postedBy: string | null;
}

export interface ErpWorkbookData {
  roadmapTasks: RoadmapRow[];
  dailyTasks: DailyTaskRow[];
  announcements: AnnouncementRow[];
}

export interface ImportOptions {
  dryRun: boolean;
  // Explicit workbook-owner-label -> user email mapping (e.g.
  // { "MD/CEO": "ceo@company.com" }). Checked before name matching.
  ownerMap?: Record<string, string>;
}

export interface ImportReport {
  dryRun: boolean;
  project: { name: string; action: 'created' | 'existing' | 'would-create' };
  roadmapTasks: { created: number; skipped: number };
  dailyTasks: { created: number; skipped: number };
  announcements: { created: number; skipped: number };
  ownerMatches: Record<string, string>; // owner label -> matched user name
  unmatchedOwners: string[]; // labels that fell back to the importing user
}

export const ROADMAP_PROJECT_NAME = 'Strategic Roadmap - Rs 100 Cr Execution';

const STATUS_MAP: Record<string, string> = {
  'not started': 'todo',
  'in progress': 'in-progress',
  'done': 'completed',
  'completed': 'completed',
  'blocked': 'blocked',
};

const PRIORITY_MAP: Record<string, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

const mapStatus = (v: string | null) => STATUS_MAP[(v || '').trim().toLowerCase()] || 'todo';
const mapPriority = (v: string | null) => PRIORITY_MAP[(v || '').trim().toLowerCase()] || 'medium';
const toDate = (v: string | null) => (v ? new Date(`${v}T00:00:00.000Z`) : undefined);

// --- Excel parsing -----------------------------------------------------------

const cellText = (row: ExcelJS.Row, col: number): string | null => {
  const cell = row.getCell(col);
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    // Formula cells carry their cached value in `result`
    const result = (v as ExcelJS.CellFormulaValue).result;
    if (result instanceof Date) return result.toISOString().slice(0, 10);
    if (typeof result === 'string' || typeof result === 'number') {
      const s = String(result).trim();
      return s || null;
    }
    // Rich text and other object values
    const text = (cell.text || '').trim();
    return text || null;
  }
  const s = String(v).trim();
  return s || null;
};

// Accepts Excel Date cells (already ISO from cellText) and dd/mm/yyyy strings.
const cellDate = (row: ExcelJS.Row, col: number): string | null => {
  const s = cellText(row, col);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

export async function parseErpWorkbook(buffer: Buffer): Promise<ErpWorkbookData> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const data: ErpWorkbookData = { roadmapTasks: [], dailyTasks: [], announcements: [] };

  const roadmap = wb.getWorksheet('Strategic Roadmap');
  roadmap?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const title = cellText(row, 2);
    if (!title) return;
    data.roadmapTasks.push({
      title,
      phase: cellText(row, 3),
      owner: cellText(row, 4),
      deadlineLabel: cellText(row, 5),
      targetDate: cellDate(row, 7),
      priority: cellText(row, 9),
      status: cellText(row, 10),
      notes: cellText(row, 12),
    });
  });

  const daily = wb.getWorksheet('Daily Tasks');
  daily?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const title = cellText(row, 3);
    if (!title) return;
    data.dailyTasks.push({
      dateAdded: cellDate(row, 2),
      title,
      department: cellText(row, 4),
      assignedTo: cellText(row, 5),
      priority: cellText(row, 6),
      dueDate: cellDate(row, 7),
      status: cellText(row, 8),
      notes: cellText(row, 10),
    });
  });

  const ann = wb.getWorksheet('Announcements');
  ann?.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const text = cellText(row, 2);
    if (!text) return;
    data.announcements.push({
      date: cellDate(row, 1),
      text,
      postedBy: cellText(row, 3),
    });
  });

  return data;
}

// --- User matching -----------------------------------------------------------

// Matches a workbook owner label ("MD/CEO", "ATUL", "BD & Tendering Mgr")
// against the explicit ownerMap (label -> email) first, then existing users
// by exact name, then by name token. Returns null when nothing matches; the
// caller falls back to the importing user and reports it.
function matchUser(
  label: string,
  users: { _id: mongoose.Types.ObjectId; name: string; email: string }[],
  ownerMap?: Record<string, string>
): { _id: mongoose.Types.ObjectId; name: string } | null {
  const needle = label.trim().toLowerCase();
  if (ownerMap) {
    const mappedEmail = Object.entries(ownerMap).find(
      ([key]) => key.trim().toLowerCase() === needle
    )?.[1];
    if (mappedEmail) {
      const byEmail = users.find(u => u.email.toLowerCase() === mappedEmail.trim().toLowerCase());
      if (byEmail) return byEmail;
    }
  }
  const exact = users.find(u => u.name.trim().toLowerCase() === needle);
  if (exact) return exact;
  const token = users.find(u =>
    u.name.toLowerCase().split(/\s+/).includes(needle) ||
    needle.split(/\s+/).includes(u.name.trim().toLowerCase())
  );
  return token || null;
}

// --- Import ------------------------------------------------------------------

export async function importErpData(
  data: ErpWorkbookData,
  actorId: mongoose.Types.ObjectId,
  options: ImportOptions
): Promise<ImportReport> {
  const { dryRun } = options;
  const report: ImportReport = {
    dryRun,
    project: { name: ROADMAP_PROJECT_NAME, action: 'existing' },
    roadmapTasks: { created: 0, skipped: 0 },
    dailyTasks: { created: 0, skipped: 0 },
    announcements: { created: 0, skipped: 0 },
    ownerMatches: {},
    unmatchedOwners: [],
  };

  const users = await User.find({}, 'name email').lean<{ _id: mongoose.Types.ObjectId; name: string; email: string }[]>();

  const resolveOwner = (label: string | null): mongoose.Types.ObjectId => {
    if (!label) return actorId;
    const match = matchUser(label, users, options.ownerMap);
    if (match) {
      report.ownerMatches[label] = match.name;
      return match._id;
    }
    if (!report.unmatchedOwners.includes(label)) report.unmatchedOwners.push(label);
    return actorId;
  };

  // Roadmap project + tasks
  let projectId: mongoose.Types.ObjectId | undefined;
  if (data.roadmapTasks.length > 0) {
    const existing = await Project.findOne({ name: ROADMAP_PROJECT_NAME }).select('_id');
    if (existing) {
      projectId = existing._id;
    } else if (dryRun) {
      report.project.action = 'would-create';
    } else {
      const targetDates = data.roadmapTasks.map(t => t.targetDate).filter(Boolean) as string[];
      const endDate = targetDates.length ? targetDates.sort()[targetDates.length - 1] : '2029-07-09';
      const project = await Project.create({
        name: ROADMAP_PROJECT_NAME,
        description:
          'Company execution roadmap imported from the Ray Infrastructures ERP workbook. Targets: Y1 Rs 25 Cr, Y2 Rs 60 Cr, Y3 Rs 100 Cr.',
        status: 'active',
        priority: 'critical',
        startDate: toDate('2026-07-25'),
        endDate: toDate(endDate),
        budget: 0,
        currency: 'INR',
        owner: actorId,
        managers: [actorId],
        team: [actorId],
        tags: ['roadmap', 'erp-import'],
      });
      projectId = project._id;
      report.project.action = 'created';
    }

    for (const row of data.roadmapTasks) {
      const exists = projectId
        ? await Task.findOne({ title: row.title, project: projectId }).select('_id')
        : null;
      if (exists) {
        report.roadmapTasks.skipped++;
        continue;
      }
      report.roadmapTasks.created++;
      if (dryRun) {
        if (row.owner) resolveOwner(row.owner); // still report matches in dry-run
        continue;
      }
      const assignedTo = resolveOwner(row.owner);
      const descriptionParts = [
        row.phase ? `Phase: ${row.phase}` : null,
        row.owner ? `Owner (from workbook): ${row.owner}` : null,
        row.deadlineLabel ? `Deadline: ${row.deadlineLabel}` : null,
        row.notes,
      ].filter(Boolean);
      await Task.create({
        title: row.title,
        description: descriptionParts.join('\n') || row.title,
        taskType: 'project',
        assignmentType: 'assigned',
        project: projectId,
        assignedTo,
        assignedBy: actorId,
        status: mapStatus(row.status),
        priority: mapPriority(row.priority),
        dueDate: toDate(row.targetDate),
        tags: [
          ...(row.phase ? [{ name: row.phase }] : []),
          ...(row.owner ? [{ name: `owner:${row.owner}`, color: '#8b5cf6' }] : []),
        ],
      });
    }
  }

  // Daily (individual) tasks
  for (const row of data.dailyTasks) {
    const exists = await Task.findOne({ title: row.title, taskType: 'individual' }).select('_id');
    if (exists) {
      report.dailyTasks.skipped++;
      continue;
    }
    report.dailyTasks.created++;
    const assignedTo = resolveOwner(row.assignedTo);
    if (dryRun) continue;
    await Task.create({
      title: row.title,
      description: row.notes || row.title,
      taskType: 'individual',
      assignmentType: 'assigned',
      assignedTo,
      assignedBy: actorId,
      status: mapStatus(row.status),
      priority: mapPriority(row.priority),
      dueDate: toDate(row.dueDate),
      tags: row.department ? [{ name: row.department, color: '#f59e0b' }] : [],
    });
  }

  // Announcements -> webapp broadcasts
  for (const row of data.announcements) {
    const exists = await Broadcast.findOne({ content: row.text }).select('_id');
    if (exists) {
      report.announcements.skipped++;
      continue;
    }
    report.announcements.created++;
    const sender = row.postedBy ? resolveOwner(row.postedBy) : actorId;
    if (dryRun) continue;
    await Broadcast.create({
      sender,
      content: row.text,
      type: 'webapp',
      timestamp: toDate(row.date) || new Date(),
    });
  }

  return report;
}
