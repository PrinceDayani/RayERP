import { Request, Response } from 'express';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import Invoice from '../models/Invoice';
import Payment from '../models/Payment';
import Expense from '../models/Expense';

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;

    const revenueAccounts = await Account.find({ ...filter, type: 'revenue' });
    const expenseAccounts = await Account.find({ ...filter, type: 'expense' });

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: {
        revenue: { accounts: revenueAccounts, total: totalRevenue },
        expenses: { accounts: expenseAccounts, total: totalExpenses },
        netIncome,
        projectId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;

    const assets = await Account.find({ ...filter, type: 'asset' });
    const liabilities = await Account.find({ ...filter, type: 'liability' });
    const equity = await Account.find({ ...filter, type: 'equity' });

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      success: true,
      data: {
        assets: { accounts: assets, total: totalAssets },
        liabilities: { accounts: liabilities, total: totalLiabilities },
        equity: { accounts: equity, total: totalEquity },
        projectId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    const dateFilter: any = {
      createdAt: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    };
    if (projectId) dateFilter.projectId = projectId;

    const payments = await Payment.find({ ...dateFilter, status: 'completed' });
    const expenses = await Expense.find({ ...dateFilter, status: 'paid' });

    const cashInflows = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const cashOutflows = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netCashFlow = cashInflows - cashOutflows;

    res.json({
      success: true,
      data: {
        inflows: { payments, total: cashInflows },
        outflows: { expenses, total: cashOutflows },
        netCashFlow,
        projectId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;

    const totalInvoices = await Invoice.countDocuments(filter);
    const totalPayments = await Payment.countDocuments({ ...filter, status: 'completed' });
    const totalExpenses = await Expense.countDocuments(filter);
    const pendingInvoices = await Invoice.countDocuments({ ...filter, status: { $in: ['sent', 'overdue'] } });

    const totalRevenue = await Invoice.aggregate([
      { $match: { ...filter, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalExpenseAmount = await Expense.aggregate([
      { $match: { ...filter, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalInvoices,
        totalPayments,
        totalExpenses,
        pendingInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalExpenseAmount: totalExpenseAmount[0]?.total || 0,
        projectId
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};