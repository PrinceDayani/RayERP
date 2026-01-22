const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const analyticsApi = {
  getDashboardAnalytics: () => 
    fetch(`${API_BASE}/api/analytics/dashboard`, { headers: getAuthHeaders() }),
  
  getProductivityTrends: (params?: { period?: string; department?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/api/analytics/productivity-trends${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
  },
  
  getProjectDues: () => 
    fetch(`${API_BASE}/api/analytics/project-dues`, { headers: getAuthHeaders() }),
  
  getTopPerformers: (params?: { period?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetch(`${API_BASE}/api/analytics/top-performers${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
  },
  
  getBudgetAnalytics: () => 
    fetch(`${API_BASE}/api/analytics/budget-analytics`, { headers: getAuthHeaders() }),
  
  getComprehensiveAnalytics: () => 
    fetch(`${API_BASE}/api/dashboard/comprehensive-analytics`, { headers: getAuthHeaders() }),
  
  getFinancialAnalytics: () => 
    fetch(`${API_BASE}/api/analytics/financial`, { headers: getAuthHeaders() }),
  
  getFinancialRevenue: () => 
    fetch(`${API_BASE}/api/analytics/financial/revenue`, { headers: getAuthHeaders() }),
  
  getFinancialExpenses: () => 
    fetch(`${API_BASE}/api/analytics/financial/expenses`, { headers: getAuthHeaders() }),
  
  getInvoiceAnalytics: () => 
    fetch(`${API_BASE}/api/finance/invoices/analytics`, { headers: getAuthHeaders() })
};
