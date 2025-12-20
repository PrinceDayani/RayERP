import express from 'express';
import Invoice from '../models/Invoice';
import { JournalEntry } from '../models/JournalEntry';
import { protect } from '../middleware/auth.middleware';
import { requireFinanceAccess } from '../middleware/financePermission.middleware';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  sendInvoice,
  getInvoiceSummary,
  getCustomers,
  getChartOfAccounts,
  getInvoiceJournalEntry,
  invoiceRateLimit,
  validateInvoiceCreation,
  validateInvoiceUpdate,
  validatePayment
} from '../controllers/invoiceController';
import { invoiceHealthChecker } from '../utils/invoiceHealthCheck';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Health check endpoint (no auth required for monitoring)
router.get('/health', async (req, res) => {
  try {
    const health = await invoiceHealthChecker.performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;
    res.status(statusCode).json({ success: true, data: health });
  } catch (error) {
    res.status(503).json({ 
      success: false, 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed metrics endpoint (requires auth)
router.get('/metrics', protect, async (req, res) => {
  try {
    const metrics = await invoiceHealthChecker.getDetailedMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET Customers from Contacts (before rate limiter to avoid conflicts)
router.get('/customers/list', protect, getCustomers);

// GET Chart of Accounts for invoice creation
router.get('/accounts/list', protect, getChartOfAccounts);

// Apply authentication and rate limiting
router.use(protect);
router.use(invoiceRateLimit);

const storage = multer.diskStorage({
  destination: './public/uploads/invoices/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Generate invoice number
const generateInvoiceNumber = async (type: string, fiscalYear: number) => {
  const prefix = type === 'SALES' ? 'SI' : type === 'PURCHASE' ? 'PI' : type === 'CREDIT_NOTE' ? 'CN' : 'DN';
  const count = await Invoice.countDocuments({ invoiceType: type, invoiceDate: { $gte: new Date(fiscalYear, 3, 1), $lt: new Date(fiscalYear + 1, 3, 1) } });
  return `${prefix}/${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}/${String(count + 1).padStart(5, '0')}`;
};

// Calculate late fees
const calculateLateFees = (invoice: any) => {
  if (invoice.status === 'PAID' || !invoice.lateFeePercentage) return 0;
  const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime() - invoice.gracePeriodDays * 86400000) / 86400000));
  return daysOverdue > 0 ? (invoice.balanceAmount * invoice.lateFeePercentage / 100) * (daysOverdue / 30) : 0;
};

// Auto-create journal entry
const createJournalEntry = async (invoice: any, userId: string) => {
  const lines = [];
  if (invoice.invoiceType === 'SALES') {
    lines.push({ account: invoice.lineItems[0].account, debit: invoice.totalAmount, credit: 0, description: `Sales Invoice ${invoice.invoiceNumber}` });
    lines.push({ account: invoice.lineItems[0].account, debit: 0, credit: invoice.subtotal, description: 'Sales Revenue' });
    if (invoice.totalTax > 0) lines.push({ account: invoice.lineItems[0].account, debit: 0, credit: invoice.totalTax, description: 'Tax Collected' });
  } else {
    lines.push({ account: invoice.lineItems[0].account, debit: invoice.subtotal, credit: 0, description: 'Purchase Expense' });
    if (invoice.totalTax > 0) lines.push({ account: invoice.lineItems[0].account, debit: invoice.totalTax, credit: 0, description: 'Tax Paid' });
    lines.push({ account: invoice.lineItems[0].account, debit: 0, credit: invoice.totalAmount, description: `Purchase Invoice ${invoice.invoiceNumber}` });
  }
  
  const je = new JournalEntry({
    entryNumber: `JE-INV-${invoice.invoiceNumber}`,
    entryType: 'MANUAL',
    status: 'POSTED',
    entryDate: invoice.invoiceDate,
    postingDate: new Date(),
    periodYear: new Date(invoice.invoiceDate).getFullYear(),
    periodMonth: new Date(invoice.invoiceDate).getMonth() + 1,
    description: `Auto-generated from ${invoice.invoiceType} Invoice ${invoice.invoiceNumber}`,
    lines,
    totalDebit: lines.reduce((sum, l) => sum + l.debit, 0),
    totalCredit: lines.reduce((sum, l) => sum + l.credit, 0),
    sourceType: 'INVOICE',
    sourceId: invoice._id,
    createdBy: userId,
    postedBy: userId
  });
  await je.save();
  return je._id;
};

// CREATE Invoice with validation
router.post('/', validateInvoiceCreation, requireFinanceAccess('invoices.create'), createInvoice);

// GET All Invoices with enhanced filtering
router.get('/', requireFinanceAccess('invoices.view'), getInvoices);

// GET Invoice Stats
router.get('/stats', requireFinanceAccess('invoices.view'), async (req, res) => {
  try {
    const stats = {
      total: await Invoice.countDocuments(),
      draft: await Invoice.countDocuments({ status: 'DRAFT' }),
      sent: await Invoice.countDocuments({ status: 'SENT' }),
      paid: await Invoice.countDocuments({ status: 'PAID' }),
      overdue: await Invoice.countDocuments({ status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] }, dueDate: { $lt: new Date() } }),
      totalAmount: (await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]))[0]?.total || 0,
      totalPaid: (await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount' } } }]))[0]?.total || 0,
      totalOutstanding: (await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$balanceAmount' } } }]))[0]?.total || 0
    };
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Aging Report
router.get('/aging-report', requireFinanceAccess('invoices.view'), async (req, res) => {
  try {
    const now = new Date();
    const invoices = await Invoice.find({ status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] } }).populate('customerId');
    
    const aging = {
      current: { count: 0, amount: 0, invoices: [] as any[] },
      days30: { count: 0, amount: 0, invoices: [] as any[] },
      days60: { count: 0, amount: 0, invoices: [] as any[] },
      days90: { count: 0, amount: 0, invoices: [] as any[] },
      days90Plus: { count: 0, amount: 0, invoices: [] as any[] }
    };
    
    invoices.forEach(inv => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      const bucket = daysOverdue <= 0 ? 'current' : daysOverdue <= 30 ? 'days30' : daysOverdue <= 60 ? 'days60' : daysOverdue <= 90 ? 'days90' : 'days90Plus';
      aging[bucket].count++;
      aging[bucket].amount += inv.balanceAmount;
      aging[bucket].invoices.push({ invoiceNumber: inv.invoiceNumber, customer: inv.partyName, amount: inv.balanceAmount, daysOverdue });
    });
    
    res.json({ success: true, data: aging });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Invoice - Approve
router.post('/:id/approve', requireFinanceAccess('invoices.approve'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    const level = invoice.approvalWorkflow.find(w => w.approverId.toString() === req.user?.id && w.status === 'PENDING');
    if (!level) return res.status(403).json({ success: false, message: 'Not authorized to approve' });
    
    level.status = 'APPROVED';
    level.date = new Date();
    level.comments = req.body.comments;
    
    if (invoice.approvalWorkflow.every(w => w.status === 'APPROVED')) {
      invoice.approvalStatus = 'APPROVED';
      invoice.status = 'APPROVED';
    }
    
    await invoice.save();
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Invoice - Send
router.post('/:id/send', requireFinanceAccess('invoices.send'), sendInvoice);

// GET Invoice PDF
router.get('/:id/pdf', requireFinanceAccess('invoices.view'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    const pdfService = require('../services/pdfService').default;
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Invoice - Record Payment with validation
router.post('/:id/payment', validatePayment, requireFinanceAccess('invoices.edit'), recordPayment);

// POST Invoice - Post (Create JE)
router.post('/:id/post', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status !== 'APPROVED') return res.status(400).json({ success: false, message: 'Invoice must be approved first' });
    
    const jeId = await createJournalEntry(invoice, req.user?.id);
    invoice.journalEntryId = jeId;
    invoice.status = 'SENT';
    await invoice.save();
    
    res.json({ success: true, data: invoice, message: 'Invoice posted and journal entry created' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Batch Invoices
router.post('/batch', async (req, res) => {
  try {
    const { invoices } = req.body;
    const created = [];
    
    for (const inv of invoices) {
      const fiscalYear = new Date(inv.invoiceDate).getMonth() >= 3 ? new Date(inv.invoiceDate).getFullYear() : new Date(inv.invoiceDate).getFullYear() - 1;
      const invoiceNumber = await generateInvoiceNumber(inv.invoiceType, fiscalYear);
      const invoice = new Invoice({ ...inv, invoiceNumber, balanceAmount: inv.totalAmount, amountInBaseCurrency: inv.totalAmount * (inv.exchangeRate || 1), createdBy: req.user?.id });
      await invoice.save();
      created.push(invoice);
    }
    
    res.status(201).json({ success: true, data: created, message: `${created.length} invoices created` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Create Recurring Invoices
router.post('/generate-recurring', async (req, res) => {
  try {
    const recurringInvoices = await Invoice.find({ isRecurring: true, nextRecurringDate: { $lte: new Date() }, status: { $ne: 'CANCELLED' } });
    const created = [];
    
    for (const parent of recurringInvoices) {
      const fiscalYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
      const invoiceNumber = await generateInvoiceNumber(parent.invoiceType, fiscalYear);
      
      const newInvoice = new Invoice({
        ...parent.toObject(),
        _id: undefined,
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        status: 'DRAFT',
        parentInvoiceId: parent._id,
        paidAmount: 0,
        balanceAmount: parent.totalAmount,
        payments: [],
        createdBy: parent.createdBy
      });
      await newInvoice.save();
      created.push(newInvoice);
      
      // Update next recurring date
      const nextDate = new Date(parent.nextRecurringDate);
      if (parent.recurringFrequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (parent.recurringFrequency === 'QUARTERLY') nextDate.setMonth(nextDate.getMonth() + 3);
      else if (parent.recurringFrequency === 'SEMI_ANNUALLY') nextDate.setMonth(nextDate.getMonth() + 6);
      else if (parent.recurringFrequency === 'ANNUALLY') nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      parent.nextRecurringDate = nextDate;
      await parent.save();
    }
    
    res.json({ success: true, data: created, message: `${created.length} recurring invoices generated` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Send Reminders
router.post('/send-reminders', async (req, res) => {
  try {
    const overdueInvoices = await Invoice.find({ status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] }, dueDate: { $lt: new Date() } });
    let sent = 0;
    
    for (const invoice of overdueInvoices) {
      const daysSinceLastReminder = invoice.lastReminderDate ? Math.floor((Date.now() - invoice.lastReminderDate.getTime()) / 86400000) : 999;
      if (daysSinceLastReminder >= 7) {
        // TODO: Send email reminder
        invoice.remindersSent++;
        invoice.lastReminderDate = new Date();
        invoice.dunningLevel = Math.min(3, Math.floor(invoice.remindersSent / 3));
        await invoice.save();
        sent++;
      }
    }
    
    res.json({ success: true, message: `${sent} reminders sent` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Calculate Late Fees
router.post('/calculate-late-fees', async (req, res) => {
  try {
    const overdueInvoices = await Invoice.find({ status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID'] }, dueDate: { $lt: new Date() }, lateFeePercentage: { $gt: 0 } });
    
    for (const invoice of overdueInvoices) {
      invoice.lateFeeAmount = calculateLateFees(invoice);
      invoice.status = 'OVERDUE';
      await invoice.save();
    }
    
    res.json({ success: true, message: `Late fees calculated for ${overdueInvoices.length} invoices` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Upload Attachment
router.post('/:id/attachment', upload.single('file'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    invoice.attachments.push(`/uploads/invoices/${req.file?.filename}`);
    await invoice.save();
    
    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET Invoice by ID
router.get('/:id', requireFinanceAccess('invoices.view'), getInvoiceById);

// GET Journal Entry for Invoice
router.get('/:id/journal-entry', requireFinanceAccess('invoices.view'), getInvoiceJournalEntry);

// PUT Update Invoice
router.put('/:id', validateInvoiceUpdate, requireFinanceAccess('invoices.edit'), updateInvoice);

// DELETE Invoice
router.delete('/:id', requireFinanceAccess('invoices.delete'), deleteInvoice);

export default router;
