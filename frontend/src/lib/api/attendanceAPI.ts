import api from './api';
import { unwrapResponse } from './unwrap';

export interface Attendance {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  // Set when the day was worked against a project; drives that project's
  // actual man-hours.
  project?: { _id: string; name: string; jobNumber?: string } | string;
  date: string;
  checkIn: string;
  checkOut?: string;
  breakTime: number;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  totalHours: number;
  averageHours: number;
}

export interface TodayStats {
  totalEmployees: number;
  presentToday: number;
  lateArrivals: number;
  totalHours: number;
  avgHours: number;
  attendanceRecords: Attendance[];
}

export const attendanceAPI = {
  getAll: async (params?: { startDate?: string; endDate?: string; employee?: string; project?: string }) => {
    const response = await api.get('/attendance', { params });
    return unwrapResponse(response.data);
  },

  getById: async (id: string) => {
    const response = await api.get(`/attendance/${id}`);
    return unwrapResponse(response.data);
  },

  checkIn: async (employee: string) => {
    const response = await api.post('/attendance/checkin', { employee });
    return response.data;
  },

  checkOut: async (employee: string) => {
    const response = await api.post('/attendance/checkout', { employee });
    return response.data;
  },

  getStats: async (params: { employeeId?: string; month: string; year: string }): Promise<AttendanceStats> => {
    const response = await api.get('/attendance/stats', { params });
    return unwrapResponse(response.data);
  },

  getTodayStats: async () => {
    const response = await api.get('/attendance/today-stats');
    return unwrapResponse(response.data);
  },

  mark: async (data: {
    employee: string;
    date: string;
    status: string;
    checkIn: string;
    checkOut?: string;
    notes?: string;
  }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },

  markAttendance: async (data: {
    employee: string;
    date: string;
    status: string;
    checkIn: string;
    checkOut?: string;
    notes?: string;
  }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },

  edit: async (id: string, data: {
    status?: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) => {
    const response = await api.put(`/attendance/${id}`, data);
    return unwrapResponse(response.data);
  },

  updateAttendance: async (id: string, data: {
    status?: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) => {
    const response = await api.put(`/attendance/${id}`, data);
    return unwrapResponse(response.data);
  },

  deleteAttendance: async (id: string) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};

export default attendanceAPI;
