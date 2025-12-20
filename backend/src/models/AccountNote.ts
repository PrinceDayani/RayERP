import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountNote extends Document {
  accountId: mongoose.Types.ObjectId;
  note: string;
  noteType: 'general' | 'valuation' | 'contingency' | 'policy';
  asOfDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountNoteSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  note: { type: String, required: true },
  noteType: { type: String, enum: ['general', 'valuation', 'contingency', 'policy'], default: 'general' },
  asOfDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAccountNote>('AccountNote', AccountNoteSchema);
