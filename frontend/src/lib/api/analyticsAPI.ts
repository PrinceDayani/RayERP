import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AnalyticsResponse {
  projectProgress: Array<{ name: string; progress: number; status: string }>;
  taskDistribution: Array<{ name: string; value: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number }>;
  recentActivity: Array<{ id: string; type: string; description: string; time: string }>;
}

const analyticsAPI = {
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const token = localStorage.getItem('auth-token') || localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/dashboard/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};

export { analyticsAPI };
export default analyticsAPI;
