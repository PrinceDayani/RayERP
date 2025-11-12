const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || `HTTP error! status: ${response.status}`;
      console.error('API Error Response:', errorJson);
    } catch {
      errorMessage = `HTTP error! status: ${response.status}`;
      console.error('API Error Text:', errorText);
    }
    throw new Error(errorMessage);
  }
  
  const text = await response.text();
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const generalLedgerApi = {
  // Account operations
  getAccounts: async () => {
    const response = await fetch(`${API_BASE}/api/general-ledger/accounts`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createAccount: async (data: any) => {
    const response = await fetch(`${API_BASE}/api/general-ledger/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateAccount: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/api/general-ledger/accounts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Journal entry operations
  getJournalEntries: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`${API_BASE}/api/general-ledger/journal-entries?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createJournalEntry: async (data: any) => {
    console.log('Creating journal entry with data:', data);
    const response = await fetch(`${API_BASE}/api/general-ledger/journal-entries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await handleResponse(response);
    console.log('Journal entry created:', result);
    return result;
  },

  postJournalEntry: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/general-ledger/journal-entries/${id}/post`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Reports
  getTrialBalance: async () => {
    const response = await fetch(`${API_BASE}/api/general-ledger/trial-balance`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};