import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave, { LEAVE_TYPES, LeaveType } from './Leave';
import LeavePolicy from '../../organization/leavePolicy/LeavePolicy';
import { calendarDays, countWorkingDays, resolveRulesForEmployee } from '../../organization/workSchedule/scheduleService';

// Leave dates arrive as YYYY-MM-DD and are stored as UTC midnight of that day,
// so the calendar day is the first ten characters of either form.
const leaveDayKey = (value: unknown): string | null => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(String(value));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { status, employee, startDate, endDate } = req.query;
    const filter: any = {};
    
    if (status) filter.status = status;
    if (employee) filter.employee = employee;
    
    // Check if someone is on leave on a specific date (for today's leave check)
    if (startDate && endDate && startDate === endDate) {
      const checkDate = new Date(startDate as string);
      filter.startDate = { $lte: checkDate };
      filter.endDate = { $gte: checkDate };
    } else if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate as string) };
      filter.endDate = { $lte: new Date(endDate as string) };
    }
    
    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ appliedDate: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leaves' });
  }
};

export const createLeave = async (req: Request, res: Response) => {
  try {
    const { employee, leaveType, startDate, endDate, reason, documents } = req.body;
    if (!employee || !mongoose.Types.ObjectId.isValid(employee)) {
      return res.status(400).json({ success: false, message: 'Valid employee is required' });
    }
    if (!LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json({ success: false, message: 'Invalid leave type' });
    }
    const fromKey = leaveDayKey(startDate);
    const toKey = leaveDayKey(endDate);
    if (!fromKey || !toKey || toKey < fromKey) {
      return res.status(400).json({ success: false, message: 'Valid start and end dates are required, with the end on or after the start' });
    }

    const policy = await LeavePolicy.getPolicy();
    const totalDays = policy.excludeNonWorkingDays
      ? await countWorkingDays(await resolveRulesForEmployee(employee), fromKey, toKey)
      : calendarDays(fromKey, toKey);
    if (totalDays === 0) {
      return res.status(400).json({ success: false, message: 'The selected dates fall entirely on weekly offs or holidays' });
    }

    // Only the applicant's fields are taken from the body; status and approval
    // fields are set by the approval flow, never by the applicant.
    const leave = new Leave({
      employee,
      leaveType,
      startDate: new Date(fromKey),
      endDate: new Date(toKey),
      reason,
      documents: Array.isArray(documents) ? documents : undefined,
      totalDays,
      appliedDate: new Date()
    });
    
    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../../../server');
    io.emit('leave:created', leave);
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating leave request' });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, rejectionReason } = req.body;
    
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedBy = approvedBy;
      updateData.approvedDate = new Date();
    } else if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    }
    
    const leave = await Leave.findByIdAndUpdate(id, updateData, { new: true })
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');
    
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const { io } = await import('../../../server');
    io.emit('leave:updated', leave);
    res.json({ success: true, data: leave });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating leave status' });
  }
};

export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancelledBy, cancellationReason } = req.body;
    
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Only allow cancellation of pending or approved leaves
    if (leave.status === 'cancelled' || leave.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot cancel this leave request' });
    }
    
    const updatedLeave = await Leave.findByIdAndUpdate(id, {
      status: 'cancelled',
      cancelledBy,
      cancelledDate: new Date(),
      cancellationReason
    }, { new: true })
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName')
      .populate('cancelledBy', 'firstName lastName');
    
    const { io } = await import('../../../server');
    io.emit('leave:cancelled', updatedLeave);
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: 'Error cancelling leave', error });
  }
};

export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee id' });
    }
    const currentYear = new Date().getFullYear();
    const usedIn = async (year: number) => {
      const leaves = await Leave.find({
        employee: employeeId,
        status: 'approved',
        startDate: { $gte: new Date(`${year}-01-01`) },
        endDate: { $lte: new Date(`${year}-12-31`) }
      }).select('leaveType totalDays').lean();
      const used: Partial<Record<LeaveType, number>> = {};
      for (const l of leaves) used[l.leaveType] = (used[l.leaveType] || 0) + l.totalDays;
      return used;
    };

    const policy = await LeavePolicy.getPolicy();
    const [usedNow, usedLastYear] = await Promise.all([usedIn(currentYear), usedIn(currentYear - 1)]);

    // Carry-forward is the previous year's unused quota, capped per type.
    const balance: Partial<Record<LeaveType, { used: number; total: number; carriedForward: number }>> = {};
    for (const t of policy.types) {
      const carriedForward = t.carryForward
        ? Math.min(t.maxCarryForward, Math.max(0, t.annualQuota - (usedLastYear[t.type] || 0)))
        : 0;
      balance[t.type] = { used: usedNow[t.type] || 0, total: t.annualQuota + carriedForward, carriedForward };
    }

    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave balance' });
  }
};