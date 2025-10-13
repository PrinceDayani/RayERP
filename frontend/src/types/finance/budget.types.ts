export interface Budget {
  id: string;
  name: string;
  fiscalYear: string;
  status: 'draft' | 'approved' | 'active';
  totalAmount: number;
  allocations: BudgetAllocation[];
}

export interface BudgetAllocation {
  id: string;
  accountId: string;
  amount: number;
  period: string;
  actual?: number;
  variance?: number;
}

export interface BudgetForecast {
  id: string;
  budgetId: string;
  period: string;
  forecastAmount: number;
  confidence: number;
}