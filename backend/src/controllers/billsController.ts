import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Bill } from '../models/Bill';
import { BillPayment } from '../models/BillPayment';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { accountId, billDate, dueDate, vendor, items, notes } = req.body;
    const userId = (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!accountId || !billDate || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    
    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than 0' });
    }

    const billNumber = `BILL-${Date.now()}`;

    const bill = await Bill.create({
      accountId,
      billNumber,
      billDate,
      dueDate: dueDate || null,
      vendor: vendor || '',
      items: items.map((item: any) => ({
        description: item.description?.trim() || '',
        amount: Number(item.amount) || 0,
        paidAmount: 0,
        balanceAmount: Number(item.amount) || 0
      })),
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      status: 'pending',
      notes: notes?.trim() || '',
      createdBy: userId
    });

    logger.info(`Bill created: ${billNumber} by user ${userId}`);
    res.status(201).json({ success: true, data: bill, message: 'Bill created successfully' });
  } catch (error: any) {
    logger.error('Create bill error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create bill' });
  }
};

export const getBills = async (req: Request, res: Response) => {
  try {
    const { accountId, status, limit = 100 } = req.query;
    const query: any = {};
    if (accountId) query.accountId = accountId;
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('accountId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ billDate: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: bills, count: bills.length });
  } catch (error: any) {
    logger.error('Get bills error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch bills' });
  }
};

export const getBillById = async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('accountId', 'name code')
      .populate('createdBy', 'name email');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const payments = await BillPayment.find({ billId: bill._id })
      .populate('createdBy', 'name email')
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: { bill, payments } });
  } catch (error: any) {
    logger.error('Get bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const makePayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { billId, paymentDate, amount, paymentMethod, reference, notes, paymentAccountId } = req.body;
    const userId = (req as any).user?._id;

    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!billId || !paymentDate || !amount || !paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (bill.status === 'paid') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Bill is already paid' });
    }

    if (amount > bill.balanceAmount) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Payment amount (₹${amount}) exceeds balance (₹${bill.balanceAmount})` });
    }

    // Auto-allocate payment to items
    const allocations: any[] = [];
    let remainingAmount = amount;

    for (let i = 0; i < bill.items.length && remainingAmount > 0; i++) {
      const item = bill.items[i];
      const payableAmount = Math.min(remainingAmount, item.balanceAmount);
      
      if (payableAmount > 0) {
        allocations.push({ itemIndex: i, amount: payableAmount });
        item.paidAmount += payableAmount;
        item.balanceAmount -= payableAmount;
        remainingAmount -= payableAmount;
      }
    }

    bill.paidAmount += amount;
    bill.balanceAmount -= amount;
    bill.status = bill.balanceAmount === 0 ? 'paid' : 'partial';
    await bill.save({ session });

    const payment = await BillPayment.create([{
      billId,
      paymentDate,
      amount,
      paymentMethod,
      reference,
      allocations,
      notes,
      createdBy: userId
    }], { session });

    // Deduct from payment account (default to bill account if not specified)
    const accountToDeduct = paymentAccountId || bill.accountId;
    await ChartOfAccount.findByIdAndUpdate(
      accountToDeduct,
      { $inc: { balance: -amount } },
      { session }
    );

    await session.commitTransaction();
    logger.info(`Payment of ₹${amount} made for bill ${bill.billNumber} by user ${userId}`);
    res.json({ success: true, data: { payment: payment[0], bill }, message: 'Payment processed successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process payment' });
  } finally {
    session.endSession();
  }
};

export const updateBill = async (req: Request, res: Response) => {
  try {
    const { billDate, dueDate, vendor, notes } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (bill.paidAmount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot edit bill with existing payments' });
    }

    if (billDate) bill.billDate = billDate;
    if (dueDate !== undefined) bill.dueDate = dueDate;
    if (vendor !== undefined) bill.vendor = vendor;
    if (notes !== undefined) bill.notes = notes;
    
    await bill.save();

    logger.info(`Bill updated: ${bill.billNumber}`);
    res.json({ success: true, data: bill, message: 'Bill updated successfully' });
  } catch (error: any) {
    logger.error('Update bill error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update bill' });
  }
};

export const deleteBill = async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (bill.paidAmount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete bill with existing payments. Please reverse payments first.' });
    }

    const billNumber = bill.billNumber;
    await bill.deleteOne();
    
    logger.info(`Bill deleted: ${billNumber}`);
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error: any) {
    logger.error('Delete bill error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete bill' });
  }
};

export const getBillPayments = async (req: Request, res: Response) => {
  try {
    const payments = await BillPayment.find({ billId: req.params.id })
      .populate('createdBy', 'name email')
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: payments });
  } catch (error: any) {
    logger.error('Get payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBillsSummary = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    const query: any = accountId ? { accountId } : {};

    const summary = await Bill.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          balanceAmount: { $sum: '$balanceAmount' }
        }
      }
    ]);

    const overdue = await Bill.countDocuments({
      ...query,
      status: { $ne: 'paid' },
      dueDate: { $lt: new Date() }
    });

    res.json({ success: true, data: { summary, overdue } });
  } catch (error: any) {
    logger.error('Bills summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActivityTransactions = async (req: Request, res: Response) => {
  try {
    const { activity, startDate, endDate } = req.query;

    if (!activity || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const query: any = {
      date: { $gte: new Date(startDate as string), $lte: new Date(endDate as string) }
    };

    let accounts: any[] = [];
    
    if (activity === 'operating') {
      const revenueAccounts = await ChartOfAccount.find({ type: 'REVENUE', isActive: true });
      const expenseAccounts = await ChartOfAccount.find({ type: 'EXPENSE', isActive: true });
      accounts = [...revenueAccounts, ...expenseAccounts];
    } else if (activity === 'investing') {
      accounts = await ChartOfAccount.find({ type: 'ASSET', subType: 'fixed', isActive: true });
    } else if (activity === 'financing') {
      const liabilityAccounts = await ChartOfAccount.find({ type: 'LIABILITY', isActive: true });
      const equityAccounts = await ChartOfAccount.find({ type: 'EQUITY', isActive: true });
      accounts = [...liabilityAccounts, ...equityAccounts];
    }

    query.accountId = { $in: accounts.map(a => a._id) };

    const transactions = await Ledger.find(query)
      .populate('accountId', 'name code')
      .sort({ date: -1 })
      .limit(100);

    res.json({ success: true, data: transactions });
  } catch (error: any) {
    logger.error('Activity transactions error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch transactions' });
  }
};

export const getHistoricalCashFlow = async (req: Request, res: Response) => {
  try {
    const { periods = 6 } = req.query;
    const historicalData = [];
    const now = new Date();

    for (let i = Number(periods) - 1; i >= 0; i--) {
      const endDate = new Date(now.getFullYear(), now.getMonth() - i, 0);
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      const revenueAccounts = await ChartOfAccount.find({ type: 'REVENUE', isActive: true });
      const expenseAccounts = await ChartOfAccount.find({ type: 'EXPENSE', isActive: true });
      const fixedAssetAccounts = await ChartOfAccount.find({ type: 'ASSET', subType: 'fixed', isActive: true });
      const liabilityAccounts = await ChartOfAccount.find({ type: 'LIABILITY', isActive: true });
      const equityAccounts = await ChartOfAccount.find({ type: 'EQUITY', isActive: true });

      const dateQuery = { date: { $gte: startDate, $lte: endDate } };

      const revenueEntries = await Ledger.find({ ...dateQuery, accountId: { $in: revenueAccounts.map(a => a._id) } });
      const expenseEntries = await Ledger.find({ ...dateQuery, accountId: { $in: expenseAccounts.map(a => a._id) } });
      const investingEntries = await Ledger.find({ ...dateQuery, accountId: { $in: fixedAssetAccounts.map(a => a._id) } });
      const financingEntries = await Ledger.find({ ...dateQuery, accountId: { $in: [...liabilityAccounts.map(a => a._id), ...equityAccounts.map(a => a._id)] } });

      const operating = revenueEntries.reduce((sum, e) => sum + e.credit - e.debit, 0) - expenseEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      const investing = investingEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      const financing = financingEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);

      historicalData.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        operating,
        investing,
        financing,
        net: operating + investing + financing
      });
    }

    res.json({ success: true, data: historicalData });
  } catch (error: any) {
    logger.error('Historical cash flow error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch historical data' });
  }
};




