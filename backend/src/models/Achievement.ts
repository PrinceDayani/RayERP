import mongoose, { Document, Schema } from 'mongoose';

export type AchievementCategory = 'award' | 'certification' | 'milestone' | 'training' | 'recognition';

export interface IAchievement extends Document {
    employee: mongoose.Types.ObjectId;
    title: string;
    description: string;
    date: Date;
    category: AchievementCategory;
    issuer?: string;
    credentialId?: string;
    credentialUrl?: string;
    expiryDate?: Date;
    verified: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    attachments?: string[];
    tags?: string[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    // Virtual properties  
    readonly isExpired: boolean;
    readonly isExpiringSoon: boolean;

    // Instance methods
    verify(userId: mongoose.Types.ObjectId): Promise<this>;
    unverify(): Promise<this>;
}

const achievementSchema = new Schema<IAchievement>({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['award', 'certification', 'milestone', 'training', 'recognition'],
        required: true
    },
    issuer: {
        type: String,
        trim: true
    },
    credentialId: {
        type: String,
        trim: true
    },
    credentialUrl: {
        type: String,
        trim: true
    },
    expiryDate: {
        type: Date
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    attachments: [{
        type: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Indexes for performance
achievementSchema.index({ employee: 1, date: -1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ verified: 1 });
achievementSchema.index({ expiryDate: 1 });
achievementSchema.index({ tags: 1 });

// Virtual for checking if expired
achievementSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
});

// Virtual for checking if expiring soon (within 90 days)
achievementSchema.virtual('isExpiringSoon').get(function () {
    if (!this.expiryDate || this.isExpired) return false;
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    return this.expiryDate <= threeMonthsFromNow;
});

// Methods
achievementSchema.methods.verify = function (userId: mongoose.Types.ObjectId) {
    this.verified = true;
    this.verifiedBy = userId;
    this.verifiedAt = new Date();
    return this.save();
};

achievementSchema.methods.unverify = function () {
    this.verified = false;
    this.verifiedBy = undefined;
    this.verifiedAt = undefined;
    return this.save();
};

// Statics
achievementSchema.statics.getByEmployee = function (employeeId: mongoose.Types.ObjectId) {
    return this.find({ employee: employeeId })
        .sort({ date: -1 })
        .populate('createdBy', 'username email')
        .populate('verifiedBy', 'username email');
};

achievementSchema.statics.getByCategory = function (
    employeeId: mongoose.Types.ObjectId,
    category: AchievementCategory
) {
    return this.find({ employee: employeeId, category })
        .sort({ date: -1 });
};

achievementSchema.statics.getExpiring = function (employeeId: mongoose.Types.ObjectId) {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);

    return this.find({
        employee: employeeId,
        expiryDate: {
            $exists: true,
            $lte: threeMonthsFromNow,
            $gte: new Date()
        }
    }).sort({ expiryDate: 1 });
};

// Ensure virtuals are included in JSON output
achievementSchema.set('toJSON', { virtuals: true });
achievementSchema.set('toObject', { virtuals: true });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
