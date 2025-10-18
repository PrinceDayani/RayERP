import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateItem {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface ITemplateCategory {
  name: string;
  type: 'labor' | 'materials' | 'equipment' | 'overhead';
  allocatedAmount: number;
  items: ITemplateItem[];
}

export interface IBudgetTemplate extends Document {
  name: string;
  description?: string;
  projectType: string;
  categories: ITemplateCategory[];
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const templateItemSchema = new Schema<ITemplateItem>({
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, default: 1, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 }
});

const templateCategorySchema = new Schema<ITemplateCategory>({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['labor', 'materials', 'equipment', 'overhead'], 
    required: true 
  },
  allocatedAmount: { type: Number, default: 0, min: 0 },
  items: [templateItemSchema]
});

const budgetTemplateSchema = new Schema<IBudgetTemplate>({
  name: { 
    type: String, 
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: { 
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  projectType: { 
    type: String, 
    required: [true, 'Project type is required'],
    trim: true
  },
  categories: [templateCategorySchema],
  isDefault: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
budgetTemplateSchema.index({ name: 1, projectType: 1 });
budgetTemplateSchema.index({ projectType: 1, isDefault: -1 });

// Virtual for total template amount
budgetTemplateSchema.virtual('totalAmount').get(function() {
  return this.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
});

budgetTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate totals
  this.categories.forEach(category => {
    category.allocatedAmount = category.items.reduce((sum, item) => {
      item.totalCost = item.quantity * item.unitCost;
      return sum + item.totalCost;
    }, 0);
  });
  
  next();
});

export default mongoose.model<IBudgetTemplate>('BudgetTemplate', budgetTemplateSchema);