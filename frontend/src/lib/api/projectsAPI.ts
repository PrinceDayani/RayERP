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

export const PROJECT_CATEGORIES = [
  'construction',
  'infrastructure',
  'consultancy',
  'design',
  'supply',
  'maintenance',
  'software',
  'research',
  'other'
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface SiteLocation {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

/** The schedule and value the project was awarded on. Read-only once sourced from a tender. */
export interface ProjectBaseline {
  startDate?: string;
  endDate?: string;
  contractValue?: number;
  manHours?: number;
  source: 'tender' | 'manual';
  capturedAt: string;
}

export interface ProjectManHours {
  planned: number;
  actual: number;
  lastCalculatedAt?: string;
}

/** Client as it comes back populated from Contact. */
export interface ProjectClientContact {
  _id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Project {
  _id: string;
  name: string;
  jobNumber?: string;
  description: string;
  projectType?: 'instruction' | 'reporting';
  projectCategory?: ProjectCategory;
  startDate: string;
  endDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  baseline?: ProjectBaseline;
  manHours?: ProjectManHours;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived' | 'cancelled';
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
  clientContact?: string | ProjectClientContact;
  siteLocation?: SiteLocation;
  tender?: string;
  tags?: string[];
  /** Milestones live on ProjectPhase — see projectPhasesAPI. */
  risks?: Risk[];
  dependencies?: string[];
  template?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type { Task };

/**
 * Assignable person for operational refs (project team/managers, task
 * assignee/watchers, project permissions). These are Users, never Employees.
 */
export interface MinimalUser {
  _id: string;
  name: string;
  email: string;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  projectType?: string;
  tag?: string;
  /** Past end date and not completed/cancelled/archived. */
  overdue?: boolean;
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

  // Asks the project's owner and managers for an assignment. Grants nothing.
  requestAccess: async (id: string, payload: { reason: string; urgency: string }) => {
    const response = await api.post(`/projects/${id}/access-request`, payload);
    return response.data as { success: boolean; message: string };
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

  // The status endpoint enforces the legal transition map server-side.
  setStatus: async (id: string, status: Project['status']) => {
    const response = await api.patch(`/projects/${id}/status`, { status });
    return unwrapResponse(response.data);
  },

  archive: async (id: string) => projectsAPI.setStatus(id, 'archived'),

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

  // Recomputes planned vs actual man-hours from tasks, allocations, daily
  // reports and project-attributed attendance.
  recalculateManHours: async (projectId: string) => {
    const response = await api.post(`/projects/${projectId}/man-hours/recalculate`);
    return unwrapResponse(response.data) as ProjectManHours & { baselineManHours: number | null };
  },

  // Activities with no float, as flagged by the last critical-path run.
  getCriticalTasks: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/tasks`, { params: { critical: true } });
    return unwrapResponse(response.data);
  },

  // Templates
  getTemplates: async () => {
    const response = await api.get("/projects/templates/list");
    return unwrapResponse(response.data);
  },

  // Optimized data loading
  // Assignable users for team/manager pickers. These project fields ref User,
  // so this must not be sourced from the Employee (HR) rail.
  getUsersMinimal: async (): Promise<MinimalUser[]> => {
    const response = await api.get("/projects/users/minimal");
    return unwrapResponse(response.data) ?? [];
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
export const setProjectStatus = projectsAPI.setStatus;
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
export const recalculateProjectManHours = projectsAPI.recalculateManHours;
export const getProjectCriticalTasks = projectsAPI.getCriticalTasks;
export const getProjectTemplates = projectsAPI.getTemplates;
export const getProjectsPaged = projectsAPI.getPaged;
export const getProjectsMinimal = projectsAPI.getMinimal;
export const restoreProject = projectsAPI.restore;
export const requestProjectAccess = projectsAPI.requestAccess;

export default projectsAPI;
