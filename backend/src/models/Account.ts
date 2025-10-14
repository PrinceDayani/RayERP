import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;
  projectId?: mongoose.Types.ObjectId;
  parentAccount?: mongoose.Types.ObjectId;
  balance: number;
  isActive: boolean;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>({
  code: { 
    type: String, 
    required: [true, 'Account code is required'],
    trim: true,
    maxlength: [20, 'Account code cannot exceed 20 characters']
  },
  name: { 
    type: String, 
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  type: { 
    type: String, 
    enum: {
      values: ['asset', 'liability', 'equity', 'revenue', 'expense'],
      message: 'Invalid account type'
    },
    required: [true, 'Account type is required']
  },
  subType: { 
    type: String, 
    required: [true, 'Account sub-type is required'],
    trim: true,
    maxlength: [50, 'Sub-type cannot exceed 50 characters']
  },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  parentAccount: { type: Schema.Types.ObjectId, ref: 'Account' },
  balance: { 
    type: Number, 
    default: 0,
    validate: {
      validator: function(v: number) {
        return !isNaN(v) && isFinite(v);
      },
      message: 'Balance must be a valid number'
    }
  },
  isActive: { type: Boolean, default: true, index: true },
  description: { type: String, maxlength: [500, 'Description cannot exceed 500 characters'] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
accountSchema.index({ code: 1, projectId: 1 }, { unique: true });
accountSchema.index({ type: 1, projectId: 1 });
accountSchema.index({ isActive: 1, projectId: 1 });

// Pre-save middleware
accountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.code) this.code = this.code.toUpperCase();
  next();
});

// Virtual for formatted balance
accountSchema.virtual('formattedBalance').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.balance);
});

export default mongoose.model<IAccount>('Account', accountSchema);