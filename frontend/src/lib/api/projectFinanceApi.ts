import { 
  ProjectFinanceFilters, 
  ProjectProfitLoss, 
  ProjectTrialBalance, 
  ProjectBalanceSheet, 
  ProjectCashFlow, 
  ProjectLedgerEntry, 
  ProjectJournalEntry 
} from '@/types/project-finance.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

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
    
    const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE}/api/general-ledger/reports?reportType=profit-loss&${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Trial Balance
  getTrialBalance: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectTrialBalance> => {
    const params = new URLSearchParams();
    if (filters?.dateRange?.endDate) {
      params.append('asOfDate', filters.dateRange.endDate);
    }
    
    const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE}/api/general-ledger/trial-balance?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Balance Sheet
  getBalanceSheet: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectBalanceSheet> => {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate);
      params.append('endDate', filters.dateRange.endDate);
    }
    
    const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE}/api/general-ledger/reports?reportType=balance-sheet&${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Cash Flow
  getCashFlow: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectCashFlow> => {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.startDate);
      params.append('endDate', filters.dateRange.endDate);
    }
    
    const token = localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
    const response = await fetch(`${API_BASE}/api/general-ledger/reports?reportType=cash-flow&${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Ledger Entries
  getLedgerEntries: async (projectId: string, filters?: ProjectFinanceFilters): Promise<ProjectLedgerEntry[]> => {
    const params = new URLSearchParams();
    params.append('includeAll', 'true'); // Include draft entries
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