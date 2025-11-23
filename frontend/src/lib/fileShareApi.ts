//path: frontend/src/lib/fileShareApi.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fileShareApi = {
  // Share a file with employees
  shareFile: async (fileId: string, employeeIds: string[], message?: string) => {
    const response = await fetch(`${API_URL}/api/file-shares/files/${fileId}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeIds, message })
    });
    
    if (!response.ok) {
      throw new Error('Failed to share file');
    }
    
    return response.json();
  },

  // Get all files shared with current user
  getSharedFiles: async () => {
    const response = await fetch(`${API_URL}/api/file-shares/shared`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch shared files');
    }
    
    return response.json();
  },

  // Get all shares for a specific file
  getFileShares: async (fileId: string) => {
    const response = await fetch(`${API_URL}/api/file-shares/files/${fileId}/shares`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch file shares');
    }
    
    return response.json();
  },

  // Get all file shares for a project
  getProjectShares: async (projectId: string) => {
    const response = await fetch(`${API_URL}/api/file-shares/projects/${projectId}/shares`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch project shares');
    }
    
    return response.json();
  },

  // Mark a shared file as viewed
  markAsViewed: async (shareId: string) => {
    const response = await fetch(`${API_URL}/api/file-shares/shares/${shareId}/viewed`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark as viewed');
    }
    
    return response.json();
  },

  // Mark a shared file as downloaded
  markAsDownloaded: async (shareId: string) => {
    const response = await fetch(`${API_URL}/api/file-shares/shares/${shareId}/downloaded`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark as downloaded');
    }
    
    return response.json();
  },

  // Delete a file share
  deleteShare: async (shareId: string) => {
    const response = await fetch(`${API_URL}/api/file-shares/shares/${shareId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete share');
    }
    
    return response.json();
  }
};
