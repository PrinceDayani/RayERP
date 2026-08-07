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
  progressMode?: 'task-based' | 'financial';
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
  milestones?: Milestone[];
  risks?: Risk[];
  dependencies?: string[];
  template?: string;
  createdAt: string;
  updatedAt: string;
}

export type { Task };

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  projectType?: string;
  tag?: string;
  q?: string;
  sort?: 'recent' | 'created' | 'name' | 'endDate' | 'startDate' | 'progress';
}

export interface PaginatedProjects {
  data: Project[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const projectsAPI = {
  // Projects. Without paging params the API returns a bare array, so this
  // keeps returning one for existing callers.
  getAll: async (params: ProjectListParams = {}) => {
    const response = await api.get("/projects", { params });
    return unwrapResponse(response.data);
  },

  // Server-side filtered and paged listing.
  getPaged: async (params: ProjectListParams): Promise<PaginatedProjects> => {
    const response = await api.get("/projects", {
      params: { page: 1, limit: 25, ...params }
    });
    return {
      data: response.data?.data ?? [],
      pagination: response.data?.pagination ?? { page: 1, limit: 25, total: 0, pages: 0 }
    };
  },

  // Id/name pairs for dropdowns.
  getMinimal: async () => {
    const response = await api.get("/projects/minimal");
    return unwrapResponse(response.data);
  },

  restore: async (id: string) => {
    const response = await api.post(`/projects/${id}/restore`);
    return unwrapResponse(response.data);
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

  archive: async (id: string) => {
    const response = await api.patch(`/projects/${id}/status`, { status: 'archived' });
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

  // Milestones
  updateMilestones: async (projectId: string, milestones: Milestone[]) => {
    const response = await api.put(`/projects/${projectId}/milestones`, { milestones });
    return unwrapResponse(response.data);
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
export const getProjectById = projectsAPI.getById;
export const createProject = projectsAPI.create;
export const editProject = projectsAPI.edit;
export const updateProject = projectsAPI.update;
export const deleteProject = projectsAPI.delete;
export const archiveProject = projectsAPI.archive;
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
export const updateProjectMilestones = projectsAPI.updateMilestones;
export const updateProjectRisks = projectsAPI.updateRisks;
export const cloneProject = projectsAPI.cloneProject;
export const calculateProjectProgress = projectsAPI.calculateProgress;
export const getProjectTemplates = projectsAPI.getTemplates;
export const getProjectsPaged = projectsAPI.getPaged;
export const getProjectsMinimal = projectsAPI.getMinimal;
export const restoreProject = projectsAPI.restore;

export default projectsAPI;
