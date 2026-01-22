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
  getTrends: async (): Promise<TrendsResponse | null> => {
    try {
      const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/dashboard/trends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trends:', error);
      return null;
    }
  }
};

export { trendsAPI };
export default trendsAPI;