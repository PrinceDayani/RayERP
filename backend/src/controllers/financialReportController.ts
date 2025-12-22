import { Request, Response } from 'express';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import AccountNote from '../models/AccountNote';
import { generateBalanceSheetPDF, generateExcelBuffer } from '../utils/pdfGenerator';

// Cache for financial reports (5 minutes TTL)
const reportCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const getCacheKey = (prefix: string, params: any) => `${prefix}:${JSON.stringify(params)}`;

const getFromCache = (key: string) => {
  const cached = reportCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  reportCache.delete(key);
  return null;
};

const setCache = (key: string, data: any) => {
  reportCache.set(key, { data, timestamp: Date.now() });
  if (reportCache.size > 100) {
    const firstKey = reportCache.keys().next().value;
    reportCache.delete(firstKey);
  }
};

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, costCenterId, compareYoY, compareQoQ, budgetComparison, departmentId, includeBudget, includeTransactions } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    // Check cache
    const cacheKey = getCacheKey('pl', { startDate, endDate, costCenterId });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Build aggregation pipeline for optimized query
    const matchStage: any = {
      date: { $gte: start, $lte: end }
    };
    if (costCenterId) matchStage.costCenter = new mongoose.Types.ObjectId(costCenterId as string);
    if (departmentId) matchStage.department = new mongoose.Types.ObjectId(departmentId as string);

    // Get all account balances using aggregation (single query) - FIXED
    const accountBalances = await Ledger.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$accountId',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      },
      {
        $lookup: {
          from: 'chartofaccounts',
          localField: '_id',
          foreignField: '_id',
          as: 'account'
        }
      },
      { $unwind: '$account' },
      {
        $match: {
          'account.isActive': true
        }
      },
      {
        $project: {
          accountId: '$_id',
          name: '$account.name',
          code: '$account.code',
          type: '$account.type',
          subType: '$account.subType',
          category: '$account.category',
          totalDebit: 1,
          totalCredit: 1,
          balance: {
            $cond: [
              { $in: ['$account.type', ['REVENUE', 'LIABILITY', 'EQUITY']] },
              { $subtract: ['$totalCredit', '$totalDebit'] },
              { $subtract: ['$totalDebit', '$totalCredit'] }
            ]
          }
        }
      }
    ]);

    // Categorize accounts
    const revenue = accountBalances.filter(a => a.type === 'REVENUE');
    const expenses = accountBalances.filter(a => a.type === 'EXPENSE');

    // Group revenue by category
    const revenueByCategory = revenue.reduce((acc: any, item) => {
      const cat = item.category || item.subType || 'Other Revenue';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ accountId: item.accountId, account: item.name, code: item.code, amount: item.balance });
      return acc;
    }, {});

    // Separate COGS and Operating Expenses
    const cogs = expenses.filter(e => 
      e.subType === 'cogs' || 
      e.category === 'Cost of Goods Sold' ||
      e.category === 'COGS' ||
      ['direct materials', 'direct labor', 'manufacturing'].some(k => e.name.toLowerCase().includes(k))
    );

    const operatingExpenses = expenses.filter(e => !cogs.find(c => c.accountId.equals(e.accountId)));

    // Further categorize operating expenses
    const depreciation = operatingExpenses.filter(e => 
      e.subType === 'depreciation' ||
      e.category === 'Depreciation' ||
      ['depreciation', 'amortization'].some(k => e.name.toLowerCase().includes(k))
    );

    const interestExpense = operatingExpenses.filter(e => 
      e.subType === 'interest' ||
      e.category === 'Interest' ||
      e.name.toLowerCase().includes('interest')
    );

    const taxExpense = operatingExpenses.filter(e => 
      e.subType === 'tax' ||
      e.category === 'Tax' ||
      ['tax', 'income tax', 'gst'].some(k => e.name.toLowerCase().includes(k))
    );

    const otherOperating = operatingExpenses.filter(e => 
      !depreciation.find(d => d.accountId.equals(e.accountId)) &&
      !interestExpense.find(i => i.accountId.equals(e.accountId)) &&
      !taxExpense.find(t => t.accountId.equals(e.accountId))
    );

    // Group operating expenses by category
    const operatingByCategory = otherOperating.reduce((acc: any, item) => {
      const cat = item.category || item.subType || 'Other Operating Expenses';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ accountId: item.accountId, account: item.name, code: item.code, amount: item.balance });
      return acc;
    }, {});

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0);
    const totalCOGS = cogs.reduce((sum, c) => sum + c.balance, 0);
    const grossProfit = totalRevenue - totalCOGS;
    
    const totalOperatingExpenses = otherOperating.reduce((sum, e) => sum + e.balance, 0);
    const totalDepreciation = depreciation.reduce((sum, d) => sum + d.balance, 0);
    const ebitda = grossProfit - totalOperatingExpenses;
    const ebit = ebitda - totalDepreciation;
    
    const totalInterest = interestExpense.reduce((sum, i) => sum + i.balance, 0);
    const ebt = ebit - totalInterest;
    
    const totalTax = taxExpense.reduce((sum, t) => sum + t.balance, 0);
    const netIncome = ebt - totalTax;

    // Calculate margins and ratios
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
    const operatingMargin = totalRevenue > 0 ? (ebit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    // Comparison logic
    let comparison = null;
    if (compareYoY && startDate && endDate) {
      const prevYearStart = new Date(start);
      prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
      const prevYearEnd = new Date(end);
      prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);
      const prevData = await getProfitLossData(prevYearStart.toISOString(), prevYearEnd.toISOString());
      comparison = { 
        type: 'YoY', 
        previous: prevData, 
        variance: {
          revenue: totalRevenue - prevData.totalRevenue,
          grossProfit: grossProfit - prevData.grossProfit,
          ebitda: ebitda - prevData.ebitda,
          netIncome: netIncome - prevData.netIncome,
          revenuePercent: prevData.totalRevenue > 0 ? ((totalRevenue - prevData.totalRevenue) / prevData.totalRevenue) * 100 : 0,
          netIncomePercent: prevData.netIncome > 0 ? ((netIncome - prevData.netIncome) / prevData.netIncome) * 100 : 0
        }
      };
    }

    // Add transaction details if requested
    const addTransactionDetails = async (items: any[]) => {
      if (includeTransactions !== 'true') return items;
      return Promise.all(items.map(async (item) => {
        const transactions = await Ledger.find({ 
          accountId: item.accountId, 
          date: { $gte: start, $lte: end } 
        }).select('_id date description debit credit reference').limit(100);
        return { ...item, transactions, transactionCount: transactions.length };
      }));
    };

    // Budget comparison if requested
    let budgetData = null;
    if (includeBudget === 'true') {
      const Budget = mongoose.model('Budget');
      const budgets = await Budget.find({
        startDate: { $lte: end },
        endDate: { $gte: start },
        isActive: true
      });
      
      const budgetRevenue = budgets.filter((b: any) => b.type === 'REVENUE')
        .reduce((sum: number, b: any) => sum + b.amount, 0);
      const budgetExpenses = budgets.filter((b: any) => b.type === 'EXPENSE')
        .reduce((sum: number, b: any) => sum + b.amount, 0);
      
      budgetData = {
        revenue: budgetRevenue,
        expenses: budgetExpenses,
        netIncome: budgetRevenue - budgetExpenses,
        variance: {
          revenue: totalRevenue - budgetRevenue,
          revenuePercent: budgetRevenue > 0 ? ((totalRevenue - budgetRevenue) / budgetRevenue) * 100 : 0,
          netIncome: netIncome - (budgetRevenue - budgetExpenses),
          netIncomePercent: (budgetRevenue - budgetExpenses) > 0 ? 
            ((netIncome - (budgetRevenue - budgetExpenses)) / (budgetRevenue - budgetExpenses)) * 100 : 0
        }
      };
    }

    // FIXED: Map items to accounts for frontend compatibility
    const result = {
      revenue: {
        byCategory: revenueByCategory,
        accounts: await addTransactionDetails(revenue.map(r => ({ _id: r.accountId, name: r.name, code: r.code, balance: r.balance }))),
        total: totalRevenue
      },
      cogs: {
        accounts: cogs.map(c => ({ _id: c.accountId, name: c.name, code: c.code, balance: c.balance })),
        total: totalCOGS
      },
      grossProfit,
      expenses: {
        byCategory: operatingByCategory,
        accounts: otherOperating.map(e => ({ _id: e.accountId, name: e.name, code: e.code, balance: e.balance })),
        total: totalOperatingExpenses
      },
      ebitda,
      depreciation: {
        accounts: depreciation.map(d => ({ _id: d.accountId, name: d.name, code: d.code, balance: d.balance })),
        total: totalDepreciation
      },
      ebit,
      interestExpense: {
        accounts: interestExpense.map(i => ({ _id: i.accountId, name: i.name, code: i.code, balance: i.balance })),
        total: totalInterest
      },
      ebt,
      taxExpense: {
        accounts: taxExpense.map(t => ({ _id: t.accountId, name: t.name, code: t.code, balance: t.balance })),
        total: totalTax
      },
      netIncome,
      margins: {
        gross: Math.round(grossMargin * 100) / 100,
        ebitda: Math.round(ebitdaMargin * 100) / 100,
        operating: Math.round(operatingMargin * 100) / 100,
        net: Math.round(netMargin * 100) / 100
      },
      comparison,
      budget: budgetData,
      period: { startDate, endDate },
      reportType: 'profit-loss',
      filters: { costCenterId, departmentId }
    };

    setCache(cacheKey, result);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('P&L error:', error);
    res.status(500).json({ success: false, message: 'Error generating P&L', error: error.message });
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const { asOfDate, compareDate, includeBudget, includeNotes, companyIds, accountCodeFrom, accountCodeTo } = req.query;
    const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

    // Check cache
    const cacheKey = getCacheKey('bs', { asOfDate, compareDate, companyIds, accountCodeFrom, accountCodeTo });
    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    // Multi-company consolidation
    const companyFilter = companyIds ? { companyId: { $in: (companyIds as string).split(',') } } : {};
    
    // Account code range filter
    const accountCodeFilter: any = {};
    if (accountCodeFrom) accountCodeFilter.$gte = accountCodeFrom;
    if (accountCodeTo) accountCodeFilter.$lte = accountCodeTo;

    // Single aggregation query for current period
    const accountBalances = await Ledger.aggregate([
      { $match: { date: { $lte: asOf }, ...companyFilter } },
      {
        $group: {
          _id: '$accountId',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      },
      {
        $lookup: {
          from: 'chartofaccounts',
          localField: '_id',
          foreignField: '_id',
          as: 'account'
        }
      },
      { $unwind: '$account' },
      { 
        $match: { 
          'account.isActive': true,
          ...(accountCodeFrom || accountCodeTo ? { 'account.code': accountCodeFilter } : {})
        } 
      },
      {
        $project: {
          accountId: '$_id',
          name: '$account.name',
          code: '$account.code',
          type: '$account.type',
          subType: '$account.subType',
          category: '$account.category',
          parentId: '$account.parentId',
          balance: {
            $cond: [
              { $eq: ['$account.type', 'ASSET'] },
              { $subtract: ['$totalDebit', '$totalCredit'] },
              { $subtract: ['$totalCredit', '$totalDebit'] }
            ]
          }
        }
      }
    ]);

    // Categorize accounts
    const assets = accountBalances.filter(a => a.type === 'ASSET');
    const liabilities = accountBalances.filter(a => a.type === 'LIABILITY');
    const equity = accountBalances.filter(a => a.type === 'EQUITY');

    // Classify assets
    const currentAssets = assets.filter(a => ['cash', 'bank', 'receivable', 'inventory', 'prepaid'].includes(a.subType) || a.category === 'Current Assets');
    const nonCurrentAssets = assets.filter(a => !currentAssets.find(c => c.accountId.equals(a.accountId)));
    const fixedAssets = nonCurrentAssets.filter(a => a.subType === 'fixed' || a.category === 'Fixed Assets');
    const intangibleAssets = nonCurrentAssets.filter(a => a.subType === 'intangible' || a.category === 'Intangible Assets');
    const otherAssets = nonCurrentAssets.filter(a => !fixedAssets.find(f => f.accountId.equals(a.accountId)) && !intangibleAssets.find(i => i.accountId.equals(a.accountId)));

    // Classify liabilities
    const currentLiabilities = liabilities.filter(a => ['payable', 'accrued', 'short-term'].includes(a.subType) || a.category === 'Current Liabilities');
    const longTermLiabilities = liabilities.filter(a => !currentLiabilities.find(c => c.accountId.equals(a.accountId)));

    // Classify equity
    const shareCapital = equity.filter(a => a.subType === 'capital' || a.category === 'Share Capital' || a.name.toLowerCase().includes('capital'));
    const retainedEarnings = equity.filter(a => a.subType === 'retained' || a.category === 'Retained Earnings' || a.name.toLowerCase().includes('retained'));
    const reserves = equity.filter(a => a.subType === 'reserve' || a.category === 'Reserves' || a.name.toLowerCase().includes('reserve'));
    const otherEquity = equity.filter(a => !shareCapital.find(s => s.accountId.equals(a.accountId)) && !retainedEarnings.find(r => r.accountId.equals(a.accountId)) && !reserves.find(r => r.accountId.equals(a.accountId)));

    // Calculate totals
    const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
    const totalCurrentLiabilities = currentLiabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalLongTermLiabilities = longTermLiabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0);

    // Enhanced ratios
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const quickAssets = currentAssets.filter(a => a.subType !== 'inventory').reduce((sum, a) => sum + a.balance, 0);
    const quickRatio = totalCurrentLiabilities > 0 ? quickAssets / totalCurrentLiabilities : 0;
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
    const equityRatio = totalAssets > 0 ? totalEquity / totalAssets : 0;
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const assetTurnover = totalAssets > 0 ? 1 : 0; // Placeholder, needs revenue data

    // Comparison logic
    let comparison = null;
    if (compareDate) {
      const compareBalances = await Ledger.aggregate([
        { $match: { date: { $lte: new Date(compareDate as string) } } },
        { $group: { _id: '$accountId', totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } },
        { $lookup: { from: 'chartofaccounts', localField: '_id', foreignField: '_id', as: 'account' } },
        { $unwind: '$account' },
        { $match: { 'account.isActive': true } },
        {
          $project: {
            accountId: '$_id',
            type: '$account.type',
            subType: '$account.subType',
            balance: {
              $cond: [
                { $eq: ['$account.type', 'ASSET'] },
                { $subtract: ['$totalDebit', '$totalCredit'] },
                { $subtract: ['$totalCredit', '$totalDebit'] }
              ]
            }
          }
        }
      ]);

      const compareAssets = compareBalances.filter(a => a.type === 'ASSET');
      const compareLiabilities = compareBalances.filter(a => a.type === 'LIABILITY');
      const compareEquity = compareBalances.filter(a => a.type === 'EQUITY');
      const compareTotalAssets = compareAssets.reduce((sum, a) => sum + a.balance, 0);
      const compareTotalLiabilities = compareLiabilities.reduce((sum, l) => sum + l.balance, 0);
      const compareTotalEquity = compareEquity.reduce((sum, e) => sum + e.balance, 0);

      // Account-level comparison
      const assetComparison = assets.map(a => {
        const prev = compareAssets.find(c => c.accountId.equals(a.accountId));
        return { accountId: a.accountId, current: a.balance, previous: prev?.balance || 0, change: a.balance - (prev?.balance || 0) };
      });
      const liabilityComparison = liabilities.map(l => {
        const prev = compareLiabilities.find(c => c.accountId.equals(l.accountId));
        return { accountId: l.accountId, current: l.balance, previous: prev?.balance || 0, change: l.balance - (prev?.balance || 0) };
      });
      const equityComparison = equity.map(e => {
        const prev = compareEquity.find(c => c.accountId.equals(e.accountId));
        return { accountId: e.accountId, current: e.balance, previous: prev?.balance || 0, change: e.balance - (prev?.balance || 0) };
      });

      comparison = {
        totalAssets: compareTotalAssets,
        totalLiabilities: compareTotalLiabilities,
        totalEquity: compareTotalEquity,
        assetChange: totalAssets - compareTotalAssets,
        liabilityChange: totalLiabilities - compareTotalLiabilities,
        equityChange: totalEquity - compareTotalEquity,
        assetChangePercent: compareTotalAssets > 0 ? ((totalAssets - compareTotalAssets) / compareTotalAssets) * 100 : 0,
        liabilityChangePercent: compareTotalLiabilities > 0 ? ((totalLiabilities - compareTotalLiabilities) / compareTotalLiabilities) * 100 : 0,
        equityChangePercent: compareTotalEquity > 0 ? ((totalEquity - compareTotalEquity) / compareTotalEquity) * 100 : 0,
        accounts: { assets: assetComparison, liabilities: liabilityComparison, equity: equityComparison }
      };
    }

    // Budget comparison
    let budgetData = null;
    if (includeBudget === 'true') {
      try {
        const Budget = mongoose.model('Budget');
        const budgets = await Budget.find({ isActive: true });
        const budgetAssets = budgets.filter((b: any) => b.accountType === 'ASSET').reduce((sum: number, b: any) => sum + b.amount, 0);
        const budgetLiabilities = budgets.filter((b: any) => b.accountType === 'LIABILITY').reduce((sum: number, b: any) => sum + b.amount, 0);
        const budgetEquity = budgets.filter((b: any) => b.accountType === 'EQUITY').reduce((sum: number, b: any) => sum + b.amount, 0);
        budgetData = {
          assets: budgetAssets,
          liabilities: budgetLiabilities,
          equity: budgetEquity,
          variance: {
            assets: totalAssets - budgetAssets,
            liabilities: totalLiabilities - budgetLiabilities,
            equity: totalEquity - budgetEquity
          }
        };
      } catch (e) {
        logger.warn('Budget model not available');
      }
    }

    // Common-size analysis
    const commonSize = {
      assets: assets.map(a => ({ ...a, percentage: totalAssets > 0 ? (a.balance / totalAssets) * 100 : 0 })),
      liabilities: liabilities.map(l => ({ ...l, percentage: totalAssets > 0 ? (l.balance / totalAssets) * 100 : 0 })),
      equity: equity.map(e => ({ ...e, percentage: totalAssets > 0 ? (e.balance / totalAssets) * 100 : 0 }))
    };

    // Get notes if requested
    let notes = null;
    if (includeNotes === 'true') {
      const accountIds = [...assets, ...liabilities, ...equity].map(a => a.accountId);
      const accountNotes = await AccountNote.find({ accountId: { $in: accountIds } }).populate('createdBy', 'name');
      notes = accountNotes.reduce((acc: any, note: any) => {
        if (!acc[note.accountId.toString()]) acc[note.accountId.toString()] = [];
        acc[note.accountId.toString()].push(note);
        return acc;
      }, {});
    }

    // ROE & ROA calculations
    let profitabilityRatios = null;
    try {
      const plData = await getProfitLossData(
        new Date(asOf.getFullYear(), 0, 1).toISOString(),
        asOf.toISOString()
      );
      profitabilityRatios = {
        roe: totalEquity > 0 ? (plData.netIncome / totalEquity) * 100 : 0,
        roa: totalAssets > 0 ? (plData.netIncome / totalAssets) * 100 : 0,
        netIncome: plData.netIncome
      };
    } catch (e) {
      logger.warn('Could not calculate ROE/ROA');
    }

    // AI-powered insights
    const insights = generateInsights({
      totalAssets,
      totalLiabilities,
      totalEquity,
      ratios: {
        currentRatio,
        quickRatio,
        debtToEquity,
        equityRatio
      },
      comparison
    });

    const result = {
      assets: {
        current: currentAssets.map(a => ({ accountId: a.accountId, account: a.name, code: a.code, amount: a.balance, parentId: a.parentId })),
        nonCurrent: {
          fixed: fixedAssets.map(a => ({ accountId: a.accountId, account: a.name, code: a.code, amount: a.balance, parentId: a.parentId })),
          intangible: intangibleAssets.map(a => ({ accountId: a.accountId, account: a.name, code: a.code, amount: a.balance, parentId: a.parentId })),
          other: otherAssets.map(a => ({ accountId: a.accountId, account: a.name, code: a.code, amount: a.balance, parentId: a.parentId }))
        },
        totalCurrent: totalCurrentAssets,
        totalNonCurrent: totalNonCurrentAssets,
        total: totalAssets
      },
      liabilities: {
        current: currentLiabilities.map(l => ({ accountId: l.accountId, account: l.name, code: l.code, amount: l.balance, parentId: l.parentId })),
        longTerm: longTermLiabilities.map(l => ({ accountId: l.accountId, account: l.name, code: l.code, amount: l.balance, parentId: l.parentId })),
        totalCurrent: totalCurrentLiabilities,
        totalLongTerm: totalLongTermLiabilities,
        total: totalLiabilities
      },
      equity: {
        shareCapital: shareCapital.map(e => ({ accountId: e.accountId, account: e.name, code: e.code, amount: e.balance, parentId: e.parentId })),
        retainedEarnings: retainedEarnings.map(e => ({ accountId: e.accountId, account: e.name, code: e.code, amount: e.balance, parentId: e.parentId })),
        reserves: reserves.map(e => ({ accountId: e.accountId, account: e.name, code: e.code, amount: e.balance, parentId: e.parentId })),
        other: otherEquity.map(e => ({ accountId: e.accountId, account: e.name, code: e.code, amount: e.balance, parentId: e.parentId })),
        total: totalEquity
      },
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      balanceDifference: totalAssets - (totalLiabilities + totalEquity),
      ratios: {
        currentRatio: Math.round(currentRatio * 100) / 100,
        quickRatio: Math.round(quickRatio * 100) / 100,
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        debtToAssets: Math.round(debtToAssets * 100) / 100,
        equityRatio: Math.round(equityRatio * 100) / 100,
        workingCapital: Math.round(workingCapital * 100) / 100,
        assetTurnover: Math.round(assetTurnover * 100) / 100,
        ...profitabilityRatios
      },
      comparison,
      budget: budgetData,
      commonSize,
      notes,
      insights,
      asOfDate: asOf
    };

    setCache(cacheKey, result);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Balance Sheet error:', error);
    res.status(500).json({ success: false, message: 'Error generating Balance Sheet', error: error.message });
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, method = 'indirect' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    // Get cash accounts
    const cashAccounts = await ChartOfAccount.find({ type: 'ASSET', subType: 'cash', isActive: true });
    const cashAccountIds = cashAccounts.map(a => a._id);

    // Opening balance - cash before start date
    const openingEntries = await Ledger.find({ 
      accountId: { $in: cashAccountIds },
      date: { $lt: start }
    });
    const openingBalance = openingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

    if (method === 'direct') {
      // DIRECT METHOD - Show actual cash receipts and payments
      const operatingEntries = await Ledger.find({
        accountId: { $in: cashAccountIds },
        date: { $gte: start, $lte: end },
        cashFlowCategory: 'OPERATING'
      });

      // Categorize operating cash flows
      const cashFromCustomers = operatingEntries
        .filter(e => e.description.toLowerCase().includes('customer') || e.description.toLowerCase().includes('sales'))
        .reduce((sum, e) => sum + e.debit, 0);
      
      const cashToSuppliers = operatingEntries
        .filter(e => e.description.toLowerCase().includes('supplier') || e.description.toLowerCase().includes('purchase'))
        .reduce((sum, e) => sum + e.credit, 0);
      
      const cashToEmployees = operatingEntries
        .filter(e => e.description.toLowerCase().includes('salary') || e.description.toLowerCase().includes('wage'))
        .reduce((sum, e) => sum + e.credit, 0);
      
      const otherOperatingCash = operatingEntries
        .filter(e => {
          const desc = e.description.toLowerCase();
          return !desc.includes('customer') && !desc.includes('sales') && 
                 !desc.includes('supplier') && !desc.includes('purchase') &&
                 !desc.includes('salary') && !desc.includes('wage');
        })
        .reduce((sum, e) => sum + e.debit - e.credit, 0);

      const operatingNet = cashFromCustomers - cashToSuppliers - cashToEmployees + otherOperatingCash;

      const investingEntries = await Ledger.find({
        accountId: { $in: cashAccountIds },
        date: { $gte: start, $lte: end },
        cashFlowCategory: 'INVESTING'
      });

      const financingEntries = await Ledger.find({
        accountId: { $in: cashAccountIds },
        date: { $gte: start, $lte: end },
        cashFlowCategory: 'FINANCING'
      });

      const investing = investingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      const financing = financingEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

      const netCashFlow = operatingNet + investing + financing;
      const closingBalance = openingBalance + netCashFlow;

      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.json({
        success: true,
        method: 'direct',
        data: {
          openingBalance: Math.round(openingBalance * 100) / 100,
          operatingActivities: {
            cashFromCustomers: Math.round(cashFromCustomers * 100) / 100,
            cashToSuppliers: Math.round(-cashToSuppliers * 100) / 100,
            cashToEmployees: Math.round(-cashToEmployees * 100) / 100,
            otherOperatingCash: Math.round(otherOperatingCash * 100) / 100,
            net: Math.round(operatingNet * 100) / 100
          },
          investingActivities: {
            net: Math.round(investing * 100) / 100
          },
          financingActivities: {
            net: Math.round(financing * 100) / 100
          },
          netCashFlow: Math.round(netCashFlow * 100) / 100,
          closingBalance: Math.round(closingBalance * 100) / 100,
          period: { startDate, endDate }
        }
      });
    }

    // INDIRECT METHOD (default)
    const operatingEntries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      date: { $gte: start, $lte: end },
      cashFlowCategory: 'OPERATING'
    });

    const investingEntries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      date: { $gte: start, $lte: end },
      cashFlowCategory: 'INVESTING'
    });

    const financingEntries = await Ledger.find({
      accountId: { $in: cashAccountIds },
      date: { $gte: start, $lte: end },
      cashFlowCategory: 'FINANCING'
    });

    // Calculate inflows/outflows for each category
    const calcFlows = (entries: any[]) => {
      const inflows = entries.reduce((sum, e) => sum + e.debit, 0);
      const outflows = entries.reduce((sum, e) => sum + e.credit, 0);
      return { inflows, outflows, net: inflows - outflows };
    };

    const operating = calcFlows(operatingEntries);
    const investing = calcFlows(investingEntries);
    const financing = calcFlows(financingEntries);

    const netCashFlow = operating.net + investing.net + financing.net;
    const closingBalance = openingBalance + netCashFlow;

    res.setHeader('Cache-Control', 'private, max-age=300');
    res.json({
      success: true,
      method: 'indirect',
      data: {
        openingBalance: Math.round(openingBalance * 100) / 100,
        operatingActivities: { 
          inflows: Math.round(operating.inflows * 100) / 100, 
          outflows: Math.round(operating.outflows * 100) / 100, 
          net: Math.round(operating.net * 100) / 100
        },
        investingActivities: { 
          inflows: Math.round(investing.inflows * 100) / 100, 
          outflows: Math.round(investing.outflows * 100) / 100, 
          net: Math.round(investing.net * 100) / 100
        },
        financingActivities: { 
          inflows: Math.round(financing.inflows * 100) / 100, 
          outflows: Math.round(financing.outflows * 100) / 100, 
          net: Math.round(financing.net * 100) / 100
        },
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        closingBalance: Math.round(closingBalance * 100) / 100,
        period: { startDate, endDate }
      }
    });
  } catch (error: any) {
    logger.error('Cash Flow error:', error);
    res.status(500).json({ success: false, message: 'Error generating Cash Flow' });
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

    if (format === 'csv' || format === 'excel') {
      const buffer = generateExcelBuffer(data);
      res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const pdf = await generateBalanceSheetPDF(data);
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


async function getProfitLossData(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const accountBalances = await Ledger.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$accountId',
        totalDebit: { $sum: '$debit' },
        totalCredit: { $sum: '$credit' }
      }
    },
    {
      $lookup: {
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'account'
      }
    },
    { $unwind: '$account' },
    { $match: { 'ChartOfAccount.isActive': true } },
    {
      $project: {
        type: '$ChartOfAccount.type',
        subType: '$ChartOfAccount.subType',
        category: '$ChartOfAccount.category',
        balance: {
          $cond: [
            { $in: ['$ChartOfAccount.type', ['REVENUE', 'LIABILITY', 'EQUITY']] },
            { $subtract: ['$totalCredit', '$totalDebit'] },
            { $subtract: ['$totalDebit', '$totalCredit'] }
          ]
        }
      }
    }
  ]);

  const revenue = accountBalances.filter(a => a.type === 'REVENUE');
  const expenses = accountBalances.filter(a => a.type === 'EXPENSE');
  const cogs = expenses.filter(e => 
    e.subType === 'cogs' || e.category === 'Cost of Goods Sold' || e.category === 'COGS'
  );
  const operatingExpenses = expenses.filter(e => !cogs.find((c: any) => c._id.equals(e._id)));
  const depreciation = operatingExpenses.filter(e => e.subType === 'depreciation' || e.category === 'Depreciation');
  const otherOperating = operatingExpenses.filter(e => !depreciation.find((d: any) => d._id.equals(e._id)));

  const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0);
  const totalCOGS = cogs.reduce((sum, c) => sum + c.balance, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalOperatingExpenses = otherOperating.reduce((sum, e) => sum + e.balance, 0);
  const totalDepreciation = depreciation.reduce((sum, d) => sum + d.balance, 0);
  const totalExpenses = totalCOGS + totalOperatingExpenses + totalDepreciation;
  const ebitda = grossProfit - totalOperatingExpenses;
  const ebit = ebitda - totalDepreciation;
  const netIncome = ebit;

  const margins = {
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    ebitdaMargin: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0,
    ebitMargin: totalRevenue > 0 ? (ebit / totalRevenue) * 100 : 0,
    netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
  };

  return { totalRevenue, totalCOGS, grossProfit, totalOperatingExpenses, totalExpenses, ebitda, ebit, netIncome, margins };
}

async function getBalanceSheetData(asOfDate: string) {
  const query: any = {};
  if (asOfDate) {
    query.date = { $lte: new Date(asOfDate) };
  }

  const assets = await ChartOfAccount.find({ type: 'ASSET', isActive: true });
  const liabilities = await ChartOfAccount.find({ type: 'LIABILITY', isActive: true });
  const equity = await ChartOfAccount.find({ type: 'EQUITY', isActive: true });

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
    
    const transactions = await Ledger.find(query)
      .sort({ date: -1 })
      .limit(100)
      .lean();
    const account = await ChartOfAccount.findById(accountId);
    
    // Enrich transactions with journal entry details
    const JournalEntry = mongoose.model('JournalEntry');
    const enrichedTransactions = await Promise.all(
      transactions.map(async (txn: any) => {
        if (txn.journalEntryId) {
          try {
            const entry = await JournalEntry.findById(txn.journalEntryId).lean();
            if (entry) {
              const lineAccounts = await ChartOfAccount.find({
                _id: { $in: (entry as any).lines.map((l: any) => l.account) }
              }).lean();
              
              const accountMap = new Map(lineAccounts.map(a => [a._id.toString(), a]));
              
              return {
                ...txn,
                journalEntry: {
                  _id: entry._id,
                  entryNumber: (entry as any).entryNumber,
                  entryDate: (entry as any).entryDate,
                  description: (entry as any).description,
                  reference: (entry as any).reference,
                  lines: (entry as any).lines.map((line: any) => ({
                    account: accountMap.get(line.account.toString()),
                    debit: line.debit,
                    credit: line.credit,
                    description: line.description
                  }))
                }
              };
            }
          } catch (err) {
            logger.warn('Error fetching journal entry:', err);
          }
        }
        return txn;
      })
    );
    
    res.json({ success: true, data: { account, transactions: enrichedTransactions } });
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
    const avgMonthlyExpenses = historicalData.totalOperatingExpenses / 12;
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

export const clearPLCache = async (req: Request, res: Response) => {
  try {
    reportCache.clear();
    res.json({ success: true, message: 'P&L cache cleared successfully' });
  } catch (error: any) {
    logger.error('Cache clear error:', error);
    res.status(500).json({ success: false, message: 'Error clearing cache', error: error.message });
  }
};

export const getPLSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const data = await getProfitLossData(start.toISOString(), end.toISOString());

    res.json({
      success: true,
      data: {
        revenue: data.totalRevenue,
        cogs: data.totalCOGS,
        grossProfit: data.grossProfit,
        operatingExpenses: data.totalOperatingExpenses,
        ebitda: data.ebitda,
        ebit: data.ebit,
        netIncome: data.netIncome,
        margins: data.margins
      }
    });
  } catch (error: any) {
    logger.error('P&L summary error:', error);
    res.status(500).json({ success: false, message: 'Error generating P&L summary', error: error.message });
  }
};

export const getMultiPeriodComparison = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, periodType = 'monthly' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const periods = [];

    let current = new Date(start);
    while (current <= end) {
      let periodEnd: Date;
      let periodLabel: string;

      if (periodType === 'monthly') {
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        periodLabel = current.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else if (periodType === 'quarterly') {
        const quarter = Math.floor(current.getMonth() / 3);
        periodEnd = new Date(current.getFullYear(), (quarter + 1) * 3, 0);
        periodLabel = `Q${quarter + 1} ${current.getFullYear()}`;
      } else {
        periodEnd = new Date(current.getFullYear(), 11, 31);
        periodLabel = current.getFullYear().toString();
      }

      if (periodEnd > end) periodEnd = end;

      const data = await getProfitLossData(current.toISOString(), periodEnd.toISOString());
      periods.push({
        period: periodLabel,
        startDate: current.toISOString().split('T')[0],
        endDate: periodEnd.toISOString().split('T')[0],
        ...data
      });

      if (periodType === 'monthly') {
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      } else if (periodType === 'quarterly') {
        current = new Date(current.getFullYear(), current.getMonth() + 3, 1);
      } else {
        current = new Date(current.getFullYear() + 1, 0, 1);
      }
    }

    // Calculate period-over-period changes
    const withChanges = periods.map((period, index) => {
      if (index === 0) return { ...period, change: null };
      const prev = periods[index - 1];
      return {
        ...period,
        change: {
          revenue: period.totalRevenue - prev.totalRevenue,
          revenuePercent: prev.totalRevenue > 0 ? ((period.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100 : 0,
          netIncome: period.netIncome - prev.netIncome,
          netIncomePercent: prev.netIncome > 0 ? ((period.netIncome - prev.netIncome) / prev.netIncome) * 100 : 0
        }
      };
    });

    res.json({ success: true, data: { periods: withChanges, periodType } });
  } catch (error: any) {
    logger.error('Multi-period comparison error:', error);
    res.status(500).json({ success: false, message: 'Error generating multi-period comparison', error: error.message });
  }
};

const generateInsights = (data: any) => {
  const insights = [];
  const { totalAssets, totalLiabilities, totalEquity, ratios, comparison } = data;

  // Liquidity insights
  if (ratios.currentRatio < 1) {
    insights.push({ type: 'warning', category: 'liquidity', message: 'Current ratio below 1.0 indicates potential liquidity issues', severity: 'high' });
  } else if (ratios.currentRatio > 3) {
    insights.push({ type: 'info', category: 'liquidity', message: 'High current ratio may indicate inefficient use of assets', severity: 'low' });
  }

  // Leverage insights
  if (ratios.debtToEquity > 2) {
    insights.push({ type: 'warning', category: 'leverage', message: 'High debt-to-equity ratio indicates high financial leverage', severity: 'medium' });
  }

  // Anomaly detection
  if (comparison) {
    if (Math.abs(comparison.assetChangePercent) > 50) {
      insights.push({ type: 'alert', category: 'anomaly', message: `Unusual asset change: ${comparison.assetChangePercent.toFixed(1)}%`, severity: 'high' });
    }
    if (Math.abs(comparison.liabilityChangePercent) > 50) {
      insights.push({ type: 'alert', category: 'anomaly', message: `Unusual liability change: ${comparison.liabilityChangePercent.toFixed(1)}%`, severity: 'high' });
    }
  }

  // Equity insights
  if (ratios.equityRatio < 0.3) {
    insights.push({ type: 'warning', category: 'equity', message: 'Low equity ratio indicates high dependence on debt financing', severity: 'medium' });
  }

  // Positive insights
  if (ratios.currentRatio >= 1.5 && ratios.currentRatio <= 2.5) {
    insights.push({ type: 'success', category: 'liquidity', message: 'Healthy current ratio indicates good short-term financial health', severity: 'low' });
  }

  return insights;
};

export const addAccountNote = async (req: Request, res: Response) => {
  try {
    const { accountId, note, noteType, asOfDate } = req.body;
    const userId = (req as any).user?.id;

    const accountNote = await AccountNote.create({
      accountId,
      note,
      noteType,
      asOfDate,
      createdBy: userId
    });

    res.json({ success: true, data: accountNote });
  } catch (error: any) {
    logger.error('Add account note error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAccountNotes = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const notes = await AccountNote.find({ accountId }).populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error: any) {
    logger.error('Get account notes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAccountNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AccountNote.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete account note error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentPL = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get all departments
    const Department = mongoose.model('Department');
    const departments = await Department.find({ isActive: true });

    const departmentPLs = await Promise.all(
      departments.map(async (dept: any) => {
        const accountBalances = await Ledger.aggregate([
          { 
            $match: { 
              date: { $gte: start, $lte: end },
              department: dept._id
            } 
          },
          {
            $group: {
              _id: '$accountId',
              totalDebit: { $sum: '$debit' },
              totalCredit: { $sum: '$credit' }
            }
          },
          {
            $lookup: {
              from: 'chartofaccounts',
              localField: '_id',
              foreignField: '_id',
              as: 'account'
            }
          },
          { $unwind: '$account' },
          { $match: { 'account.isActive': true } }
        ]);

        const revenue = accountBalances.filter((a: any) => a.account.type === 'REVENUE');
        const expenses = accountBalances.filter((a: any) => a.account.type === 'EXPENSE');

        const totalRevenue = revenue.reduce((sum: number, r: any) => 
          sum + (r.totalCredit - r.totalDebit), 0);
        const totalExpenses = expenses.reduce((sum: number, e: any) => 
          sum + (e.totalDebit - e.totalCredit), 0);

        return {
          departmentId: dept._id,
          departmentName: dept.name,
          revenue: totalRevenue,
          expenses: totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        };
      })
    );

    const totals = departmentPLs.reduce((acc, dept) => ({
      revenue: acc.revenue + dept.revenue,
      expenses: acc.expenses + dept.expenses,
      netIncome: acc.netIncome + dept.netIncome
    }), { revenue: 0, expenses: 0, netIncome: 0 });

    res.json({
      success: true,
      data: {
        departments: departmentPLs,
        totals,
        period: { startDate, endDate },
        reportType: 'department-pl'
      }
    });
  } catch (error: any) {
    logger.error('Department P&L error:', error);
    res.status(500).json({ success: false, message: 'Error generating department P&L', error: error.message });
  }
};

// NEW: Trial Balance Report
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

    const accountBalances = await Ledger.aggregate([
      { $match: { date: { $lte: asOf } } },
      { $group: { _id: '$accountId', totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } },
      { $lookup: { from: 'chartofaccounts', localField: '_id', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $match: { 'account.isActive': true } },
      {
        $project: {
          _id: '$_id',
          code: '$account.code',
          name: '$account.name',
          type: '$account.type',
          balance: { $subtract: ['$totalDebit', '$totalCredit'] }
        }
      },
      { $sort: { code: 1 } }
    ]);

    const totalDebit = accountBalances.filter(a => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const totalCredit = accountBalances.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);

    res.json({
      success: true,
      data: {
        accounts: accountBalances,
        totalDebit,
        totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
        asOfDate: asOf,
        reportType: 'trial-balance'
      }
    });
  } catch (error: any) {
    logger.error('Trial Balance error:', error);
    res.status(500).json({ success: false, message: 'Error generating trial balance', error: error.message });
  }
};

// NEW: General Ledger Report
export const getGeneralLedger = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, accountId, page = 1, limit = 100 } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const query: any = { date: { $gte: start, $lte: end } };
    if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId as string);

    const skip = (Number(page) - 1) * Number(limit);
    const entries = await Ledger.find(query)
      .populate('accountId', 'code name')
      .sort({ date: 1, createdAt: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Ledger.countDocuments(query);

    res.json({
      success: true,
      data: {
        entries,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
        period: { startDate, endDate },
        reportType: 'general-ledger'
      }
    });
  } catch (error: any) {
    logger.error('General Ledger error:', error);
    res.status(500).json({ success: false, message: 'Error generating general ledger', error: error.message });
  }
};

// NEW: Accounts Receivable Report
export const getAccountsReceivable = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

    try {
      const Invoice = mongoose.model('Invoice');
      const invoices = await Invoice.find({
        status: { $in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
        balanceAmount: { $gt: 0 }
      }).populate('customerId', 'name email');

      logger.info(`Found ${invoices.length} invoices for AR report`);

      const aging = {
        current: invoices.filter((inv: any) => {
          const days = Math.floor((asOf.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return days <= 30;
        }),
        days31to60: invoices.filter((inv: any) => {
          const days = Math.floor((asOf.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return days > 30 && days <= 60;
        }),
        days61to90: invoices.filter((inv: any) => {
          const days = Math.floor((asOf.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return days > 60 && days <= 90;
        }),
        over90: invoices.filter((inv: any) => {
          const days = Math.floor((asOf.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          return days > 90;
        })
      };

      const total = invoices.reduce((sum: number, inv: any) => sum + (inv.balanceAmount || 0), 0);

      res.json({
        success: true,
        data: {
          invoices,
          aging,
          totals: {
            current: aging.current.reduce((sum: number, inv: any) => sum + (inv.balanceAmount || 0), 0),
            days31to60: aging.days31to60.reduce((sum: number, inv: any) => sum + (inv.balanceAmount || 0), 0),
            days61to90: aging.days61to90.reduce((sum: number, inv: any) => sum + (inv.balanceAmount || 0), 0),
            over90: aging.over90.reduce((sum: number, inv: any) => sum + (inv.balanceAmount || 0), 0),
            total
          },
          asOfDate: asOf,
          reportType: 'accounts-receivable'
        }
      });
    } catch (modelError: any) {
      logger.warn('Invoice model not found, returning empty data');
      res.json({
        success: true,
        data: {
          invoices: [],
          aging: { current: [], days31to60: [], days61to90: [], over90: [] },
          totals: { current: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 },
          asOfDate: asOf,
          reportType: 'accounts-receivable',
          message: 'Invoice model not available'
        }
      });
    }
  } catch (error: any) {
    logger.error('AR Report error:', error);
    res.status(500).json({ success: false, message: 'Error generating AR report', error: error.message });
  }
};

// NEW: Accounts Payable Report
export const getAccountsPayable = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;
    const asOf = asOfDate ? new Date(asOfDate as string) : new Date();

    try {
      const Bill = mongoose.model('Bill');
      const bills = await Bill.find({
        status: { $in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        balanceAmount: { $gt: 0 }
      }).populate('vendorId', 'name email');

    const aging = {
      current: bills.filter((bill: any) => {
        const days = Math.floor((asOf.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return days <= 30;
      }),
      days31to60: bills.filter((bill: any) => {
        const days = Math.floor((asOf.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return days > 30 && days <= 60;
      }),
      over60: bills.filter((bill: any) => {
        const days = Math.floor((asOf.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return days > 60;
      })
    };

      const total = bills.reduce((sum: number, bill: any) => sum + (bill.balanceAmount || 0), 0);

      res.json({
        success: true,
        data: {
          bills,
          aging,
          totals: {
            current: aging.current.reduce((sum: number, bill: any) => sum + (bill.balanceAmount || 0), 0),
            days31to60: aging.days31to60.reduce((sum: number, bill: any) => sum + (bill.balanceAmount || 0), 0),
            over60: aging.over60.reduce((sum: number, bill: any) => sum + (bill.balanceAmount || 0), 0),
            total
          },
          asOfDate: asOf,
          reportType: 'accounts-payable'
        }
      });
    } catch (modelError: any) {
      logger.warn('Bill model not found, returning empty data');
      res.json({
        success: true,
        data: {
          bills: [],
          aging: { current: [], days31to60: [], over60: [] },
          totals: { current: 0, days31to60: 0, over60: 0, total: 0 },
          asOfDate: asOf,
          reportType: 'accounts-payable',
          message: 'Bill model not available'
        }
      });
    }
  } catch (error: any) {
    logger.error('AP Report error:', error);
    res.status(500).json({ success: false, message: 'Error generating AP report', error: error.message });
  }
};

// NEW: Expense Report
export const getExpenseReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, categoryId, departmentId } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const matchStage: any = { date: { $gte: start, $lte: end } };
    if (departmentId) matchStage.department = new mongoose.Types.ObjectId(departmentId as string);

    const expenses = await Ledger.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'chartofaccounts', localField: 'accountId', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $match: { 'account.type': 'EXPENSE', 'account.isActive': true } },
      {
        $group: {
          _id: { accountId: '$accountId', category: '$account.category' },
          account: { $first: '$account.name' },
          code: { $first: '$account.code' },
          category: { $first: '$account.category' },
          total: { $sum: { $subtract: ['$debit', '$credit'] } }
        }
      },
      { $sort: { category: 1, code: 1 } }
    ]);

    const byCategory = expenses.reduce((acc: any, exp: any) => {
      const cat = exp.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { items: [], total: 0 };
      acc[cat].items.push(exp);
      acc[cat].total += exp.total;
      return acc;
    }, {});

    const total = expenses.reduce((sum, exp) => sum + exp.total, 0);

    res.json({
      success: true,
      data: {
        expenses,
        byCategory,
        total,
        period: { startDate, endDate },
        reportType: 'expense-report'
      }
    });
  } catch (error: any) {
    logger.error('Expense Report error:', error);
    res.status(500).json({ success: false, message: 'Error generating expense report', error: error.message });
  }
};

// NEW: Revenue Report
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, categoryId, departmentId } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const matchStage: any = { date: { $gte: start, $lte: end } };
    if (departmentId) matchStage.department = new mongoose.Types.ObjectId(departmentId as string);

    const revenue = await Ledger.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'chartofaccounts', localField: 'accountId', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $match: { 'account.type': 'REVENUE', 'account.isActive': true } },
      {
        $group: {
          _id: { accountId: '$accountId', category: '$account.category' },
          account: { $first: '$account.name' },
          code: { $first: '$account.code' },
          category: { $first: '$account.category' },
          total: { $sum: { $subtract: ['$credit', '$debit'] } }
        }
      },
      { $sort: { category: 1, code: 1 } }
    ]);

    const byCategory = revenue.reduce((acc: any, rev: any) => {
      const cat = rev.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { items: [], total: 0 };
      acc[cat].items.push(rev);
      acc[cat].total += rev.total;
      return acc;
    }, {});

    const total = revenue.reduce((sum, rev) => sum + rev.total, 0);

    res.json({
      success: true,
      data: {
        revenue,
        byCategory,
        total,
        period: { startDate, endDate },
        reportType: 'revenue-report'
      }
    });
  } catch (error: any) {
    logger.error('Revenue Report error:', error);
    res.status(500).json({ success: false, message: 'Error generating revenue report', error: error.message });
  }
};

