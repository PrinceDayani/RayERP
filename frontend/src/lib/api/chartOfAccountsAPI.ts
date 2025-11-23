const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

const getToken = () => localStorage.getItem('auth-token');

export const chartOfAccountsAPI = {
  getTemplates: async () => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/templates`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  applyTemplate: async (templateId: string) => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/templates/${templateId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createMapping: async (data: any) => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getMappings: async (externalSystem?: string) => {
    const query = externalSystem ? `?externalSystem=${externalSystem}` : '';
    const res = await fetch(`${API_URL}/api/chart-of-accounts/mappings${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  setOpeningBalance: async (data: any) => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/opening-balances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getOpeningBalances: async (fiscalYear?: string) => {
    const query = fiscalYear ? `?fiscalYear=${fiscalYear}` : '';
    const res = await fetch(`${API_URL}/api/chart-of-accounts/opening-balances${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  bulkImport: async (accounts: any[]) => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ accounts })
    });
    return res.json();
  },

  exportCSV: async () => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/export`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.blob();
  },

  setRestriction: async (accountId: string, data: any) => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/${accountId}/restriction`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getConsolidation: async (accountIds: string[], startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ accountIds: accountIds.join(',') });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await fetch(`${API_URL}/api/chart-of-accounts/consolidation?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  updateReconciliation: async (accountId: string, data: any) => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/${accountId}/reconciliation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getReconciliationReport: async () => {
    const res = await fetch(`${API_URL}/api/chart-of-accounts/reconciliation`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  }
};
