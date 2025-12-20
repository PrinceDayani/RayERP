/**
 * TypeScript Interfaces for Financial Reports
 * Comprehensive type definitions for type safety
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportFilters extends DateRange {
  costCenterId?: string;
  departmentId?: string;
  includeBudget?: boolean;
  includeTransactions?: boolean;
  compareYoY?: boolean;
  compareQoQ?: boolean;
  page?: number;
  limit?: number;
}

export interface AccountBalance {
  _id: string;
  name: string;
  code: string;
  balance: number;
  category?: string;
  subType?: string;
  transactions?: Transaction[];
  transactionCount?: number;
}

export interface Transaction {
  _id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  balance: number;
}

export interface CategoryData {
  items: AccountBalance[];
  total: number;
}

export interface FinancialMargins {
  gross: number;
  ebitda: number;
  operating: number;
  net: number;
}

export interface ComparisonData {
  type: 'YoY' | 'QoQ' | 'MoM';
  previous: Partial<ProfitLossData>;
  variance: {
    revenue: number;
    revenuePercent: number;
    grossProfit: number;
    ebitda: number;
    netIncome: number;
    netIncomePercent: number;
  };
}

export interface BudgetData {
  revenue: number;
  expenses: number;
  netIncome: number;
  variance: {
    revenue: number;
    revenuePercent: number;
    netIncome: number;
    netIncomePercent: number;
  };
}

export interface ProfitLossData {
  revenue: {
    accounts: AccountBalance[];
    byCategory: Record<string, CategoryData>;
    total: number;
  };
  expenses: {
    accounts: AccountBalance[];
    byCategory: Record<string, CategoryData>;
    total: number;
  };
  cogs: {
    accounts: AccountBalance[];
    total: number;
  };
  grossProfit: number;
  ebitda: number;
  ebit: number;
  ebt: number;
  netIncome: number;
  margins: FinancialMargins;
  comparison?: ComparisonData;
  budget?: BudgetData;
  period: DateRange;
  reportType: 'profit-loss';
  filters?: Partial<ReportFilters>;
}

export interface BalanceSheetData {
  assets: {
    current: AccountBalance[];
    nonCurrent: {
      fixed: AccountBalance[];
      intangible: AccountBalance[];
      other: AccountBalance[];
    };
    totalCurrent: number;
    totalNonCurrent: number;
    total: number;
  };
  liabilities: {
    current: AccountBalance[];
    longTerm: AccountBalance[];
    totalCurrent: number;
    totalLongTerm: number;
    total: number;
  };
  equity: {
    shareCapital: AccountBalance[];
    retainedEarnings: AccountBalance[];
    reserves: AccountBalance[];
    other: AccountBalance[];
    total: number;
  };
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
  balanceDifference: number;
  ratios: BalanceSheetRatios;
  comparison?: any;
  budget?: any;
  commonSize?: any;
  notes?: any;
  insights?: Insight[];
  asOfDate: Date;
  reportType: 'balance-sheet';
}

export interface BalanceSheetRatios {
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  debtToAssets: number;
  equityRatio: number;
  workingCapital: number;
  assetTurnover: number;
  roe?: number;
  roa?: number;
}

export interface CashFlowData {
  openingBalance: number;
  operatingActivities: {
    inflows?: number;
    outflows?: number;
    net: number;
    items?: any[];
  };
  investingActivities: {
    inflows?: number;
    outflows?: number;
    net: number;
    items?: any[];
  };
  financingActivities: {
    inflows?: number;
    outflows?: number;
    net: number;
    items?: any[];
  };
  netCashFlow: number;
  closingBalance: number;
  period: DateRange;
  method: 'direct' | 'indirect';
  reportType: 'cash-flow';
}

export interface TrialBalanceData {
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  balanceDifference?: number;
  asOfDate: Date;
  reportType: 'trial-balance';
}

export interface GeneralLedgerData {
  entries: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  period: DateRange;
  reportType: 'general-ledger';
}

export interface AgingBucket {
  current: any[];
  days31to60: any[];
  days61to90?: any[];
  over90?: any[];
  over60?: any[];
}

export interface AgingTotals {
  current: number;
  days31to60: number;
  days61to90?: number;
  over90?: number;
  over60?: number;
  total: number;
}

export interface AccountsReceivableData {
  invoices: any[];
  aging: AgingBucket;
  totals: AgingTotals;
  asOfDate: Date;
  reportType: 'accounts-receivable';
}

export interface AccountsPayableData {
  bills: any[];
  aging: Omit<AgingBucket, 'days61to90' | 'over90'> & { over60: any[] };
  totals: Omit<AgingTotals, 'days61to90' | 'over90'> & { over60: number };
  asOfDate: Date;
  reportType: 'accounts-payable';
}

export interface ExpenseReportData {
  expenses: any[];
  byCategory: Record<string, CategoryData>;
  total: number;
  period: DateRange;
  reportType: 'expense-report';
}

export interface RevenueReportData {
  revenue: any[];
  byCategory: Record<string, CategoryData>;
  total: number;
  period: DateRange;
  reportType: 'revenue-report';
}

export interface DepartmentPLData {
  departments: Array<{
    departmentId: string;
    departmentName: string;
    revenue: number;
    expenses: number;
    netIncome: number;
    margin: number;
  }>;
  totals: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  period: DateRange;
  reportType: 'department-pl';
}

export interface Insight {
  type: 'success' | 'info' | 'warning' | 'alert';
  category: 'liquidity' | 'leverage' | 'equity' | 'anomaly' | 'performance';
  message: string;
  severity: 'low' | 'medium' | 'high';
  value?: number;
  recommendation?: string;
}

export type ReportData = 
  | ProfitLossData 
  | BalanceSheetData 
  | CashFlowData 
  | TrialBalanceData 
  | GeneralLedgerData 
  | AccountsReceivableData 
  | AccountsPayableData 
  | ExpenseReportData 
  | RevenueReportData 
  | DepartmentPLData;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  cached?: boolean;
  performance?: {
    duration: number;
    cacheHit: boolean;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  reportType: string;
  filters: ReportFilters;
}
