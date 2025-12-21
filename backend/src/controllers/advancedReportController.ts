import { Request, Response } from 'express';
import ChartOfAccount from '../models/ChartOfAccount';
import JournalEntry from '../models/JournalEntry';
import { Voucher } from '../models/Voucher';
import { logger } from '../utils/logger';

export const getAdvancedProfitLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, comparative } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const revenueAccounts = await ChartOfAccount.find({ type: 'REVENUE', isActive: true });
    const expenseAccounts = await ChartOfAccount.find({ type: 'EXPENSE', isActive: true });

    const revenue = revenueAccounts.map(a => ({
      code: a.code,
      name: a.name,
      amount: a.balance,
      percentage: 0
    }));

    const expenses = expenseAccounts.map(a => ({
      code: a.code,
      name: a.name,
      amount: a.balance,
      percentage: 0
    }));

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalRevenue - totalExpenses;

    revenue.forEach(r => r.percentage = totalRevenue > 0 ? (r.amount / totalRevenue) * 100 : 0);
    expenses.forEach(e => e.percentage = totalRevenue > 0 ? (e.amount / totalRevenue) * 100 : 0);

    res.json({
      period: { startDate, endDate },
      revenue: { items: revenue, total: totalRevenue },
      expenses: { items: expenses, total: totalExpenses },
      grossProfit,
      netProfit: grossProfit,
      profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    });
  } catch (error) {
    logger.error('Advanced P&L error:', error);
    res.status(500).json({ message: 'Error generating P&L report' });
  }
};

export const getAdvancedBalanceSheet = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const date = new Date(asOfDate as string || Date.now());

    const assets = await ChartOfAccount.find({ type: 'ASSET', isActive: true });
    const liabilities = await ChartOfAccount.find({ type: 'LIABILITY', isActive: true });
    const equity = await ChartOfAccount.find({ type: 'EQUITY', isActive: true });

    const assetItems = assets.map(a => ({ code: a.code, name: a.name, amount: a.balance }));
    const liabilityItems = liabilities.map(a => ({ code: a.code, name: a.name, amount: a.balance }));
    const equityItems = equity.map(a => ({ code: a.code, name: a.name, amount: a.balance }));

    const totalAssets = assetItems.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilityItems.reduce((sum, l) => sum + l.amount, 0);
    const totalEquity = equityItems.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      asOfDate: date,
      assets: { items: assetItems, total: totalAssets },
      liabilities: { items: liabilityItems, total: totalLiabilities },
      equity: { items: equityItems, total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    });
  } catch (error) {
    logger.error('Advanced Balance Sheet error:', error);
    res.status(500).json({ message: 'Error generating balance sheet' });
  }
};

export const getCashFlowStatement = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const cashAccounts = await ChartOfAccount.find({ 
      $or: [{ subType: 'cash' }, { name: /cash|bank/i }],
      isActive: true 
    });

    const entries = await JournalEntry.find({
      date: { $gte: start, $lte: end },
      isPosted: true
    }).populate('lines.accountId');

    let operating = 0, investing = 0, financing = 0;

    entries.forEach(entry => {
      entry.lines.forEach(line => {
        const account = line.accountId as any;
        const amount = line.debit - line.credit;
        
        if (account?.type === 'REVENUE' || account?.type === 'EXPENSE') {
          operating += amount;
        } else if (account?.subType === 'fixed-asset') {
          investing += amount;
        } else if (account?.type === 'LIABILITY' || account?.type === 'EQUITY') {
          financing += amount;
        }
      });
    });

    const netCashFlow = operating + investing + financing;
    const openingCash = cashAccounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0);
    const closingCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

    res.json({
      period: { startDate, endDate },
      operating: { amount: operating, percentage: netCashFlow ? (operating / netCashFlow) * 100 : 0 },
      investing: { amount: investing, percentage: netCashFlow ? (investing / netCashFlow) * 100 : 0 },
      financing: { amount: financing, percentage: netCashFlow ? (financing / netCashFlow) * 100 : 0 },
      netCashFlow,
      openingCash,
      closingCash
    });
  } catch (error) {
    logger.error('Cash flow error:', error);
    res.status(500).json({ message: 'Error generating cash flow statement' });
  }
};

export const getVoucherRegister = async (req: Request, res: Response) => {
  try {
    const { voucherType, startDate, endDate } = req.query;
    const query: any = {};
    
    if (voucherType) query.voucherType = voucherType;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const vouchers = await Voucher.find(query)
      .populate('lines.accountId', 'code name')
      .sort({ date: -1 });

    const summary = {
      total: vouchers.length,
      posted: vouchers.filter(v => v.isPosted).length,
      draft: vouchers.filter(v => !v.isPosted).length,
      totalAmount: vouchers.reduce((sum, v) => sum + v.totalAmount, 0)
    };

    res.json({ vouchers, summary });
  } catch (error) {
    logger.error('Voucher register error:', error);
    res.status(500).json({ message: 'Error generating voucher register' });
  }
};



