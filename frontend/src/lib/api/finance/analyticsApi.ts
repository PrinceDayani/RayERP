const API_BASE = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export const analyticsApi = {
  getKPIs: () => fetch(`${API_BASE}/api/analytics/kpis`),
  getRevenueTrends: () => fetch(`${API_BASE}/api/analytics/revenue-trends`),
  getProfitability: () => fetch(`${API_BASE}/api/analytics/profitability`),
  getFinancialHealth: () => fetch(`${API_BASE}/api/analytics/financial-health`)
};
