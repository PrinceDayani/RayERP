import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { AccountGroup } from '../models/AccountGroup';
import { AccountSubGroup } from '../models/AccountSubGroup';
import { AccountLedger } from '../models/AccountLedger';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { Transaction } from '../models/Transaction';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// Accounts
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const account = new Account({ ...req.body, createdBy: req.user?.id });
    await account.save();
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    await Account.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Journal Entries
export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const entries = await JournalEntry.find()
      .populate('lines.account', 'name code')
      .sort({ entryDate: -1 })
      .limit(Number(limit));
    res.json({ success: true, data: entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJournalEntry = async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findById(req.params.id)
      .populate('lines.account', 'name code');
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJournalEntry = async (req: Request, res: Response) => {
  try {
    const entry = new JournalEntry({ ...req.body, createdBy: req.user?.id });
    await entry.save();
    res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateJournalEntry = async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteJournalEntry = async (req: Request, res: Response) => {
  try {
    await JournalEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Journal entry deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const postJournalEntry = async (req: Request, res: Response) => {
  try {
    const entry = await JournalEntry.findByIdAndUpdate(
      req.params.id, 
      { status: 'POSTED', isPosted: true, postingDate: new Date() }, 
      { new: true }
    );
    res.json({ success: true, data: entry });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reports
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
    const trialBalance = accounts.map(account => ({
      code: account.code,
      name: account.name,
      debit: account.balance >= 0 ? account.balance : 0,
      credit: account.balance < 0 ? Math.abs(account.balance) : 0
    }));
    res.json({ success: true, data: trialBalance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await Ledger.find({ accountId: req.params.accountId })
      .sort({ date: -1 })
      .limit(100);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFinancialReports = async (req: Request, res: Response) => {
  try {
    const { reportType } = req.query;
    
    if (reportType === 'profit-loss') {
      const revenue = await Account.find({ type: 'revenue', isActive: true });
      const expenses = await Account.find({ type: 'expense', isActive: true });
      
      const totalRevenue = revenue.reduce((sum, acc) => sum + acc.balance, 0);
      const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
      
      res.json({
        success: true,
        data: {
          revenue: { accounts: revenue, total: totalRevenue },
          expenses: { accounts: expenses, total: totalExpenses },
          netIncome: totalRevenue - totalExpenses
        }
      });
    } else {
      res.json({ success: true, data: { message: 'Report type not implemented' } });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Groups
export const getGroups = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const getGroupById = async (req: Request, res: Response) => {
  res.json({ success: true, data: null });
};

export const createGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteGroup = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Group deleted' });
};

// Sub-Groups
export const getSubGroups = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const getSubGroupById = async (req: Request, res: Response) => {
  res.json({ success: true, data: null });
};

export const createSubGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateSubGroup = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteSubGroup = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Sub-group deleted' });
};

// Ledgers
export const getLedgers = async (req: Request, res: Response) => {
  try {
    const { accountId, search } = req.query;
    const filter: any = { isActive: true };
    if (accountId) filter.accountId = accountId;
    if (search) filter.name = { $regex: search, $options: 'i' };
    
    const ledgers = await AccountLedger.find(filter)
      .populate({ path: 'accountId', populate: { path: 'subGroupId' } })
      .sort({ code: 1 });
    res.json(ledgers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLedgerById = async (req: Request, res: Response) => {
  res.json({ success: true, data: null });
};

export const createLedger = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateLedger = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteLedger = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Ledger deleted' });
};

export const getAccountHierarchy = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const createTransactionJournal = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

// Additional functions
export const getVouchersByType = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const getCurrencies = async (req: Request, res: Response) => {
  res.json({ success: true, data: [{ code: 'INR', name: 'Indian Rupee', rate: 1 }] });
};

export const createCurrency = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateCurrency = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteCurrency = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Currency deleted' });
};

export const getExchangeRate = async (req: Request, res: Response) => {
  res.json({ success: true, data: { rate: 1 } });
};

export const updateExchangeRate = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const getCostCenters = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const createCostCenter = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateCostCenter = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteCostCenter = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Cost center deleted' });
};

export const getCostCenterReport = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getBillDetails = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const createBillDetail = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateBillDetail = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteBillDetail = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Bill detail deleted' });
};

export const updateBillPayment = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const getBillStatement = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const calculateInterest = async (req: Request, res: Response) => {
  res.json({ success: true, data: { interest: 0 } });
};

export const postInterestEntry = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Interest entry posted' });
};

export const getInterestReport = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getGLBudgets = async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};

export const createGLBudget = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const updateGLBudget = async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
};

export const deleteGLBudget = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'GL Budget deleted' });
};

export const getBudgetVarianceReport = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};

export const getAccountBudgetStatus = async (req: Request, res: Response) => {
  res.json({ success: true, data: {} });
};