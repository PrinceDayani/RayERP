import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Holiday from './Holiday';
import { logger } from '../../../utils/logger';

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const validDate = (value: unknown): string | null => {
  const m = DATE.exec(String(value ?? ''));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? m[0] : null;
};

const readHoliday = (body: any, partial: boolean) => {
  const data: Record<string, unknown> = {};
  if (body.name !== undefined || !partial) {
    const name = String(body.name ?? '').trim();
    if (!name || name.length > 120) return { error: 'name is required (up to 120 characters)' };
    data.name = name;
  }
  if (body.date !== undefined || !partial) {
    const date = validDate(body.date);
    if (!date) return { error: 'date must be a valid YYYY-MM-DD day' };
    data.date = date;
    data.year = Number(date.slice(0, 4));
  }
  if (body.type !== undefined) {
    if (!['public', 'optional'].includes(body.type)) return { error: "type must be 'public' or 'optional'" };
    data.type = body.type;
  }
  if (body.description !== undefined) data.description = String(body.description ?? '').trim().slice(0, 300);
  return { data };
};

const duplicate = (error: any) => error?.code === 11000;

// Readable by everyone: staff need the holiday calendar.
export const listHolidays = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1970 || year > 2200) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }
    const holidays = await Holiday.find({ year }).sort({ date: 1 }).lean();
    res.json({ success: true, data: holidays });
  } catch (error: any) {
    logger.error('List holidays error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error fetching holidays' });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { data, error } = readHoliday(req.body || {}, false);
    if (error) return res.status(400).json({ success: false, message: error });
    const holiday = await Holiday.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    logger.info('Holiday created', { userId: req.user._id.toString(), holidayId: holiday._id.toString() });
    res.status(201).json({ success: true, data: holiday });
  } catch (error: any) {
    if (duplicate(error)) return res.status(409).json({ success: false, message: 'That holiday is already on the calendar' });
    logger.error('Create holiday error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error creating holiday' });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid holiday id' });
    const { data, error } = readHoliday(req.body || {}, true);
    if (error) return res.status(400).json({ success: false, message: error });
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { $set: { ...data, updatedBy: req.user._id } },
      { new: true, runValidators: true }
    );
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
    logger.info('Holiday updated', { userId: req.user._id.toString(), holidayId: holiday._id.toString() });
    res.json({ success: true, data: holiday });
  } catch (error: any) {
    if (duplicate(error)) return res.status(409).json({ success: false, message: 'That holiday is already on the calendar' });
    logger.error('Update holiday error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error updating holiday' });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid holiday id' });
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
    logger.info('Holiday deleted', { userId: req.user._id.toString(), holidayId: holiday._id.toString() });
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error: any) {
    logger.error('Delete holiday error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error deleting holiday' });
  }
};

// Copies one year's holidays into another, skipping any already present.
// Dates keep their day and month; movable festivals need editing afterwards.
export const copyHolidays = async (req: Request, res: Response) => {
  try {
    const from = Number(req.body?.fromYear);
    const to = Number(req.body?.toYear);
    if (![from, to].every(y => Number.isInteger(y) && y >= 1970 && y <= 2200) || from === to) {
      return res.status(400).json({ success: false, message: 'fromYear and toYear must be different valid years' });
    }
    const source = await Holiday.find({ year: from }).lean();
    let created = 0;
    for (const h of source) {
      const date = validDate(`${to}${h.date.slice(4)}`);
      if (!date) continue; // 29 Feb into a non-leap year
      const exists = await Holiday.exists({ date, name: h.name });
      if (exists) continue;
      await Holiday.create({ name: h.name, date, year: to, type: h.type, description: h.description, createdBy: req.user._id, updatedBy: req.user._id });
      created++;
    }
    logger.info('Holidays copied', { userId: req.user._id.toString(), from, to, created });
    res.json({ success: true, message: `${created} holiday(s) copied to ${to}`, data: { created } });
  } catch (error: any) {
    logger.error('Copy holidays error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error copying holidays' });
  }
};
