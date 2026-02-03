//path: frontend/src/lib/api/optimizedProjectsAPI.ts
import api from './api';
import { Project } from './projectsAPI';

export const optimizedProjectsAPI = {
  // Fast project creation
  createFast: async (projectData: Partial<Project>) => {
    const response = await api.post("/projects-fast/fast", projectData);
    return response.data;
  },

  // Fast data loading
  getEmployeesMinimal: async () => {
    const response = await api.get("/projects-fast/employees/minimal");
    return response.data;
  },

  getDepartmentsMinimal: async () => {
    const response = await api.get("/projects-fast/departments/minimal");
    return response.data;
  },
};

export default optimizedProjectsAPI;
