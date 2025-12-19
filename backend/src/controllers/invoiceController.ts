import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import { JournalEntry } from '../models/JournalEntry';
import ChartOfAccount from '../models/ChartOfAccount';
import mongoose from 'mongoose';

// Helper function to create journal entry for invoice
const createInvoiceJournalEntry = async (invoice: any, userId: string) => {
  try {
    // Find any available accounts by type
    const accountsReceivable = await ChartOfAccount.findOne({ accountType: 'ASSET' });
    const salesRevenue = await ChartOfAccount.findOne({ accountType: 'REVENUE' });
    const taxPayable = await ChartOfAccount.findOne({ accountType: 'LIABILITY' });

    if (!accountsReceivable || !salesRevenue) {
      console.error('Required accounts not found. Please create at least one ASSET and one REVENUE account.');
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

    await journalEntry.save();
    return journalEntry._id;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return null;
  }
};

// Helper function to create payment journal entry
const createPaymentJournalEntry = async (invoice: any, paymentAmount: number, userId: string) => {
  try {
    const accounts = await ChartOfAccount.find({ accountType: 'ASSET' }).limit(2);
    const cashAccount = accounts[0]; // First ASSET account as cash
    const accountsReceivable = accounts[1] || accounts[0]; // Second ASSET account or same if only one

    if (!cashAccount) {
      console.warn('No ASSET accounts found for payment journal entry');
      return null;
    }

    const journalEntry = new JournalEntry({
      entryNumber: `JE-PAY-${invoice.invoiceNumber}-${Date.now()}`,
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
    return journalEntry._id;
  } catch (error) {
    console.error('Error creating payment journal entry:', error);
    return null;
  }
};

// Generate unique invoice number
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  const lastInvoice = await Invoice.findOne(
    { invoiceNumber: { $regex: `^${prefix}` } },
    {},
    { sort: { invoiceNumber: -1 } }
  );
  
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoiceNumber = await generateInvoiceNumber();
    
    const invoiceData = {
      ...req.body,
      invoiceNumber,
      createdBy: req.user.id,
      balanceAmount: req.body.totalAmount - (req.body.paidAmount || 0)
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Create journal entry for the invoice - REQUIRED
    const journalEntryId = await createInvoiceJournalEntry(invoice, req.user.id);
    if (!journalEntryId) {
      // Delete the invoice if journal entry creation failed
      await Invoice.findByIdAndDelete(invoice._id);
      throw new Error('Failed to create journal entry. Invoice creation cancelled.');
    }
    
    invoice.journalEntryId = journalEntryId;
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice created successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const {
      status,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate as string);
      if (endDate) filter.issueDate.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email')
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
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount, paymentMethod = 'CASH', reference = '' } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const remainingAmount = invoice.totalAmount - invoice.paidAmount;
    
    if (amount <= 0 || amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Record payment in invoice
    invoice.paidAmount += amount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;
    
    // Add payment record
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

    await invoice.save();

    // Create payment journal entry
    await createPaymentJournalEntry(invoice, amount, req.user.id);

    res.json({
      success: true,
      data: invoice,
      message: 'Payment recorded successfully'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
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

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be sent'
      });
    }

    invoice.status = 'SENT';
    invoice.sentDate = new Date();
    await invoice.save();

    // Create journal entry if not already created
    if (!invoice.journalEntryId) {
      const journalEntryId = await createInvoiceJournalEntry(invoice, req.user.id);
      if (journalEntryId) {
        invoice.journalEntryId = journalEntryId;
        await invoice.save();
      }
    }

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



export default {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markInvoicePaid,
  recordPayment,
  sendInvoice,
  getInvoiceSummary
};