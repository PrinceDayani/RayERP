export interface BalanceSheet {
  assets: {
    current: BalanceSheetItem[];
    nonCurrent: BalanceSheetItem[];
    total: number;
  };
  liabilities: {
    current: BalanceSheetItem[];
    nonCurrent: BalanceSheetItem[];
    total: number;
  };
  equity: {
    items: BalanceSheetItem[];
    total: number;
  };
}

export interface BalanceSheetItem {
  account: string;
  amount: number;
}

export interface ProfitLossStatement {
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: ProfitLossItem[];
  operatingIncome: number;
  otherIncome: number;
  netIncome: number;
}

export interface ProfitLossItem {
  category: string;
  amount: number;
}

export interface CashFlowStatement {
  operating: CashFlowItem[];
  investing: CashFlowItem[];
  financing: CashFlowItem[];
  netCashFlow: number;
}

export interface CashFlowItem {
  description: string;
  amount: number;
}