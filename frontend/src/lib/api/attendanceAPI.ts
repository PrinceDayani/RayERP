import api from './api';

export interface Attendance {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
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
  getAll: async (params?: { startDate?: string; endDate?: string; employee?: string }) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
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
    return response.data;
  },

  getTodayStats: async () => {
    const response = await api.get('/attendance/today-stats');
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

  updateAttendance: async (id: string, data: {
    status?: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },

  deleteAttendance: async (id: string) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};

export default attendanceAPI;
