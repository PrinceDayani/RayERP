import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : 'http://localhost:5000/api';


// Achievement API
export const achievementAPI = {
    // Get all achievements for an employee
    getEmployeeAchievements: async (employeeId: string) => {
        const response = await axios.get(`${API_URL}/achievements/employee/${employeeId}`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Get achievement stats
    getAchievementStats: async (employeeId: string) => {
        const response = await axios.get(`${API_URL}/achievements/employee/${employeeId}/stats`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Get expiring certifications
    getExpiringCertifications: async (employeeId: string) => {
        const response = await axios.get(`${API_URL}/achievements/employee/${employeeId}/expiring`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Create achievement
    createAchievement: async (employeeId: string, data: any) => {
        const response = await axios.post(`${API_URL}/achievements/employee/${employeeId}`, data, {
            withCredentials: true,
        });
        return response.data;
    },

    // Update achievement
    updateAchievement: async (id: string, data: any) => {
        const response = await axios.put(`${API_URL}/achievements/${id}`, data, {
            withCredentials: true,
        });
        return response.data;
    },

    // Delete achievement
    deleteAchievement: async (id: string) => {
        const response = await axios.delete(`${API_URL}/achievements/${id}`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Verify achievement
    verifyAchievement: async (id: string) => {
        const response = await axios.post(`${API_URL}/achievements/${id}/verify`, {}, {
            withCredentials: true,
        });
        return response.data;
    },
};

// Career API
export const careerAPI = {
    // Get employee career history
    getEmployeeCareer: async (employeeId: string) => {
        const response = await axios.get(`${API_URL}/career/${employeeId}`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Get career stats
    getCareerStats: async (employeeId: string) => {
        const response = await axios.get(`${API_URL}/career/${employeeId}/stats`, {
            withCredentials: true,
        });
        return response.data;
    },

    // Get recent career events
    getRecentEvents: async (employeeId: string, limit?: number) => {
        const response = await axios.get(`${API_URL}/career/${employeeId}/recent`, {
            params: { limit },
            withCredentials: true,
        });
        return response.data;
    },

    // Add career event
    addCareerEvent: async (employeeId: string, data: any) => {
        const response = await axios.post(`${API_URL}/career/${employeeId}/events`, data, {
            withCredentials: true,
        });
        return response.data;
    },

    // Update career event
    updateCareerEvent: async (employeeId: string, eventId: string, data: any) => {
        const response = await axios.put(`${API_URL}/career/${employeeId}/events/${eventId}`, data, {
            withCredentials: true,
        });
        return response.data;
    },

    // Delete career event
    deleteCareerEvent: async (employeeId: string, eventId: string) => {
        const response = await axios.delete(`${API_URL}/career/${employeeId}/events/${eventId}`, {
            withCredentials: true,
        });
        return response.data;
    },
};
