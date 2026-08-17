//path: frontend/src/lib/api/projectsAPI.ts
import api from './api';
import { Task } from './tasksAPI';
import { unwrapResponse } from './unwrap';

export interface Milestone {
  _id?: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedDate?: string;
}

export interface Risk {
  _id?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation?: string;
  status: 'identified' | 'mitigated' | 'resolved';
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  projectType?: 'instruction' | 'reporting';
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  spentBudget?: number;
  currency: string;
  progress: number;
  progressMode?: 'task-based' | 'financial' | 'phase-based';
  autoCalculateProgress?: boolean;
  financialProgress?: {
    totalContractValue: number;
    totalPaymentsReceived: number;
    totalPaymentsMade: number;
    financialProgress: number;
    lastUpdated: string;
    departmentBreakdown?: {
      department: string;
      allocated: number;
      spent: number;
      received: number;
    }[];
  };
  managers: string[];
  team: string[];
  departments?: string[];
  client?: string;
  tags?: string[];
  /** Milestones live on ProjectPhase — see projectPhasesAPI. */
  risks?: Risk[];
  dependencies?: string[];
  template?: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProjects {
  success: boolean;
  data: Project[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  archived?: 'true' | 'all';
  status?: string;
  priority?: string;
  search?: string;
  sort?: 'recent' | 'name' | 'progress' | 'dueDate';
}

export type { Task };

export const projectsAPI = {
  // Projects
  getAll: async (params = {}) => {
    const response = await api.get("/projects", { params });
    return response.data;
  },

  // Paginated variant: keeps the `pagination` envelope the bare `getAll` discards.
  getAllPaginated: async (params: ProjectListParams): Promise<PaginatedProjects> => {
    const response = await api.get("/projects", { params });
    return response.data as PaginatedProjects;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return unwrapResponse(response.data);
  },

  create: async (projectData: Partial<Project>) => {
    const response = await api.post("/projects", projectData);
    return unwrapResponse(response.data);
  },

  edit: async (id: string, projectData: Partial<Project>) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return unwrapResponse(response.data);
  },

  update: async (id: string, projectData: Partial<Project>) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return unwrapResponse(response.data);
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return unwrapResponse(response.data);
  },

  archive: async (id: string): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/archive`);
    return unwrapResponse(response.data);
  },

  unarchive: async (id: string): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/unarchive`);
    return unwrapResponse(response.data);
  },

  manageTeam: async (id: string, action: 'add' | 'remove', memberId: string) => {
    if (action === 'add') {
      const response = await api.post(`/projects/${id}/members`, { memberId });
      return response.data;
    } else {
      const response = await api.delete(`/projects/${id}/members/${memberId}`);
      return response.data;
    }
  },

  // Tasks
  getTasks: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  createTask: async (projectId: string, taskData: Partial<Task>) => {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  updateTask: async (projectId: string, taskId: string, taskData: Partial<Task>) => {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
  },

  deleteTask: async (projectId: string, taskId: string) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  // Dashboard stats
  getStats: async () => {
    const response = await api.get("/projects/stats");
    return unwrapResponse(response.data);
  },

  // Reports
  getProjectReports: async (fromDate?: string, toDate?: string) => {
    const params = { fromDate, toDate };
    const response = await api.get("/projects/reports", { params });
    return response.data;
  },

  getTaskReports: async (fromDate?: string, toDate?: string) => {
    const params = { fromDate, toDate };
    const response = await api.get("/tasks/reports", { params });
    return response.data;
  },

  getTeamProductivity: async (fromDate?: string, toDate?: string) => {
    const params = { fromDate, toDate };
    const response = await api.get("/reports/team-productivity", { params });
    return response.data;
  },

  // Timeline data
  getTimelineData: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/timeline-data`);
    return response.data;
  },

  getAllTimelineData: async () => {
    const response = await api.get("/projects/timeline-data");
    return response.data;
  },

  // Risks
  updateRisks: async (projectId: string, risks: Risk[]) => {
    const response = await api.put(`/projects/${projectId}/risks`, { risks });
    return unwrapResponse(response.data);
  },

  // Clone project
  cloneProject: async (projectId: string) => {
    const response = await api.post(`/projects/${projectId}/clone`);
    return response.data;
  },

  // Calculate progress
  calculateProgress: async (projectId: string) => {
    const response = await api.post(`/projects/${projectId}/calculate-progress`);
    return unwrapResponse(response.data);
  },

  // Templates
  getTemplates: async () => {
    const response = await api.get("/projects/templates/list");
    return unwrapResponse(response.data);
  },

  // Optimized data loading
  getEmployeesMinimal: async () => {
    const response = await api.get("/projects/employees/minimal");
    return unwrapResponse(response.data);
  },

  getDepartmentsMinimal: async () => {
    const response = await api.get("/projects/departments/minimal");
    return unwrapResponse(response.data);
  },
};

export const getAllProjects = projectsAPI.getAll;
export const getAllProjectsPaginated = projectsAPI.getAllPaginated;
export const getProjectById = projectsAPI.getById;
export const createProject = projectsAPI.create;
export const editProject = projectsAPI.edit;
export const updateProject = projectsAPI.update;
export const deleteProject = projectsAPI.delete;
export const archiveProject = projectsAPI.archive;
export const unarchiveProject = projectsAPI.unarchive;
export const manageProjectTeam = projectsAPI.manageTeam;
export const getProjectTasks = projectsAPI.getTasks;
export const createProjectTask = projectsAPI.createTask;
export const updateProjectTask = projectsAPI.updateTask;
export const deleteProjectTask = projectsAPI.deleteTask;
export const getProjectStats = projectsAPI.getStats;
export const getProjectReports = projectsAPI.getProjectReports;
export const getTaskReports = projectsAPI.getTaskReports;
export const getTeamProductivity = projectsAPI.getTeamProductivity;
export const getProjectTimelineData = projectsAPI.getTimelineData;
export const getAllProjectsTimelineData = projectsAPI.getAllTimelineData;
export const updateProjectRisks = projectsAPI.updateRisks;
export const cloneProject = projectsAPI.cloneProject;
export const calculateProjectProgress = projectsAPI.calculateProgress;
export const getProjectTemplates = projectsAPI.getTemplates;

export default projectsAPI;
