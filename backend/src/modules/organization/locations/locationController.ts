import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Location from './Location';
import Employee from '../../hr/employees/Employee';
import { logger } from '../../../utils/logger';

const TYPES = ['head-office', 'branch', 'site', 'warehouse'];
const ADDRESS_FIELDS = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const;

const readLocation = (body: any, partial: boolean) => {
  const data: Record<string, unknown> = {};
  if (body.name !== undefined || !partial) {
    const name = String(body.name ?? '').trim();
    if (!name || name.length > 120) return { error: 'name is required (up to 120 characters)' };
    data.name = name;
  }
  if (body.code !== undefined) {
    const code = String(body.code ?? '').trim().toUpperCase();
    if (code && !/^[A-Z0-9-]{1,20}$/.test(code)) return { error: 'code may use letters, digits and dashes (up to 20)' };
    data.code = code || undefined;
  }
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type)) return { error: `type must be one of ${TYPES.join(', ')}` };
    data.type = body.type;
  }
  if (body.address !== undefined) {
    if (typeof body.address !== 'object' || body.address === null) return { error: 'address must be an object' };
    for (const f of ADDRESS_FIELDS) {
      if (body.address[f] !== undefined) data[`address.${f}`] = String(body.address[f] ?? '').trim().slice(0, 200);
    }
  }
  if (body.phone !== undefined) data.phone = String(body.phone ?? '').trim().slice(0, 30);
  if (body.email !== undefined) {
    const email = String(body.email ?? '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'email is not a valid address' };
    data.email = email;
  }
  if (body.active !== undefined) data.active = body.active === true;
  return { data };
};

const duplicate = (error: any) => error?.code === 11000;

export const listLocations = async (req: Request, res: Response) => {
  try {
    const filter = req.query.active === 'true' ? { active: true } : {};
    const locations = await Location.find(filter).sort({ type: 1, name: 1 }).lean();
    // Employees record their posting as free text; count matches by name.
    const counts = await Employee.aggregate([
      { $match: { workLocation: { $in: locations.map(l => l.name) } } },
      { $group: { _id: '$workLocation', n: { $sum: 1 } } },
    ]);
    res.json({
      success: true,
      data: locations.map(l => ({ ...l, employeeCount: counts.find(c => c._id === l.name)?.n || 0 })),
    });
  } catch (error: any) {
    logger.error('List locations error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error fetching locations' });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const { data, error } = readLocation(req.body || {}, false);
    if (error) return res.status(400).json({ success: false, message: error });
    const location = new Location({ createdBy: req.user._id, updatedBy: req.user._id });
    location.set(data);
    await location.save();
    logger.info('Location created', { userId: req.user._id.toString(), locationId: location._id.toString() });
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    if (duplicate(error)) return res.status(409).json({ success: false, message: 'A location with that name or code already exists' });
    logger.error('Create location error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error creating location' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid location id' });
    const { data, error } = readLocation(req.body || {}, true);
    if (error) return res.status(400).json({ success: false, message: error });
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

    const previousName = location.name;
    location.set({ ...data, updatedBy: req.user._id });
    await location.save();

    // Keep employees' free-text posting in step with a renamed location.
    let employeesRenamed = 0;
    if (location.name !== previousName) {
      employeesRenamed = (await Employee.updateMany({ workLocation: previousName }, { $set: { workLocation: location.name } })).modifiedCount;
    }
    logger.info('Location updated', { userId: req.user._id.toString(), locationId: location._id.toString(), employeesRenamed });
    res.json({ success: true, data: location });
  } catch (error: any) {
    if (duplicate(error)) return res.status(409).json({ success: false, message: 'A location with that name or code already exists' });
    logger.error('Update location error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error updating location' });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid location id' });
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    const posted = await Employee.countDocuments({ workLocation: location.name });
    if (posted > 0) {
      return res.status(409).json({ success: false, message: `${posted} employee(s) are posted here; move them or mark the location inactive instead` });
    }
    await location.deleteOne();
    logger.info('Location deleted', { userId: req.user._id.toString(), locationId: location._id.toString() });
    res.json({ success: true, message: 'Location deleted' });
  } catch (error: any) {
    logger.error('Delete location error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error deleting location' });
  }
};
