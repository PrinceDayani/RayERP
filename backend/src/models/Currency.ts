import mongoose, { Document, Schema } from 'mongoose';

export interface ICurrency extends Document {
  code: string;
  name: string;
  symbol: string;
  isBaseCurrency: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExchangeRate extends Document {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CurrencySchema = new Schema<ICurrency>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  isBaseCurrency: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ExchangeRateSchema = new Schema<IExchangeRate>({
  fromCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  toCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

CurrencySchema.index({ code: 1 });
ExchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1, date: -1 });

export const Currency = mongoose.model<ICurrency>('Currency', CurrencySchema);
export const ExchangeRate = mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
