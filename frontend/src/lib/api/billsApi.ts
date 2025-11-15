const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const billsApi = {
  exportPDF: async (accountId?: string) => {
    const url = accountId ? `${API_BASE}/api/bills/export/pdf?accountId=${accountId}` : `${API_BASE}/api/bills/export/pdf`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.blob();
  },
  
  sendReminders: async () => {
    const res = await fetch(`${API_BASE}/api/bills/reminders/send`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  
  processRecurring: async () => {
    const res = await fetch(`${API_BASE}/api/bills/recurring/process`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  
  getActivityTransactions: async (activity: string, startDate: string, endDate: string) => {
    const params = new URLSearchParams({ activity, startDate, endDate });
    const res = await fetch(`${API_BASE}/api/bills/activity-transactions?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  
  getHistoricalCashFlow: async (periods: number = 6) => {
    const res = await fetch(`${API_BASE}/api/bills/historical-cashflow?periods=${periods}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
