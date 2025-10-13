const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const accountApi = {
  getClientAccounts: () => fetch(`${API_BASE}/api/accounts/clients`),
  getAgingReports: () => fetch(`${API_BASE}/api/accounts/aging`),
  getCreditManagement: () => fetch(`${API_BASE}/api/accounts/credit`)
};