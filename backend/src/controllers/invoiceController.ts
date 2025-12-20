import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { JournalEntry } from '../models/JournalEntry';
import ChartOfAccount from '../models/ChartOfAccount';
import Contact from '../models/Contact';
import Receipt from '../models/Receipt';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import emailService from '../services/emailService';
import pdfService from '../services/pdfService';
import { createCustomerLedgerAccount } from '../utils/customerLedger';
import { generateJournalEntryNumber, generateInvoiceNumber } from '../utils/journalNumberGenerator';

// Rate limiting for invoice operations
export const invoiceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many invoice requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
export const validateInvoiceCreation = [
  body('partyName').trim().isLength({ min: 1, max: 200 }).withMessage('Party name is required'),
  body('invoiceDate').isISO8601().withMessage('Invalid invoice date'),
  body('dueDate').isISO8601().withMessage('Invalid due date'),
  body('lineItems').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lineItems.*.description').trim().isLength({ min: 1 }).withMessage('Line item description is required'),
  body('lineItems.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('lineItems.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
];

export const validateInvoiceUpdate = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
];

export const validatePayment = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod').isIn(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE', 'UPI', 'OTHER']).withMessage('Invalid payment method'),
];

// Helper function to create journal entry for invoice
const createInvoiceJournalEntry = async (invoice: any, userId: string) => {
  try {
    // Find accounts by type (correct field name is 'type', not 'accountType')
    const accountsReceivable = await ChartOfAccount.findOne({ type: 'ASSET', isActive: true });
    const salesRevenue = await ChartOfAccount.findOne({ type: 'REVENUE', isActive: true });
    const taxPayable = await ChartOfAccount.findOne({ type: 'LIABILITY', isActive: true });

    if (!accountsReceivable || !salesRevenue) {
      logger.error('Required accounts not found');
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

    // Add tax line if applicable
    if (invoice.totalTax > 0 && taxPayable) {
      lines.push({
        account: taxPayable._id,
        debit: 0,
        credit: invoice.totalTax,
        description: `Tax on Sales - ${invoice.invoiceNumber}`
      });
    }

    const entryNumber = await generateJournalEntryNumber('INVOICE', 'AR');
    const journalEntry = new JournalEntry({
      entryNumber,
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

    await journalEntry.save();
    logger.info('Journal entry created', { journalEntryId: journalEntry._id, invoiceId: invoice._id });
    return journalEntry._id;
  } catch (error) {
    logger.error('Error creating journal entry', { error: error instanceof Error ? error.message : 'Unknown error', invoiceId: invoice._id });
    throw error;
  }
};

// Helper function to create payment journal entry
const createPaymentJournalEntry = async (invoice: any, paymentAmount: number, userId: string) => {
  try {
    const accounts = await ChartOfAccount.find({ type: 'ASSET', isActive: true }).limit(2);
    const cashAccount = accounts[0];
    const accountsReceivable = accounts[1] || accounts[0];

    if (!cashAccount) {
      logger.warn('No ASSET accounts found for payment journal entry');
      return null;
    }

    const entryNumber = await generateJournalEntryNumber('INVOICE', 'AR');
    const journalEntry = new JournalEntry({
      entryNumber,
      entryDate: new Date(),
      description: `Payment received for Invoice ${invoice.invoiceNumber}`,
      reference: invoice.invoiceNumber,
      sourceType: 'INVOICE',
      sourceId: invoice._id,
      lines: [
        {
          account: cashAccount._id,
          debit: paymentAmount,
          credit: 0,
          description: `Payment received - ${invoice.invoiceNumber}`
        },
        {
          account: accountsReceivable._id,
          debit: 0,
          credit: paymentAmount,
          description: `Payment against AR - ${invoice.invoiceNumber}`
        }
      ],
      totalDebit: paymentAmount,
      totalCredit: paymentAmount,
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      status: 'POSTED',
      isPosted: true,
      createdBy: userId
    });

    await journalEntry.save();
    logger.info('Payment journal entry created', { journalEntryId: journalEntry._id, invoiceId: invoice._id, amount: paymentAmount });
    return journalEntry._id;
  } catch (error) {
    logger.error('Error creating payment journal entry', { error: error instanceof Error ? error.message : 'Unknown error', invoiceId: invoice._id });
    return null;
  }
};

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

// Generate unique invoice number with retry logic
const generateInvoiceNumberLegacy = async (retries = 3): Promise<string> => {
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
      logger.warn('Error generating invoice number, retrying', { attempt: i + 1 });
    }
  }
  
  // Fallback with timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${new Date().getFullYear()}-${timestamp}`;
};

export const createInvoice = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    // Validate due date is after invoice date
    const invoiceDate = new Date(req.body.invoiceDate);
    const dueDate = new Date(req.body.dueDate);
    if (dueDate <= invoiceDate) {
      return res.status(400).json({ success: false, message: 'Due date must be after invoice date' });
    }

    const invoiceNumber = await generateInvoiceNumber(req.body.invoiceType || 'SALES');
    
    const invoiceData = {
      ...req.body,
      invoiceNumber,
      invoiceType: req.body.invoiceType || 'SALES',
      status: 'DRAFT',
      currency: req.body.currency || 'INR',
      exchangeRate: req.body.exchangeRate || 1,
      baseCurrency: 'INR',
      paidAmount: 0,
      balanceAmount: req.body.totalAmount,
      amountInBaseCurrency: req.body.totalAmount * (req.body.exchangeRate || 1),
      createdBy: req.user.id
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // NO JOURNAL ENTRY CREATED HERE - Only when invoice is sent/finalized

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    const duration = Date.now() - startTime;
    logger.info('Invoice created successfully (draft)', { userId: req.user.id, invoiceId: invoice._id, invoiceNumber, duration });

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice created successfully (draft)'
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error creating invoice', { error: error.message, userId: req.user?.id, duration });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      status,
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
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { invoiceNumber: searchRegex },
        { partyName: searchRegex },
        { partyEmail: searchRegex }
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Invoice.countDocuments(filter)
    ]);

    const duration = Date.now() - startTime;
    logger.info('Invoices fetched', { count: invoices.length, total, duration });

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
  } catch (error: any) {
    logger.error('Error fetching invoices', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify paid invoice'
      });
    }

    // Update invoice data but preserve invoice number
    const updateData = { ...req.body };
    delete updateData.invoiceNumber; // Prevent changing invoice number
    updateData.updatedBy = req.user.id;
    updateData.balanceAmount = updateData.totalAmount - (updateData.paidAmount || 0);

    Object.assign(invoice, updateData);
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (['paid', 'sent'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete invoice that has been sent or paid'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markInvoicePaid = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    const paymentAmount = invoice.totalAmount - invoice.paidAmount;
    
    invoice.paidAmount = invoice.totalAmount;
    invoice.balanceAmount = 0;
    invoice.status = 'PAID';
    invoice.paidDate = new Date();
    
    // Add payment record
    invoice.payments.push({
      date: new Date(),
      amount: paymentAmount,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate,
      amountInBaseCurrency: paymentAmount * invoice.exchangeRate,
      paymentMethod: 'CASH',
      reference: 'Full Payment'
    });
    
    await invoice.save();

    // Create payment journal entry
    await createPaymentJournalEntry(invoice, paymentAmount, req.user.id);

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice marked as paid successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { amount, paymentMethod = 'CASH', reference = '' } = req.body;
    const { id } = req.params;

    const session = await mongoose.startSession();
    let updatedInvoice;
    
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(id).session(session).read('primary');
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const remainingAmount = invoice.totalAmount - invoice.paidAmount;
      
      if (amount <= 0 || amount > remainingAmount) {
        throw new Error('Invalid payment amount');
      }

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

      if (invoice.paidAmount >= invoice.totalAmount) {
        invoice.status = 'PAID';
        invoice.paidDate = new Date();
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }

      await invoice.save({ session });
      updatedInvoice = invoice;
    });

    await session.endSession();

    // Create payment journal entry (outside transaction)
    await createPaymentJournalEntry(updatedInvoice, amount, req.user.id);

    // Auto-create receipt
    let receiptId = null;
    try {
      const receiptNumber = await generateReceiptNumber();
      const receipt = new Receipt({
        receiptNumber,
        receiptDate: new Date(),
        amount,
        currency: updatedInvoice.currency,
        exchangeRate: updatedInvoice.exchangeRate,
        amountInBaseCurrency: amount * updatedInvoice.exchangeRate,
        paymentMethod,
        paymentReference: reference,
        invoiceId: updatedInvoice._id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        customerId: updatedInvoice.customerId,
        receivedFrom: updatedInvoice.partyName,
        receivedFromEmail: updatedInvoice.partyEmail,
        receivedFromAddress: updatedInvoice.partyAddress,
        status: 'VALID',
        createdBy: req.user.id
      });
      await receipt.save();
      receiptId = receipt._id;
      logger.info('Receipt auto-created', { receiptId, receiptNumber, invoiceId: id, amount });
    } catch (receiptError) {
      logger.error('Failed to auto-create receipt', { error: receiptError instanceof Error ? receiptError.message : 'Unknown error', invoiceId: id });
    }

    const duration = Date.now() - startTime;
    logger.info('Payment recorded', { userId: req.user.id, invoiceId: id, amount, receiptId, duration });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      receiptId
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error recording payment', { error: error.message, invoiceId: req.params.id, duration });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendInvoice = async (req: Request, res: Response) => {
  let session: mongoose.ClientSession | null = null;
  
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID' });
    }

    session = await mongoose.startSession();
    let result;

    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(req.params.id).session(session).read('primary');
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status !== 'DRAFT') {
        throw new Error('Only draft invoices can be sent');
      }

      // Use customer's ledger account or find/create defaults
      const lineItemAccounts = invoice.lineItems?.map(item => item.account).filter(Boolean) || [];
      
      let accountsReceivable, salesRevenue, taxPayable;
      
      // Use customer's specific ledger account if available
      if (invoice.customerId) {
        const customer = await Contact.findById(invoice.customerId).session(session).read('primary');
        if (customer?.ledgerAccountId) {
          accountsReceivable = await ChartOfAccount.findById(customer.ledgerAccountId).session(session).read('primary');
        }
      }
      
      // Fallback to general Accounts Receivable if no customer account
      if (!accountsReceivable) {
        accountsReceivable = await ChartOfAccount.findOne({ 
          type: 'ASSET', 
          isActive: true 
        }).session(session).read('primary');
        
        if (!accountsReceivable) {
          accountsReceivable = new ChartOfAccount({
            code: '1200',
            name: 'Accounts Receivable',
            type: 'ASSET',
            isActive: true,
            createdBy: req.user.id
          });
          await accountsReceivable.save({ session });
        }
      }
      
      // Find or create Sales Revenue if not from line items
      if (!salesRevenue) {
        salesRevenue = await ChartOfAccount.findOne({ 
          type: 'REVENUE', 
          isActive: true 
        }).session(session).read('primary');
        
        if (!salesRevenue) {
          salesRevenue = new ChartOfAccount({
            code: '4000',
            name: 'Sales Revenue',
            type: 'REVENUE',
            isActive: true,
            createdBy: req.user.id
          });
          await salesRevenue.save({ session });
        }
      }
      
      // Find or create Tax Payable if needed
      if (invoice.totalTax > 0) {
        taxPayable = await ChartOfAccount.findOne({ 
          type: 'LIABILITY', 
          isActive: true 
        }).session(session).read('primary');
        
        if (!taxPayable) {
          taxPayable = new ChartOfAccount({
            code: '2100',
            name: 'Tax Payable',
            type: 'LIABILITY',
            isActive: true,
            createdBy: req.user.id
          });
          await taxPayable.save({ session });
        }
      }

      // Create journal entry lines
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
          credit: invoice.subtotal || invoice.totalAmount,
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

      const entryNumber = await generateJournalEntryNumber('INVOICE', 'AR');
      const journalEntry = new JournalEntry({
        entryNumber,
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
        createdBy: req.user.id
      });

      await journalEntry.save({ session });
      
      invoice.status = 'SENT';
      invoice.sentDate = new Date();
      invoice.journalEntryId = journalEntry._id;
      await invoice.save({ session });

      result = { 
        invoice, 
        journalEntryId: journalEntry._id,
        accountsUsed: {
          accountsReceivable: {
            id: accountsReceivable._id,
            code: accountsReceivable.code,
            name: accountsReceivable.name,
            type: accountsReceivable.type
          },
          salesRevenue: {
            id: salesRevenue._id,
            code: salesRevenue.code,
            name: salesRevenue.name,
            type: salesRevenue.type
          },
          taxPayable: taxPayable ? {
            id: taxPayable._id,
            code: taxPayable.code,
            name: taxPayable.name,
            type: taxPayable.type
          } : null
        }
      };
    });

    // Email handling (outside transaction)
    let emailStatus = 'no_email';
    if (result?.invoice?.partyEmail?.trim()) {
      try {
        const pdfBuffer = await pdfService.generateInvoicePDF(result.invoice);
        await emailService.sendInvoice(result.invoice, pdfBuffer);
        emailStatus = 'sent';
      } catch (emailError) {
        emailStatus = 'failed';
        logger.warn('Email failed', { 
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          invoiceId: result.invoice._id 
        });
      }
    }

    logger.info('Invoice sent successfully', { 
      invoiceId: result?.invoice._id, 
      journalEntryId: result?.journalEntryId,
      emailStatus,
      userId: req.user.id 
    });

    res.json({
      success: true,
      data: {
        ...result?.invoice.toObject(),
        emailStatus,
        accountsUsed: result?.accountsUsed
      },
      message: 'Invoice sent successfully and journal entry created'
    });

  } catch (error: any) {
    logger.error('Send invoice failed', { 
      error: error.message, 
      stack: error.stack,
      invoiceId: req.params.id,
      userId: req.user?.id 
    });
    
    res.status(error.message?.includes('not found') ? 404 : 
               error.message?.includes('Only draft') ? 400 : 500).json({ 
      success: false, 
      message: error.message || 'Failed to send invoice'
    });
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (sessionError) {
        logger.warn('Session end error', { error: sessionError });
      }
    }
  }
};

export const getInvoiceSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate as string);
      if (endDate) filter.issueDate.$lte = new Date(endDate as string);
    }

    const [summary] = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          overdueCount: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $gt: [{ $subtract: ['$totalAmount', '$paidAmount'] }, 0] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        draftCount: 0,
        sentCount: 0,
        paidCount: 0,
        overdueCount: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Generate PDF for invoice
export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const pdfBuffer = await pdfService.generateInvoicePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('Error generating PDF', { error: error.message, invoiceId: req.params.id });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get customers list with their ledger accounts
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const customers = await Contact.find({ isCustomer: true, status: 'active' })
      .select('name email phone company ledgerAccountId')
      .sort({ name: 1 })
      .lean();
    
    // Ensure all customers have ledger accounts
    const updatedCustomers = [];
    for (const customer of customers) {
      let customerData = { ...customer };
      
      if (!customer.ledgerAccountId) {
        try {
          const ledgerAccountId = await createCustomerLedgerAccount(
            customer._id.toString(), 
            customer.name, 
            userId
          );
          customerData.ledgerAccountId = ledgerAccountId;
          logger.info('Customer ledger account auto-created', { 
            customerId: customer._id, 
            ledgerAccountId 
          });
        } catch (error) {
          logger.warn('Failed to create customer ledger account', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            customerId: customer._id 
          });
        }
      }
      
      updatedCustomers.push(customerData);
    }
    
    res.json({ success: true, data: updatedCustomers });
  } catch (error: any) {
    logger.error('Error fetching customers', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Chart of Accounts for invoice creation
export const getChartOfAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await ChartOfAccount.find({ 
      isActive: true,
      allowPosting: true 
    }).select('_id code name type').sort({ code: 1 });
    
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    logger.error('Error fetching chart of accounts', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get journal entry for invoice
export const getInvoiceJournalEntry = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (!invoice.journalEntryId) {
      return res.status(404).json({ success: false, message: 'No journal entry found for this invoice' });
    }

    const journalEntry = await JournalEntry.findById(invoice.journalEntryId)
      .populate('lines.account', 'code name type')
      .populate('createdBy', 'name email');

    if (!journalEntry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }

    res.json({ success: true, data: journalEntry });
  } catch (error: any) {
    logger.error('Error fetching journal entry', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markInvoicePaid,
  recordPayment,
  sendInvoice,
  generateInvoicePDF,
  getInvoiceSummary,
  getCustomers,
  getChartOfAccounts,
  getInvoiceJournalEntry,
  invoiceRateLimit,
  validateInvoiceCreation,
  validateInvoiceUpdate,
  validatePayment
};
