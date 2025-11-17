import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartmentBudget extends Document {
  departmentId: mongoose.Types.ObjectId;
  fiscalYear: string;
  totalBudget: number;
  allocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  categories: {
    name: string;
    allocated: number;
    spent: number;
  }[];
  status: 'draft' | 'approved' | 'active' | 'closed';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const departmentBudgetSchema = new Schema<IDepartmentBudget>({
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  fiscalYear: { type: String, required: true },
  totalBudget: { type: Number, required: true, min: 0 },
  allocatedBudget: { type: Number, default: 0, min: 0 },
  spentBudget: { type: Number, default: 0, min: 0 },
  remainingBudget: { type: Number, default: 0 },
  categories: [{
    name: { type: String, required: true },
    allocated: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0, min: 0 }
  }],
  status: { type: String, enum: ['draft', 'approved', 'active', 'closed'], default: 'draft' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

departmentBudgetSchema.index({ departmentId: 1, fiscalYear: 1 }, { unique: true });

departmentBudgetSchema.pre('save', function(next) {
  this.remainingBudget = this.totalBudget - this.spentBudget;
  next();
});

export default mongoose.model<IDepartmentBudget>('DepartmentBudget', departmentBudgetSchema);
