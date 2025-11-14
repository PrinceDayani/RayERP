import { Request, Response } from 'express';
import { Account } from '../models/Account';
import { Ledger } from '../models/Ledger';
import { logger } from '../utils/logger';

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

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

    res.json({
      success: true,
      data: { revenue, expenses, totalRevenue, totalExpenses, netIncome, period: { startDate, endDate } }
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

async function getProfitLossData(startDate: string, endDate: string) {
  const query: any = {};
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

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

  return { revenue, expenses };
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
      variance: calculateVariance(period1Data, period2Data)
    };

    res.json({ success: true, data: comparison });
  } catch (error: any) {
    logger.error('Comparative report error:', error);
    res.status(500).json({ success: false, message: 'Error generating comparative report', error: error.message });
  }
};

function calculateVariance(period1: any, period2: any) {
  return { message: 'Variance calculation' };
}
