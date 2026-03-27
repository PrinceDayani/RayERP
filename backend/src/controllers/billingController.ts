import { Request, Response } from 'express';
import MilestoneBilling from '../models/MilestoneBilling';
import BOQ from '../models/BOQ';
import Project from '../models/Project';
import InvoiceSequence from '../models/InvoiceSequence';
import JournalEntry from '../models/JournalEntry';
import { hasProjectAccess } from '../modules/projects/permissions/permissionController';
import { calculateMilestoneProgress } from '../utils/boqCalculations';

export const getAllBillings = async (req: Request, res: Response) => {
  try {
    const { status, approvalStatus, projectId, page = '1', limit = '50' } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (projectId) query.project = projectId;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const [billings, total] = await Promise.all([
      MilestoneBilling.find(query)
        .populate('project', 'name status')
        .populate('boq', 'version overallProgress')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      MilestoneBilling.countDocuments(query)
    ]);
    
    res.json({ 
      billings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching billings', error: error.message });
  }
};

export const createMilestoneBilling = async (req: Request, res: Response) => {
  const session = await MilestoneBilling.startSession();
  session.startTransaction();
  
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
    
    const project = await Project.findById(projectId).session(session);
    if (!project) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?._id, projectId);
    if (!hasAccess) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied: You do not have permission to create billing for this project' });
    }
    
    const boq = await BOQ.findById(boqId).session(session);
    if (!boq) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'BOQ not found' });
    }
    
    if (boq.status !== 'active' && boq.status !== 'approved') {
      await session.abortTransaction();
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
      createdBy: req.user?.userId,
      auditTrail: [{
        action: 'created',
        performedBy: req.user?.userId,
        timestamp: new Date(),
        notes: `Billing created for milestone: ${milestoneName}`
      }]
    });
    
    await billing.save({ session });
    await session.commitTransaction();
    
    res.status(201).json({ message: 'Milestone billing created successfully', billing });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error creating milestone billing', error: error.message });
  } finally {
    session.endSession();
  }
};

export const getBillingsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, approvalStatus, page = '1', limit = '50' } = req.query;
    
    const hasAccess = await hasProjectAccess(req.user?._id, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view billings for this project' });
    }
    
    const query: any = { project: projectId };
    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const [billings, total] = await Promise.all([
      MilestoneBilling.find(query)
        .populate('project', 'name')
        .populate('boq', 'version overallProgress')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      MilestoneBilling.countDocuments(query)
    ]);
    
    res.json({ 
      billings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
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
    
    const hasAccess = await hasProjectAccess(req.user?._id, billing.project.toString());
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
  const session = await MilestoneBilling.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    const billing = await MilestoneBilling.findById(id).session(session);
    if (!billing) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?._id, billing.project.toString());
    if (!hasAccess) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied: You do not have permission to approve this billing' });
    }
    
    if (billing.status !== 'pending-approval') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Only pending billings can be approved' });
    }
    
    if (billing.createdBy.toString() === req.user?.userId) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Cannot approve own billing - segregation of duties violation' });
    }
    
    billing.status = 'approved';
    billing.approvalStatus = 'approved';
    billing.approvedBy = req.user?.userId;
    billing.approvedDate = new Date();
    
    billing.auditTrail.push({
      action: 'approved',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      notes: 'Billing approved'
    });
    
    await billing.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'Billing approved successfully', billing });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error approving billing', error: error.message });
  } finally {
    session.endSession();
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
  const session = await MilestoneBilling.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { invoiceDate, dueDate, prefix = 'INV' } = req.body;
    
    const billing = await MilestoneBilling.findById(id).session(session);
    if (!billing) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    if (billing.status !== 'approved') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Only approved billings can be invoiced' });
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const sequence = await InvoiceSequence.findOneAndUpdate(
      { prefix, year, month },
      { $inc: { currentNumber: 1 }, lastGeneratedAt: now },
      { upsert: true, new: true, session }
    );
    
    const invoiceNumber = `${prefix}-${year}${String(month).padStart(2, '0')}-${String(sequence.currentNumber).padStart(5, '0')}`;
    
    const calculatedTotal = billing.billingItems.reduce((sum, item) => sum + item.amount, 0);
    if (billing.totalBilledAmount > 0 && Math.abs(calculatedTotal - billing.totalBilledAmount) > 0.01) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: `Total billed amount mismatch: calculated ${calculatedTotal}, stored ${billing.totalBilledAmount}` 
      });
    }
    
    billing.status = 'invoiced';
    billing.invoiceNumber = invoiceNumber;
    billing.invoiceDate = invoiceDate ? new Date(invoiceDate) : now;
    billing.dueDate = dueDate ? new Date(dueDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    billing.totalBilledAmount = calculatedTotal;
    
    billing.auditTrail.push({
      action: 'invoiced',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      notes: `Invoice ${invoiceNumber} generated`
    });
    
    await billing.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'Invoice generated successfully', billing });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error generating invoice', error: error.message });
  } finally {
    session.endSession();
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  const session = await MilestoneBilling.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { amount, paymentReference, paymentDate, paymentMethod, bankAccount, createJournalEntry = true } = req.body;
    
    if (!amount || amount <= 0 || !isFinite(amount)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    if (!paymentMethod || !['bank_transfer', 'cheque', 'cash', 'online', 'other'].includes(paymentMethod)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    
    const billing = await MilestoneBilling.findById(id).session(session);
    if (!billing) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const hasAccess = await hasProjectAccess(req.user?._id, billing.project.toString());
    if (!hasAccess) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied: You do not have permission to record payment for this billing' });
    }
    
    if (billing.status !== 'invoiced') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Only invoiced billings can receive payments' });
    }
    
    const currentOutstanding = billing.totalBilledAmount - billing.totalPaidAmount;
    if (amount > currentOutstanding + 0.01) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Payment amount exceeds outstanding balance',
        outstanding: currentOutstanding,
        attempted: amount
      });
    }
    
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    let journalEntryId;
    if (createJournalEntry) {
      const journalEntry = new JournalEntry({
        entryNumber: `JE-${Date.now()}`,
        entryType: 'MANUAL',
        status: 'POSTED',
        entryDate: paymentDate ? new Date(paymentDate) : new Date(),
        postingDate: new Date(),
        periodYear: new Date().getFullYear(),
        periodMonth: new Date().getMonth() + 1,
        description: `Payment received for invoice ${billing.invoiceNumber}`,
        reference: paymentReference,
        isPosted: true,
        lines: [
          {
            account: bankAccount,
            debit: amount,
            credit: 0,
            description: `Payment received - ${paymentMethod}`,
            project: billing.project
          },
          {
            account: billing.project,
            debit: 0,
            credit: amount,
            description: `Payment for ${billing.milestoneName}`,
            project: billing.project
          }
        ],
        totalDebit: amount,
        totalCredit: amount,
        sourceType: 'INVOICE',
        sourceId: billing._id,
        createdBy: req.user?.userId,
        approvalStatus: 'APPROVED'
      });
      
      await journalEntry.save({ session });
      journalEntryId = journalEntry._id;
    }
    
    billing.paymentRecords.push({
      paymentId,
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      paymentReference,
      bankAccount,
      reconciled: false,
      journalEntryId,
      notes: `Payment recorded via ${paymentMethod}`
    });
    
    billing.totalPaidAmount += amount;
    
    if (billing.totalPaidAmount >= billing.totalBilledAmount - 0.01) {
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
    
    billing.auditTrail.push({
      action: 'payment_recorded',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      notes: `Payment of ${amount} recorded - ${paymentReference}`
    });
    
    await billing.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'Payment recorded successfully', billing, paymentId });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  } finally {
    session.endSession();
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

export const reconcilePayment = async (req: Request, res: Response) => {
  const session = await MilestoneBilling.startSession();
  session.startTransaction();
  
  try {
    const { id, paymentId } = req.params;
    
    const billing = await MilestoneBilling.findById(id).session(session);
    if (!billing) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const payment = billing.paymentRecords.find(p => p.paymentId === paymentId);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.reconciled) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Payment already reconciled' });
    }
    
    payment.reconciled = true;
    payment.reconciledDate = new Date();
    
    billing.auditTrail.push({
      action: 'payment_recorded',
      performedBy: req.user?.userId,
      timestamp: new Date(),
      notes: `Payment ${paymentId} reconciled`
    });
    
    await billing.save({ session });
    await session.commitTransaction();
    
    res.json({ message: 'Payment reconciled successfully', billing });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error reconciling payment', error: error.message });
  } finally {
    session.endSession();
  }
};

export const getAuditTrail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;
    
    const billing = await MilestoneBilling.findById(id)
      .populate('auditTrail.performedBy', 'name email')
      .select('auditTrail status invoiceNumber');
    
    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const total = billing.auditTrail.length;
    const paginatedTrail = billing.auditTrail
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(skip, skip + limitNum);
    
    res.json({ 
      auditTrail: paginatedTrail,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching audit trail', error: error.message });
  }
};
