import api from './api';

export interface ProjectPermission {
  _id: string;
  project: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  permissions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const projectPermissionsAPI = {
  // Get all permissions for a project
  getProjectPermissions: async (projectId: string): Promise<ProjectPermission[]> => {
    const response = await api.get(`/projects/${projectId}/permissions`);
    return response.data.data;
  },

  // Set permissions for an employee on a project
  setProjectPermissions: async (
    projectId: string, 
    employeeId: string, 
    permissions: string[]
  ): Promise<ProjectPermission> => {
    const response = await api.post(`/projects/${projectId}/permissions`, {
      employeeId,
      permissions
    });
    return response.data.data;
  },

  // Get permissions for a specific employee on a project
  getEmployeeProjectPermissions: async (
    projectId: string, 
    employeeId: string
  ): Promise<string[]> => {
    const response = await api.get(`/projects/${projectId}/permissions/${employeeId}`);
    return response.data.data;
  },

  // Remove permissions for an employee on a project
  removeProjectPermissions: async (
    projectId: string, 
    employeeId: string
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/permissions/${employeeId}`);
  },

  // Bulk set permissions for multiple employees
  bulkSetPermissions: async (
    projectId: string,
    permissions: { [employeeId: string]: string[] }
  ): Promise<void> => {
    const promises = Object.entries(permissions).map(([employeeId, perms]) =>
      projectPermissionsAPI.setProjectPermissions(projectId, employeeId, perms)
    );
    await Promise.all(promises);
  }
};

export default projectPermissionsAPI;