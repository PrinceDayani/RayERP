const API_BASE = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const reportingApi = {
  getBalanceSheet: async (asOfDate?: string, compareDate?: string) => {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);
    if (compareDate) params.append('compareDate', compareDate);
    const url = `${API_BASE}/api/financial-reports/balance-sheet${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },
  getProfitLoss: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `${API_BASE}/api/financial-reports/profit-loss${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },
  getCashFlow: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `${API_BASE}/api/financial-reports/cash-flow${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },
  exportReport: async (reportType: string, format: string, startDate?: string, endDate?: string, asOfDate?: string) => {
    const params = new URLSearchParams({ reportType, format });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (asOfDate) params.append('asOfDate', asOfDate);
    const url = `${API_BASE}/api/financial-reports/export?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (format === 'csv' || format === 'pdf') return res.blob();
    return res.json();
  },
  getComparative: async (reportType: string, period1Start: string, period1End: string, period2Start: string, period2End: string) => {
    const params = new URLSearchParams({ reportType, period1Start, period1End, period2Start, period2End });
    const url = `${API_BASE}/api/financial-reports/comparative?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },
  getAccountTransactions: async (accountId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `${API_BASE}/api/financial-reports/account-transactions/${accountId}${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  }
};

export const bankReconciliationApi = {
  uploadStatement: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/bank-reconciliation/statements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getStatements: async (accountId?: string) => {
    const url = accountId ? `${API_BASE}/api/bank-reconciliation/statements?accountId=${accountId}` : `${API_BASE}/api/bank-reconciliation/statements`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },
  startReconciliation: async (statementId: string) => {
    const res = await fetch(`${API_BASE}/api/bank-reconciliation/statements/${statementId}/reconcile`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  completeReconciliation: async (id: string, adjustments: any[]) => {
    const res = await fetch(`${API_BASE}/api/bank-reconciliation/reconciliations/${id}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adjustments })
    });
    return res.json();
  },
  getReconciliations: async (accountId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (status) params.append('status', status);
    const url = `${API_BASE}/api/bank-reconciliation/reconciliations${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },
  bulkMatch: async (reconciliationId: string, matches: any[]) => {
    const res = await fetch(`${API_BASE}/api/bank-reconciliation/reconciliations/bulk-match`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reconciliationId, matches })
    });
    return res.json();
  },
  getOutstandingItems: async (accountId: string) => {
    const res = await fetch(`${API_BASE}/api/bank-reconciliation/reconciliations/outstanding/${accountId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};