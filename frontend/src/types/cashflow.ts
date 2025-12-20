// TypeScript types for Cash Flow
export interface ActivityData {
  inflows: number;
  outflows: number;
  net: number;
}

export interface CashFlowData {
  openingBalance: number;
  operatingActivities: ActivityData;
  investingActivities: ActivityData;
  financingActivities: ActivityData;
  netCashFlow: number;
  closingBalance: number;
  period?: {
    startDate: string;
    endDate: string;
  };
}

export interface CashFlowRatios {
  operatingCashRatio: string;
  cashFlowMargin: string;
  cashCoverage: string;
}

export interface ForecastData {
  month: string;
  projected: number;
  operating: number;
  investing: number;
  financing: number;
}

export interface HistoricalData {
  month: string;
  operating: number;
  investing: number;
  financing: number;
  net: number;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
