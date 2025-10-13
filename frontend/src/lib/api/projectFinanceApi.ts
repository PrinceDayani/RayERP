import { 
  ProjectFinanceFilters, 
  ProjectProfitLoss, 
  ProjectTrialBalance, 
  ProjectBalanceSheet, 
  ProjectCashFlow, 
  ProjectLedgerEntry, 
  ProjectJournalEntry 
} from '@/types/project-finance.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const projectFinanceApi = {
  // Profit & Loss
  getProfitLoss: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectProfitLoss> => {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate);
      params.append('endDate', filters.dateRange.endDate);
    }
    
    // Mock data for now
    return {
      projectId,
      revenue: {
        contractValue: 150000,
        billedAmount: 120000,
        unbilledAmount: 30000
      },
      expenses: {
        directCosts: 80000,
        indirectCosts: 15000,
        overheads: 10000
      },
      grossProfit: 45000,
      netProfit: 35000,
      profitMargin: 23.33
    };
  },

  // Trial Balance
  getTrialBalance: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectTrialBalance> => {
    // Mock data
    return {
      projectId,
      accounts: [
        { accountCode: '1001', accountName: 'Cash', debit: 25000, credit: 0, balance: 25000 },
        { accountCode: '1200', accountName: 'Accounts Receivable', debit: 30000, credit: 0, balance: 30000 },
        { accountCode: '2001', accountName: 'Accounts Payable', debit: 0, credit: 15000, balance: -15000 },
        { accountCode: '4001', accountName: 'Project Revenue', debit: 0, credit: 120000, balance: -120000 },
        { accountCode: '5001', accountName: 'Direct Costs', debit: 80000, credit: 0, balance: 80000 }
      ],
      totalDebits: 135000,
      totalCredits: 135000
    };
  },

  // Balance Sheet
  getBalanceSheet: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectBalanceSheet> => {
    // Mock data
    return {
      projectId,
      assets: {
        current: [
          { name: 'Cash', amount: 25000 },
          { name: 'Accounts Receivable', amount: 30000 },
          { name: 'Work in Progress', amount: 15000 }
        ],
        fixed: [
          { name: 'Equipment', amount: 50000 },
          { name: 'Software', amount: 10000 }
        ],
        total: 130000
      },
      liabilities: {
        current: [
          { name: 'Accounts Payable', amount: 15000 },
          { name: 'Accrued Expenses', amount: 5000 }
        ],
        longTerm: [
          { name: 'Equipment Loan', amount: 25000 }
        ],
        total: 45000
      },
      equity: {
        items: [
          { name: 'Project Capital', amount: 50000 },
          { name: 'Retained Earnings', amount: 35000 }
        ],
        total: 85000
      }
    };
  },

  // Cash Flow
  getCashFlow: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectCashFlow> => {
    // Mock data
    return {
      projectId,
      operating: {
        receipts: 120000,
        payments: 95000,
        net: 25000
      },
      investing: {
        receipts: 0,
        payments: 60000,
        net: -60000
      },
      financing: {
        receipts: 50000,
        payments: 0,
        net: 50000
      },
      netCashFlow: 15000,
      openingBalance: 10000,
      closingBalance: 25000
    };
  },

  // Ledger Entries
  getLedgerEntries: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectLedgerEntry[]> => {
    // Mock data
    return [
      {
        id: '1',
        projectId,
        date: '2024-01-15',
        accountCode: '1001',
        accountName: 'Cash',
        description: 'Initial project funding',
        voucherType: 'Receipt',
        voucherNumber: 'RV001',
        debit: 50000,
        credit: 0,
        balance: 50000
      },
      {
        id: '2',
        projectId,
        date: '2024-01-20',
        accountCode: '5001',
        accountName: 'Direct Costs',
        description: 'Material purchase',
        voucherType: 'Payment',
        voucherNumber: 'PV001',
        debit: 25000,
        credit: 0,
        balance: 25000
      }
    ];
  },

  // Journal Entries
  getJournalEntries: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectJournalEntry[]> => {
    // Mock data
    return [
      {
        id: '1',
        projectId,
        date: '2024-01-15',
        voucherNumber: 'JV001',
        description: 'Project setup entry',
        entries: [
          { accountCode: '1001', accountName: 'Cash', debit: 50000, credit: 0 },
          { accountCode: '3001', accountName: 'Project Capital', debit: 0, credit: 50000 }
        ],
        totalDebit: 50000,
        totalCredit: 50000,
        status: 'posted'
      }
    ];
  },

  // Export functions
  exportReport: async (reportType: string, projectId: string, format: 'pdf' | 'excel', filters?: ProjectFinanceFilters) => {
    // Mock export - would typically return a blob or download URL
    console.log(`Exporting ${reportType} for project ${projectId} as ${format}`);
    return { success: true, message: 'Report exported successfully' };
  }
};