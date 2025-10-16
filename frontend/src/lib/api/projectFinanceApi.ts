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
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate);
      params.append('endDate', filters.dateRange.endDate);
    }
    if (filters?.accountCode) {
      params.append('accountCode', filters.accountCode);
    }
    
    const response = await fetch(`${API_BASE}/api/project-ledger/${projectId}/ledger-entries?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Journal Entries
  getJournalEntries: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectJournalEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate);
      params.append('endDate', filters.dateRange.endDate);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    
    const response = await fetch(`${API_BASE}/api/project-ledger/${projectId}/journal-entries?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Create Journal Entry
  createJournalEntry: async (projectId: string, entryData: any): Promise<ProjectJournalEntry> => {
    const response = await fetch(`${API_BASE}/api/project-ledger/${projectId}/journal-entries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryData)
    });
    
    return handleResponse(response);
  },

  // Update Journal Entry
  updateJournalEntry: async (projectId: string, entryId: string, entryData: any): Promise<ProjectJournalEntry> => {
    const response = await fetch(`${API_BASE}/api/project-ledger/${projectId}/journal-entries/${entryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryData)
    });
    
    return handleResponse(response);
  },

  // Post Journal Entry
  postJournalEntry: async (projectId: string, entryId: string): Promise<ProjectJournalEntry> => {
    const response = await fetch(`${API_BASE}/api/project-ledger/${projectId}/journal-entries/${entryId}/post`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Delete Journal Entry
  deleteJournalEntry: async (projectId: string, entryId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/project-ledger/${projectId}/journal-entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    await handleResponse(response);
  },

  // Export functions
  exportReport: async (reportType: string, projectId: string, format: 'pdf' | 'excel', filters?: ProjectFinanceFilters) => {
    // Mock export - would typically return a blob or download URL
    console.log(`Exporting ${reportType} for project ${projectId} as ${format}`);
    return { success: true, message: 'Report exported successfully' };
  }
};