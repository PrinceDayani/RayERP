const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const analyticsApi = {
  getKPIs: () => fetch(`${API_BASE}/api/analytics/kpis`),
  getRevenueTrends: () => fetch(`${API_BASE}/api/analytics/revenue-trends`),
  getProfitability: () => fetch(`${API_BASE}/api/analytics/profitability`),
  getFinancialHealth: () => fetch(`${API_BASE}/api/analytics/financial-health`)
};