//path: frontend/src/lib/api/projectsAPI.ts
import api from './api';
import { Task } from './tasksAPI';

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
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget: number;
  spentBudget?: number;
  progress: number;
  autoCalculateProgress?: boolean;
  manager: string;
  team: string[];
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

export const projectsAPI = {
  // Projects
  getAll: async (params = {}) => {
    const response = await api.get("/projects", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData: Partial<Project>) => {
    const response = await api.post("/projects", projectData);
    return response.data;
  },

  update: async (id: string, projectData: Partial<Project>) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
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
    return response.data;
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
    return response.data;
  },

  // Risks
  updateRisks: async (projectId: string, risks: Risk[]) => {
    const response = await api.put(`/projects/${projectId}/risks`, { risks });
    return response.data;
  },

  // Clone project
  cloneProject: async (projectId: string) => {
    const response = await api.post(`/projects/${projectId}/clone`);
    return response.data;
  },

  // Calculate progress
  calculateProgress: async (projectId: string) => {
    const response = await api.post(`/projects/${projectId}/calculate-progress`);
    return response.data;
  },

  // Templates
  getTemplates: async () => {
    const response = await api.get("/projects/templates/list");
    return response.data;
  },
};

export const getAllProjects = projectsAPI.getAll;
export const getProjectById = projectsAPI.getById;
export const createProject = projectsAPI.create;
export const updateProject = projectsAPI.update;
export const deleteProject = projectsAPI.delete;
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

export default projectsAPI;