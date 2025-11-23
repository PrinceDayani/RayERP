const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

export interface OnboardingData {
  name: string;
  email: string;
  password: string;
  role: string;
  roleIds: string[];
  projectAssignments: {
    projectId: string;
    accessLevel: 'read' | 'write' | 'admin';
  }[];
}

export const onboardingAPI = {
  async onboardUser(data: OnboardingData) {
    const response = await fetch(`${API_BASE_URL}/onboarding/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to onboard user');
    }

    return response.json();
  },

  async getResources() {
    const response = await fetch(`${API_BASE_URL}/onboarding/resources`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    return response.json();
  },

  async assignUserToProject(userId: string, projectId: string, accessLevel: 'read' | 'write' | 'admin') {
    const response = await fetch(`${API_BASE_URL}/onboarding/assign-project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify({ userId, projectId, accessLevel })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign user to project');
    }

    return response.json();
  },

  async getUserProjects(userId: string) {
    const response = await fetch(`${API_BASE_URL}/onboarding/user/${userId}/projects`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user projects');
    }

    return response.json();
  },

  async removeUserFromProject(userId: string, projectId: string) {
    const response = await fetch(`${API_BASE_URL}/onboarding/user/${userId}/project/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove user from project');
    }

    return response.json();
  }
};