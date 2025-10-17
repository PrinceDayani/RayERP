import mongoose, { Document, Schema } from 'mongoose';

export interface IWIPLedger extends Document {
  projectId: mongoose.Types.ObjectId;
  boqItemId?: mongoose.Types.ObjectId;
  activityId?: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  costHead: 'material' | 'labour' | 'equipment' | 'subcontractor' | 'overhead';
  amount: number;
  cumulativeAmount: number;
  journalEntryId: mongoose.Types.ObjectId;
  isCapitalized: boolean;
  capitalizedDate?: Date;
  capitalizedAmount?: number;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const WIPLedgerSchema = new Schema<IWIPLedger>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  boqItemId: {
    type: Schema.Types.ObjectId,
    ref: 'BOQItem'
  },
  activityId: {
    type: Schema.Types.ObjectId,
    ref: 'Activity'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  costHead: {
    type: String,
    required: true,
    enum: ['material', 'labour', 'equipment', 'subcontractor', 'overhead']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  cumulativeAmount: {
    type: Number,
    required: true,
    min: 0
  },
  journalEntryId: {
    type: Schema.Types.ObjectId,
    ref: 'JournalEntry',
    required: true
  },
  isCapitalized: {
    type: Boolean,
    default: false
  },
  capitalizedDate: {
    type: Date
  },
  capitalizedAmount: {
    type: Number,
    min: 0
  },
  reference: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

WIPLedgerSchema.index({ projectId: 1, date: 1 });
WIPLedgerSchema.index({ costHead: 1 });
WIPLedgerSchema.index({ isCapitalized: 1 });

export const WIPLedger = mongoose.model<IWIPLedger>('WIPLedger', WIPLedgerSchema);