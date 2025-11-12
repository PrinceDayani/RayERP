import mongoose, { Document, Schema } from 'mongoose';

export interface IBroadcast extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'department' | 'webapp';
  departmentId?: mongoose.Types.ObjectId;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const broadcastSchema = new Schema<IBroadcast>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['department', 'webapp'], required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

broadcastSchema.index({ type: 1, timestamp: -1 });
broadcastSchema.index({ departmentId: 1, timestamp: -1 });

const Broadcast = mongoose.model<IBroadcast>('Broadcast', broadcastSchema);
export default Broadcast;
