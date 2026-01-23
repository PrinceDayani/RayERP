import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetItem {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IBudgetCategory {
  name: string;
  type: 'labor' | 'materials' | 'equipment' | 'overhead' | 'special';
  allocatedAmount: number;
  spentAmount: number;
  currency?: string;
  items: IBudgetItem[];
}

export interface IBudgetApproval {
  userId: mongoose.Types.ObjectId;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: Date;
}

export interface IBudget extends Document {
  projectId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  projectName?: string;
  departmentName?: string;
  budgetName?: string;
  fiscalYear: number;
  fiscalPeriod: string;
  totalBudget: number;
  totalAmount?: number;
  allocatedAmount?: number;
  actualSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  currency: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'closed';
  categories: IBudgetCategory[];
  approvals: IBudgetApproval[];
  parentBudgetId?: mongoose.Types.ObjectId;
  budgetType: 'project' | 'department' | 'special';
  deleteApprovalStatus?: 'pending' | 'approved' | 'rejected';
  deleteRequestedBy?: mongoose.Types.ObjectId;
  deleteRequestedAt?: Date;
  budgetVersion?: number;
  previousVersionId?: mongoose.Types.ObjectId;
  isLatestVersion?: boolean;
  revisionHistory?: Array<{
    version: number;
    revisedBy: mongoose.Types.ObjectId;
    revisedAt: Date;
    reason: string;
    changes: any;
    approvedBy: mongoose.Types.ObjectId;
    approvedAt: Date;
  }>;
  createdBy: mongoose.Types.ObjectId;
  createdByDepartment: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const budgetItemSchema = new Schema<IBudgetItem>({
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, default: 1, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 }
});

// Auto-calculate total cost
budgetItemSchema.pre('validate', function(next) {
  this.totalCost = this.quantity * this.unitCost;
  next();
});

const budgetCategorySchema = new Schema<IBudgetCategory>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['labor', 'materials', 'equipment', 'overhead', 'special'], 
    required: true 
  },
  allocatedAmount: { type: Number, default: 0, min: 0 },
  spentAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String },
  items: [budgetItemSchema]
});

// Auto-calculate allocated amount from items only if not explicitly set
budgetCategorySchema.pre('validate', function(next) {
  if (this.items && this.items.length > 0 && (!this.allocatedAmount || this.allocatedAmount === 0)) {
    this.allocatedAmount = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  }
  next();
});

const budgetApprovalSchema = new Schema<IBudgetApproval>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  comments: String,
  approvedAt: Date
});

const budgetSchema = new Schema<IBudget>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  projectName: String,
  departmentName: String,
  budgetName: String,
  fiscalYear: { type: Number, required: true, default: () => new Date().getFullYear() },
  fiscalPeriod: { type: String, required: true, default: 'Q1' },
  totalBudget: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, min: 0 },
  allocatedAmount: { type: Number, min: 0 },
  actualSpent: { type: Number, default: 0, min: 0 },
  remainingBudget: { type: Number, default: 0 },
  utilizationPercentage: { type: Number, default: 0, min: 0, max: 100 },
  currency: { type: String, default: 'USD', required: true, trim: true, uppercase: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'rejected', 'active', 'closed'], 
    default: 'draft' 
  },
  categories: [budgetCategorySchema],
  approvals: [budgetApprovalSchema],
  parentBudgetId: { type: Schema.Types.ObjectId, ref: 'Budget' },
  budgetType: { 
    type: String, 
    enum: ['project', 'department', 'special'], 
    required: true 
  },
  deleteApprovalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'] 
  },
  deleteRequestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deleteRequestedAt: Date,
  
  // Version Control
  budgetVersion: { type: Number, default: 1 },
  previousVersionId: { type: Schema.Types.ObjectId, ref: 'Budget' },
  isLatestVersion: { type: Boolean, default: true },
  revisionHistory: [{
    version: Number,
    revisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revisedAt: Date,
    reason: String,
    changes: Schema.Types.Mixed,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  }],
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdByDepartment: { type: Schema.Types.ObjectId, ref: 'Department', required: false }
}, { timestamps: true });

budgetSchema.pre('save', function(next) {
  // Validation: Budget must have project OR department (except special budgets)
  if (this.budgetType !== 'special') {
    if (!this.projectId && !this.departmentId) {
      return next(new Error('Budget must be assigned to either a Project or Department'));
    }
  }
  
  this.updatedAt = new Date();
  
  // Calculate totals from categories
  if (this.categories && this.categories.length > 0) {
    // Calculate actual spent from categories
    this.actualSpent = this.categories.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    
    // If totalBudget is 0 or not set, calculate it from categories
    if (!this.totalBudget || this.totalBudget === 0) {
      this.totalBudget = this.categories.reduce((sum, cat) => {
        // Use allocatedAmount if available, otherwise calculate from items
        if (cat.allocatedAmount && cat.allocatedAmount > 0) {
          return sum + cat.allocatedAmount;
        }
        const categoryTotal = cat.items ? cat.items.reduce((itemSum, item) => itemSum + (item.totalCost || 0), 0) : 0;
        return sum + categoryTotal;
      }, 0);
    }
    
    this.remainingBudget = this.totalBudget - this.actualSpent;
    this.utilizationPercentage = this.totalBudget > 0 ? Math.min((this.actualSpent / this.totalBudget) * 100, 100) : 0;
  } else {
    // No categories, ensure defaults
    this.actualSpent = this.actualSpent || 0;
    this.remainingBudget = this.totalBudget - this.actualSpent;
    this.utilizationPercentage = this.totalBudget > 0 ? Math.min((this.actualSpent / this.totalBudget) * 100, 100) : 0;
  }
  
  next();
});

// Add indexes
budgetSchema.index({ projectId: 1, fiscalYear: 1 });
budgetSchema.index({ departmentId: 1, fiscalYear: 1 });
budgetSchema.index({ budgetType: 1, status: 1 });
budgetSchema.index({ parentBudgetId: 1 });
budgetSchema.index({ createdByDepartment: 1 });
budgetSchema.index({ budgetVersion: 1, isLatestVersion: 1 });
budgetSchema.index({ previousVersionId: 1 });

// Virtual for budget variance
budgetSchema.virtual('budgetVariance').get(function() {
  return this.totalBudget - this.actualSpent;
});

// Virtual for over/under budget status
budgetSchema.virtual('budgetStatus').get(function() {
  if (this.actualSpent > this.totalBudget) return 'over';
  if (this.utilizationPercentage > 90) return 'warning';
  return 'on-track';
});

export default mongoose.model<IBudget>('Budget', budgetSchema);