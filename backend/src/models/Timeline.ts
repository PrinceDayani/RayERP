import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeline extends Document {
  entityType: 'project' | 'task';
  entityId: mongoose.Types.ObjectId;
  eventType: 'created' | 'updated' | 'status_changed' | 'assigned' | 'completed' | 'deleted' | 'comment_added';
  title: string;
  description: string;
  user: mongoose.Types.ObjectId;
  metadata?: {
    oldValue?: any;
    newValue?: any;
    field?: string;
  };
  createdAt: Date;
}

const timelineSchema = new Schema<ITimeline>({
  entityType: { 
    type: String, 
    enum: ['project', 'task'], 
    required: true 
  },
  entityId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'entityType'
  },
  eventType: { 
    type: String, 
    enum: ['created', 'updated', 'status_changed', 'assigned', 'completed', 'deleted', 'comment_added'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  metadata: {
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    field: String
  }
}, { timestamps: true });

// Index for efficient queries
timelineSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.model<ITimeline>('Timeline', timelineSchema);