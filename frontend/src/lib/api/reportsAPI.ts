const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const reportsAPI = {
  getOverview: async (params?: { from?: string; to?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_URL}/api/reports/overview?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  getEmployeeReports: async (params?: { from?: string; to?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_URL}/api/reports/employees?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch employee reports');
    return response.json();
  },

  getProjectReports: async (params?: { from?: string; to?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_URL}/api/reports/projects?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch project reports');
    return response.json();
  },

  getTaskReports: async (params?: { from?: string; to?: string; projectId?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_URL}/api/reports/tasks?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch task reports');
    return response.json();
  },

  getTeamProductivity: async (params?: { from?: string; to?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_URL}/api/reports/team-productivity?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch team productivity');
    return response.json();
  }
};
