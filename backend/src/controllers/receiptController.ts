import { Request, Response } from 'express';
import Receipt from '../models/Receipt';
import { Invoice } from '../models/Finance';
import { logger } from '../utils/logger';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Validation middleware
export const validateReceiptCreation = [
  body('invoiceId').isMongoId().withMessage('Invalid invoice ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHEQUE', 'UPI', 'OTHER']).withMessage('Invalid payment method'),
  body('receiptDate').optional().isISO8601().withMessage('Invalid receipt date'),
];

// Generate unique receipt number
const generateReceiptNumber = async (retries = 3): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `RCP-${currentYear}-`;
      
      const lastReceipt = await Receipt.findOne(
        { receiptNumber: { $regex: `^${prefix}` } },
        {},
        { sort: { receiptNumber: -1 } }
      ).lean();
      
      let nextNumber = 1;
      if (lastReceipt) {
        const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
      }
      
      const receiptNumber = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
      
      const exists = await Receipt.findOne({ receiptNumber }).lean();
      if (!exists) {
        return receiptNumber;
      }
    } catch (error) {
      logger.warn('Error generating receipt number, retrying', { attempt: i + 1 });
    }
  }
  
  const timestamp = Date.now().toString().slice(-6);
  return `RCP-${new Date().getFullYear()}-${timestamp}`;
};

// Create receipt (automatically called when payment is recorded)
export const createReceipt = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { invoiceId, amount, paymentMethod, paymentReference, transactionId, bankName, chequeNumber, chequeDate, notes } = req.body;

    // Get invoice details
    const invoice = await Invoice.findById(invoiceId).populate('customerId', 'name email address');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Validate payment amount
    if (amount > invoice.balanceAmount) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds invoice balance' });
    }

    const receiptNumber = await generateReceiptNumber();
    const receiptDate = req.body.receiptDate ? new Date(req.body.receiptDate) : new Date();

    const receiptData = {
      receiptNumber,
      receiptDate,
      amount,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate,
      amountInBaseCurrency: amount * invoice.exchangeRate,
      paymentMethod,
      paymentReference,
      transactionId,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      receivedFrom: invoice.partyName,
      receivedFromEmail: invoice.partyEmail,
      receivedFromAddress: invoice.partyAddress,
      bankName,
      chequeNumber,
      chequeDate: chequeDate ? new Date(chequeDate) : undefined,
      notes,
      status: 'VALID',
      createdBy: req.user.id
    };

    const receipt = new Receipt(receiptData);
    await receipt.save();

    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('invoiceId', 'invoiceNumber totalAmount paidAmount balanceAmount')
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const duration = Date.now() - startTime;
    logger.info('Receipt created successfully', {
      userId: req.user.id,
      receiptId: receipt._id,
      receiptNumber,
      amount,
      invoiceId,
      duration
    });

    res.status(201).json({
      success: true,
      data: populatedReceipt,
      message: 'Receipt created successfully'
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error creating receipt', {
      error: error.message,
      userId: req.user?.id,
      duration
    });
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all receipts with filtering
export const getReceipts = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      status,
      invoiceId,
      customerId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
      search
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (invoiceId) filter.invoiceId = invoiceId;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.receiptDate = {};
      if (startDate) filter.receiptDate.$gte = new Date(startDate as string);
      if (endDate) filter.receiptDate.$lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { receiptNumber: searchRegex },
        { receivedFrom: searchRegex },
        { invoiceNumber: searchRegex }
      ];
    }

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate('invoiceId', 'invoiceNumber totalAmount')
        .populate('customerId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ receiptDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Receipt.countDocuments(filter)
    ]);

    const duration = Date.now() - startTime;
    logger.info('Receipts fetched', { count: receipts.length, total, duration });

    res.json({
      success: true,
      data: receipts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    logger.error('Error fetching receipts', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get receipt by ID
export const getReceiptById = async (req: Request, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('invoiceId', 'invoiceNumber totalAmount paidAmount balanceAmount partyName')
      .populate('customerId', 'name email phone address')
      .populate('createdBy', 'name email')
      .lean();

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: receipt });
  } catch (error: any) {
    logger.error('Error fetching receipt', { error: error.message, receiptId: req.params.id });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get receipts for an invoice
export const getReceiptsByInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const receipts = await Receipt.find({ invoiceId, status: 'VALID' })
      .populate('createdBy', 'name email')
      .sort({ receiptDate: -1 })
      .lean();

    res.json({ success: true, data: receipts });
  } catch (error: any) {
    logger.error('Error fetching invoice receipts', { error: error.message, invoiceId: req.params.invoiceId });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel receipt
export const cancelReceipt = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Receipt is already cancelled' });
    }

    receipt.status = 'CANCELLED';
    receipt.cancellationReason = reason;
    receipt.cancellationDate = new Date();
    receipt.cancelledBy = new mongoose.Types.ObjectId(req.user.id);
    await receipt.save();

    const duration = Date.now() - startTime;
    logger.info('Receipt cancelled', {
      userId: req.user.id,
      receiptId: receipt._id,
      receiptNumber: receipt.receiptNumber,
      reason,
      duration
    });

    res.json({
      success: true,
      data: receipt,
      message: 'Receipt cancelled successfully'
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error cancelling receipt', {
      error: error.message,
      receiptId: req.params.id,
      duration
    });
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get receipt statistics
export const getReceiptStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = { status: 'VALID' };
    
    if (startDate || endDate) {
      filter.receiptDate = {};
      if (startDate) filter.receiptDate.$gte = new Date(startDate as string);
      if (endDate) filter.receiptDate.$lte = new Date(endDate as string);
    }

    const [stats] = await Receipt.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalReceipts: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          cashPayments: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$amount', 0] } },
          bankTransfers: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'BANK_TRANSFER'] }, '$amount', 0] } },
          cardPayments: { $sum: { $cond: [{ $in: ['$paymentMethod', ['CREDIT_CARD', 'DEBIT_CARD']] }, '$amount', 0] } },
          upiPayments: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'UPI'] }, '$amount', 0] } },
          chequePayments: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'CHEQUE'] }, '$amount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats || {
        totalReceipts: 0,
        totalAmount: 0,
        cashPayments: 0,
        bankTransfers: 0,
        cardPayments: 0,
        upiPayments: 0,
        chequePayments: 0
      }
    });
  } catch (error: any) {
    logger.error('Error fetching receipt stats', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createReceipt,
  getReceipts,
  getReceiptById,
  getReceiptsByInvoice,
  cancelReceipt,
  getReceiptStats,
  validateReceiptCreation
};
