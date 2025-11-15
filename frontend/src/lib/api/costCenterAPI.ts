const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

export const costCenterAPI = {
  getAll: async (params?: { hierarchy?: boolean; departmentId?: string; projectId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_URL}/api/cost-centers?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_URL}/api/cost-centers/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  create: async (data: any) => {
    const res = await fetch(`${API_URL}/api/cost-centers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/api/cost-centers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_URL}/api/cost-centers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  allocate: async (data: any) => {
    const res = await fetch(`${API_URL}/api/cost-centers/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  transfer: async (data: any) => {
    const res = await fetch(`${API_URL}/api/cost-centers/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getProfitability: async (params: any) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/api/cost-centers/reports/profitability?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getVariance: async (costCenterId: string, period?: string) => {
    const query = new URLSearchParams({ costCenterId, period: period || '' }).toString();
    const res = await fetch(`${API_URL}/api/cost-centers/reports/variance?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  bulkImport: async (costCenters: any[]) => {
    const res = await fetch(`${API_URL}/api/cost-centers/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ costCenters })
    });
    return res.json();
  },

  exportCSV: async () => {
    const res = await fetch(`${API_URL}/api/cost-centers/export/csv`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.blob();
  }
};
