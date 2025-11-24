import api from './api';

export interface EmployeeReportData {
  employee: {
    _id: string;
    employeeId: string;
    name: string;
    department: string;
    position: string;
    salary: number;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    totalHours: number;
  };
  leaves: {
    totalLeaves: number;
    leavesByType: Record<string, number>;
  };
}

export const employeeReportAPI = {
  getEmployeeReport: async (params?: { startDate?: string; endDate?: string; department?: string }) => {
    const response = await api.get('/employee-reports/employee-report', { params });
    return response.data;
  },

  getDepartmentSummary: async () => {
    const response = await api.get('/employee-reports/department-summary');
    return response.data;
  },

  getAttendanceSummary: async (month: string, year: string) => {
    const response = await api.get('/employee-reports/attendance-summary', { params: { month, year } });
    return response.data;
  }
};

export default employeeReportAPI;
