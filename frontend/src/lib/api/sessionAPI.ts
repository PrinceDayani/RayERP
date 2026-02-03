import api from './api';

export interface SessionInfo {
    _id: string;
    sessionId: string;
    deviceInfo: {
        userAgent: string;
        deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
        browser?: string;
        os?: string;
    };
    ipAddress: string;
    location?: {
        country?: string;
        city?: string;
        timezone?: string;
    };
    createdAt: string;
    lastActive: string;
    expiresAt: string;
    isCurrent: boolean;
}

export interface SessionStatistics {
    totalActiveSessions: number;
    totalExpiredSessions: number;
    avgSessionsPerUser: number;
    maxSessionsPerUser: number;
}

const sessionAPI = {
    // Get all active sessions for current user
    getActiveSessions: async (): Promise<SessionInfo[]> => {
        try {
            const response = await api('/api/sessions');
            return response.data.sessions || [];
        } catch (error) {
            console.error('Error fetching active sessions:', error);
            throw error;
        }
    },

    // Revoke a specific session
    revokeSession: async (sessionId: string): Promise<void> => {
        try {
            await api(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error revoking session:', error);
            throw error;
        }
    },

    // Revoke all other sessions (keep current)
    revokeAllOtherSessions: async (): Promise<number> => {
        try {
            const response = await api('/api/sessions', {
                method: 'DELETE'
            });
            return response.data.revokedCount || 0;
        } catch (error) {
            console.error('Error revoking all sessions:', error);
            throw error;
        }
    },

    // Get session statistics (admin only)
    getStatistics: async (): Promise<SessionStatistics> => {
        try {
            const response = await api('/api/sessions/statistics');
            return response.data.statistics;
        } catch (error) {
            console.error('Error fetching session statistics:', error);
            throw error;
        }
    }
};

export default sessionAPI;
