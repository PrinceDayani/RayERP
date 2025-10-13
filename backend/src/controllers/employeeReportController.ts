import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
export const getEmployeeReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    const filter: any = {};
    if (department) filter.department = department;
    
    const employees = await Employee.find(filter);
    
    const report = await Promise.all(employees.map(async (emp) => {
      const attendanceFilter: any = { employee: emp._id };
      if (startDate && endDate) {
        attendanceFilter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
      }
      
      const attendance = await Attendance.find(attendanceFilter);
      const leaves = await Leave.find({ employee: emp._id, status: 'approved', ...attendanceFilter });
      
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
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating employee report', error });
  }
};

export const getDepartmentSummary = async (req: Request, res: Response) => {
  try {
    const departments = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error generating department summary', error });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    
    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$totalHours' }
      }}
    ]);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error generating attendance summary', error });
  }
};