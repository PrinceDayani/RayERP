import api from './api';

// ==========================================
// TYPES
// ==========================================

export interface Activity {
  _id?: string;
  description: string;
  category: 'construction' | 'procurement' | 'design' | 'inspection' | 'administrative' | 'other';
  hoursSpent: number;
  quantityCompleted?: string;
  attachments?: string[];
}

export interface Blocker {
  _id?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: { _id: string; name: string; email?: string };
}

export interface ReportFinancials {
  paymentsProcessed: number;
  invoicesReceived: number;
  vendor?: string;
  paymentReference?: string;
}

export interface DailyReport {
  _id: string;
  reportedBy: { _id: string; name: string; email?: string };
  project: { _id: string; name: string } | string;
  reportDate: string;
  reportType: 'daily' | 'weekly' | 'milestone';
  activities: Activity[];
  financials?: ReportFinancials;
  blockers: Blocker[];
  nextSteps: string[];
  notes?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  acknowledgedBy?: { _id: string; name: string; email?: string };
  acknowledgedAt?: string;
  totalHours: number;
  customFieldValues?: Record<string, any>;
  templateVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export type TemplateFieldType = 'text' | 'number' | 'select' | 'date' | 'photo';

export interface TemplateSection {
  key: string;
  label: string;
  required: boolean;
  helpText?: string;
}

export interface TemplateCustomField {
  key: string;
  label: string;
  type: TemplateFieldType;
  options?: string[];
  required: boolean;
  helpText?: string;
}

export interface ReportTemplate {
  version: number;
  sections: TemplateSection[];
  customFields: TemplateCustomField[];
  requiredActivityCategories: string[];
  requireBlockers: boolean;
  requireNextSteps: boolean;
  requireFinancials: boolean;
}

export interface FinancialEntry {
  _id: string;
  project: string;
  entryType: 'payment-made' | 'payment-received' | 'invoice-raised' | 'expense';
  amount: number;
  currency: string;
  description: string;
  vendorOrClient?: string;
  department?: { _id: string; name: string };
  referenceNumber?: string;
  date: string;
  reportedBy: { _id: string; name: string; email?: string };
  approvedBy?: { _id: string; name: string; email?: string };
  approvedAt?: string;
  attachments: string[];
  category: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'overhead' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportingSchedule {
  _id: string;
  project: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dueTime: string;
  dueDay?: number;
  dueDateOfMonth?: number;
  requiredFrom: { user: { _id: string; name: string; email?: string }; role: string }[];
  reminderEnabled: boolean;
  reminderBeforeMinutes: number;
  escalateOnMiss: boolean;
  escalateTo?: { _id: string; name: string; email?: string };
  isActive: boolean;
  template?: ReportTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressSummary {
  projectId: string;
  projectName: string;
  projectType: 'instruction' | 'reporting';
  progressMode: 'task-based' | 'financial';
  effectiveProgress: number;
  financial: {
    budget: number;
    currency: string;
    totalSpent: number;
    totalReceived: number;
    remaining: number;
    progress: number;
  };
  tasks: {
    total: number;
    completed: number;
    progress: number;
  };
  reporting: {
    reportsLast7Days: number;
    unresolvedBlockers: number;
  };
  healthScore: 'healthy' | 'at-risk' | 'critical';
}

export interface FinancialSummary {
  budget: number;
  currency: string;
  totalSpent: number;
  totalReceived: number;
  remaining: number;
  financialProgress: number;
  pendingEntries: number;
  paymentsMadeCount: number;
  paymentsReceivedCount: number;
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
}

export interface ReportingStatus {
  date: string;
  totalMembers: number;
  reported: number;
  pending: number;
  complianceRate: number;
  members: {
    user: { _id: string; name: string; email?: string };
    hasReported: boolean;
    report: DailyReport | null;
  }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ReportsFeedFilters {
  projectIds?: string[];
  userIds?: string[];
  from?: string;
  to?: string;
  status?: 'draft' | 'submitted' | 'acknowledged';
  hasBlockers?: boolean;
  page?: number;
  limit?: number;
}

export interface ReportsMatrixMember {
  _id: string;
  name: string;
  email?: string;
}

export interface ReportsMatrixProject {
  _id: string;
  name: string;
}

export interface ReportsMatrixCell {
  hasReported: boolean;
  hours: number;
  status: string;
}

export interface ReportsMatrix {
  members: ReportsMatrixMember[];
  projects: ReportsMatrixProject[];
  cells: Record<string, ReportsMatrixCell>;
  range: { from: string; to: string; days: number };
}

export interface ReportsFeedSummary {
  reportsToday: number;
  pendingAcknowledgments: number;
  openBlockers: number;
  complianceLast7d: number;
}

// ==========================================
// API FUNCTIONS
// ==========================================

export const projectReportingAPI = {
  // --- Daily Reports ---

  createReport: async (projectId: string, data: Partial<DailyReport>) => {
    const response = await api.post(`/projects/${projectId}/reports`, data);
    return response.data;
  },

  getProjectReports: async (projectId: string, params?: Record<string, any>) => {
    const response = await api.get(`/projects/${projectId}/reports`, { params });
    return response.data;
  },

  getMyReports: async (projectId: string, params?: Record<string, any>) => {
    const response = await api.get(`/projects/${projectId}/reports/my`, { params });
    return response.data;
  },

  getReportById: async (projectId: string, reportId: string) => {
    const response = await api.get(`/projects/${projectId}/reports/${reportId}`);
    return response.data;
  },

  updateReport: async (projectId: string, reportId: string, data: Partial<DailyReport>) => {
    const response = await api.put(`/projects/${projectId}/reports/${reportId}`, data);
    return response.data;
  },

  acknowledgeReport: async (projectId: string, reportId: string) => {
    const response = await api.patch(`/projects/${projectId}/reports/${reportId}/acknowledge`);
    return response.data;
  },

  deleteReport: async (projectId: string, reportId: string) => {
    const response = await api.delete(`/projects/${projectId}/reports/${reportId}`);
    return response.data;
  },

  getReportingStatus: async (projectId: string, date?: string) => {
    const response = await api.get(`/projects/${projectId}/reporting-status`, { params: { date } });
    return response.data;
  },

  // --- Financial Entries ---

  createFinancialEntry: async (projectId: string, data: Partial<FinancialEntry>) => {
    const response = await api.post(`/projects/${projectId}/financial-entries`, data);
    return response.data;
  },

  getFinancialEntries: async (projectId: string, params?: Record<string, any>) => {
    const response = await api.get(`/projects/${projectId}/financial-entries`, { params });
    return response.data;
  },

  approveFinancialEntry: async (projectId: string, entryId: string) => {
    const response = await api.patch(`/projects/${projectId}/financial-entries/${entryId}/approve`);
    return response.data;
  },

  rejectFinancialEntry: async (projectId: string, entryId: string, reason: string) => {
    const response = await api.patch(`/projects/${projectId}/financial-entries/${entryId}/reject`, { reason });
    return response.data;
  },

  deleteFinancialEntry: async (projectId: string, entryId: string) => {
    const response = await api.delete(`/projects/${projectId}/financial-entries/${entryId}`);
    return response.data;
  },

  getFinancialSummary: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/financial-summary`);
    return response.data;
  },

  // --- Reporting Schedule ---

  upsertSchedule: async (projectId: string, data: Partial<ReportingSchedule>) => {
    const response = await api.post(`/projects/${projectId}/reporting-schedule`, data);
    return response.data;
  },

  getSchedule: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/reporting-schedule`);
    return response.data;
  },

  deactivateSchedule: async (projectId: string) => {
    const response = await api.delete(`/projects/${projectId}/reporting-schedule`);
    return response.data;
  },

  // --- Progress ---

  getProgressSummary: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/progress-summary`);
    return response.data;
  },

  generateSnapshot: async (projectId: string, period?: string) => {
    const response = await api.post(`/projects/${projectId}/progress-snapshot`, { period });
    return response.data;
  },

  getProgressHistory: async (projectId: string, params?: Record<string, any>) => {
    const response = await api.get(`/projects/${projectId}/progress-history`, { params });
    return response.data;
  },

  // --- Blockers ---

  getUnresolvedBlockers: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/blockers`);
    return response.data;
  },

  resolveBlocker: async (projectId: string, reportId: string, blockerId: string) => {
    const response = await api.patch(`/projects/${projectId}/reports/${reportId}/blockers/${blockerId}/resolve`);
    return response.data;
  },

  // --- Export ---

  exportFinancialEntriesCSV: (projectId: string, params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '';
    return `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/financial-entries/export${query}`;
  },

  // --- Reminders ---

  triggerReminderCheck: async () => {
    const response = await api.post(`/projects/system/check-overdue-reports`);
    return response.data;
  },

  // --- Bulk Operations ---

  bulkAcknowledgeReports: async (projectId: string, reportIds: string[]) => {
    const response = await api.post(`/projects/${projectId}/reports/bulk-acknowledge`, { reportIds });
    return response.data;
  },

  bulkApproveEntries: async (projectId: string, entryIds: string[]) => {
    const response = await api.post(`/projects/${projectId}/financial-entries/bulk-approve`, { entryIds });
    return response.data;
  },

  // --- Weekly Summary ---

  getWeeklySummary: async (projectId: string, weekStart?: string) => {
    const response = await api.get(`/projects/${projectId}/weekly-summary`, { params: { weekStart } });
    return response.data;
  },

  // --- Org-wide Reporting Dashboard ---

  getReportsFeed: async (filters: ReportsFeedFilters = {}) => {
    const params: Record<string, any> = {};
    if (filters.projectIds && filters.projectIds.length) params.projectIds = filters.projectIds.join(',');
    if (filters.userIds && filters.userIds.length) params.userIds = filters.userIds.join(',');
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.status) params.status = filters.status;
    if (filters.hasBlockers) params.hasBlockers = 'true';
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    const response = await api.get(`/reporting/feed`, { params });
    return response.data as PaginatedResponse<DailyReport>;
  },

  getReportsMatrix: async (params: { from?: string; to?: string; projectIds?: string[] } = {}) => {
    const query: Record<string, any> = {};
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    if (params.projectIds && params.projectIds.length) query.projectIds = params.projectIds.join(',');
    const response = await api.get(`/reporting/matrix`, { params: query });
    return response.data as { success: boolean; data: ReportsMatrix };
  },

  getReportsFeedSummary: async () => {
    const response = await api.get(`/reporting/summary`);
    return response.data as { success: boolean; data: ReportsFeedSummary };
  },

  // --- Global single-report (cross-project, addressed by report id only) ---

  getReport: async (reportId: string) => {
    const response = await api.get(`/reporting/reports/${reportId}`);
    return response.data as { success: boolean; data: DailyReport };
  },

  updateReportGlobal: async (reportId: string, data: Partial<DailyReport>) => {
    const response = await api.put(`/reporting/reports/${reportId}`, data);
    return response.data as { success: boolean; data: DailyReport };
  },

  acknowledgeReportGlobal: async (reportId: string) => {
    const response = await api.patch(`/reporting/reports/${reportId}/acknowledge`);
    return response.data as { success: boolean; data: DailyReport };
  },

  deleteReportGlobal: async (reportId: string) => {
    const response = await api.delete(`/reporting/reports/${reportId}`);
    return response.data as { success: boolean; message: string };
  },

  resolveBlockerGlobal: async (reportId: string, blockerId: string) => {
    const response = await api.patch(`/reporting/reports/${reportId}/blockers/${blockerId}/resolve`);
    return response.data as { success: boolean; data: DailyReport };
  },

  // --- Global schedule (cross-project, addressed by schedule id) ---

  listSchedules: async () => {
    const response = await api.get(`/reporting/schedules`);
    return response.data as { success: boolean; data: ReportingSchedule[] };
  },

  getScheduleById: async (scheduleId: string) => {
    const response = await api.get(`/reporting/schedules/${scheduleId}`);
    return response.data as { success: boolean; data: ReportingSchedule };
  },

  updateScheduleGlobal: async (scheduleId: string, data: Partial<ReportingSchedule>) => {
    const response = await api.put(`/reporting/schedules/${scheduleId}`, data);
    return response.data as { success: boolean; data: ReportingSchedule };
  },

  deactivateScheduleGlobal: async (scheduleId: string) => {
    const response = await api.delete(`/reporting/schedules/${scheduleId}`);
    return response.data as { success: boolean; data: ReportingSchedule; message: string };
  }
};
