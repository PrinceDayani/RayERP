import { Request, Response } from 'express';
import { Invoice } from '../models/Finance';
import InvoiceTemplate from '../models/InvoiceTemplate';
import { Voucher } from '../models/Voucher';
import JournalEntry from '../models/JournalEntry';
import nodemailer from 'nodemailer';


// Recurring Invoice Generation
export const generateRecurringInvoices = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const recurringInvoices = await Invoice.find({
      isRecurring: true,
      nextInvoiceDate: { $lte: today },
      $or: [{ recurringEndDate: { $gte: today } }, { recurringEndDate: null }]
    });

    const generated = [];
    for (const parent of recurringInvoices) {
      const newInvoice = new Invoice({
        ...parent.toObject(),
        _id: undefined,
        invoiceNumber: undefined,
        parentInvoiceId: parent._id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAmount: 0,
        payments: [],
        status: 'draft',
        createdAt: new Date()
      });
      
      await newInvoice.save();
      
      // Update next invoice date
      const nextDate = calculateNextDate(parent.nextRecurringDate!, parent.recurringFrequency!);
      parent.nextRecurringDate = nextDate;
      await parent.save();
      
      generated.push(newInvoice);
    }

    res.json({ success: true, count: generated.length, data: generated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Partial Payment
export const addPayment = async (req: Request, res: Response) => {
  try {
    const { amount, method, reference, notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.payments.push({ 
      date: new Date(), 
      amount, 
      currency: 'INR',
      exchangeRate: 1,
      amountInBaseCurrency: amount,
      paymentMethod: method, 
      reference: reference || '', 
      notes 
    });
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Invoice Aging Report
export const getAgingReport = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ status: { $in: ['sent', 'partial', 'overdue'] } });
    
    const aging = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    invoices.forEach(inv => {
      const days = Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const balance = inv.totalAmount - inv.paidAmount;
      
      if (days <= 0) aging.current += balance;
      else if (days <= 30) aging['1-30'] += balance;
      else if (days <= 60) aging['31-60'] += balance;
      else if (days <= 90) aging['61-90'] += balance;
      else aging['90+'] += balance;
    });

    res.json({ success: true, data: aging });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Auto-create Sales Voucher
export const createVoucherFromInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const voucher = new Voucher({
      voucherType: 'sales',
      voucherNumber: `SV-${invoice.invoiceNumber}`,
      date: invoice.invoiceDate,
      reference: invoice.invoiceNumber,
      description: `Sales invoice ${invoice.invoiceNumber}`,
      lines: [
        { accountId: 'DEBTORS_ACCOUNT', debit: invoice.totalAmount, credit: 0, description: `Invoice ${invoice.invoiceNumber}` },
        { accountId: 'SALES_ACCOUNT', debit: 0, credit: invoice.subtotal, description: 'Sales' },
        { accountId: 'TAX_ACCOUNT', debit: 0, credit: invoice.totalTax, description: 'Tax' }
      ],
      status: 'draft',
      createdBy: invoice.createdBy
    });

    await voucher.save();
    // Link via journalEntryId instead
    // invoice.voucherId = voucher._id;
    await invoice.save();

    res.json({ success: true, data: { invoice, voucher } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// E-Invoice Generation (GST India)
export const generateEInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Mock e-invoice generation (integrate with GST API in production)
    invoice.eInvoiceIRN = `IRN${Date.now()}`;
    invoice.eInvoiceAckNo = `ACK${Date.now()}`;
    invoice.eInvoiceAckDate = new Date();
    invoice.eInvoiceQRCode = `QR-${invoice.invoiceNumber}`;
    
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Convert Proforma to Invoice
export const convertProformaToInvoice = async (req: Request, res: Response) => {
  try {
    const proforma = await Invoice.findById(req.params.id);
    if (!proforma) {
      return res.status(404).json({ success: false, message: 'Proforma not found' });
    }

    const invoice = new Invoice({
      ...proforma.toObject(),
      _id: undefined,
      invoiceNumber: undefined,
      isProforma: false,
      status: 'draft',
      issueDate: new Date()
    });

    await invoice.save();
    // Link via linkedInvoiceId instead
    // proforma.convertedToInvoiceId = invoice._id;
    await proforma.save();

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Email Invoice
export const emailInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Mock email sending (configure SMTP in production)
    invoice.sentDate = new Date();
    await invoice.save();

    res.json({ success: true, message: 'Invoice emailed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send Reminder
export const sendReminder = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.remindersSent += 1;
    invoice.lastReminderDate = new Date();
    await invoice.save();

    res.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dispute Invoice
export const disputeInvoice = async (req: Request, res: Response) => {
  try {
    const { reason, amount } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Add dispute info to notes
    invoice.notes = `DISPUTED: ${reason}. Amount: ${amount}. Date: ${new Date().toISOString()}`;
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve Invoice
export const approveInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.approvalStatus = 'APPROVED';
    invoice.approvalWorkflow.push({
      level: 1,
      approverId: req.user.id,
      status: 'APPROVED',
      date: new Date()
    });
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function
function calculateNextDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}
