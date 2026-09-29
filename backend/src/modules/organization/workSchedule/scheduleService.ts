import mongoose from 'mongoose';
import WorkSchedule, { IWeeklyOff, IWorkSchedule } from './WorkSchedule';
import Holiday from '../holidays/Holiday';
import Employee from '../../hr/employees/Employee';
import Department from '../../hr/departments/Department';
import { appTimezone, startOfZonedDay } from '../../../utils/timezoneHelper';

export type ScheduleSource = 'employee' | 'department' | 'organization' | 'built-in';

export interface ScheduleRules {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  lateGraceMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  breakMinutes: number;
  weeklyOffs: IWeeklyOff[];
  source: ScheduleSource;
}

// The rules attendance used before timings became configurable. They apply
// until an administrator saves the organisation's general timings.
export const BUILT_IN_RULES: ScheduleRules = {
  name: 'Standard',
  startTime: '10:00',
  endTime: '18:00',
  lateGraceMinutes: 15,
  halfDayHours: 4,
  fullDayHours: 8,
  breakMinutes: 0,
  weeklyOffs: [],
  source: 'built-in',
};

const toRules = (s: Pick<IWorkSchedule, 'name' | 'startTime' | 'endTime' | 'lateGraceMinutes' | 'halfDayHours' | 'fullDayHours' | 'breakMinutes' | 'weeklyOffs'> & { _id?: unknown }, source: ScheduleSource): ScheduleRules => ({
  id: s._id ? String(s._id) : undefined,
  name: s.name,
  startTime: s.startTime,
  endTime: s.endTime,
  lateGraceMinutes: s.lateGraceMinutes,
  halfDayHours: s.halfDayHours,
  fullDayHours: s.fullDayHours,
  breakMinutes: s.breakMinutes,
  weeklyOffs: (s.weeklyOffs || []).map(o => ({ day: o.day, weeks: [...(o.weeks || [])] })),
  source,
});

// General timings are read on every check-in, so they are held in process and
// dropped whenever a schedule changes.
let generalCache: { rules: ScheduleRules; expires: number } | null = null;
const CACHE_TTL_MS = 60000;

export const invalidateScheduleCache = (): void => {
  generalCache = null;
};

export const getGeneralRules = async (): Promise<ScheduleRules> => {
  if (generalCache && generalCache.expires > Date.now()) return generalCache.rules;
  const doc = await WorkSchedule.findOne({ isDefault: true, active: true }).lean();
  const rules = doc ? toRules(doc, 'organization') : BUILT_IN_RULES;
  generalCache = { rules, expires: Date.now() + CACHE_TTL_MS };
  return rules;
};

/**
 * The timings that apply to an employee: their own shift, else the first of
 * their departments that has one, else the organisation's general timings.
 */
export const resolveRulesForEmployee = async (employeeId: unknown): Promise<ScheduleRules> => {
  if (!employeeId || !mongoose.Types.ObjectId.isValid(String(employeeId))) return getGeneralRules();

  const employee = await Employee.findById(employeeId).select('workSchedule department departments').lean();
  if (!employee) return getGeneralRules();

  if (employee.workSchedule) {
    const own = await WorkSchedule.findOne({ _id: employee.workSchedule, active: true }).lean();
    if (own) return toRules(own, 'employee');
  }

  const names = [...(employee.departments || []), employee.department].filter((n): n is string => !!n);
  if (names.length) {
    const departments = await Department.find({ name: { $in: names }, workSchedule: { $ne: null } })
      .select('name workSchedule')
      .lean();
    for (const name of names) {
      const dept = departments.find(d => d.name === name);
      if (!dept?.workSchedule) continue;
      const shift = await WorkSchedule.findOne({ _id: dept.workSchedule, active: true }).lean();
      if (shift) return toRules(shift, 'department');
    }
  }

  return getGeneralRules();
};

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const arrivalStatus = (rules: ScheduleRules, arrival: Date): 'present' | 'late' => {
  const workStart = startOfZonedDay(arrival).getTime() + minutesOf(rules.startTime) * 60_000;
  const lateMinutes = (arrival.getTime() - workStart) / 60_000;
  return lateMinutes > rules.lateGraceMinutes ? 'late' : 'present';
};

export const isHalfDay = (rules: ScheduleRules, workedHours: number): boolean => workedHours < rules.halfDayHours;

/** YYYY-MM-DD of the calendar day containing `at` in the business timezone. */
export const dayKey = (at: Date, timezone: string = appTimezone()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);

const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const shiftKey = (key: string, days: number) => {
  const d = parseKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const isWeeklyOff = (rules: ScheduleRules, key: string): boolean => {
  const date = parseKey(key);
  const weekday = date.getUTCDay();
  const weekOfMonth = Math.ceil(date.getUTCDate() / 7);
  return rules.weeklyOffs.some(o => o.day === weekday && (o.weeks.length === 0 || o.weeks.includes(weekOfMonth)));
};

/** Public holidays between two YYYY-MM-DD keys, inclusive. Optional holidays are not days off. */
export const publicHolidayKeys = async (fromKey: string, toKey: string): Promise<Set<string>> => {
  const holidays = await Holiday.find({ date: { $gte: fromKey, $lte: toKey }, type: 'public' }).select('date').lean();
  return new Set(holidays.map(h => h.date));
};

/** Working days between two YYYY-MM-DD keys, inclusive, skipping weekly offs and public holidays. */
export const countWorkingDays = async (rules: ScheduleRules, fromKey: string, toKey: string): Promise<number> => {
  const holidays = await publicHolidayKeys(fromKey, toKey);
  let count = 0;
  for (let key = fromKey; key <= toKey; key = shiftKey(key, 1)) {
    if (!holidays.has(key) && !isWeeklyOff(rules, key)) count++;
  }
  return count;
};

export const calendarDays = (fromKey: string, toKey: string): number =>
  Math.round((parseKey(toKey).getTime() - parseKey(fromKey).getTime()) / 86_400_000) + 1;
