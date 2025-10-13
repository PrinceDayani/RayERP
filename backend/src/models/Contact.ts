// backend/src/models/Contact.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: true },
    company: { type: String, required: false },
    position: { type: String, required: false },
    address: { type: String, required: false },
    notes: { type: String, required: false },
    tags: [{ type: String, required: false }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Add index for better search performance
ContactSchema.index({ name: 'text', email: 'text', phone: 'text', company: 'text' });

export default mongoose.model<IContact>('Contact', ContactSchema);