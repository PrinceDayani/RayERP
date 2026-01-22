import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IUserSession extends Document {
    user: mongoose.Types.ObjectId;
    tokenHash: string;
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
    createdAt: Date;
    lastActive: Date;
    expiresAt: Date;
    isActive: boolean;
    isExpired(): boolean;
}

export interface IUserSessionModel extends mongoose.Model<IUserSession> {
    hashToken(token: string): string;
    parseUserAgent(userAgent: string): {
        deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
        browser: string;
        os: string;
    };
    cleanupExpiredSessions(): Promise<number>;
}

const userSessionSchema = new Schema<IUserSession>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
            default: () => crypto.randomBytes(32).toString('hex')
        },
        deviceInfo: {
            userAgent: {
                type: String,
                required: true
            },
            deviceType: {
                type: String,
                enum: ['mobile', 'desktop', 'tablet', 'unknown'],
                default: 'unknown'
            },
            browser: String,
            os: String
        },
        ipAddress: {
            type: String,
            required: true
        },
        location: {
            country: String,
            city: String,
            timezone: String
        },
        lastActive: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true,
        collection: 'user_sessions'
    }
);

// Index for efficient cleanup of expired sessions
userSessionSchema.index({ expiresAt: 1, isActive: 1 });

// Index for finding user's active sessions
userSessionSchema.index({ user: 1, isActive: 1 });

// Static method to create token hash
userSessionSchema.statics.hashToken = function (token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to parse user agent
userSessionSchema.statics.parseUserAgent = function (userAgent: string) {
    const ua = userAgent.toLowerCase();

    // Detect device type
    let deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        deviceType = 'tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        deviceType = 'mobile';
    } else {
        deviceType = 'desktop';
    }

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { deviceType, browser, os };
};

// Method to check if session is expired
userSessionSchema.methods.isExpired = function (): boolean {
    return this.expiresAt < new Date();
};

// Auto-cleanup expired sessions (run periodically)
userSessionSchema.statics.cleanupExpiredSessions = async function () {
    const result = await this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
};

const UserSession = mongoose.model<IUserSession, IUserSessionModel>('UserSession', userSessionSchema);

export default UserSession;
