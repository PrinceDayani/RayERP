import mongoose, { Schema, Document } from 'mongoose';

export interface IForecastDataPoint {
  month: number;
  year: number;
  predictedAmount: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface IBudgetForecast extends Document {
  budget: mongoose.Types.ObjectId;
  fiscalYear: string;
  forecastType: 'linear' | 'seasonal' | 'exponential' | 'ml';
  forecastPeriod: number;
  generatedDate: Date;
  forecastData: IForecastDataPoint[];
  historicalData: {
    month: number;
    year: number;
    actualAmount: number;
  }[];
  accuracy?: number;
  methodology: string;
  assumptions: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ForecastDataPointSchema = new Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  predictedAmount: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  lowerBound: { type: Number, required: true },
  upperBound: { type: Number, required: true }
}, { _id: false });

const BudgetForecastSchema = new Schema<IBudgetForecast>({
  budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  fiscalYear: { type: String, required: true },
  forecastType: { 
    type: String, 
    enum: ['linear', 'seasonal', 'exponential', 'ml'],
    default: 'linear'
  },
  forecastPeriod: { type: Number, required: true, min: 1, max: 24 },
  generatedDate: { type: Date, default: Date.now },
  forecastData: [ForecastDataPointSchema],
  historicalData: [{
    month: Number,
    year: Number,
    actualAmount: Number
  }],
  accuracy: { type: Number, min: 0, max: 100 },
  methodology: { type: String, required: true },
  assumptions: [String],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

BudgetForecastSchema.index({ budget: 1, fiscalYear: 1 });
BudgetForecastSchema.index({ generatedDate: -1 });

export default mongoose.model<IBudgetForecast>('BudgetForecast', BudgetForecastSchema);
