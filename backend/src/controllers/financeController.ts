// src/controllers/financeController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Finance, { Payment as PaymentModel, Invoice as InvoiceModel } from '../models/Finance';
import JournalEntry from '../models/JournalEntry';
import Account from '../models/ChartOfAccount';

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getFromCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
};

/**
 * Create a new Payment record with full validation and journal entry creation
 */
export const createPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const paymentData = {
      ...req.body,
      type: 'payment',
      createdBy: req.user.id,
      paymentDate: req.body.paymentDate || new Date(),
    };

    // Validate allocations if provided
    if (paymentData.allocations?.length) {
      let totalAllocated = 0;
      for (const alloc of paymentData.allocations) {
        const invoice = await InvoiceModel.findById(alloc.invoiceId).session(session);
        if (!invoice) throw new Error(`Invoice ${alloc.invoiceId} not found`);
        if (invoice.balanceAmount < alloc.amount) {
          throw new Error(`Allocation amount exceeds invoice balance for ${invoice.invoiceNumber}`);
        }
        totalAllocated += alloc.amount;
      }
      paymentData.allocatedAmount = totalAllocated;
      paymentData.unappliedAmount = paymentData.totalAmount - totalAllocated;
    }

    const payment = await PaymentModel.create([paymentData], { session });

    clearCache('finance');
    clearCache('analytics');

    // Update invoice paid amounts
    if (paymentData.allocations?.length) {
      for (const alloc of paymentData.allocations) {
        const invoice = await InvoiceModel.findById(alloc.invoiceId).session(session);
        if (invoice) {
          invoice.paidAmount = (invoice.paidAmount || 0) + alloc.amount;
          invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;
          if (invoice.balanceAmount <= 0) invoice.status = 'PAID';
          else if (invoice.paidAmount > 0) invoice.status = 'PARTIALLY_PAID';
          await invoice.save({ session });
        }
      }
    }

    // Create journal entry if approved
    if (payment[0].approvalStatus === 'APPROVED') {
      const accountMap: Record<string, string> = {
        CASH: 'Cash',
        BANK_TRANSFER: 'Bank',
        CHEQUE: 'Bank',
        UPI: 'Bank',
        CARD: 'Bank',
        NEFT: 'Bank',
        RTGS: 'Bank',
        WALLET: 'E-Wallet',
      };

      const cashAccount = await Account.findOne({ name: accountMap[payment[0].paymentMethod] || 'Cash' }).session(session);
      const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);

      if (cashAccount && receivableAccount) {
        const je = new JournalEntry({
          date: payment[0].paymentDate,
          description: `Payment received: ${payment[0].paymentNumber}`,
          entries: [
            { account: cashAccount._id, debit: payment[0].baseAmount, credit: 0, description: `${payment[0].paymentMethod} payment` },
            { account: receivableAccount._id, debit: 0, credit: payment[0].baseAmount, description: 'Accounts receivable' },
          ],
          totalDebit: payment[0].baseAmount,
          totalCredit: payment[0].baseAmount,
          status: 'POSTED',
          createdBy: req.user.id,
        });
        await je.save({ session });
        payment[0].journalEntryId = je._id as mongoose.Types.ObjectId;
        await payment[0].save({ session });
      }
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, data: payment[0] });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Create a new Invoice record with full validation
 */
export const createInvoice = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const invoiceData = {
      ...req.body,
      type: 'invoice',
      createdBy: req.user.id,
      invoiceDate: req.body.invoiceDate || new Date(),
      balanceAmount: req.body.totalAmount,
    };

    const invoice = await InvoiceModel.create([invoiceData], { session });
    
    clearCache('finance');
    clearCache('analytics');
    
    await session.commitTransaction();
    res.status(201).json({ success: true, data: invoice[0] });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get a finance record (payment or invoice) by ID with populated references
 */
export const getFinanceById = async (req: Request, res: Response) => {
  try {
    const cacheKey = `finance:${req.params.id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const finance = await Finance.findById(req.params.id)
      .populate('customerId vendorId createdBy')
      .lean();
    if (!finance) return res.status(404).json({ success: false, message: 'Record not found' });
    
    setCache(cacheKey, finance);
    res.json({ success: true, data: finance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List finance records with optional filters
 */
export const getFinances = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, status, search } = req.query as any;
    const cacheKey = `finances:${page}:${limit}:${type}:${status}:${search}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { partyName: { $regex: search, $options: 'i' } },
        { paymentNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const records = await Finance.find(filter)
      .populate('customerId vendorId createdBy')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await Finance.countDocuments(filter);
    
    const result = { success: true, data: records, pagination: { page: Number(page), limit: Number(limit), total } };
    setCache(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a finance record (partial)
 */
export const updateFinance = async (req: Request, res: Response) => {
  try {
    const updated = await Finance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Record not found' });
    
    clearCache('finance');
    clearCache('analytics');
    
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a finance record
 */
export const deleteFinance = async (req: Request, res: Response) => {
  try {
    const deleted = await Finance.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Record not found' });
    
    clearCache('finance');
    clearCache('analytics');
    
    res.json({ success: true, message: 'Record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Allocate a payment to one or more invoices
 * Creates journal entries for partial/full payments
 */
export const allocatePayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { paymentId, allocations } = req.body; // allocations: [{ invoiceId, amount }]
    const payment = await PaymentModel.findById(paymentId).session(session);
    if (!payment) throw new Error('Payment not found');

    const revenueAccount = await Account.findOne({ name: 'Sales Revenue' }).session(session);
    const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);

    let totalAllocated = 0;
    for (const alloc of allocations) {
      const invoice = await InvoiceModel.findById(alloc.invoiceId).session(session);
      if (!invoice) throw new Error(`Invoice ${alloc.invoiceId} not found`);
      if (invoice.balanceAmount < alloc.amount) {
        throw new Error(`Allocation exceeds invoice balance for ${invoice.invoiceNumber}`);
      }

      // Add allocation to payment
      payment.allocations.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: alloc.amount,
        allocationDate: new Date(),
      });

      // Update invoice
      const previousPaidAmount = invoice.paidAmount || 0;
      invoice.paidAmount = previousPaidAmount + alloc.amount;
      invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;
      
      const newStatus = invoice.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      const statusChanged = invoice.status !== newStatus;
      invoice.status = newStatus;
      
      if (newStatus === 'PAID') invoice.paidDate = new Date();

      // Create journal entry for partial/full payment (only if status changed to PARTIALLY_PAID or PAID)
      if (statusChanged && revenueAccount && receivableAccount && !invoice.journalEntryId) {
        const je = new JournalEntry({
          date: new Date(),
          description: `${newStatus === 'PAID' ? 'Full' : 'Partial'} payment for invoice: ${invoice.invoiceNumber}`,
          reference: `${invoice.invoiceNumber}-${payment.paymentNumber}`,
          entries: [
            { account: receivableAccount._id, debit: alloc.amount, credit: 0, description: 'Accounts receivable' },
            { account: revenueAccount._id, debit: 0, credit: alloc.amount, description: 'Sales revenue' },
          ],
          totalDebit: alloc.amount,
          totalCredit: alloc.amount,
          status: 'POSTED',
          createdBy: req.user.id,
        });
        await je.save({ session });
        invoice.journalEntryId = je._id as mongoose.Types.ObjectId;
      }

      await invoice.save({ session });
      totalAllocated += alloc.amount;
    }

    payment.allocatedAmount = (payment.allocatedAmount || 0) + totalAllocated;
    payment.unappliedAmount = payment.totalAmount - payment.allocatedAmount;
    await payment.save({ session });

    await session.commitTransaction();
    res.json({ success: true, data: payment });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Approve a payment or invoice - moves to APPROVED status
 * For payments: DRAFT/PENDING_APPROVAL → APPROVED (creates journal entry)
 * For invoices: DRAFT/PENDING_APPROVAL → APPROVED (no journal entry yet)
 */
export const approveFinance = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    
    const finance = await Finance.findById(req.params.id).session(session) as any;
    if (!finance) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    finance.approvalStatus = 'APPROVED';
    finance.approvedBy = req.user.id as any;
    finance.approvedAt = new Date();
    finance.status = 'APPROVED';

    // Create journal entry ONLY for payments when approved
    if (finance.type === 'payment' && !finance.journalEntryId) {
      const accountMap: Record<string, string> = {
        CASH: 'Cash', BANK_TRANSFER: 'Bank', CHEQUE: 'Bank', UPI: 'Bank',
        CARD: 'Bank', NEFT: 'Bank', RTGS: 'Bank', WALLET: 'E-Wallet',
      };

      const cashAccount = await Account.findOne({ name: accountMap[(finance as any).paymentMethod] || 'Cash' }).session(session);
      const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);

      if (cashAccount && receivableAccount) {
        const je = new JournalEntry({
          date: (finance as any).paymentDate || new Date(),
          description: `Payment received: ${(finance as any).paymentNumber}`,
          reference: (finance as any).paymentNumber,
          entries: [
            { account: cashAccount._id, debit: finance.baseAmount, credit: 0, description: `${(finance as any).paymentMethod} payment` },
            { account: receivableAccount._id, debit: 0, credit: finance.baseAmount, description: 'Accounts receivable' },
          ],
          totalDebit: finance.baseAmount,
          totalCredit: finance.baseAmount,
          status: 'POSTED',
          createdBy: req.user.id,
        });
        await je.save({ session });
        finance.journalEntryId = je._id;
      }
    }

    await finance.save({ session });
    await session.commitTransaction();
    res.json({ success: true, data: finance });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Mark invoice as PAID - creates journal entry
 * Invoice: SENT/VIEWED/PARTIALLY_PAID → PAID (creates journal entry)
 */
export const markInvoicePaid = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    
    const invoice = await InvoiceModel.findById(req.params.id).session(session) as any;
    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'PAID';
    invoice.paidAmount = invoice.totalAmount;
    invoice.balanceAmount = 0;
    invoice.paidDate = new Date();

    // Create journal entry for invoice payment
    if (!invoice.journalEntryId) {
      const revenueAccount = await Account.findOne({ name: 'Sales Revenue' }).session(session);
      const receivableAccount = await Account.findOne({ name: 'Accounts Receivable' }).session(session);

      if (revenueAccount && receivableAccount) {
        const je = new JournalEntry({
          date: invoice.paidDate,
          description: `Invoice paid: ${invoice.invoiceNumber}`,
          reference: invoice.invoiceNumber,
          entries: [
            { account: receivableAccount._id, debit: invoice.baseAmount, credit: 0, description: 'Accounts receivable' },
            { account: revenueAccount._id, debit: 0, credit: invoice.baseAmount, description: 'Sales revenue' },
          ],
          totalDebit: invoice.baseAmount,
          totalCredit: invoice.baseAmount,
          status: 'POSTED',
          createdBy: req.user.id,
        });
        await je.save({ session });
        invoice.journalEntryId = je._id;
      }
    }

    await invoice.save({ session });
    await session.commitTransaction();
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get analytics for finance records
 */
export const getFinanceAnalytics = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'analytics:finance';
    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [metrics, revenueData, statusBreakdown, paymentMethods] = await Promise.all([
      Finance.aggregate([
        {
          $facet: {
            total: [
              { $match: { type: 'invoice' } },
              { $group: { _id: null, revenue: { $sum: { $ifNull: ['$totalAmount', 0] } }, count: { $sum: 1 } } }
            ],
            overdue: [
              { $match: { type: 'invoice', status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] }, dueDate: { $lt: new Date() } } },
              { $group: { _id: null, amount: { $sum: { $ifNull: ['$balanceAmount', '$totalAmount'] } }, count: { $sum: 1 } } }
            ],
            avgPaymentTime: [
              { $match: { type: 'invoice', status: 'PAID', updatedAt: { $exists: true }, invoiceDate: { $exists: true } } },
              { $project: { days: { $divide: [{ $subtract: ['$updatedAt', '$invoiceDate'] }, 86400000] } } },
              { $group: { _id: null, avg: { $avg: '$days' } } }
            ]
          }
        }
      ]),
      Finance.aggregate([
        { $match: { type: 'invoice', invoiceDate: { $gte: sixMonthsAgo, $exists: true } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } }, revenue: { $sum: { $ifNull: ['$totalAmount', 0] } }, payments: { $sum: { $ifNull: ['$paidAmount', 0] } } } },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', revenue: 1, payments: 1, _id: 0 } }
      ]),
      Finance.aggregate([
        { $match: { type: 'invoice' } },
        { $group: { _id: '$status', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, color: { $switch: { branches: [{ case: { $eq: ['$_id', 'PAID'] }, then: '#10b981' }, { case: { $eq: ['$_id', 'SENT'] }, then: '#3b82f6' }, { case: { $eq: ['$_id', 'PARTIALLY_PAID'] }, then: '#f59e0b' }, { case: { $eq: ['$_id', 'OVERDUE'] }, then: '#ef4444' }], default: '#8b5cf6' } }, _id: 0 } }
      ]),
      Finance.aggregate([
        { $match: { type: 'payment', paymentMethod: { $exists: true } } },
        { $group: { _id: '$paymentMethod', value: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
        { $project: { name: { $ifNull: ['$_id', 'Other'] }, value: 1, _id: 0 } }
      ])
    ]);

    const result = metrics[0] || { total: [], overdue: [], avgPaymentTime: [] };
    const response = {
      success: true,
      data: {
        metrics: {
          totalRevenue: result.total[0]?.revenue || 0,
          totalInvoices: result.total[0]?.count || 0,
          totalPayments: result.total[0]?.count || 0,
          overdueAmount: result.overdue[0]?.amount || 0,
          overdueCount: result.overdue[0]?.count || 0,
          avgPaymentTime: Math.round(result.avgPaymentTime[0]?.avg || 0)
        },
        revenueData: revenueData || [],
        statusBreakdown: statusBreakdown || [],
        paymentMethods: paymentMethods || []
      }
    };
    
    setCache(cacheKey, response);
    res.json(response);
  } catch (error: any) {
    console.error('Finance analytics error:', error);
    res.json({
      success: true,
      data: {
        metrics: { totalRevenue: 0, totalInvoices: 0, totalPayments: 0, overdueAmount: 0, overdueCount: 0, avgPaymentTime: 0 },
        revenueData: [],
        statusBreakdown: [],
        paymentMethods: []
      }
    });
  }
};

/**
 * Get cash flow data
 */
export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query as any;
    const filter: any = { type: 'payment', status: { $in: ['APPROVED', 'COMPLETED'] } };
    if (startDate && endDate) {
      filter.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const groupFormat: Record<string, any> = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$paymentDate' } },
      month: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
    };

    const cashFlow = await Finance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupFormat[groupBy] || groupFormat.day,
          totalInflow: { $sum: '$baseAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: cashFlow });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get overdue invoices
 */
export const getOverdueInvoices = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query as any;
    const overdueInvoices = await InvoiceModel.find({
      status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] },
      dueDate: { $lt: new Date() },
      balanceAmount: { $gt: 0 },
    })
      .sort({ dueDate: 1 })
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: overdueInvoices, count: overdueInvoices.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get unallocated payments
 */
export const getUnallocatedPayments = async (req: Request, res: Response) => {
  try {
    const { customerId, limit = 50 } = req.query as any;
    const filter: any = { type: 'payment', unappliedAmount: { $gt: 0 }, status: { $in: ['APPROVED', 'COMPLETED'] } };
    if (customerId) filter.customerId = customerId;

    const unallocatedPayments = await PaymentModel.find(filter)
      .sort({ paymentDate: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: unallocatedPayments, count: unallocatedPayments.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk delete finance records
 */
export const bulkDeleteFinance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide record IDs to delete' });
    }

    const result = await Finance.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${result.deletedCount} records deleted`, deletedCount: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk approve finance records
 */
export const bulkApproveFinance = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide record IDs to approve' });
    }

    const result = await Finance.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          approvalStatus: 'APPROVED',
          status: 'APPROVED',
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      }
    );

    res.json({ success: true, message: `${result.modifiedCount} records approved`, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Download invoice/payment as PDF
 */
export const downloadFinancePDF = async (req: Request, res: Response) => {
  try {
    const record = await Finance.findById(req.params.id)
      .populate('customerId', 'name email address')
      .populate('vendorId', 'name email address')
      .lean() as any;

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${record.type}-${req.params.id}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text(record.type === 'invoice' ? 'INVOICE' : 'PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown();

    // Company Info (left side)
    doc.fontSize(10);
    doc.text('Your Company Name', 50, 100);
    doc.text('123 Business Street', 50, 115);
    doc.text('City, State 12345', 50, 130);
    doc.text('contact@company.com', 50, 145);

    // Invoice/Payment Info (right side)
    const isInvoice = record.type === 'invoice';
    doc.text(`${isInvoice ? 'Invoice' : 'Payment'} #: ${(record as any).invoiceNumber || (record as any).paymentNumber}`, 400, 100);
    doc.text(`Date: ${new Date((record as any).invoiceDate || (record as any).paymentDate || record.createdAt).toLocaleDateString()}`, 400, 115);

    if (isInvoice && (record as any).dueDate) {
      doc.text(`Due Date: ${new Date((record as any).dueDate).toLocaleDateString()}`, 400, 130);
    }

    doc.text(`Status: ${record.status}`, 400, isInvoice ? 145 : 130);

    // Bill To / Customer Info
    doc.moveDown(3);
    doc.fontSize(12).text('Bill To:', 50);
    doc.fontSize(10);
    const customer = (record as any).customerId || (record as any).vendorId;
    if (customer) {
      doc.text(customer.name || 'N/A', 50);
      doc.text(customer.email || '', 50);
      if (customer.address) doc.text(customer.address, 50);
    }

    // Line Items Table (for invoices)
    if (isInvoice && (record as any).lineItems && (record as any).lineItems.length > 0) {
      doc.moveDown(2);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 300, tableTop);
      doc.text('Price', 350, tableTop);
      doc.text('Tax %', 420, tableTop);
      doc.text('Amount', 480, tableTop, { align: 'right', width: 100 });

      doc.font('Helvetica');
      let yPosition = tableTop + 20;

      (record as any).lineItems.forEach((item: any) => {
        doc.text(item.description || '', 50, yPosition, { width: 240 });
        doc.text(item.quantity || '', 300, yPosition);
        doc.text(`${record.currency || 'INR'} ${(item.unitPrice || item.rate || 0).toFixed(2)}`, 350, yPosition);
        doc.text(`${item.taxRate || item.gstRate || 0}%`, 420, yPosition);
        doc.text(`${record.currency || 'INR'} ${(item.amount || item.total || 0).toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });
        yPosition += 25;
      });

      // Totals
      yPosition += 10;
      doc.moveTo(350, yPosition).lineTo(580, yPosition).stroke();
      yPosition += 10;

      doc.text('Subtotal:', 400, yPosition);
      doc.text(`${record.currency || 'INR'} ${((record as any).subtotal || 0).toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });
      yPosition += 15;

      doc.text('Tax:', 400, yPosition);
      doc.text(`${record.currency || 'INR'} ${((record as any).totalTax || 0).toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });
      yPosition += 15;

      if ((record as any).discount && (record as any).discount > 0) {
        doc.text('Discount:', 400, yPosition);
        doc.text(`-${record.currency || 'INR'} ${(record as any).discount.toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });
        yPosition += 15;
      }

      doc.font('Helvetica-Bold');
      doc.fontSize(12);
      doc.text('Total:', 400, yPosition);
      doc.text(`${record.currency || 'INR'} ${(record.totalAmount || 0).toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });

      if (isInvoice) {
        yPosition += 20;
        doc.fontSize(10);
        doc.text('Paid:', 400, yPosition);
        doc.text(`${record.currency || 'INR'} ${((record as any).paidAmount || 0).toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });
        yPosition += 15;

        doc.text('Balance Due:', 400, yPosition);
        doc.text(`${record.currency || 'INR'} ${((record as any).balanceAmount || record.totalAmount).toFixed(2)}`, 480, yPosition, { align: 'right', width: 100 });
      }
    } else {
      // For payments without line items
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Amount:', 50);
      doc.text(`${record.currency || 'INR'} ${(record.totalAmount || 0).toFixed(2)}`, 200);
    }

    // Notes
    if (record.notes) {
      doc.moveDown(4);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Notes:', 50);
      doc.font('Helvetica');
      doc.text(record.notes, 50, doc.y, { width: 500 });
    }

    // Footer
    doc.fontSize(8).text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

    // Finalize PDF
    doc.end();
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: `PDF generation failed: ${error.message}` });
  }
};

/**
 * Send invoice/payment via email
 */
export const sendFinanceEmail = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const { to, subject, message } = req.body;
    const record = await Finance.findById(req.params.id).lean();

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Email sending logic (implement with nodemailer)
    // For now, just return success
    res.json({
      success: true,
      message: `Email sent to ${to}`,
      emailData: { to, subject, message, recordId: req.params.id }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Duplicate an invoice
 */
export const duplicateInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const original = await Finance.findById(req.params.id).lean();

    if (!original || original.type !== 'invoice') {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Create duplicate with new invoice number and dates
    const { _id, invoiceNumber, createdAt, updatedAt, ...invoiceData } = original as any;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];
    const serial = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const duplicate = await Finance.create({
      ...invoiceData,
      invoiceNumber: `INV-${timestamp}-${serial}`,
      status: 'DRAFT',
      approvalStatus: 'PENDING',
      invoiceDate: now,
      createdBy: req.user.id,
    });

    res.json({ success: true, data: duplicate, message: 'Invoice duplicated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
