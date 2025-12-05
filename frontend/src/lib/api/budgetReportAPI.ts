import api from './axios';

export interface BudgetReport {
  _id: string;
  reportType: 'summary' | 'detailed' | 'variance' | 'forecast' | 'comparison' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters: any;
  fileUrl: string;
  fileSize: number;
  generatedBy: { _id: string; name: string };
  generatedAt: string;
  expiresAt: string;
}

export interface GenerateReportRequest {
  reportType: 'summary' | 'detailed' | 'variance' | 'forecast' | 'comparison' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters?: {
    fiscalYear?: string;
    departmentId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

export const budgetReportAPI = {
  generateReport: async (data: GenerateReportRequest) => {
    const response = await api.post('/budget-reports/generate', data);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/budget-reports');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/budget-reports/statistics');
    return response.data;
  },

  getReportDetails: async (reportId: string) => {
    const response = await api.get(`/budget-reports/${reportId}`);
    return response.data;
  },

  downloadReport: async (reportId: string) => {
    const response = await api.get(`/budget-reports/${reportId}/download`, { responseType: 'blob' });
    return response.data;
  },

  deleteReport: async (reportId: string) => {
    const response = await api.delete(`/budget-reports/${reportId}`);
    return response.data;
  },
};
