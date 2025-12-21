import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxRecord extends Document {
    type: 'GST' | 'VAT' | 'TDS' | 'Income Tax' | 'Sales Tax';
    amount: number;
    rate: number;
    status: 'Pending' | 'Filed' | 'Paid' | 'Overdue';
    dueDate: Date;
    period: string;
    description: string;
    createdBy: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    attachments?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const TaxRecordSchema: Schema = new Schema(
    {
        type: {
            type: String,
            required: [true, 'Tax type is required'],
            enum: {
                values: ['GST', 'VAT', 'TDS', 'Income Tax', 'Sales Tax'],
                message: '{VALUE} is not a valid tax type'
            },
            index: true
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative']
        },
        rate: {
            type: Number,
            required: [true, 'Tax rate is required'],
            min: [0, 'Rate cannot be negative'],
            max: [100, 'Rate cannot exceed 100%']
        },
        status: {
            type: String,
            required: true,
            enum: {
                values: ['Pending', 'Filed', 'Paid', 'Overdue'],
                message: '{VALUE} is not a valid status'
            },
            default: 'Pending',
            index: true
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
            index: true
        },
        period: {
            type: String,
            required: [true, 'Period is required'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: {
            type: Date
        },
        attachments: [{
            type: String
        }]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Compound indexes for common queries
TaxRecordSchema.index({ type: 1, status: 1, isDeleted: 1 });
TaxRecordSchema.index({ createdBy: 1, dueDate: -1, isDeleted: 1 });
TaxRecordSchema.index({ status: 1, dueDate: 1, isDeleted: 1 });
TaxRecordSchema.index({ isDeleted: 1, createdAt: -1 });

// Query helper to exclude deleted records
(TaxRecordSchema.query as any).active = function(this: any) {
    return this.where({ isDeleted: false });
};

// Virtual for checking if overdue
TaxRecordSchema.virtual('isOverdue').get(function () {
    return this.status !== 'Paid' && this.status !== 'Filed' && new Date() > this.dueDate;
});

// Pre-save middleware to auto-update status if overdue
TaxRecordSchema.pre('save', function (next) {
    if (this.status !== 'Paid' && this.status !== 'Filed' && new Date() > this.dueDate) {
        this.status = 'Overdue';
    }
    next();
});

export default mongoose.model<ITaxRecord>('TaxRecord', TaxRecordSchema);
