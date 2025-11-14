import mongoose, { Schema, Document } from 'mongoose';

export interface IFiscalYear extends Document {
  year: string;
  startDate: Date;
  endDate: Date;
  status: 'OPEN' | 'CLOSED';
  closedBy?: mongoose.Types.ObjectId;
  closedAt?: Date;
  openingBalances?: { accountId: mongoose.Types.ObjectId; balance: number }[];
}

const FiscalYearSchema = new Schema({
  year: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  closedAt: Date,
  openingBalances: [{
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    balance: Number
  }]
}, { timestamps: true });

export default mongoose.model<IFiscalYear>('FiscalYear', FiscalYearSchema);
