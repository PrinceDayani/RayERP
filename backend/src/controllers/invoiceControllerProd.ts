import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { JournalEntry } from '../models/JournalEntry';
import ChartOfAccount from '../models/ChartOfAccount';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Rate limiting for invoice operations
export const invoiceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many invoice requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
export const validateInvoiceCreation = [
  body('partyName').trim().isLength({ min: 1, max: 200 }).withMessage('Party name is required and must be 1-200 characters'),
  body('invoiceDate').isISO8601().withMessage('Invalid invoice date'),
  body('dueDate').isISO8601().withMessage('Invalid due date'),
  body('lineItems').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lineItems.*.description').trim().isLength({ min: 1, max: 500 }).withMessage('Line item description is required'),
  body('lineItems.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('lineItems.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
];

export const validateInvoiceUpdate = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  body('partyName').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Party name must be 1-200 characters'),
  body('totalAmount').optional().isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
];

export const validateInvoiceId = [
  param('id').isMongoId().withMessage('Invalid invoice ID')
];

export const validatePayment = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod').isIn(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE', 'UPI', 'OTHER']).withMessage('Invalid payment method'),
];

// Utility functions
const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
};

const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors in invoice operation', { errors: errors.array(), userId: req.user?.id });
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  return null;
};

const sanitizeInvoiceData = (data: any) => {
  const sanitized: any = {};
  const allowedFields = [
    'partyName', 'partyEmail', 'partyAddress', 'customerId', 'invoiceDate', 'dueDate',
    'lineItems', 'subtotal', 'totalTax', 'totalAmount', 'currency', 'exchangeRate',
    'paymentTerms', 'notes', 'internalNotes'
  ];
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string') {
        sanitized[field] = data[field].trim();
      } else {
        sanitized[field] = data[field];
      }
    }
  });
  
  return sanitized;
};

// Generate unique invoice number with retry logic
const generateInvoiceNumber = async (retries = 3): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;
      
      const lastInvoice = await Invoice.findOne(
        { invoiceNumber: { $regex: `^${prefix}` } },
        {},
        { sort: { invoiceNumber: -1 } }
      ).lean();
      
      let nextNumber = 1;
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
      }
      
      const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      
      // Check if number already exists (race condition protection)
      const exists = await Invoice.findOne({ invoiceNumber }).lean();
      if (!exists) {
        return invoiceNumber;
      }
    } catch (error) {
      logger.warn('Error generating invoice number, retrying', { attempt: i + 1, error });
    }
  }
  
  // Fallback with timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${new Date().getFullYear()}-${timestamp}`;
};

// Enhanced journal entry creation with error handling
const createInvoiceJournalEntry = async (invoice: any, userId: string): Promise<mongoose.Types.ObjectId | null> => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const [accountsReceivable, salesRevenue, taxPayable] = await Promise.all([
        ChartOfAccount.findOne({ accountType: 'ASSET' }).session(session),
        ChartOfAccount.findOne({ accountType: 'REVENUE' }).session(session),
        ChartOfAccount.findOne({ accountType: 'LIABILITY' }).session(session)
      ]);

      if (!accountsReceivable || !salesRevenue) {
        throw new Error('Required accounting setup missing. Please create chart of accounts.');
      }

      const lines = [
        {
          account: accountsReceivable._id,
          debit: invoice.totalAmount,
          credit: 0,
          description: `Sales Invoice ${invoice.invoiceNumber} - ${invoice.partyName}`
        },
        {
          account: salesRevenue._id,
          debit: 0,
          credit: invoice.subtotal,
          description: `Sales Revenue - ${invoice.invoiceNumber}`
        }
      ];

      if (invoice.totalTax > 0 && taxPayable) {
        lines.push({
          account: taxPayable._id,
          debit: 0,
          credit: invoice.totalTax,
          description: `Tax on Sales - ${invoice.invoiceNumber}`
        });
      }

      const journalEntry = new JournalEntry({
        entryNumber: `JE-INV-${invoice.invoiceNumber}`,
        entryDate: invoice.invoiceDate,
        description: `Sales Invoice ${invoice.invoiceNumber} - ${invoice.partyName}`,
        reference: invoice.invoiceNumber,
        sourceType: 'INVOICE',
        sourceId: invoice._id,
        lines,
        totalDebit: invoice.totalAmount,
        totalCredit: invoice.totalAmount,
        periodYear: new Date(invoice.invoiceDate).getFullYear(),
        periodMonth: new Date(invoice.invoiceDate).getMonth() + 1,
        status: 'POSTED',
        isPosted: true,
        createdBy: userId
      });

      await journalEntry.save({ session });
      return journalEntry._id;
    });

    return session.id;
  } catch (error) {
    logger.error('Error creating invoice journal entry', {
      error: error instanceof Error ? error.message : 'Unknown error',
      invoiceId: invoice._id,
      userId
    });
    return null;
  } finally {
    await session.endSession();
  }
};

// Production-ready create invoice
export const createInvoice = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  let invoiceId: string | undefined;
  
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;
    
    userId = getUserId(req);
    const sanitizedData = sanitizeInvoiceData(req.body);
    
    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Validate due date is after invoice date
    const invoiceDate = new Date(sanitizedData.invoiceDate);
    const dueDate = new Date(sanitizedData.dueDate);
    if (dueDate <= invoiceDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be after invoice date'
      });
    }
    
    // Calculate balance amount
    const balanceAmount = sanitizedData.totalAmount - (sanitizedData.paidAmount || 0);
    
    const invoiceData = {
      ...sanitizedData,
      invoiceNumber,
      invoiceType: 'SALES',
      status: 'DRAFT',
      currency: sanitizedData.currency || 'INR',
      exchangeRate: sanitizedData.exchangeRate || 1,
      baseCurrency: 'INR',
      paidAmount: 0,
      balanceAmount,
      amountInBaseCurrency: sanitizedData.totalAmount * (sanitizedData.exchangeRate || 1),
      payments: [],
      createdBy: userId,
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    invoiceId = invoice._id.toString();

    // Create journal entry - REQUIRED for accounting integrity
    const journalEntryId = await createInvoiceJournalEntry(invoice, userId);
    if (!journalEntryId) {
      // Delete the invoice if journal entry creation failed
      await Invoice.findByIdAndDelete(invoice._id);
      throw new Error('Failed to create journal entry. Invoice creation cancelled.');
    }
    
    invoice.journalEntryId = journalEntryId;
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const duration = Date.now() - startTime;
    logger.info('Invoice created successfully', {
      userId,
      invoiceId: invoice._id,
      invoiceNumber,
      totalAmount: sanitizedData.totalAmount,
      duration
    });

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating invoice', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      invoiceId,
      duration,
      requestBody: req.body
    });
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        return res.status(409).json({ success: false, message: 'Invoice number already exists' });
      }
    }
    
    res.status(500).json({ success: false, message: 'Error creating invoice' });
  }
};

// Production-ready get invoices with enhanced filtering
export const getInvoices = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    userId = getUserId(req);
    const {
      status,
      customerId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
      search,
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query;

    // Validate and sanitize pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID' });
      }
      filter.customerId = customerId;
    }
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid start date' });
        }
        filter.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid end date' });
        }
        filter.invoiceDate.$lte = end;
      }
    }

    // Add search functionality
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { invoiceNumber: searchRegex },
        { partyName: searchRegex },
        { partyEmail: searchRegex }
      ];
    }

    // Build sort object
    const sort: any = {};
    const validSortFields = ['invoiceDate', 'dueDate', 'totalAmount', 'status', 'invoiceNumber'];
    if (validSortFields.includes(sortBy as string)) {
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.invoiceDate = -1; // Default sort
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Invoice.countDocuments(filter)
    ]);

    const duration = Date.now() - startTime;
    logger.info('Invoices fetched successfully', {
      userId,
      count: invoices.length,
      total,
      duration,
      page: pageNum,
      limit: limitNum,
      filters: filter
    });

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching invoices', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      duration
    });
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
};

// Production-ready record payment with transaction safety
export const recordPayment = async (req: Request, res: Response) => {
  const startTime = Date.now();
  let userId: string;
  
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;
    
    userId = getUserId(req);
    const { amount, paymentMethod = 'CASH', reference = '' } = req.body;
    const { id } = req.params;

    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(id).session(session);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const remainingAmount = invoice.totalAmount - invoice.paidAmount;
      
      if (amount <= 0 || amount > remainingAmount) {
        throw new Error('Invalid payment amount');
      }

      // Record payment
      invoice.paidAmount += amount;
      invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;
      
      invoice.payments.push({
        date: new Date(),
        amount,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        amountInBaseCurrency: amount * invoice.exchangeRate,
        paymentMethod,
        reference
      });

      // Update status
      if (invoice.paidAmount >= invoice.totalAmount) {
        invoice.status = 'PAID';
        invoice.paidDate = new Date();
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }

      await invoice.save({ session });
    });

    await session.endSession();

    const duration = Date.now() - startTime;
    logger.info('Payment recorded successfully', {
      userId,
      invoiceId: id,
      amount,
      paymentMethod,
      duration
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error recording payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'unknown',
      invoiceId: req.params.id,
      duration
    });
    
    res.status(400).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Error recording payment' 
    });
  }
};

export default {
  createInvoice,
  getInvoices,
  recordPayment
};