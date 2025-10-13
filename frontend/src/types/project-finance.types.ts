export interface ProjectFinanceFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  accountId?: string;
  voucherType?: string;
}

export interface ProjectProfitLoss {
  projectId: string;
  revenue: {
    contractValue: number;
    billedAmount: number;
    unbilledAmount: number;
  };
  expenses: {
    directCosts: number;
    indirectCosts: number;
    overheads: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface ProjectTrialBalance {
  projectId: string;
  accounts: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  totalDebits: number;
  totalCredits: number;
}

export interface ProjectBalanceSheet {
  projectId: string;
  assets: {
    current: Array<{ name: string; amount: number }>;
    fixed: Array<{ name: string; amount: number }>;
    total: number;
  };
  liabilities: {
    current: Array<{ name: string; amount: number }>;
    longTerm: Array<{ name: string; amount: number }>;
    total: number;
  };
  equity: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
}

export interface ProjectCashFlow {
  projectId: string;
  operating: {
    receipts: number;
    payments: number;
    net: number;
  };
  investing: {
    receipts: number;
    payments: number;
    net: number;
  };
  financing: {
    receipts: number;
    payments: number;
    net: number;
  };
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

export interface ProjectLedgerEntry {
  id: string;
  projectId: string;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  voucherType: string;
  voucherNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ProjectJournalEntry {
  id: string;
  projectId: string;
  date: string;
  voucherNumber: string;
  description: string;
  entries: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'approved';
}