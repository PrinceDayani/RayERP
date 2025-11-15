import mongoose, { Document, Schema } from 'mongoose';

export interface IInterestAccrual {
  date: Date;
  accruedAmount: number;
  cumulativeAccrued: number;
}

export interface ITDSDeduction {
  tdsRate: number;
  tdsAmount: number;
  netInterest: number;
  deductionDate: Date;
  challanNumber?: string;
}

export interface IEMISchedule {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalEMI: number;
  outstandingPrincipal: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface IInterestCalculation extends Document {
  accountId: mongoose.Types.ObjectId;
  calculationType: 'simple' | 'compound' | 'emi' | 'overdue';
  fromDate: Date;
  toDate: Date;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency?: 'daily' | 'monthly' | 'quarterly' | 'yearly';
  interestAmount: number;
  effectiveRate?: number;
  accruals: IInterestAccrual[];
  tdsDetails?: ITDSDeduction;
  emiSchedule?: IEMISchedule[];
  gracePeriodDays?: number;
  penaltyRate?: number;
  status: 'draft' | 'posted' | 'accrued';
  journalEntryId?: mongoose.Types.ObjectId;
  autoCalculated: boolean;
  scheduledDate?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InterestCalculationSchema = new Schema<IInterestCalculation>({
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  calculationType: { type: String, enum: ['simple', 'compound', 'emi', 'overdue'], default: 'simple' },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  principalAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  compoundingFrequency: { type: String, enum: ['daily', 'monthly', 'quarterly', 'yearly'] },
  interestAmount: { type: Number, required: true },
  effectiveRate: Number,
  accruals: [{
    date: Date,
    accruedAmount: Number,
    cumulativeAccrued: Number
  }],
  tdsDetails: {
    tdsRate: Number,
    tdsAmount: Number,
    netInterest: Number,
    deductionDate: Date,
    challanNumber: String
  },
  emiSchedule: [{
    installmentNumber: Number,
    dueDate: Date,
    principalAmount: Number,
    interestAmount: Number,
    totalEMI: Number,
    outstandingPrincipal: Number,
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' }
  }],
  gracePeriodDays: { type: Number, default: 0 },
  penaltyRate: Number,
  status: { type: String, enum: ['draft', 'posted', 'accrued'], default: 'draft' },
  journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
  autoCalculated: { type: Boolean, default: false },
  scheduledDate: Date,
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

InterestCalculationSchema.index({ accountId: 1, fromDate: 1, toDate: 1 });
InterestCalculationSchema.index({ status: 1, scheduledDate: 1 });

export const InterestCalculation = mongoose.model<IInterestCalculation>('InterestCalculation', InterestCalculationSchema);
