const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export const financialReportsAPI = {
  getDrillDown: async (token: string, accountId: string, startDate: string, endDate: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/drill-down/${accountId}?startDate=${startDate}&endDate=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getComparative: async (token: string, period1Start: string, period1End: string, period2Start: string, period2End: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/comparative?period1Start=${period1Start}&period1End=${period1End}&period2Start=${period2Start}&period2End=${period2End}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getChartData: async (token: string, chartType: string, startDate: string, endDate: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/chart-data?chartType=${chartType}&startDate=${startDate}&endDate=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  filter: async (token: string, filters: any) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/filter`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    });
    return res.json();
  },

  getLiveData: async (token: string, reportType: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/live-data?reportType=${reportType}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getVarianceAnalysis: async (token: string, startDate: string, endDate: string, compareWith: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/variance-analysis?startDate=${startDate}&endDate=${endDate}&compareWith=${compareWith}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  scheduleEmail: async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/schedule-email`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  exportReport: async (token: string, reportType: string, format: string, startDate: string, endDate: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/export?reportType=${reportType}&format=${format}&startDate=${startDate}&endDate=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  saveCustomReport: async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/custom-report`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getCustomReports: async (token: string) => {
    const res = await fetch(`${API_URL}/api/financial-reports-enhanced/custom-reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
