const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  level: number;
  balance: number;
  isGroup: boolean;
  isActive: boolean;
  description?: string;
  children?: Account[];
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  reference?: string;
  description: string;
  lines: JournalLine[];
  isPosted: boolean;
  createdBy: string;
  createdAt: string;
}

export interface JournalLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  accounts: {
    id: string;
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
  }[];
  totals: {
    debits: number;
    credits: number;
    balanced: boolean;
  };
  asOfDate: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const generalLedgerAPI = {
  // Account management
  async getAccounts(params?: { type?: string; hierarchy?: boolean; includeInactive?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.hierarchy) queryParams.append('hierarchy', 'true');
    if (params?.includeInactive) queryParams.append('includeInactive', 'true');
    
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/accounts?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
  },

  async createAccount(accountData: Partial<Account>) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create account' }));
      throw new Error(errorData.message || errorData.error || 'Failed to create account');
    }
    return response.json();
  },

  async updateAccount(id: string, updates: Partial<Account>) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/accounts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  },

  async deleteAccount(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/accounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete account');
    return response.json();
  },

  async deleteJournalEntry(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/journal-entries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete journal entry');
    return response.json();
  },

  // Journal entries
  async getJournalEntries(params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/journal-entries?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    return response.json();
  },

  async getJournalEntry(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/journal-entries/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch journal entry');
    return response.json();
  },

  async createJournalEntry(entryData: {
    date: string;
    reference?: string;
    description: string;
    lines: JournalLine[];
  }) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/journal-entries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entryData)
    });
    if (!response.ok) throw new Error('Failed to create journal entry');
    return response.json();
  },

  async updateJournalEntry(id: string, entryData: {
    date?: string;
    reference?: string;
    description?: string;
    lines?: JournalLine[];
  }) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/journal-entries/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(entryData)
    });
    if (!response.ok) throw new Error('Failed to update journal entry');
    return response.json();
  },

  async postJournalEntry(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/journal-entries/${id}/post`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to post journal entry');
    return response.json();
  },

  // Reports
  async getTrialBalance(asOfDate?: string): Promise<TrialBalance> {
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.append('asOfDate', asOfDate);
    
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/trial-balance?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch trial balance');
    return response.json();
  },

  async getAccountLedger(accountId: string, params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/accounts/${accountId}/ledger?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch account ledger');
    return response.json();
  },

  async getFinancialReports(reportType: 'profit-loss' | 'balance-sheet', params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    queryParams.append('reportType', reportType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/reports?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch financial report');
    return response.json();
  },

  // Transaction automation
  async createTransactionJournal(transactionData: {
    transactionType: string;
    transactionId: string;
    amount: number;
    lines: JournalLine[];
    metadata?: any;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/general-ledger/transactions/journal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transactionData)
    });
    if (!response.ok) throw new Error('Failed to create transaction journal');
    return response.json();
  }
};

export default generalLedgerAPI;