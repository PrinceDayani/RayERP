import mongoose, { Document, Schema } from 'mongoose';

export interface IBankStatementEntry {
  date: Date;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  isReconciled: boolean;
  reconciledWith?: mongoose.Types.ObjectId;
}

export interface IBankStatement extends Document {
  bankAccount: mongoose.Types.ObjectId;
  statementDate: Date;
  openingBalance: number;
  closingBalance: number;
  entries: IBankStatementEntry[];
  uploadedFile?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankStatementSchema = new Schema<IBankStatement>({
  bankAccount: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  statementDate: {
    type: Date,
    required: true
  },
  openingBalance: {
    type: Number,
    required: true
  },
  closingBalance: {
    type: Number,
    required: true
  },
  entries: [{
    date: { type: Date, required: true },
    description: { type: String, required: true },
    reference: String,
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    isReconciled: { type: Boolean, default: false },
    reconciledWith: { type: Schema.Types.ObjectId, ref: 'Transaction' }
  }],
  uploadedFile: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

BankStatementSchema.index({ bankAccount: 1, statementDate: -1 });

export default mongoose.model<IBankStatement>('BankStatement', BankStatementSchema);