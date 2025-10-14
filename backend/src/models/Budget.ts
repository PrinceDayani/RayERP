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
  type: 'labor' | 'materials' | 'equipment' | 'overhead';
  allocatedAmount: number;
  spentAmount: number;
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
  projectId: mongoose.Types.ObjectId;
  projectName: string;
  fiscalYear: number;
  fiscalPeriod: string;
  totalBudget: number;
  actualSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  currency: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'closed';
  categories: IBudgetCategory[];
  approvals: IBudgetApproval[];
  parentBudgetId?: mongoose.Types.ObjectId;
  budgetType: 'project' | 'master' | 'department';
  createdBy: mongoose.Types.ObjectId;
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
    enum: ['labor', 'materials', 'equipment', 'overhead'], 
    required: true 
  },
  allocatedAmount: { type: Number, default: 0, min: 0 },
  spentAmount: { type: Number, default: 0, min: 0 },
  items: [budgetItemSchema]
});

// Auto-calculate allocated amount from items
budgetCategorySchema.pre('validate', function(next) {
  if (this.items && this.items.length > 0) {
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
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: String,
  fiscalYear: { type: Number, required: true, default: () => new Date().getFullYear() },
  fiscalPeriod: { type: String, required: true, default: 'Q1' },
  totalBudget: { type: Number, required: true, min: 0 },
  actualSpent: { type: Number, default: 0, min: 0 },
  remainingBudget: { type: Number, default: 0 },
  utilizationPercentage: { type: Number, default: 0, min: 0, max: 100 },
  currency: { type: String, default: 'USD' },
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
    enum: ['project', 'master', 'department'], 
    default: 'project' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

budgetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate totals from categories
  if (this.categories && this.categories.length > 0) {
    // Calculate actual spent from categories
    this.actualSpent = this.categories.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    
    // If totalBudget is 0, calculate it from categories
    if (this.totalBudget === 0) {
      this.totalBudget = this.categories.reduce((sum, cat) => {
        const categoryTotal = cat.items ? cat.items.reduce((itemSum, item) => itemSum + (item.totalCost || 0), 0) : 0;
        return sum + categoryTotal;
      }, 0);
    }
    
    this.remainingBudget = this.totalBudget - this.actualSpent;
    this.utilizationPercentage = this.totalBudget > 0 ? (this.actualSpent / this.totalBudget) * 100 : 0;
  }
  
  next();
});

// Add indexes
budgetSchema.index({ projectId: 1, fiscalYear: 1 });
budgetSchema.index({ budgetType: 1, status: 1 });
budgetSchema.index({ parentBudgetId: 1 });

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