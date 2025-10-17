import mongoose, { Document, Schema } from 'mongoose';

export interface IFiscalYear extends Document {
  year: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isClosed: boolean;
  closingRules: {
    carryForwardBalances: boolean;
    autoCloseRevenue: boolean;
    autoCloseExpense: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FiscalYearSchema = new Schema<IFiscalYear>({
  year: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  closingRules: {
    carryForwardBalances: {
      type: Boolean,
      default: true
    },
    autoCloseRevenue: {
      type: Boolean,
      default: true
    },
    autoCloseExpense: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

FiscalYearSchema.index({ year: 1 });
FiscalYearSchema.index({ isActive: 1 });

export const FiscalYear = mongoose.model<IFiscalYear>('FiscalYear', FiscalYearSchema);