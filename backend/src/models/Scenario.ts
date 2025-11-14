import mongoose, { Schema, Document } from 'mongoose';

export interface IScenario extends Document {
  name: string;
  description?: string;
  baseDate: Date;
  entries: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ScenarioSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  baseDate: { type: Date, required: true },
  entries: [{ type: Schema.Types.ObjectId, ref: 'JournalEntry' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IScenario>('Scenario', ScenarioSchema);
