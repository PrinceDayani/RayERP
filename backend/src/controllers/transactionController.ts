import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import Account  from '../models/ChartOfAccount';

export const createTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries) || entries.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 entries required' });
    }
    
    // Validate double-entry bookkeeping
    const totalDebits = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ success: false, message: 'Debits must equal credits' });
    }

    const transaction = new Transaction({
      ...req.body,
      totalAmount: totalDebits,
      createdBy: req.user.id
    });
    
    await transaction.save();
    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, projectId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;

    const transactions = await Transaction.find(filter)
      .populate('entries.accountId', 'name code')
      .populate('projectId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: transactions,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('entries.accountId', 'name code')
      .populate('projectId', 'name')
      .populate('createdBy', 'name');
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    res.json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const postTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Update account balances
    for (const entry of transaction.entries) {
      const account = await Account.findById(entry.accountId);
      if (account) {
        if (['asset', 'expense'].includes(account.type)) {
          account.balance += entry.debit - entry.credit;
        } else {
          account.balance += entry.credit - entry.debit;
        }
        await account.save();
      }
    }

    transaction.status = 'posted';
    await transaction.save();
    
    res.json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
