import { apiClient } from '../api';

export interface TaxRecord {
  _id: string;
  type: 'GST' | 'VAT' | 'TDS' | 'Income Tax' | 'Sales Tax';
  amount: number;
  rate: number;
  status: 'Pending' | 'Filed' | 'Paid' | 'Overdue';
  dueDate: string;
  period: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRecord {
  type: 'GST' | 'VAT' | 'TDS' | 'Income Tax' | 'Sales Tax';
  amount: number;
  rate: number;
  period: string;
  description: string;
  dueDate: string;
}

export const taxAPI = {
  // Get all tax records
  getTaxRecords: async (params?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return apiClient.get(`/api/tax-management${query ? `?${query}` : ''}`);
  },

  // Get single tax record
  getTaxRecord: async (id: string) => {
    return apiClient.get(`/api/tax-management/${id}`);
  },

  // Create tax record
  createTaxRecord: async (data: CreateTaxRecord) => {
    return apiClient.post('/api/tax-management', data);
  },

  // Update tax record
  updateTaxRecord: async (id: string, data: Partial<CreateTaxRecord>) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tax-management/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Delete tax record
  deleteTaxRecord: async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tax-management/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    return response.json();
  },

  // Get tax statistics
  getTaxStats: async () => {
    return apiClient.get('/api/tax-management/stats');
  },

  // Get tax liabilities
  getTaxLiabilities: async () => {
    return apiClient.get('/api/tax-management/liabilities');
  },

  // Calculate TDS
  calculateTDS: async (amount: number, rate: number) => {
    return apiClient.post('/api/tax-management/calculate-tds', { amount, rate });
  },

  // Calculate income tax
  calculateIncomeTax: async (income: number, deductions?: number) => {
    return apiClient.post('/api/tax-management/calculate-income-tax', { income, deductions });
  }
};