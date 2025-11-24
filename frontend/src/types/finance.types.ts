export interface FinanceDashboard {
  id: string;
  companyId: string;
  fiscalYear: number;
  currentPeriod: string;
  baseCurrency: string;
  settings: FinanceSettings;
  summary: FinanceSummary;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceSettings {
  autoPostJournals: boolean;
  requireApproval: boolean;
  allowNegativeInventory: boolean;
  decimalPlaces: number;
}

export interface FinanceSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  lastUpdated: Date;
}

export interface FinanceKPI {
  name: string;
  value: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  percentage?: number;
}
