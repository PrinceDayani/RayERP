import { Request, Response } from 'express';
import Employee from './Employee';
import Attendance from '../attendance/Attendance';
import Leave from '../leave/Leave';
import { addZonedDays, parseZonedDay, zonedTimeToUtc } from '../../../utils/timezoneHelper';

export const getEmployeeReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department } = req.query;

    const filter: any = {};
    if (department) filter.department = department;

    let range: { start: Date; end: Date } | null = null;
    if (startDate && endDate) {
      const start = parseZonedDay(startDate);
      const end = parseZonedDay(endDate);
      if (!start || !end) {
        return res.status(400).json({ success: false, message: 'Invalid startDate or endDate' });
      }
      range = { start, end: addZonedDays(end, 1) };
    }

    const employees = await Employee.find(filter);

    const report = await Promise.all(employees.map(async (emp) => {
      const attendanceFilter: any = { employee: emp._id };
      const leaveFilter: any = { employee: emp._id, status: 'approved' };
      if (range) {
        attendanceFilter.date = { $gte: range.start, $lt: range.end };
        // Leaves that overlap the range at all.
        leaveFilter.startDate = { $lt: range.end };
        leaveFilter.endDate = { $gte: range.start };
      }

      const attendance = await Attendance.find(attendanceFilter);
      const leaves = await Leave.find(leaveFilter);
      
      return {
        employee: {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          position: emp.position,
          salary: emp.salary
        },
        attendance: {
          totalDays: attendance.length,
          presentDays: attendance.filter(a => a.status === 'present').length,
          lateDays: attendance.filter(a => a.status === 'late').length,
          totalHours: attendance.reduce((sum, a) => sum + a.totalHours, 0)
        },
        leaves: {
          totalLeaves: leaves.reduce((sum, l) => sum + l.totalDays, 0),
          leavesByType: leaves.reduce((acc, l) => {
            acc[l.leaveType] = (acc[l.leaveType] || 0) + l.totalDays;
            return acc;
          }, {} as any)
        },
      };
    }));

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating employee report' });
  }
};

export const getDepartmentSummary = async (req: Request, res: Response) => {
  try {
    const departments = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating department summary' });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1970) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year are required' });
    }

    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: zonedTimeToUtc(year, month, 1), $lt: zonedTimeToUtc(year, month + 1, 1) } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$totalHours' }
      }}
    ]);
    
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating attendance summary' });
  }
};