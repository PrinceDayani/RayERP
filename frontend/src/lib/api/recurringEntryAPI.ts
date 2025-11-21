const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export const recurringEntryAPI = {
  getAll: async (token: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  create: async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/api/recurring-entries`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (token: string, id: string, data: any) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  skipNext: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}/skip-next`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getHistory: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getFailed: async (token: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/failed`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  retry: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}/retry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getPendingApprovals: async (token: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/pending-approvals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  approve: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  batchApprove: async (token: string, entryIds: string[]) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/batch-approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryIds })
    });
    return res.json();
  },

  getVersions: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/api/recurring-entries/${id}/versions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
