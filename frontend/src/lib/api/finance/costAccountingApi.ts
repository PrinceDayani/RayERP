const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const costAccountingApi = {
  getCostCenters: () => fetch(`${API_BASE}/api/cost-accounting/centers`),
  getAllocations: () => fetch(`${API_BASE}/api/cost-accounting/allocations`),
  getProjectCosts: () => fetch(`${API_BASE}/api/cost-accounting/projects`)
};