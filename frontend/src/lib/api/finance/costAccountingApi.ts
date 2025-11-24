const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

export const costAccountingApi = {
  getCostCenters: () => fetch(`${API_BASE}/api/cost-accounting/centers`),
  getAllocations: () => fetch(`${API_BASE}/api/cost-accounting/allocations`),
  getProjectCosts: () => fetch(`${API_BASE}/api/cost-accounting/projects`)
};
