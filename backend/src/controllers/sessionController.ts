import { Request, Response } from 'express';
import UserSession from '../models/UserSession';
import { logger } from '../utils/logger';

// Get all active sessions for current user
export const getActiveSessions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const currentTokenHash = (req as any).sessionTokenHash;

        const sessions = await UserSession.find({
            user: userId,
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).sort({ lastActive: -1 });

        const sessionData = sessions.map(session => ({
            _id: session._id,
            sessionId: session.sessionId,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            location: session.location,
            createdAt: session.createdAt,
            lastActive: session.lastActive,
            expiresAt: session.expiresAt,
            isCurrent: session.tokenHash === currentTokenHash
        }));

        res.status(200).json({
            success: true,
            sessions: sessionData,
            totalSessions: sessionData.length
        });
    } catch (error: any) {
        logger.error(`Get active sessions error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error retrieving active sessions'
        });
    }
};

// Revoke a specific session
export const revokeSession = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const sessionId = req.params.sessionId;
        const currentTokenHash = (req as any).sessionTokenHash;

        const session = await UserSession.findOne({
            _id: sessionId,
            user: userId
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Prevent revoking current session via this endpoint
        if (session.tokenHash === currentTokenHash) {
            return res.status(400).json({
                success: false,
                message: 'Cannot revoke current session. Use logout instead.'
            });
        }

        await UserSession.deleteOne({ _id: sessionId });

        logger.info(`Session ${sessionId} revoked for user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Session revoked successfully'
        });
    } catch (error: any) {
        logger.error(`Revoke session error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error revoking session'
        });
    }
};

// Revoke all other sessions (keep current)
export const revokeAllOtherSessions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const currentTokenHash = (req as any).sessionTokenHash;

        const result = await UserSession.deleteMany({
            user: userId,
            tokenHash: { $ne: currentTokenHash }
        });

        logger.info(`Revoked ${result.deletedCount} sessions for user ${userId}`);

        res.status(200).json({
            success: true,
            message: `Successfully revoked ${result.deletedCount} session(s)`,
            revokedCount: result.deletedCount
        });
    } catch (error: any) {
        logger.error(`Revoke all sessions error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error revoking sessions'
        });
    }
};

// Clean up expired sessions (admin only or cron job)
export const cleanupExpiredSessions = async (req: Request, res: Response) => {
    try {
        const deletedCount = await UserSession.cleanupExpiredSessions();

        logger.info(`Cleaned up ${deletedCount} expired sessions`);

        res.status(200).json({
            success: true,
            message: `Cleaned up ${deletedCount} expired session(s)`,
            deletedCount
        });
    } catch (error: any) {
        logger.error(`Cleanup expired sessions error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error cleaning up expired sessions'
        });
    }
};

// Get session statistics (admin only)
export const getSessionStatistics = async (req: Request, res: Response) => {
    try {
        const totalActiveSessions = await UserSession.countDocuments({
            isActive: true,
            expiresAt: { $gt: new Date() }
        });

        const totalExpiredSessions = await UserSession.countDocuments({
            expiresAt: { $lte: new Date() }
        });

        const sessionsPerUser = await UserSession.aggregate([
            {
                $match: {
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                }
            },
            {
                $group: {
                    _id: '$user',
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    avgSessionsPerUser: { $avg: '$sessionCount' },
                    maxSessionsPerUser: { $max: '$sessionCount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            statistics: {
                totalActiveSessions,
                totalExpiredSessions,
                avgSessionsPerUser: sessionsPerUser[0]?.avgSessionsPerUser || 0,
                maxSessionsPerUser: sessionsPerUser[0]?.maxSessionsPerUser || 0
            }
        });
    } catch (error: any) {
        logger.error(`Get session statistics error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error retrieving session statistics'
        });
    }
};
