const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const reportingApi = {
  getBalanceSheet: () => fetch(`${API_BASE}/api/reports/balance-sheet`),
  getProfitLoss: () => fetch(`${API_BASE}/api/reports/profit-loss`),
  getCashFlow: () => fetch(`${API_BASE}/api/reports/cash-flow`),
  getFinancialRatios: () => fetch(`${API_BASE}/api/reports/ratios`),
  generateCustomReport: (config: any) => fetch(`${API_BASE}/api/reports/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
};