import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  isDefault: boolean; // Mark default system roles
  level: number; // Role hierarchy level (higher = more privileges)
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    required: true,
    default: 1
  }
}, {
  timestamps: true
});

roleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew && this.name?.toLowerCase() === 'root') {
    return next(new Error('Root role cannot be modified'));
  }
  next();
});

roleSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;
  const query = this.getQuery();
  const role = await this.model.findOne(query);
  if (role?.name?.toLowerCase() === 'root') {
    return next(new Error('Root role cannot be modified'));
  }
  next();
});

roleSchema.pre('findOneAndDelete', async function(next) {
  const query = this.getQuery();
  const role = await this.model.findOne(query);
  if (role?.name?.toLowerCase() === 'root') {
    return next(new Error('Root role cannot be deleted'));
  }
  next();
});

export const Role = mongoose.model<IRole>('Role', roleSchema);