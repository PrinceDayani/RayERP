import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
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
    }).populate('employee', 'firstName lastName employeeId');
    
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
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ message: 'Error fetching today stats', error });
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
    
    console.log('Attendance filter:', filter);
    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ date: -1, checkIn: -1 });
    
    console.log('Found attendance records:', attendance.length);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance', error });
  }
};

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findById(id)
      .populate('employee', 'firstName lastName employeeId');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance record', error });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  try {
    const { employee } = req.body;
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
    console.error('Check-in error:', error);
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
    console.error('Check-out error:', error);
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
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance stats', error });
  }
};

export const requestAttendance = async (req: Request, res: Response) => {
  try {
    const { employee, date, status, checkIn, checkOut, notes } = req.body;
    
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
    console.error('Error requesting attendance:', error);
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
    console.error('Error approving attendance:', error);
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
    console.error('Error syncing card data:', error);
    res.status(400).json({ message: 'Error syncing card data', error: error.message });
  }
};

export const markAttendance = requestAttendance; // Alias for backward compatibility

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, checkIn, checkOut, notes } = req.body;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Update fields if provided
    if (status) attendance.status = status;
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (notes !== undefined) attendance.notes = notes;
    
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
    res.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(400).json({ message: 'Error updating attendance', error: error.message });
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
    console.error('Error deleting attendance:', error);
    res.status(400).json({ message: 'Error deleting attendance', error: error.message });
  }
};