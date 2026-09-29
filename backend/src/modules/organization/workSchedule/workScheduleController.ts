import { Request, Response } from 'express';
import mongoose from 'mongoose';
import WorkSchedule from './WorkSchedule';
import Employee from '../../hr/employees/Employee';
import Department from '../../hr/departments/Department';
import { logger } from '../../../utils/logger';
import { BUILT_IN_RULES, getGeneralRules, invalidateScheduleCache, resolveRulesForEmployee } from './scheduleService';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const isId = (v: unknown) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

type ScheduleInput = {
  name: string; description?: string; startTime: string; endTime: string;
  lateGraceMinutes: number; halfDayHours: number; fullDayHours: number; breakMinutes: number;
  weeklyOffs: { day: number; weeks: number[] }[]; active: boolean;
};

// Returns the cleaned fields or an error message. `partial` allows omitting fields on update.
const readSchedule = (body: any, partial: boolean): { data?: Partial<ScheduleInput>; error?: string } => {
  const data: Partial<ScheduleInput> = {};
  const has = (k: string) => body[k] !== undefined;

  if (has('name') || !partial) {
    const name = String(body.name ?? '').trim();
    if (!name || name.length > 80) return { error: 'name is required (up to 80 characters)' };
    data.name = name;
  }
  if (has('description')) data.description = String(body.description ?? '').trim().slice(0, 300);

  for (const k of ['startTime', 'endTime'] as const) {
    if (has(k) || !partial) {
      if (!TIME.test(String(body[k] ?? ''))) return { error: `${k} must be HH:mm (24-hour)` };
      data[k] = body[k];
    }
  }

  const numbers: [keyof ScheduleInput, number, number][] = [
    ['lateGraceMinutes', 0, 240], ['halfDayHours', 0, 24], ['fullDayHours', 0, 24], ['breakMinutes', 0, 600],
  ];
  for (const [k, min, max] of numbers) {
    if (has(k) || (!partial && k !== 'breakMinutes')) {
      const n = Number(body[k]);
      if (!Number.isFinite(n) || n < min || n > max) return { error: `${k} must be between ${min} and ${max}` };
      (data as any)[k] = n;
    }
  }

  if (has('weeklyOffs')) {
    if (!Array.isArray(body.weeklyOffs)) return { error: 'weeklyOffs must be a list' };
    const offs: { day: number; weeks: number[] }[] = [];
    for (const o of body.weeklyOffs) {
      const day = Number(o?.day);
      const weeks = Array.isArray(o?.weeks) ? [...new Set(o.weeks.map(Number))] as number[] : [];
      if (!Number.isInteger(day) || day < 0 || day > 6) return { error: 'weeklyOffs day must be 0 (Sunday) to 6 (Saturday)' };
      if (weeks.some(w => !Number.isInteger(w) || w < 1 || w > 5)) return { error: 'weeklyOffs weeks must be 1 to 5' };
      if (offs.some(x => x.day === day)) return { error: 'Each weekday may appear once in weeklyOffs' };
      offs.push({ day, weeks: weeks.sort() });
    }
    data.weeklyOffs = offs;
  }

  if (has('active')) data.active = body.active === true;

  const start = data.startTime ?? body.startTime;
  const end = data.endTime ?? body.endTime;
  if (start && end && start === end) return { error: 'startTime and endTime must differ' };
  if (data.halfDayHours !== undefined && data.fullDayHours !== undefined && data.halfDayHours > data.fullDayHours) {
    return { error: 'halfDayHours cannot exceed fullDayHours' };
  }
  return { data };
};

const duplicateName = (error: any) => error?.code === 11000;

// Everyone can read timings: the attendance form, leave requests and the
// employee's own profile all need them.
export const listSchedules = async (_req: Request, res: Response) => {
  try {
    const schedules = await WorkSchedule.find().sort({ isDefault: -1, name: 1 }).lean();
    const ids = schedules.map(s => s._id);
    const [deptCounts, empCounts] = await Promise.all([
      Department.aggregate([{ $match: { workSchedule: { $in: ids } } }, { $group: { _id: '$workSchedule', n: { $sum: 1 } } }]),
      Employee.aggregate([{ $match: { workSchedule: { $in: ids } } }, { $group: { _id: '$workSchedule', n: { $sum: 1 } } }]),
    ]);
    const count = (rows: any[], id: unknown) => rows.find(r => String(r._id) === String(id))?.n || 0;
    res.json({
      success: true,
      data: schedules.map(s => ({ ...s, departmentCount: count(deptCounts, s._id), employeeCount: count(empCounts, s._id) })),
      general: await getGeneralRules(),
      builtIn: BUILT_IN_RULES,
    });
  } catch (error: any) {
    logger.error('List work schedules error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error fetching work schedules' });
  }
};

// Timings in force for one employee, with where they came from.
export const getEmployeeRules = async (req: Request, res: Response) => {
  try {
    if (!isId(req.params.employeeId)) return res.status(400).json({ success: false, message: 'Invalid employee id' });
    res.json({ success: true, data: await resolveRulesForEmployee(req.params.employeeId) });
  } catch (error: any) {
    logger.error('Resolve employee timings error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error resolving timings' });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { data, error } = readSchedule(req.body || {}, false);
    if (error) return res.status(400).json({ success: false, message: error });
    const schedule = await WorkSchedule.create({ ...data, isDefault: false, createdBy: req.user._id, updatedBy: req.user._id });
    invalidateScheduleCache();
    logger.info('Work schedule created', { userId: req.user._id.toString(), scheduleId: schedule._id.toString() });
    res.status(201).json({ success: true, data: schedule });
  } catch (error: any) {
    if (duplicateName(error)) return res.status(409).json({ success: false, message: 'A schedule with that name already exists' });
    logger.error('Create work schedule error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error creating work schedule' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    const schedule = await WorkSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const { data, error } = readSchedule({ startTime: schedule.startTime, endTime: schedule.endTime, ...req.body }, true);
    if (error) return res.status(400).json({ success: false, message: error });
    if (schedule.isDefault && data!.active === false) {
      return res.status(400).json({ success: false, message: 'The general timings cannot be deactivated' });
    }
    schedule.set({ ...data, updatedBy: req.user._id });
    if (schedule.halfDayHours > schedule.fullDayHours) {
      return res.status(400).json({ success: false, message: 'halfDayHours cannot exceed fullDayHours' });
    }
    await schedule.save();
    invalidateScheduleCache();
    logger.info('Work schedule updated', { userId: req.user._id.toString(), scheduleId: schedule._id.toString() });
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    if (duplicateName(error)) return res.status(409).json({ success: false, message: 'A schedule with that name already exists' });
    logger.error('Update work schedule error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error updating work schedule' });
  }
};

// Saves the organisation's general timings, creating that schedule on first save.
export const saveGeneralTimings = async (req: Request, res: Response) => {
  try {
    const existing = await WorkSchedule.findOne({ isDefault: true });
    const { data, error } = readSchedule(
      { name: existing?.name || 'General timings', ...(existing ? { startTime: existing.startTime, endTime: existing.endTime } : {}), ...req.body, active: true },
      !!existing
    );
    if (error) return res.status(400).json({ success: false, message: error });

    let schedule;
    if (existing) {
      existing.set({ ...data, active: true, updatedBy: req.user._id });
      if (existing.halfDayHours > existing.fullDayHours) {
        return res.status(400).json({ success: false, message: 'halfDayHours cannot exceed fullDayHours' });
      }
      schedule = await existing.save();
    } else {
      schedule = await WorkSchedule.create({ ...data, isDefault: true, active: true, createdBy: req.user._id, updatedBy: req.user._id });
    }
    invalidateScheduleCache();
    logger.info('General timings saved', { userId: req.user._id.toString(), scheduleId: schedule._id.toString() });
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    if (duplicateName(error)) return res.status(409).json({ success: false, message: 'A schedule with that name already exists' });
    logger.error('Save general timings error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error saving general timings' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    const schedule = await WorkSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (schedule.isDefault) return res.status(400).json({ success: false, message: 'The general timings cannot be deleted' });

    // Members fall back to their department's or the general timings.
    const [depts, emps] = await Promise.all([
      Department.updateMany({ workSchedule: schedule._id }, { $unset: { workSchedule: 1 } }),
      Employee.updateMany({ workSchedule: schedule._id }, { $unset: { workSchedule: 1 } }),
    ]);
    await schedule.deleteOne();
    invalidateScheduleCache();
    logger.info('Work schedule deleted', {
      userId: req.user._id.toString(), scheduleId: schedule._id.toString(),
      departmentsReleased: depts.modifiedCount, employeesReleased: emps.modifiedCount,
    });
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error: any) {
    logger.error('Delete work schedule error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error deleting work schedule' });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    const [departments, employees] = await Promise.all([
      Department.find({ workSchedule: req.params.id }).select('name').sort({ name: 1 }).lean(),
      Employee.find({ workSchedule: req.params.id }).select('employeeId firstName lastName').sort({ firstName: 1 }).lean(),
    ]);
    res.json({ success: true, data: { departments, employees } });
  } catch (error: any) {
    logger.error('Get schedule assignments error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error fetching assignments' });
  }
};

// Replaces who follows this shift: listed departments and employees get it,
// anyone previously on it but not listed falls back.
export const setAssignments = async (req: Request, res: Response) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid schedule id' });
    const schedule = await WorkSchedule.findById(req.params.id).select('isDefault active');
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (schedule.isDefault) {
      return res.status(400).json({ success: false, message: 'The general timings apply to everyone without a shift; they are not assigned' });
    }

    const { departmentIds = [], employeeIds = [] } = req.body || {};
    if (!Array.isArray(departmentIds) || !Array.isArray(employeeIds) || ![...departmentIds, ...employeeIds].every(isId)) {
      return res.status(400).json({ success: false, message: 'departmentIds and employeeIds must be lists of ids' });
    }
    if (departmentIds.length > 500 || employeeIds.length > 5000) {
      return res.status(400).json({ success: false, message: 'Too many assignments in one request' });
    }

    await Promise.all([
      Department.updateMany({ workSchedule: schedule._id, _id: { $nin: departmentIds } }, { $unset: { workSchedule: 1 } }),
      Employee.updateMany({ workSchedule: schedule._id, _id: { $nin: employeeIds } }, { $unset: { workSchedule: 1 } }),
    ]);
    await Promise.all([
      Department.updateMany({ _id: { $in: departmentIds } }, { $set: { workSchedule: schedule._id } }),
      Employee.updateMany({ _id: { $in: employeeIds } }, { $set: { workSchedule: schedule._id } }),
    ]);

    logger.info('Work schedule assignments set', {
      userId: req.user._id.toString(), scheduleId: schedule._id.toString(),
      departments: departmentIds.length, employees: employeeIds.length,
    });
    res.json({ success: true, message: 'Assignments saved' });
  } catch (error: any) {
    logger.error('Set schedule assignments error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error saving assignments' });
  }
};
