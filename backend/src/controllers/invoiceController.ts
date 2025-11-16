import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import JournalEntry from '../models/JournalEntry';
import { Account } from '../models/Account';
import mongoose from 'mongoose';

export const createInvoice = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoiceData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      const count = await Invoice.countDocuments({ invoiceType: invoiceData.invoiceType });
      const prefix = invoiceData.invoiceType === 'SALES' ? 'INV' : 'BILL';
      invoiceData.invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    const invoice = new Invoice(invoiceData);
    await invoice.save({ session });

    // Create journal entry if invoice is approved
    if (invoice.status === 'APPROVED') {
      await createInvoiceJournalEntry(invoice, req.user.id, session);
    }

    await session.commitTransaction();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('vendorId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice created successfully'
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const {
      invoiceType,
      status,
      customerId,
      vendorId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};
    if (invoiceType) filter.invoiceType = invoiceType;
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (vendorId) filter.vendorId = vendorId;
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email')
        .populate('vendorId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email address')
      .populate('vendorId', 'name email address')
      .populate('createdBy', 'name email')
      .populate('journalEntryId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id).session(session);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Prevent modification of paid invoices
    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify paid invoice'
      });
    }

    const oldStatus = invoice.status;
    Object.assign(invoice, req.body);
    invoice.updatedBy = req.user.id;

    await invoice.save({ session });

    // Create journal entry if status changed to approved
    if (oldStatus !== 'APPROVED' && invoice.status === 'APPROVED') {
      await createInvoiceJournalEntry(invoice, req.user.id, session);
    }

    await session.commitTransaction();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('vendorId', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice updated successfully'
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Prevent deletion of paid or sent invoices
    if (['PAID', 'SENT', 'PARTIALLY_PAID'].includes(invoice.status)) {
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

export const recordPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount, paymentMethod, reference, paymentDate } = req.body;
    const invoice = await Invoice.findById(req.params.id).session(session);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (amount <= 0 || amount > invoice.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Add payment record
    invoice.payments.push({
      date: new Date(paymentDate || Date.now()),
      amount,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate,
      amountInBaseCurrency: amount * invoice.exchangeRate,
      paymentMethod,
      reference: reference || `Payment for ${invoice.invoiceNumber}`
    });

    // Update payment status
    invoice.paidAmount += amount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balanceAmount <= 0.01) {
      invoice.status = 'PAID';
      invoice.paidDate = new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save({ session });

    // Create payment journal entry
    await createPaymentJournalEntry(invoice, amount, paymentMethod, req.user.id, session);

    await session.commitTransaction();

    res.json({
      success: true,
      data: invoice,
      message: 'Payment recorded successfully'
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

export const sendInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only approved invoices can be sent'
      });
    }

    invoice.status = 'SENT';
    invoice.sentDate = new Date();
    await invoice.save();

    // Here you would integrate with email service
    // await emailService.sendInvoice(invoice);

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceSummary = async (req: Request, res: Response) => {
  try {
    const { invoiceType, startDate, endDate } = req.query;
    const filter: any = {};
    if (invoiceType) filter.invoiceType = invoiceType;
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate as string);
    }

    const [summary] = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$balanceAmount' },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } },
          sentCount: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
          overdueCount: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $gt: ['$balanceAmount', 0] }
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

// Helper function to create journal entry for invoice
const createInvoiceJournalEntry = async (invoice: any, userId: any, session: any) => {
  const lines = [];

  if (invoice.invoiceType === 'SALES') {
    // Debit Accounts Receivable
    lines.push({
      account: await getAccountByType('ACCOUNTS_RECEIVABLE'),
      accountId: await getAccountByType('ACCOUNTS_RECEIVABLE'),
      debit: invoice.totalAmount,
      credit: 0,
      description: `Sales Invoice ${invoice.invoiceNumber}`
    });

    // Credit Revenue accounts based on line items
    for (const item of invoice.lineItems) {
      if (item.account) {
        lines.push({
          account: item.account,
          accountId: item.account,
          debit: 0,
          credit: item.amount - item.taxAmount,
          description: item.description
        });
      }
    }

    // Credit Tax account if applicable
    if (invoice.totalTax > 0) {
      lines.push({
        account: await getAccountByType('TAX_PAYABLE'),
        accountId: await getAccountByType('TAX_PAYABLE'),
        debit: 0,
        credit: invoice.totalTax,
        description: `Tax on Invoice ${invoice.invoiceNumber}`
      });
    }
  } else {
    // Purchase Invoice
    // Credit Accounts Payable
    lines.push({
      account: await getAccountByType('ACCOUNTS_PAYABLE'),
      accountId: await getAccountByType('ACCOUNTS_PAYABLE'),
      debit: 0,
      credit: invoice.totalAmount,
      description: `Purchase Invoice ${invoice.invoiceNumber}`
    });

    // Debit Expense accounts based on line items
    for (const item of invoice.lineItems) {
      if (item.account) {
        lines.push({
          account: item.account,
          accountId: item.account,
          debit: item.amount - item.taxAmount,
          credit: 0,
          description: item.description
        });
      }
    }

    // Debit Tax account if applicable
    if (invoice.totalTax > 0) {
      lines.push({
        account: await getAccountByType('TAX_RECEIVABLE'),
        accountId: await getAccountByType('TAX_RECEIVABLE'),
        debit: invoice.totalTax,
        credit: 0,
        description: `Tax on Invoice ${invoice.invoiceNumber}`
      });
    }
  }

  const journalEntry = new JournalEntry({
    entryNumber: `INV-${invoice.invoiceNumber}`,
    entryType: 'MANUAL',
    status: 'POSTED',
    date: invoice.invoiceDate,
    entryDate: invoice.invoiceDate,
    postingDate: new Date(),
    periodYear: invoice.invoiceDate.getFullYear(),
    periodMonth: invoice.invoiceDate.getMonth() + 1,
    description: `${invoice.invoiceType} Invoice ${invoice.invoiceNumber}`,
    reference: invoice.invoiceNumber,
    lines,
    totalDebit: lines.reduce((sum, line) => sum + line.debit, 0),
    totalCredit: lines.reduce((sum, line) => sum + line.credit, 0),
    isPosted: true,
    sourceType: 'INVOICE',
    sourceId: invoice._id,
    createdBy: userId,
    postedBy: userId
  });

  await journalEntry.save({ session });
  
  // Update account balances
  for (const line of lines) {
    await Account.findByIdAndUpdate(
      line.account,
      { $inc: { balance: line.debit - line.credit } },
      { session }
    );
  }

  invoice.journalEntryId = journalEntry._id;
  await invoice.save({ session });
};

// Helper function to create payment journal entry
const createPaymentJournalEntry = async (invoice: any, amount: number, paymentMethod: string, userId: any, session: any) => {
  const lines = [];
  const cashAccount = await getAccountByType('CASH');

  if (invoice.invoiceType === 'SALES') {
    // Debit Cash/Bank
    lines.push({
      account: cashAccount,
      accountId: cashAccount,
      debit: amount,
      credit: 0,
      description: `Payment received for ${invoice.invoiceNumber}`
    });

    // Credit Accounts Receivable
    lines.push({
      account: await getAccountByType('ACCOUNTS_RECEIVABLE'),
      accountId: await getAccountByType('ACCOUNTS_RECEIVABLE'),
      debit: 0,
      credit: amount,
      description: `Payment for ${invoice.invoiceNumber}`
    });
  } else {
    // Purchase Invoice Payment
    // Credit Cash/Bank
    lines.push({
      account: cashAccount,
      accountId: cashAccount,
      debit: 0,
      credit: amount,
      description: `Payment made for ${invoice.invoiceNumber}`
    });

    // Debit Accounts Payable
    lines.push({
      account: await getAccountByType('ACCOUNTS_PAYABLE'),
      accountId: await getAccountByType('ACCOUNTS_PAYABLE'),
      debit: amount,
      credit: 0,
      description: `Payment for ${invoice.invoiceNumber}`
    });
  }

  const journalEntry = new JournalEntry({
    entryNumber: `PAY-${invoice.invoiceNumber}-${Date.now()}`,
    entryType: 'MANUAL',
    status: 'POSTED',
    date: new Date(),
    entryDate: new Date(),
    postingDate: new Date(),
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    reference: invoice.invoiceNumber,
    lines,
    totalDebit: lines.reduce((sum, line) => sum + line.debit, 0),
    totalCredit: lines.reduce((sum, line) => sum + line.credit, 0),
    isPosted: true,
    sourceType: 'INVOICE',
    sourceId: invoice._id,
    createdBy: userId,
    postedBy: userId
  });

  await journalEntry.save({ session });

  // Update account balances
  for (const line of lines) {
    await Account.findByIdAndUpdate(
      line.account,
      { $inc: { balance: line.debit - line.credit } },
      { session }
    );
  }
};

// Helper function to get account by type
const getAccountByType = async (type: string) => {
  const accountMap: any = {
    'ACCOUNTS_RECEIVABLE': { type: 'asset', name: 'Accounts Receivable' },
    'ACCOUNTS_PAYABLE': { type: 'liability', name: 'Accounts Payable' },
    'TAX_PAYABLE': { type: 'liability', name: 'Tax Payable' },
    'TAX_RECEIVABLE': { type: 'asset', name: 'Tax Receivable' },
    'CASH': { type: 'asset', name: 'Cash' }
  };

  const accountInfo = accountMap[type];
  if (!accountInfo) throw new Error(`Unknown account type: ${type}`);

  let account = await Account.findOne({ 
    type: accountInfo.type, 
    name: { $regex: accountInfo.name, $options: 'i' } 
  });

  if (!account) {
    // Create default account if it doesn't exist
    account = new Account({
      code: `${accountInfo.type.toUpperCase()}-${type}`,
      name: accountInfo.name,
      type: accountInfo.type,
      balance: 0,
      openingBalance: 0,
      currency: 'INR',
      isActive: true,
      isGroup: false,
      allowPosting: true,
      createdBy: new mongoose.Types.ObjectId()
    });
    await account.save();
  }

  return account._id;
};

export default {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  sendInvoice,
  getInvoiceSummary
};