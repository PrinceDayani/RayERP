import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  location: string;
  budget: number;
  status: 'active' | 'inactive';
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },
  manager: {
    name: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true },
    phone: { type: String, default: '' }
  },
  location: { type: String, required: true },
  budget: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  employeeCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

departmentSchema.index({ name: 1 });
departmentSchema.index({ status: 1 });
departmentSchema.index({ 'manager.email': 1 });

export default mongoose.model<IDepartment>('Department', departmentSchema);
