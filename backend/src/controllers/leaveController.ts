import { Request, Response } from 'express';
import Leave from '../models/Leave';

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
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves', error });
  }
};

export const createLeave = async (req: Request, res: Response) => {
  try {
    const leaveData = req.body;
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const leave = new Leave({
      ...leaveData,
      totalDays,
      appliedDate: new Date()
    });
    
    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId');
    
    const { io } = await import('../server');
    io.emit('leave:created', leave);
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: 'Error creating leave request', error });
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
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    const { io } = await import('../server');
    io.emit('leave:updated', leave);
    res.json(leave);
  } catch (error) {
    res.status(400).json({ message: 'Error updating leave status', error });
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
    
    const { io } = await import('../server');
    io.emit('leave:cancelled', updatedLeave);
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: 'Error cancelling leave', error });
  }
};

export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const currentYear = new Date().getFullYear();
    
    const leaves = await Leave.find({
      employee: employeeId,
      status: 'approved',
      startDate: { $gte: new Date(`${currentYear}-01-01`) },
      endDate: { $lte: new Date(`${currentYear}-12-31`) }
    });
    
    const balance = {
      sick: { used: 0, total: 12 },
      vacation: { used: 0, total: 21 },
      personal: { used: 0, total: 5 },
      maternity: { used: 0, total: 90 },
      paternity: { used: 0, total: 15 },
      emergency: { used: 0, total: 3 }
    };
    
    leaves.forEach(leave => {
      if (balance[leave.leaveType as keyof typeof balance]) {
        balance[leave.leaveType as keyof typeof balance].used += leave.totalDays;
      }
    });
    
    res.json(balance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave balance', error });
  }
};