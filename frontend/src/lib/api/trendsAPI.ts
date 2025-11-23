import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface TrendData {
  value: number;
  direction: 'up' | 'down';
}

export interface TrendsResponse {
  employees: TrendData;
  projects: TrendData;
  tasks: TrendData;
  revenue: TrendData;
  expenses: TrendData;
  profit: TrendData;
}

const trendsAPI = {
  getTrends: async (): Promise<TrendsResponse> => {
    const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/dashboard/trends`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};

export { trendsAPI };
export default trendsAPI;
