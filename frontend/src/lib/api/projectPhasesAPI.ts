//path: frontend/src/lib/api/projectPhasesAPI.ts
import api from './api';
import { unwrapResponse } from './unwrap';
import type { Milestone } from './projectsAPI';

export type PhaseStatus =
  | 'draft'
  | 'in-review'
  | 'changes-requested'
  | 'approved'
  | 'rejected'
  | 'in-progress'
  | 'completed'
  | 'on-hold'
  | 'cancelled';

export type PhaseReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes-requested' | 'skipped';

export interface PhaseDeliverable {
  _id?: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  documents: string[];
}

export interface PhaseReviewEntry {
  department: string | { _id: string; name: string };
  departmentName: string;
  stepId?: string;
  status: PhaseReviewStatus;
  decidedBy?: { _id: string; name: string; email: string } | string;
  decidedAt?: string;
  comments?: string;
  round: number;
}

export interface ProjectPhase {
  _id: string;
  project: string | { _id: string; name: string };
  name: string;
  description?: string;
  order: number;
  status: PhaseStatus;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget: number;
  spentBudget: number;
  progress: number;
  autoCalculateProgress: boolean;
  milestones: Milestone[];
  deliverables: PhaseDeliverable[];
  dependsOn: string[];
  reviewDepartments: Array<{ _id: string; name: string }> | string[];
  reviewTemplate?: string;
  reviewInstance?: string;
  reviewRound: number;
  reviewSummary: PhaseReviewEntry[];
  submittedForReviewAt?: string;
  submittedForReviewBy?: { _id: string; name: string } | string;
  reviewCompletedAt?: string;
  owner?: { _id: string; name: string; email: string } | string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PendingPhaseReview {
  instanceId: string;
  stepId: string;
  stepName: string;
  submittedAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  slaBreached: boolean;
  phase: ProjectPhase | null;
}

export const projectPhasesAPI = {
  list: async (projectId: string): Promise<ProjectPhase[]> => {
    const response = await api.get(`/projects/${projectId}/phases`);
    return unwrapResponse(response.data);
  },

  create: async (projectId: string, phase: Partial<ProjectPhase>): Promise<ProjectPhase> => {
    const response = await api.post(`/projects/${projectId}/phases`, phase);
    return unwrapResponse(response.data);
  },

  reorder: async (projectId: string, order: string[]): Promise<ProjectPhase[]> => {
    const response = await api.put(`/projects/${projectId}/phases/reorder`, { order });
    return unwrapResponse(response.data);
  },

  getById: async (phaseId: string): Promise<ProjectPhase> => {
    const response = await api.get(`/phases/${phaseId}`);
    return unwrapResponse(response.data);
  },

  update: async (phaseId: string, phase: Partial<ProjectPhase>): Promise<ProjectPhase> => {
    const response = await api.put(`/phases/${phaseId}`, phase);
    return unwrapResponse(response.data);
  },

  remove: async (phaseId: string) => {
    const response = await api.delete(`/phases/${phaseId}`);
    return unwrapResponse(response.data);
  },

  updateMilestones: async (phaseId: string, milestones: Milestone[]): Promise<ProjectPhase> => {
    const response = await api.put(`/phases/${phaseId}/milestones`, { milestones });
    return unwrapResponse(response.data);
  },

  submitForReview: async (
    phaseId: string,
    options: { templateId?: string; priority?: string } = {}
  ) => {
    const response = await api.post(`/phases/${phaseId}/submit-review`, options);
    return unwrapResponse(response.data);
  },

  review: async (
    phaseId: string,
    decision: 'approve' | 'reject' | 'request-changes',
    comments?: string,
    stepId?: string
  ) => {
    const response = await api.post(`/phases/${phaseId}/review`, { decision, comments, stepId });
    return unwrapResponse(response.data);
  },

  withdrawReview: async (phaseId: string, reason?: string): Promise<ProjectPhase> => {
    const response = await api.post(`/phases/${phaseId}/withdraw-review`, { reason });
    return unwrapResponse(response.data);
  },

  getPendingReviews: async (params: { page?: number; limit?: number } = {}) => {
    const response = await api.get('/phases/pending-review', { params });
    return response.data as {
      success: boolean;
      data: PendingPhaseReview[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  },

  getWorkflow: async (phaseId: string) => {
    const response = await api.get(`/phases/${phaseId}/workflow`);
    return unwrapResponse(response.data);
  }
};

export default projectPhasesAPI;
