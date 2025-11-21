const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

export const wipApi = {
  getWorkOrders: () => fetch(`${API_BASE}/api/wip/work-orders`),
  getMaterialConsumption: () => fetch(`${API_BASE}/api/wip/materials`),
  getLaborTracking: () => fetch(`${API_BASE}/api/wip/labor`),
  getOverheadAllocation: () => fetch(`${API_BASE}/api/wip/overhead`),
  getProductionCosts: () => fetch(`${API_BASE}/api/wip/production-costs`)
};