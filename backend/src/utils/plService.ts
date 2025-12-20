import { Ledger } from '../models/Ledger';
import mongoose from 'mongoose';

export interface PLData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  ebitda: number;
  totalDepreciation: number;
  ebit: number;
  totalInterest: number;
  ebt: number;
  totalTax: number;
  netIncome: number;
  margins: {
    gross: number;
    ebitda: number;
    operating: number;
    net: number;
  };
}

export const calculatePLMetrics = async (
  startDate: Date,
  endDate: Date,
  costCenterId?: string
): Promise<any> => {
  const matchStage: any = { date: { $gte: startDate, $lte: endDate } };
  if (costCenterId) matchStage.costCenter = new mongoose.Types.ObjectId(costCenterId);

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
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'account'
      }
    },
    { $unwind: '$account' },
    { $match: { 'account.isActive': true } },
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
            { $in: ['$account.type', ['revenue', 'liability', 'equity']] },
            { $subtract: ['$totalCredit', '$totalDebit'] },
            { $subtract: ['$totalDebit', '$totalCredit'] }
          ]
        }
      }
    }
  ]);

  return accountBalances;
};

export const categorizePLAccounts = (accountBalances: any[]) => {
  const revenue = accountBalances.filter(a => a.type === 'revenue');
  const expenses = accountBalances.filter(a => a.type === 'expense');

  const cogs = expenses.filter(e =>
    e.subType === 'cogs' ||
    e.category === 'Cost of Goods Sold' ||
    e.category === 'COGS' ||
    ['direct materials', 'direct labor', 'manufacturing'].some(k => e.name.toLowerCase().includes(k))
  );

  const operatingExpenses = expenses.filter(e => !cogs.find(c => c.accountId.equals(e.accountId)));

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

  return {
    revenue,
    cogs,
    otherOperating,
    depreciation,
    interestExpense,
    taxExpense
  };
};

export const calculatePLTotals = (categorized: any): PLData => {
  const totalRevenue = categorized.revenue.reduce((sum: number, r: any) => sum + r.balance, 0);
  const totalCOGS = categorized.cogs.reduce((sum: number, c: any) => sum + c.balance, 0);
  const grossProfit = totalRevenue - totalCOGS;

  const totalOperatingExpenses = categorized.otherOperating.reduce((sum: number, e: any) => sum + e.balance, 0);
  const ebitda = grossProfit - totalOperatingExpenses;

  const totalDepreciation = categorized.depreciation.reduce((sum: number, d: any) => sum + d.balance, 0);
  const ebit = ebitda - totalDepreciation;

  const totalInterest = categorized.interestExpense.reduce((sum: number, i: any) => sum + i.balance, 0);
  const ebt = ebit - totalInterest;

  const totalTax = categorized.taxExpense.reduce((sum: number, t: any) => sum + t.balance, 0);
  const netIncome = ebt - totalTax;

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
  const operatingMargin = totalRevenue > 0 ? (ebit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalOperatingExpenses,
    ebitda,
    totalDepreciation,
    ebit,
    totalInterest,
    ebt,
    totalTax,
    netIncome,
    margins: {
      gross: Math.round(grossMargin * 100) / 100,
      ebitda: Math.round(ebitdaMargin * 100) / 100,
      operating: Math.round(operatingMargin * 100) / 100,
      net: Math.round(netMargin * 100) / 100
    }
  };
};

export const groupByCategory = (items: any[]) => {
  return items.reduce((acc: any, item) => {
    const cat = item.category || item.subType || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({
      accountId: item.accountId,
      account: item.name,
      code: item.code,
      amount: item.balance
    });
    return acc;
  }, {});
};
