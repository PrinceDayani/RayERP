import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { Ledger } from '../models/Ledger';
import { logger } from '../utils/logger';

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, costCenterId, compareYoY, compareQoQ, budgetComparison } = req.query;
    const query: any = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    if (costCenterId) query.costCenter = costCenterId;

    const revenueAccounts = await Account.find({ type: 'revenue', isActive: true });
    const expenseAccounts = await Account.find({ type: 'expense', isActive: true });

    const revenue = await Promise.all(revenueAccounts.map(async (acc) => {
      const entries = await Ledger.find({ accountId: acc._id, ...query });
      const total = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      return { accountId: acc._id, account: acc.name, code: acc.code, amount: total };
    }));

    const expenses = await Promise.all(expenseAccounts.map(async (acc) => {
      const entries = await Ledger.find({ accountId: acc._id, ...query });
      const total = entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      return { accountId: acc._id, account: acc.name, code: acc.code, amount: total };
    }));

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    const operatingMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    let comparison = null;
    if (compareYoY && startDate && endDate) {
      const prevYearStart = new Date(new Date(startDate as string).setFullYear(new Date(startDate as string).getFullYear() - 1));
      const prevYearEnd = new Date(new Date(endDate as string).setFullYear(new Date(endDate as string).getFullYear() - 1));
      const prevData = await getProfitLossData(prevYearStart.toISOString(), prevYearEnd.toISOString(), costCenterId as string);
      comparison = { type: 'YoY', previous: prevData, variance: netIncome - prevData.netIncome };
    }

    res.json({
      success: true,
      data: { revenue, expenses, totalRevenue, totalExpenses, netIncome, grossMargin, operatingMargin, comparison, period: { startDate, endDate } }
    });
  } catch (error: any) {
    logger.error('P&L error:', error);
    res.status(500).json({ success: false, message: 'Error generating P&L', error: error.message });
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const { asOfDate, compareDate } = req.query;
    const query: any = {};
    if (asOfDate) {
      query.date = { $lte: new Date(asOfDate as string) };
    }

    const assets = await Account.find({ type: 'asset', isActive: true });
    const liabilities = await Account.find({ type: 'liability', isActive: true });
    const equity = await Account.find({ type: 'equity', isActive: true });

    const assetBalances = await Promise.all(assets.map(async (acc) => {
      const entries = await Ledger.find({ accountId: acc._id, ...query });
      const balance = entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      return { accountId: acc._id, account: acc.name, code: acc.code, amount: balance };
    }));

    const liabilityBalances = await Promise.all(liabilities.map(async (acc) => {
      const entries = await Ledger.find({ accountId: acc._id, ...query });
      const balance = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      return { accountId: acc._id, account: acc.name, code: acc.code, amount: balance };
    }));

    const equityBalances = await Promise.all(equity.map(async (acc) => {
      const entries = await Ledger.find({ accountId: acc._id, ...query });
      const balance = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      return { accountId: acc._id, account: acc.name, code: acc.code, amount: balance };
    }));

    const totalAssets = assetBalances.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilityBalances.reduce((sum, l) => sum + l.amount, 0);
    const totalEquity = equityBalances.reduce((sum, e) => sum + e.amount, 0);

    // Calculate ratios
    const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    const workingCapital = totalAssets - totalLiabilities;

    let comparison = null;
    if (compareDate) {
      const compareQuery = { date: { $lte: new Date(compareDate as string) } };
      const compareAssets = await Promise.all(assets.map(async (acc) => {
        const entries = await Ledger.find({ accountId: acc._id, ...compareQuery });
        return entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      }));
      const compareLiabilities = await Promise.all(liabilities.map(async (acc) => {
        const entries = await Ledger.find({ accountId: acc._id, ...compareQuery });
        return entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      }));
      const compareEquity = await Promise.all(equity.map(async (acc) => {
        const entries = await Ledger.find({ accountId: acc._id, ...compareQuery });
        return entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      }));
      
      const compareTotalAssets = compareAssets.reduce((sum, a) => sum + a, 0);
      const compareTotalLiabilities = compareLiabilities.reduce((sum, l) => sum + l, 0);
      const compareTotalEquity = compareEquity.reduce((sum, e) => sum + e, 0);
      
      comparison = {
        totalAssets: compareTotalAssets,
        totalLiabilities: compareTotalLiabilities,
        totalEquity: compareTotalEquity,
        assetChange: totalAssets - compareTotalAssets,
        liabilityChange: totalLiabilities - compareTotalLiabilities,
        equityChange: totalEquity - compareTotalEquity
      };
    }

    res.json({
      success: true,
      data: { 
        assets: assetBalances, 
        liabilities: liabilityBalances, 
        equity: equityBalances, 
        totalAssets, 
        totalLiabilities, 
        totalEquity, 
        ratios: { currentRatio, debtToEquity, workingCapital },
        comparison,
        asOfDate 
      }
    });
  } catch (error: any) {
    logger.error('Balance Sheet error:', error);
    res.status(500).json({ success: false, message: 'Error generating Balance Sheet', error: error.message });
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    // Get opening balance
    const cashAccounts = await Account.find({ type: 'asset', subType: 'cash', isActive: true });
    const openingQuery = startDate ? { date: { $lt: new Date(startDate as string) } } : {};
    const openingEntries = await Ledger.find({ ...openingQuery, accountId: { $in: cashAccounts.map(a => a._id) } });
    const openingBalance = openingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

    // Operating Activities - Revenue and Expense accounts
    const revenueAccounts = await Account.find({ type: 'revenue', isActive: true });
    const expenseAccounts = await Account.find({ type: 'expense', isActive: true });
    
    const revenueEntries = await Ledger.find({ ...query, accountId: { $in: revenueAccounts.map(a => a._id) } });
    const expenseEntries = await Ledger.find({ ...query, accountId: { $in: expenseAccounts.map(a => a._id) } });
    
    const operatingInflows = revenueEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);
    const operatingOutflows = expenseEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);
    const operatingNet = operatingInflows - operatingOutflows;

    // Investing Activities - Fixed assets
    const fixedAssetAccounts = await Account.find({ type: 'asset', subType: 'fixed', isActive: true });
    const investingEntries = await Ledger.find({ ...query, accountId: { $in: fixedAssetAccounts.map(a => a._id) } });
    const investingNet = investingEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);

    // Financing Activities - Liabilities and Equity
    const liabilityAccounts = await Account.find({ type: 'liability', isActive: true });
    const equityAccounts = await Account.find({ type: 'equity', isActive: true });
    const financingEntries = await Ledger.find({ ...query, accountId: { $in: [...liabilityAccounts.map(a => a._id), ...equityAccounts.map(a => a._id)] } });
    const financingNet = financingEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);

    const netCashFlow = operatingNet + investingNet + financingNet;
    const closingBalance = openingBalance + netCashFlow;

    res.json({
      success: true,
      data: {
        openingBalance,
        operatingActivities: { 
          inflows: operatingInflows, 
          outflows: operatingOutflows, 
          net: operatingNet 
        },
        investingActivities: { 
          inflows: 0, 
          outflows: Math.abs(investingNet), 
          net: investingNet 
        },
        financingActivities: { 
          inflows: financingNet > 0 ? financingNet : 0, 
          outflows: financingNet < 0 ? Math.abs(financingNet) : 0, 
          net: financingNet 
        },
        netCashFlow,
        closingBalance,
        period: { startDate, endDate }
      }
    });
  } catch (error: any) {
    logger.error('Cash Flow error:', error);
    res.status(500).json({ success: false, message: 'Error generating Cash Flow', error: error.message });
  }
};

export const exportReport = async (req: Request, res: Response) => {
  try {
    const { reportType, format = 'csv', startDate, endDate, asOfDate } = req.query;

    let data: any;
    if (reportType === 'profit-loss') {
      const plRes = await getProfitLossData(startDate as string, endDate as string);
      data = plRes;
    } else if (reportType === 'balance-sheet') {
      const bsRes = await getBalanceSheetData(asOfDate as string || endDate as string);
      data = bsRes;
    } else if (reportType === 'cash-flow') {
      const cfRes = await getCashFlowData(startDate as string, endDate as string);
      data = cfRes;
    }

    if (format === 'csv') {
      const csv = generateCSV(data, reportType as string);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      const pdf = await generatePDF(data, reportType as string);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.pdf"`);
      res.send(pdf);
    } else {
      res.json({ success: true, data });
    }
  } catch (error: any) {
    logger.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Error exporting report', error: error.message });
  }
};

async function generatePDF(data: any, reportType: string): Promise<Buffer> {
  // Simple PDF generation without external libraries
  const content = JSON.stringify(data, null, 2);
  return Buffer.from(`PDF Report: ${reportType}\n\n${content}`);
}

async function getProfitLossData(startDate: string, endDate: string, costCenterId?: string) {
  const query: any = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (costCenterId) query.costCenter = costCenterId;

  const revenueAccounts = await Account.find({ type: 'revenue', isActive: true });
  const expenseAccounts = await Account.find({ type: 'expense', isActive: true });

  const revenue = await Promise.all(revenueAccounts.map(async (acc) => {
    const entries = await Ledger.find({ accountId: acc._id, ...query });
    const total = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
    return { account: acc.name, code: acc.code, amount: total };
  }));

  const expenses = await Promise.all(expenseAccounts.map(async (acc) => {
    const entries = await Ledger.find({ accountId: acc._id, ...query });
    const total = entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
    return { account: acc.name, code: acc.code, amount: total };
  }));

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return { revenue, expenses, totalRevenue, totalExpenses, netIncome };
}

async function getBalanceSheetData(asOfDate: string) {
  const query: any = {};
  if (asOfDate) {
    query.date = { $lte: new Date(asOfDate) };
  }

  const assets = await Account.find({ type: 'asset', isActive: true });
  const liabilities = await Account.find({ type: 'liability', isActive: true });
  const equity = await Account.find({ type: 'equity', isActive: true });

  const assetBalances = await Promise.all(assets.map(async (acc) => {
    const entries = await Ledger.find({ accountId: acc._id, ...query });
    const balance = entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
    return { account: acc.name, code: acc.code, amount: balance };
  }));

  const liabilityBalances = await Promise.all(liabilities.map(async (acc) => {
    const entries = await Ledger.find({ accountId: acc._id, ...query });
    const balance = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
    return { account: acc.name, code: acc.code, amount: balance };
  }));

  const equityBalances = await Promise.all(equity.map(async (acc) => {
    const entries = await Ledger.find({ accountId: acc._id, ...query });
    const balance = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);
    return { account: acc.name, code: acc.code, amount: balance };
  }));

  return { assets: assetBalances, liabilities: liabilityBalances, equity: equityBalances };
}

export const getAccountTransactions = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query: any = { accountId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    const transactions = await Ledger.find(query).sort({ date: -1 }).limit(100);
    const account = await Account.findById(accountId);
    
    res.json({ success: true, data: { account, transactions } });
  } catch (error: any) {
    logger.error('Account transactions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions', error: error.message });
  }
}

async function getCashFlowData(startDate: string, endDate: string) {
  return { operatingActivities: [], investingActivities: [], financingActivities: [] };
}

function generateCSV(data: any, reportType: string): string {
  let csv = '';
  if (reportType === 'profit-loss') {
    csv = 'Account,Code,Amount\n';
    csv += 'REVENUE\n';
    data.revenue.forEach((r: any) => {
      csv += `${r.account},${r.code},${r.amount}\n`;
    });
    csv += '\nEXPENSES\n';
    data.expenses.forEach((e: any) => {
      csv += `${e.account},${e.code},${e.amount}\n`;
    });
  } else if (reportType === 'balance-sheet') {
    csv = 'Account,Code,Amount\n';
    csv += 'ASSETS\n';
    data.assets.forEach((a: any) => {
      csv += `${a.account},${a.code},${a.amount}\n`;
    });
    csv += '\nLIABILITIES\n';
    data.liabilities.forEach((l: any) => {
      csv += `${l.account},${l.code},${l.amount}\n`;
    });
  }
  return csv;
}

export const getComparativeReport = async (req: Request, res: Response) => {
  try {
    const { reportType, period1Start, period1End, period2Start, period2End } = req.query;

    const period1Data = await getProfitLossData(period1Start as string, period1End as string);
    const period2Data = await getProfitLossData(period2Start as string, period2End as string);

    const comparison = {
      period1: period1Data,
      period2: period2Data,
      variance: {
        revenue: period1Data.totalRevenue - period2Data.totalRevenue,
        expenses: period1Data.totalExpenses - period2Data.totalExpenses,
        netIncome: period1Data.netIncome - period2Data.netIncome,
        revenuePercent: period2Data.totalRevenue > 0 ? ((period1Data.totalRevenue - period2Data.totalRevenue) / period2Data.totalRevenue) * 100 : 0,
        expensesPercent: period2Data.totalExpenses > 0 ? ((period1Data.totalExpenses - period2Data.totalExpenses) / period2Data.totalExpenses) * 100 : 0
      }
    };

    res.json({ success: true, data: comparison });
  } catch (error: any) {
    logger.error('Comparative report error:', error);
    res.status(500).json({ success: false, message: 'Error generating comparative report', error: error.message });
  }
};

export const getMultiPeriodPL = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, periodType = 'monthly' } = req.query;
    const periods = [];
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    let current = new Date(start);
    while (current <= end) {
      const periodEnd = periodType === 'monthly' ? new Date(current.getFullYear(), current.getMonth() + 1, 0) :
                        periodType === 'quarterly' ? new Date(current.getFullYear(), current.getMonth() + 3, 0) :
                        new Date(current.getFullYear(), 11, 31);
      
      const data = await getProfitLossData(current.toISOString(), periodEnd.toISOString());
      periods.push({ period: current.toISOString().split('T')[0], ...data });
      
      current = periodType === 'monthly' ? new Date(current.getFullYear(), current.getMonth() + 1, 1) :
                periodType === 'quarterly' ? new Date(current.getFullYear(), current.getMonth() + 3, 1) :
                new Date(current.getFullYear() + 1, 0, 1);
    }
    
    res.json({ success: true, data: periods });
  } catch (error: any) {
    logger.error('Multi-period P&L error:', error);
    res.status(500).json({ success: false, message: 'Error generating multi-period P&L', error: error.message });
  }
};

export const getPLForecast = async (req: Request, res: Response) => {
  try {
    const { months = 3 } = req.query;
    const historicalData = await getProfitLossData(
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );
    
    const avgMonthlyRevenue = historicalData.totalRevenue / 12;
    const avgMonthlyExpenses = historicalData.totalExpenses / 12;
    const growthRate = 1.05;
    
    const forecast = [];
    for (let i = 1; i <= Number(months); i++) {
      forecast.push({
        month: i,
        revenue: avgMonthlyRevenue * Math.pow(growthRate, i),
        expenses: avgMonthlyExpenses * Math.pow(growthRate, i),
        netIncome: (avgMonthlyRevenue - avgMonthlyExpenses) * Math.pow(growthRate, i)
      });
    }
    
    res.json({ success: true, data: { historical: historicalData, forecast } });
  } catch (error: any) {
    logger.error('P&L forecast error:', error);
    res.status(500).json({ success: false, message: 'Error generating forecast', error: error.message });
  }
};
