import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from './Attendance';
import Employee from '../employees/Employee';
import { logger } from '../../../utils/logger';
import { addZonedDays, parseZonedDay, startOfZonedDay, zonedTimeToUtc } from '../../../utils/timezoneHelper';
// Socket will be imported dynamically to avoid circular dependency

// Office hours start at 10:00 (APP_TIMEZONE); arriving more than 15 minutes
// after that is late. Keep in sync with lateAfter in the device-log import map.
const WORK_START_HOUR = 10;
const LATE_GRACE_MINUTES = 15;

// Attendance days are stored as midnight in APP_TIMEZONE.
const statusForArrival = (arrival: Date) => {
  const workStart = new Date(startOfZonedDay(arrival).getTime() + WORK_START_HOUR * 3_600_000);
  const lateMinutes = (arrival.getTime() - workStart.getTime()) / 60_000;
  return lateMinutes > LATE_GRACE_MINUTES ? 'late' : 'present';
};

// The single-day view lists every employee, so the default page covers a full office.
const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;

// Add a new endpoint for today's dashboard stats
export const getTodayStats = async (req: Request, res: Response) => {
  try {
    const today = startOfZonedDay();
    const tomorrow = addZonedDays(today, 1);

    // Get today's attendance
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('employee', 'firstName lastName employeeId')
      .populate('project', 'name jobNumber');
    
    // Get total active employees
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    const stats = {
      totalEmployees,
      presentToday: todayAttendance.filter(a => 
        a.status === 'present' || a.status === 'late' || a.status === 'half-day'
      ).length,
      lateArrivals: todayAttendance.filter(a => a.status === 'late').length,
      totalHours: todayAttendance.reduce((sum, a) => sum + a.totalHours, 0),
      avgHours: todayAttendance.length > 0 ? 
        todayAttendance.reduce((sum, a) => sum + a.totalHours, 0) / todayAttendance.length : 0,
      attendanceRecords: todayAttendance
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching today stats', { message: (error as any)?.message });
    res.status(500).json({ success: false, message: 'Error fetching today stats' });
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, employee } = req.query;
    const filter: any = {};
    
    if (startDate && endDate) {
      const start = parseZonedDay(startDate);
      const end = parseZonedDay(endDate);
      if (!start || !end) {
        return res.status(400).json({ success: false, message: 'Invalid startDate or endDate' });
      }
      filter.date = { $gte: start, $lt: addZonedDays(end, 1) };
    } else {
      // Default to today if no date range specified
      const today = startOfZonedDay();
      filter.date = { $gte: today, $lt: addZonedDays(today, 1) };
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit as string, 10) || DEFAULT_PAGE_SIZE));
    
    if (employee) {
      if (!mongoose.Types.ObjectId.isValid(employee as string)) {
        return res.status(400).json({ success: false, message: 'Invalid employee id' });
      }
      filter.employee = employee;
    }

    const { project } = req.query;
    if (project) {
      if (!mongoose.Types.ObjectId.isValid(project as string)) {
        return res.status(400).json({ success: false, message: 'Invalid project id' });
      }
      filter.project = project;
    }

    const [attendance, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'firstName lastName employeeId')
        .populate('project', 'name jobNumber')
        .sort({ date: -1, checkIn: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: attendance,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Error fetching attendance', { message: (error as any)?.message });
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
};

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance id' });
    }
    const attendance = await Attendance.findById(id)
      .populate('employee', 'firstName lastName employeeId')
      .populate('project', 'name jobNumber');
    
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance record' });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { employee, project } = req.body;

    if (project && !mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    const checkInTime = new Date();
    const today = startOfZonedDay(checkInTime);

    const existingAttendance = await Attendance.findOne({
      employee,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const status = statusForArrival(checkInTime);

    const attendance = new Attendance({
      employee,
      project: project || undefined,
      date: today,
      checkIn: checkInTime,
      status,
      totalHours: 0,
      breakTime: 0,
      isManualEntry: true,
      approvalStatus: 'pending',
      requestedBy: employee,
      entrySource: 'manual'
    });
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('attendance:checkin-requested', attendance);
    
    res.status(201).json({
      message: 'Check-in request submitted for approval',
      attendance
    });
  } catch (error) {
    logger.error('Check-in error', { message: error.message });
    res.status(400).json({ message: 'Error checking in', error: error.message });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const { employee } = req.body;
    const today = startOfZonedDay();

    const attendance = await Attendance.findOne({
      employee,
      date: today
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }
    
    const checkOutTime = new Date();
    const totalMilliseconds = checkOutTime.getTime() - attendance.checkIn.getTime();
    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    const breakTimeHours = (attendance.breakTime || 0) / 60;
    
    attendance.checkOut = checkOutTime;
    attendance.totalHours = Math.max(0, totalHours - breakTimeHours);
    
    if (attendance.totalHours < 4) {
      attendance.status = 'half-day';
    } else if (attendance.status !== 'late') {
      attendance.status = 'present';
    }
    
    // If it's a manual entry, it needs approval
    if (attendance.isManualEntry) {
      attendance.approvalStatus = 'pending';
    }
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('attendance:checkout-requested', attendance);
    
    res.json({
      message: attendance.isManualEntry ? 'Check-out request submitted for approval' : 'Checked out successfully',
      attendance
    });
  } catch (error) {
    logger.error('Check-out error', { message: error.message });
    res.status(400).json({ message: 'Error checking out', error: error.message });
  }
};

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.query;
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1970) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year are required' });
    }
    if (employeeId && !mongoose.Types.ObjectId.isValid(employeeId as string)) {
      return res.status(400).json({ success: false, message: 'Invalid employee id' });
    }
    const filter: any = { date: { $gte: zonedTimeToUtc(year, month, 1), $lt: zonedTimeToUtc(year, month + 1, 1) } };
    if (employeeId) filter.employee = employeeId;

    const attendance = await Attendance.find(filter);

    // Get today's stats for real-time dashboard
    const today = startOfZonedDay();
    const todayFilter: any = { date: { $gte: today, $lt: addZonedDays(today, 1) } };
    if (employeeId) todayFilter.employee = employeeId;
    
    const todayAttendance = await Attendance.find(todayFilter);
    
    const stats = {
      // Monthly stats
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'half-day').length,
      lateDays: attendance.filter(a => a.status === 'late').length,
      halfDays: attendance.filter(a => a.status === 'half-day').length,
      totalHours: attendance.reduce((sum, a) => sum + a.totalHours, 0),
      averageHours: attendance.length > 0 ? attendance.reduce((sum, a) => sum + a.totalHours, 0) / attendance.length : 0,
      
      // Today's real-time stats
      todayPresent: todayAttendance.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'half-day').length,
      todayLate: todayAttendance.filter(a => a.status === 'late').length,
      todayTotalHours: todayAttendance.reduce((sum, a) => sum + a.totalHours, 0),
      todayAvgHours: todayAttendance.length > 0 ? todayAttendance.reduce((sum, a) => sum + a.totalHours, 0) / todayAttendance.length : 0
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance stats' });
  }
};

export const requestAttendance = async (req: Request, res: Response) => {
  try {
    const { employee, date, status, checkIn, checkOut, notes, project } = req.body;

    if (project && !mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const attendanceDate = parseZonedDay(date);
    if (!attendanceDate) {
      return res.status(400).json({ message: 'Valid date is required' });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      employee,
      date: attendanceDate
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already exists for this date' });
    }
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = checkOut ? new Date(checkOut) : undefined;
    
    let calculatedTotalHours = 0;
    if (checkOutTime && checkInTime) {
      const totalMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
      calculatedTotalHours = Math.max(0, totalMilliseconds / (1000 * 60 * 60));
    }
    
    const attendance = new Attendance({
      employee,
      // Site attendance booked against a project feeds that project's actual
      // man-hours; office attendance leaves this unset.
      project: project || undefined,
      date: attendanceDate,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status,
      notes: notes || '',
      totalHours: calculatedTotalHours,
      breakTime: 0,
      isManualEntry: true,
      approvalStatus: 'pending',
      requestedBy: employee,
      entrySource: 'manual'
    });
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('attendance:requested', attendance);
    
    res.status(201).json({
      message: 'Attendance request submitted for approval',
      attendance
    });
  } catch (error) {
    logger.error('Error requesting attendance', { message: error.message });
    res.status(400).json({ message: 'Error requesting attendance', error: error.message });
  }
};

export const approveAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid attendance id' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance request not found' });
    }
    
    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Attendance request already processed' });
    }
    
    // The approver is the acting user's Employee record; Root and other users
    // without one approve with approvedBy left unset.
    const approver = await Employee.findOne({ user: req.user._id }).select('_id');

    attendance.approvalStatus = action === 'approve' ? 'approved' : 'rejected';
    attendance.approvedBy = approver?._id;
    attendance.approvedDate = new Date();
    
    if (action === 'reject') {
      attendance.rejectionReason = rejectionReason;
    }
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    await attendance.populate('approvedBy', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('attendance:approved', attendance);
    
    res.json({
      message: `Attendance request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      attendance
    });
  } catch (error) {
    logger.error('Error approving attendance', { message: error.message });
    res.status(400).json({ message: 'Error processing attendance request', error: error.message });
  }
};

export const syncCardData = async (req: Request, res: Response) => {
  try {
    const { cardId, entryTime, exitTime, employeeId } = req.body;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Valid employeeId is required' });
    }
    const entryDate = new Date(entryTime);
    if (!entryTime || isNaN(entryDate.getTime())) {
      return res.status(400).json({ message: 'Valid entryTime is required' });
    }
    if (exitTime && isNaN(new Date(exitTime).getTime())) {
      return res.status(400).json({ message: 'Invalid exitTime' });
    }

    const attendanceDate = startOfZonedDay(entryDate);

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate
    });

    const status = statusForArrival(entryDate);

    if (attendance) {
      // Update existing with card data
      attendance.cardEntryTime = entryDate;
      attendance.cardExitTime = exitTime ? new Date(exitTime) : undefined;
      attendance.cardId = cardId;
      attendance.entrySource = 'card';
      attendance.approvalStatus = 'auto-approved';
    } else {
      // Create new from card data
      let totalHours = 0;
      if (exitTime) {
        const exitDate = new Date(exitTime);
        totalHours = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
      }
      
      attendance = new Attendance({
        employee: employeeId,
        date: attendanceDate,
        checkIn: entryDate,
        checkOut: exitTime ? new Date(exitTime) : undefined,
        status,
        totalHours: Math.max(0, totalHours),
        breakTime: 0,
        cardEntryTime: entryDate,
        cardExitTime: exitTime ? new Date(exitTime) : undefined,
        cardId,
        entrySource: 'card',
        isManualEntry: false,
        approvalStatus: 'auto-approved'
      });
    }
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('attendance:card-sync', attendance);
    
    res.json(attendance);
  } catch (error) {
    logger.error('Error syncing card data', { message: error.message });
    res.status(400).json({ message: 'Error syncing card data', error: error.message });
  }
};

export const markAttendance = requestAttendance; // Alias for backward compatibility

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut, notes, project } = req.body;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Update fields if provided
    if (status) attendance.status = status;
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (notes !== undefined) attendance.notes = notes;
    if (project !== undefined) {
      if (project && !mongoose.Types.ObjectId.isValid(project)) {
        return res.status(400).json({ success: false, message: 'Invalid project id' });
      }
      attendance.project = project || undefined;
    }
    
    // Recalculate total hours if both times are present
    if (attendance.checkOut && attendance.checkIn) {
      const totalMilliseconds = attendance.checkOut.getTime() - attendance.checkIn.getTime();
      const totalHours = totalMilliseconds / (1000 * 60 * 60);
      const breakTimeHours = attendance.breakTime / 60;
      attendance.totalHours = Math.max(0, totalHours - breakTimeHours);
    }
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('attendance:updated', attendance);
    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error('Error updating attendance', { message: error.message });
    res.status(400).json({ success: false, message: 'Error updating attendance' });
  }
};

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    const { io } = await import('../../../server');
    io.emit('attendance:deleted', { id });
    io.emit('attendance:updated', { deleted: id });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    logger.error('Error deleting attendance', { message: error.message });
    res.status(400).json({ message: 'Error deleting attendance', error: error.message });
  }
};