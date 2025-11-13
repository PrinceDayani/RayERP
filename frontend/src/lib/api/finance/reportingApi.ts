const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const reportingApi = {
  getBalanceSheet: async (asOfDate?: string) => {
    const url = asOfDate ? `${API_BASE}/api/financial-reports/balance-sheet?asOfDate=${asOfDate}` : `${API_BASE}/api/financial-reports/balance-sheet`;
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
  exportReport: async (reportType: string, format: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ reportType, format });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `${API_BASE}/api/financial-reports/export?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (format === 'csv') return res.text();
    return res.json();
  },
  getComparative: async (reportType: string, period1Start: string, period1End: string, period2Start: string, period2End: string) => {
    const params = new URLSearchParams({ reportType, period1Start, period1End, period2Start, period2End });
    const url = `${API_BASE}/api/financial-reports/comparative?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  }
};