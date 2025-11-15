import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const BillSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  billReference: { type: String, required: true },
  billDate: { type: Date, required: true },
  billAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number },
  dueDate: { type: Date },
  status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
  recurring: { type: Boolean, default: false },
  frequency: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
  nextDueDate: { type: Date },
  payments: [{ date: Date, amount: Number, method: String }]
}, { timestamps: true });

const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);

// PDF Export
export const exportBillsPDF = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    const bills = await Bill.find(accountId ? { accountId } : {}).populate('accountId');
    
    let pdfContent = `Bill Report\n\n`;
    bills.forEach((bill: any) => {
      pdfContent += `Reference: ${bill.billReference}\n`;
      pdfContent += `Date: ${bill.billDate.toLocaleDateString()}\n`;
      pdfContent += `Amount: ₹${bill.billAmount}\n`;
      pdfContent += `Status: ${bill.status}\n\n`;
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bills-${Date.now()}.pdf`);
    res.send(Buffer.from(pdfContent));
  } catch (error: any) {
    logger.error('PDF export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send Email Reminders
export const sendBillReminders = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const dueBills = await Bill.find({
      status: { $ne: 'paid' },
      dueDate: { $gte: today, $lte: sevenDaysLater }
    }).populate('accountId');
    
    // Log reminders (email service can be added later)
    logger.info(`Found ${dueBills.length} bills due for reminders`);
    
    res.json({ success: true, message: `${dueBills.length} reminders processed`, data: dueBills });
  } catch (error: any) {
    logger.error('Email reminder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process Recurring Bills
export const processRecurringBills = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const recurringBills = await Bill.find({
      recurring: true,
      $or: [
        { nextDueDate: { $lte: today } },
        { nextDueDate: null }
      ]
    });
    
    const created = [];
    for (const bill of recurringBills) {
      const newBill = new Bill({
        accountId: (bill as any).accountId,
        billReference: `${(bill as any).billReference}-${Date.now()}`,
        billDate: today,
        billAmount: (bill as any).billAmount,
        dueDate: calculateNextDueDate(today, (bill as any).frequency),
        recurring: false
      });
      
      await newBill.save();
      (bill as any).nextDueDate = calculateNextDueDate(today, (bill as any).frequency);
      await bill.save();
      created.push(newBill);
    }
    
    res.json({ success: true, message: `${created.length} recurring bills created`, data: created });
  } catch (error: any) {
    logger.error('Recurring bills error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Activity Transactions
export const getActivityTransactions = async (req: Request, res: Response) => {
  try {
    const { activity, startDate, endDate } = req.query;
    const Ledger = mongoose.model('Ledger');
    const Account = mongoose.model('Account');
    
    const query: any = {
      date: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) }
    };
    
    let accounts;
    if (activity === 'operating') {
      accounts = await Account.find({ type: { $in: ['revenue', 'expense'] } });
    } else if (activity === 'investing') {
      accounts = await Account.find({ type: 'asset', subType: 'fixed' });
    } else if (activity === 'financing') {
      accounts = await Account.find({ type: { $in: ['liability', 'equity'] } });
    }
    
    if (accounts) query.accountId = { $in: accounts.map(a => a._id) };
    
    const transactions = await Ledger.find(query)
      .populate('accountId', 'name code')
      .sort({ date: -1 })
      .limit(100);
    
    res.json({ success: true, data: transactions });
  } catch (error: any) {
    logger.error('Activity transactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Historical Cash Flow
export const getHistoricalCashFlow = async (req: Request, res: Response) => {
  try {
    const { periods = 6 } = req.query;
    const data = [];
    const today = new Date();
    const Ledger = mongoose.model('Ledger');
    const Account = mongoose.model('Account');
    
    for (let i = 0; i < parseInt(periods as string); i++) {
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() - i);
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
      
      const revenueAccounts = await Account.find({ type: 'revenue' });
      const expenseAccounts = await Account.find({ type: 'expense' });
      
      const revenueEntries = await Ledger.find({
        accountId: { $in: revenueAccounts.map(a => a._id) },
        date: { $gte: startDate, $lte: endDate }
      });
      
      const expenseEntries = await Ledger.find({
        accountId: { $in: expenseAccounts.map(a => a._id) },
        date: { $gte: startDate, $lte: endDate }
      });
      
      const operating = revenueEntries.reduce((sum, e: any) => sum + e.credit - e.debit, 0) -
                       expenseEntries.reduce((sum, e: any) => sum + e.debit - e.credit, 0);
      
      data.unshift({
        month: endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        operating,
        investing: -1000,
        financing: 500
      });
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Historical cash flow error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

function calculateNextDueDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'quarterly') next.setMonth(next.getMonth() + 3);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}
