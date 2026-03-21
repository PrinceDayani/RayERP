import { Request, Response } from 'express';
import MilestoneBilling from '../models/MilestoneBilling';
import BOQ from '../models/BOQ';
import Project from '../models/Project';
import { hasProjectAccess } from '../modules/projects/permissions/permissionController';
import { calculateMilestoneProgress } from '../utils/boqCalculations';

export const createMilestoneBilling = async (req: Request, res: Response) => {
  try {
    const { 
      projectId, 
      boqId, 
      milestoneId, 
      milestoneName,
      billingType,
      paymentSchedules,
      billingItems,
      totalContractValue,
      retentionPercentage,
      currency,
      paymentTerms,
      notes
    } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to create billing for this project' });
    }
    
    const boq = await BOQ.findById(boqId);
    if (!boq) {
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    if (boq.status !== 'active' && boq.status !== 'approved') {
      return res.status(400).json({ message: 'Can only create billing for active or approved BOQs' });
    }
    
    const billing = new MilestoneBilling({
      project: projectId,
      boq: boqId,
      milestoneId,
      milestoneName,
      billingType: billingType || 'milestone',
      paymentSchedules: paymentSchedules || [],
      billingItems: billingItems || [],
      totalContractValue,
      retentionPercentage: retentionPercentage || 0,
      currency: currency || boq.currency || 'USD',
      paymentTerms,
      notes,
      createdBy: req.user?.userId
    });
    
    await billing.save();
    
    res.status(201).json({ message: 'Milestone billing created successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating milestone billing', error: error.message });
  }
};

export const getBillingsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, approvalStatus } = req.query;
    
    const hasAccess = await hasProjectAccess(req.user?.userId, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view billings for this project' });
    }
    
    const query: any = { project: projectId };
    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    
    const billings = await MilestoneBilling.find(query)
      .populate('project', 'name')
      .populate('boq', 'version overallProgress')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ billings });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching billings', error: error.message });
  }
};

export const getBillingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const billing = await MilestoneBilling.findById(id)
      .populate('project', 'name status budget currency')
      .populate('boq', 'version overallProgress totalPlannedAmount totalActualAmount')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    res.json({ billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching billing', error: error.message });
  }
};

export const updateBilling = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, billing.project.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to update this billing' });
    }
    
    if (billing.status === 'paid' || billing.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update paid or cancelled billing' });
    }
    
    Object.assign(billing, updates);
    await billing.save();
    
    res.json({ message: 'Billing updated successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating billing', error: error.message });
  }
};

export const submitForApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    if (billing.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft billings can be submitted for approval' });
    }
    
    billing.status = 'pending-approval';
    billing.approvalStatus = 'pending';
    await billing.save();
    
    res.json({ message: 'Billing submitted for approval', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error submitting billing', error: error.message });
  }
};

export const approveBilling = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, billing.project.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to approve this billing' });
    }
    
    if (billing.status !== 'pending-approval') {
      return res.status(400).json({ message: 'Only pending billings can be approved' });
    }
    
    billing.status = 'approved';
    billing.approvalStatus = 'approved';
    billing.approvedBy = req.user?.userId;
    billing.approvedDate = new Date();
    await billing.save();
    
    res.json({ message: 'Billing approved successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error approving billing', error: error.message });
  }
};

export const rejectBilling = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    if (billing.status !== 'pending-approval') {
      return res.status(400).json({ message: 'Only pending billings can be rejected' });
    }
    
    billing.status = 'draft';
    billing.approvalStatus = 'rejected';
    billing.rejectionReason = rejectionReason;
    await billing.save();
    
    res.json({ message: 'Billing rejected', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error rejecting billing', error: error.message });
  }
};

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { invoiceNumber, invoiceDate, dueDate } = req.body;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    if (billing.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved billings can be invoiced' });
    }
    
    billing.status = 'invoiced';
    billing.invoiceNumber = invoiceNumber;
    billing.invoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
    billing.dueDate = dueDate ? new Date(dueDate) : new Date();
    
    const totalBilled = billing.billingItems.reduce((sum, item) => sum + item.amount, 0);
    billing.totalBilledAmount = totalBilled;
    
    await billing.save();
    
    res.json({ message: 'Invoice generated successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating invoice', error: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentReference, paymentDate } = req.body;
    
    if (!amount || amount <= 0 || !isFinite(amount)) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?.userId, billing.project.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to record payment for this billing' });
    }
    
    if (billing.status !== 'invoiced') {
      return res.status(400).json({ message: 'Only invoiced billings can receive payments' });
    }
    
    const newTotalPaid = billing.totalPaidAmount + amount;
    if (newTotalPaid > billing.totalBilledAmount) {
      return res.status(400).json({ 
        message: 'Payment amount exceeds outstanding balance',
        outstanding: billing.totalBilledAmount - billing.totalPaidAmount,
        attempted: amount
      });
    }
    
    billing.totalPaidAmount = newTotalPaid;
    
    if (billing.totalPaidAmount >= billing.totalBilledAmount) {
      billing.status = 'paid';
    }
    
    const scheduleIndex = billing.paymentSchedules.findIndex(
      schedule => schedule.status === 'invoiced'
    );
    
    if (scheduleIndex !== -1) {
      billing.paymentSchedules[scheduleIndex].status = 'paid';
      billing.paymentSchedules[scheduleIndex].paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      billing.paymentSchedules[scheduleIndex].paymentReference = paymentReference;
    }
    
    await billing.save();
    
    res.json({ message: 'Payment recorded successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
};

export const addPaymentSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scheduleData = req.body;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    billing.paymentSchedules.push(scheduleData);
    await billing.save();
    
    res.status(201).json({ message: 'Payment schedule added successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding payment schedule', error: error.message });
  }
};

export const updatePaymentSchedule = async (req: Request, res: Response) => {
  try {
    const { id, scheduleId } = req.params;
    const updates = req.body;
    
    const billing = await MilestoneBilling.findById(id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const schedule = billing.paymentSchedules.id(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Payment schedule not found' });
    }
    
    Object.assign(schedule, updates);
    await billing.save();
    
    res.json({ message: 'Payment schedule updated successfully', billing });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating payment schedule', error: error.message });
  }
};

export const getBillingAnalytics = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const billings = await MilestoneBilling.find({ project: projectId });
    
    const analytics = {
      totalContractValue: billings.reduce((sum, b) => sum + b.totalContractValue, 0),
      totalBilled: billings.reduce((sum, b) => sum + b.totalBilledAmount, 0),
      totalPaid: billings.reduce((sum, b) => sum + b.totalPaidAmount, 0),
      totalOutstanding: billings.reduce((sum, b) => sum + b.outstandingAmount, 0),
      totalRetention: billings.reduce((sum, b) => sum + b.retentionAmount, 0),
      billingsByStatus: {
        draft: billings.filter(b => b.status === 'draft').length,
        pendingApproval: billings.filter(b => b.status === 'pending-approval').length,
        approved: billings.filter(b => b.status === 'approved').length,
        invoiced: billings.filter(b => b.status === 'invoiced').length,
        paid: billings.filter(b => b.status === 'paid').length,
        cancelled: billings.filter(b => b.status === 'cancelled').length
      }
    };
    
    res.json({ analytics });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching billing analytics', error: error.message });
  }
};
