import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Invoice from '../models/Invoice';
import JournalEntry from '../models/JournalEntry';
import Account from '../models/Account';

export const createPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    
    const payment = new Payment({ ...req.body, createdBy: req.user.id });
    await payment.save();

    if (payment.allocations?.length) {
      for (const alloc of payment.allocations) {
        const invoice = await Invoice.findById(alloc.invoiceId);
        if (invoice) {
          invoice.paidAmount = (invoice.paidAmount || 0) + alloc.amount;
          invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';
          await invoice.save();
        }
      }
    }
    
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, projectId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;

    const payments = await Payment.find(filter)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('customerId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Payment.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: payments,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('customerId', 'name email')
      .populate('projectId', 'name');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approvePayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      approvalStatus: 'APPROVED',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      status: 'APPROVED'
    }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processRefund = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { amount, reason } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      status: 'REFUNDED',
      refund: { amount, reason, refundDate: new Date(), refundedBy: req.user.id }
    }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const raiseDispute = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      status: 'DISPUTED',
      dispute: { reason, status: 'OPEN', raisedDate: new Date() }
    }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reconcilePayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { bankStatementId } = req.body;
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      'reconciliation.status': 'RECONCILED',
      'reconciliation.reconciledDate': new Date(),
      'reconciliation.reconciledBy': req.user.id,
      'reconciliation.bankStatementId': bankStatementId
    }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJournalEntry = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    
    const cashAccount = await Account.findOne({ code: '1010' });
    const receivableAccount = await Account.findOne({ code: '1200' });
    
    const je = new JournalEntry({
      entryDate: payment.paymentDate,
      description: `Payment received - ${payment.paymentNumber}`,
      reference: payment.paymentNumber,
      lines: [
        { account: cashAccount?._id, debit: payment.baseAmount, credit: 0, description: 'Cash received' },
        { account: receivableAccount?._id, debit: 0, credit: payment.baseAmount, description: 'Accounts receivable' }
      ],
      totalDebit: payment.baseAmount,
      totalCredit: payment.baseAmount,
      status: 'POSTED',
      createdBy: req.user.id
    });
    await je.save();
    
    payment.journalEntryId = je._id as mongoose.Types.ObjectId;
    await payment.save();
    
    res.json({ success: true, data: { payment, journalEntry: je } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};
    if (startDate && endDate) {
      filter.paymentDate = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    const analytics = await Payment.aggregate([
      { $match: filter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$baseAmount' },
        avgAmount: { $avg: '$baseAmount' }
      }},
      { $sort: { totalAmount: -1 } }
    ]);
    
    const methodBreakdown = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$baseAmount' } }}
    ]);
    
    res.json({ success: true, data: { analytics, methodBreakdown } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const batchPayments = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { payments } = req.body;
    const created = await Payment.insertMany(payments.map((p: any) => ({ ...p, createdBy: req.user!.id })));
    res.json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendReminder = async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, {
      $inc: { remindersSent: 1 },
      lastReminderDate: new Date()
    }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment, message: 'Reminder sent' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};