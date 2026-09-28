/**
 * Imports a biometric device attendance log (ALOG_*.txt: UTF-16, tab-separated
 * No/TMNo/EnNo/Name/GMNo/Mode/In-Out/Antipass/ProxyWork/DateTime) into Attendance.
 * One record per employee per day: first punch is the check-in, last punch the
 * check-out. Records are entrySource 'card' and auto-approved, like /attendance/card-sync.
 *
 * The map file ties device enroll numbers to employees:
 *   { importTag, timezoneOffset: "+05:30", lateAfter: "10:15",
 *     devices: { "<EnNo>": "<employeeId>" | "NEW:<full name>" } }
 * "NEW:" entries create an inactive User + Employee, as importStatusWorkbooks does.
 * Enroll numbers missing from the map are skipped and reported.
 *
 * Run with:
 *   npx ts-node --transpile-only src/scripts/importAttendanceLog.ts --log <ALOG.txt> --map <map.json> --dry-run
 *   npx ts-node --transpile-only src/scripts/importAttendanceLog.ts --log <ALOG.txt> --map <map.json> --backup <backup.json>
 *   npx ts-node --transpile-only src/scripts/importAttendanceLog.ts --revert --backup <backup.json>
 *
 * Idempotent: a day that already has an attendance record for the employee is
 * left untouched, so re-running only adds new days. Reads MONGO_URI from env.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import User from '../models/User';
import { Role } from '../models/Role';

dotenv.config();

const arg = (flag: string) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const DRY_RUN = process.argv.includes('--dry-run');
const REVERT = process.argv.includes('--revert');
const LOG = arg('--log');
const MAP = arg('--map');
const BACKUP = arg('--backup');
if (REVERT && !BACKUP) throw new Error('--revert needs --backup <file>');
if (!REVERT && (!LOG || !MAP)) throw new Error('Missing --log <ALOG.txt> or --map <map.json>');
if (!REVERT && !DRY_RUN && !BACKUP) throw new Error('A real run needs --backup <file> so it can be reverted');

const STAFF_EMAIL_DOMAIN = 'staff.rayerp.local';
const HALF_DAY_HOURS = 4;
const BATCH = 500;

interface DeviceMap {
  importTag: string;
  timezoneOffset: string;
  lateAfter: string;
  devices: Record<string, string>;
}
interface Backup {
  importTag: string;
  createdUsers: string[];
  createdEmployees: string[];
  createdAttendance: string[];
}
interface Punch { enNo: string; name: string; at: Date; day: string }

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');

function readLog(file: string, tz: string): Punch[] {
  const lines = fs.readFileSync(file, 'utf16le').replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0].split('\t');
  const col = (n: string) => {
    const i = header.indexOf(n);
    if (i === -1) throw new Error(`Log header is missing column "${n}"`);
    return i;
  };
  const [cEn, cName, cAt] = [col('EnNo'), col('Name'), col('DateTime')];
  const punches: Punch[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const f = line.split('\t');
    const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(f[cAt] || '');
    if (!m) throw new Error(`Unparseable DateTime in line: ${line}`);
    punches.push({ enNo: f[cEn], name: f[cName], at: new Date(`${m[1]}T${m[2]}${tz}`), day: m[1] });
  }
  return punches;
}

async function resolveEmployees(map: DeviceMap, firstSeen: Map<string, string>, backup: Backup) {
  const pendingRole = await Role.findOne({ name: 'Pending' }).select('_id');
  if (!pendingRole) throw new Error('Pending role not found.');

  const resolved = new Map<string, mongoose.Types.ObjectId | null>();
  const missing: string[] = [];
  const toCreate = Object.entries(map.devices).filter(([, ref]) => ref.startsWith('NEW:'));
  for (const [enNo, ref] of Object.entries(map.devices)) {
    if (ref.startsWith('NEW:')) continue;
    const e = await Employee.findOne({ employeeId: ref }).select('_id');
    if (e) resolved.set(enNo, e._id as mongoose.Types.ObjectId);
    else missing.push(`${enNo} -> ${ref}`);
  }
  if (missing.length) throw new Error(`Employees not found: ${missing.join(', ')}`);

  const all = await Employee.find({ employeeId: /^EMP-IMP-\d+$/ }).select('employeeId').lean();
  let seq = Math.max(0, ...all.map(e => parseInt(e.employeeId.slice(8), 10)));
  console.log('\n-- Staff --');
  for (const [enNo, ref] of toCreate) {
    const name = ref.slice(4).trim();
    const email = `${slug(name)}@${STAFF_EMAIL_DOMAIN}`;
    const existingUser = await User.findOne({ email }).select('_id');
    const existingEmp = existingUser ? await Employee.findOne({ user: existingUser._id }).select('_id') : null;
    if (existingEmp) {
      console.log(`  = ${name} already present`);
      resolved.set(enNo, existingEmp._id as mongoose.Types.ObjectId);
      continue;
    }
    if (existingUser) throw new Error(`User ${email} exists without an Employee; resolve by hand`);
    seq++;
    const employeeId = `EMP-IMP-${String(seq).padStart(3, '0')}`;
    const hireDate = firstSeen.get(enNo);
    console.log(`  + ${name} (${employeeId}, ${email}, inactive, first punch ${hireDate})`);
    if (DRY_RUN) { resolved.set(enNo, null); continue; }
    const [firstName, ...rest] = name.split(/\s+/);
    const user = await User.create({
      name,
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: pendingRole._id,
      status: 'inactive',
    });
    backup.createdUsers.push(String(user._id));
    const emp = await Employee.create({
      employeeId,
      firstName,
      lastName: rest.join(' ') || undefined,
      email,
      hireDate: new Date(`${hireDate}T00:00:00${map.timezoneOffset}`),
      status: 'inactive',
      user: user._id,
    });
    backup.createdEmployees.push(String(emp._id));
    fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
    resolved.set(enNo, emp._id as mongoose.Types.ObjectId);
  }
  return resolved;
}

function buildDay(employee: mongoose.Types.ObjectId | null, enNo: string, day: string, punches: Punch[], map: DeviceMap) {
  const sorted = punches.map(p => p.at).sort((a, b) => a.getTime() - b.getTime());
  const checkIn = sorted[0];
  const last = sorted[sorted.length - 1];
  const checkOut = last.getTime() > checkIn.getTime() ? last : undefined;
  const totalHours = checkOut ? (checkOut.getTime() - checkIn.getTime()) / 3_600_000 : 0;
  const lateAt = new Date(`${day}T${map.lateAfter}:00${map.timezoneOffset}`);
  let status: 'present' | 'late' | 'half-day' = checkIn > lateAt ? 'late' : 'present';
  if (checkOut && totalHours < HALF_DAY_HOURS) status = 'half-day';
  return {
    employee,
    date: new Date(`${day}T00:00:00${map.timezoneOffset}`),
    checkIn,
    checkOut,
    totalHours: Math.round(totalHours * 100) / 100,
    breakTime: 0,
    status,
    notes: `Imported from device log (${map.importTag})`,
    isManualEntry: false,
    approvalStatus: 'auto-approved',
    cardEntryTime: checkIn,
    cardExitTime: checkOut,
    cardId: enNo,
    entrySource: 'card',
  };
}

async function revert(b: Backup) {
  console.log(`Reverting ${b.importTag}`);
  const ids = (a: string[]) => a.map(id => new mongoose.Types.ObjectId(id));
  console.log(`  attendance deleted: ${(await Attendance.deleteMany({ _id: { $in: ids(b.createdAttendance) } })).deletedCount}`);
  console.log(`  employees deleted: ${(await Employee.deleteMany({ _id: { $in: ids(b.createdEmployees) } })).deletedCount}`);
  console.log(`  users deleted: ${(await User.deleteMany({ _id: { $in: ids(b.createdUsers) } })).deletedCount}`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp');
  console.log(`Connected to database "${mongoose.connection.db?.databaseName}"`);

  if (REVERT) {
    await revert(JSON.parse(fs.readFileSync(BACKUP!, 'utf8')));
    return;
  }
  if (DRY_RUN) console.log('DRY RUN — no writes will be performed.');
  if (!DRY_RUN && fs.existsSync(BACKUP!)) throw new Error(`Backup file ${BACKUP} already exists; choose a new path`);

  const map: DeviceMap = JSON.parse(fs.readFileSync(MAP!, 'utf8'));
  if (!/^[+-]\d{2}:\d{2}$/.test(map.timezoneOffset)) throw new Error('timezoneOffset must look like +05:30');
  if (!/^\d{2}:\d{2}$/.test(map.lateAfter)) throw new Error('lateAfter must look like 10:15');

  const punches = readLog(LOG!, map.timezoneOffset);
  console.log(`Read ${punches.length} punches from ${LOG}`);

  const byDevice = new Map<string, Map<string, Punch[]>>();
  const firstSeen = new Map<string, string>();
  const names = new Map<string, string>();
  for (const p of punches) {
    if (!byDevice.has(p.enNo)) byDevice.set(p.enNo, new Map());
    const days = byDevice.get(p.enNo)!;
    if (!days.has(p.day)) days.set(p.day, []);
    days.get(p.day)!.push(p);
    if (!firstSeen.has(p.enNo) || p.day < firstSeen.get(p.enNo)!) firstSeen.set(p.enNo, p.day);
    if (p.name) names.set(p.enNo, p.name);
  }

  const backup: Backup = { importTag: map.importTag, createdUsers: [], createdEmployees: [], createdAttendance: [] };
  const employees = await resolveEmployees(map, firstSeen, backup);

  console.log('\n-- Attendance --');
  console.log('  EnNo      Device name   Target         days  new  existing  late  half-day  no-out');
  const docs: ReturnType<typeof buildDay>[] = [];
  const totals = { days: 0, add: 0, existing: 0 };
  const skipped: string[] = [];
  for (const [enNo, days] of [...byDevice].sort(([a], [b]) => a.localeCompare(b))) {
    const ref = map.devices[enNo];
    if (!ref) {
      skipped.push(`${enNo} "${names.get(enNo) || ''}" (${days.size} days)`);
      continue;
    }
    const employee = employees.get(enNo) ?? null;
    const existing = employee
      ? new Set((await Attendance.find({ employee }).select('date').lean()).map(a => a.date.getTime()))
      : new Set<number>();
    const row = { add: 0, existing: 0, late: 0, half: 0, noOut: 0 };
    for (const [day, list] of days) {
      const doc = buildDay(employee, enNo, day, list, map);
      if (existing.has(doc.date.getTime())) { row.existing++; continue; }
      row.add++;
      if (doc.status === 'late') row.late++;
      if (doc.status === 'half-day') row.half++;
      if (!doc.checkOut) row.noOut++;
      docs.push(doc);
    }
    totals.days += days.size; totals.add += row.add; totals.existing += row.existing;
    console.log(`  ${enNo}  ${(names.get(enNo) || '').padEnd(12)}  ${ref.padEnd(13)}  ${String(days.size).padStart(4)}  ${String(row.add).padStart(4)}  ${String(row.existing).padStart(8)}  ${String(row.late).padStart(4)}  ${String(row.half).padStart(8)}  ${String(row.noOut).padStart(6)}`);
  }
  console.log(`  total: ${totals.days} person-days, ${totals.add} to insert, ${totals.existing} already present`);
  if (skipped.length) console.log(`  skipped (not in map): ${skipped.join(', ')}`);

  if (DRY_RUN) return;
  for (let i = 0; i < docs.length; i += BATCH) {
    const inserted = await Attendance.insertMany(docs.slice(i, i + BATCH));
    backup.createdAttendance.push(...inserted.map(d => String(d._id)));
    fs.writeFileSync(BACKUP!, JSON.stringify(backup, null, 1));
  }
  console.log(`  inserted ${backup.createdAttendance.length} attendance records; backup written to ${BACKUP}`);
}

run()
  .then(() => mongoose.disconnect())
  .catch(async err => {
    console.error(err instanceof Error ? err.message : err);
    await mongoose.disconnect();
    process.exit(1);
  });
