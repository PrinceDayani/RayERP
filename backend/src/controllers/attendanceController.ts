import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { logger } from '../utils/logger';
// Socket will be imported dynamically to avoid circular dependency

// Add a new endpoint for today's dashboard stats
export const getTodayStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
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
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Set start to beginning of day
      start.setHours(0, 0, 0, 0);
      // Set end to end of day
      end.setHours(23, 59, 59, 999);
      
      filter.date = { $gte: start, $lte: end };
    } else {
      // Default to today if no date range specified
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filter.date = { $gte: today, $lt: tomorrow };
    }
    
    if (employee) {
      filter.employee = employee;
    }

    const { project } = req.query;
    if (project) {
      if (!mongoose.Types.ObjectId.isValid(project as string)) {
        return res.status(400).json({ success: false, message: 'Invalid project id' });
      }
      filter.project = project;
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('project', 'name jobNumber')
      .sort({ date: -1, checkIn: -1 });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error('Error fetching attendance', { message: (error as any)?.message });
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
};

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employee,
      date: today
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    
    const checkInTime = new Date();
    const workStartTime = new Date(today);
    workStartTime.setHours(9, 0, 0, 0);
    
    let status = 'present';
    if (checkInTime > workStartTime) {
      const lateMinutes = (checkInTime.getTime() - workStartTime.getTime()) / (1000 * 60);
      if (lateMinutes > 15) status = 'late';
    }
    
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
    
    const { io } = await import('../server');
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    
    const { io } = await import('../server');
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
    const { employeeId, month, year } = req.query;
    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    
    const filter: any = { date: { $gte: startDate, $lte: endDate } };
    if (employeeId) filter.employee = employeeId;
    
    const attendance = await Attendance.find(filter);
    
    // Get today's stats for real-time dashboard
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayFilter: any = { date: { $gte: today, $lt: tomorrow } };
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

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
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
    
    const { io } = await import('../server');
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
    const { approvedBy, rejectionReason } = req.body;
    const { action } = req.body; // 'approve' or 'reject'
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance request not found' });
    }
    
    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Attendance request already processed' });
    }
    
    attendance.approvalStatus = action === 'approve' ? 'approved' : 'rejected';
    attendance.approvedBy = approvedBy;
    attendance.approvedDate = new Date();
    
    if (action === 'reject') {
      attendance.rejectionReason = rejectionReason;
    }
    
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    await attendance.populate('approvedBy', 'firstName lastName employeeId');
    
    const { io } = await import('../server');
    io.emit('attendance:approved', attendance);
    
    res.json({
      message: `Attendance request ${action}d successfully`,
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
    
    const entryDate = new Date(entryTime);
    const attendanceDate = new Date(entryDate);
    attendanceDate.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate
    });
    
    const workStartTime = new Date(attendanceDate);
    workStartTime.setHours(9, 0, 0, 0);
    
    let status = 'present';
    if (entryDate > workStartTime) {
      const lateMinutes = (entryDate.getTime() - workStartTime.getTime()) / (1000 * 60);
      if (lateMinutes > 15) status = 'late';
    }
    
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
    
    const { io } = await import('../server');
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
    
    const { io } = await import('../server');
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
    
    const { io } = await import('../server');
    io.emit('attendance:deleted', { id });
    io.emit('attendance:updated', { deleted: id });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    logger.error('Error deleting attendance', { message: error.message });
    res.status(400).json({ message: 'Error deleting attendance', error: error.message });
  }
};