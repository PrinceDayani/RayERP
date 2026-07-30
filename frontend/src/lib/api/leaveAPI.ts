import api from './api';
import { unwrapResponse } from './unwrap';

export interface Leave {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  leaveType: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'emergency';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedDate?: string;
  rejectionReason?: string;
  documents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  sick: { used: number; total: number };
  vacation: { used: number; total: number };
  personal: { used: number; total: number };
  maternity: { used: number; total: number };
  paternity: { used: number; total: number };
  emergency: { used: number; total: number };
}

export const leaveAPI = {
  getAll: async (params?: { status?: string; employee?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/leaves', { params });
    return unwrapResponse(response.data);
  },

  apply: async (leaveData: { employee: string; leaveType: string; startDate: string; endDate: string; reason: string }) => {
    const response = await api.post('/leaves', leaveData);
    return unwrapResponse(response.data);
  },

  create: async (leaveData: { employee: string; leaveType: string; startDate: string; endDate: string; reason: string }) => {
    const response = await api.post('/leaves', leaveData);
    return unwrapResponse(response.data);
  },

  cancel: async (id: string) => {
    const response = await api.put(`/leaves/${id}/status`, { status: 'cancelled' });
    return unwrapResponse(response.data);
  },

  updateStatus: async (id: string, statusData: { status: string; approvedBy?: string; rejectionReason?: string }) => {
    const response = await api.put(`/leaves/${id}/status`, statusData);
    return unwrapResponse(response.data);
  },

  getBalance: async (employeeId: string): Promise<LeaveBalance> => {
    const response = await api.get(`/leaves/balance/${employeeId}`);
    return unwrapResponse(response.data);
  },

  getTodayLeaves: async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get('/leaves', { 
      params: { 
        status: 'approved',
        startDate: today,
        endDate: today 
      } 
    });
    return { onLeave: unwrapResponse<any[]>(response.data).length };
  }
};

export default leaveAPI;
