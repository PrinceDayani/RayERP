//path: backend/src/models/FileShare.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IFileShare extends Document {
  file: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  sharedBy: mongoose.Types.ObjectId;
  sharedWith: mongoose.Types.ObjectId[];
  message?: string;
  status: 'pending' | 'viewed' | 'downloaded';
  viewedBy: { employee: mongoose.Types.ObjectId; viewedAt: Date }[];
  downloadedBy: { employee: mongoose.Types.ObjectId; downloadedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const FileShareSchema: Schema = new Schema({
  file: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectFile',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sharedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }],
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'viewed', 'downloaded'],
    default: 'pending'
  },
  viewedBy: [{
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    viewedAt: { type: Date, default: Date.now }
  }],
  downloadedBy: [{
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    downloadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

FileShareSchema.index({ file: 1, sharedWith: 1 });
FileShareSchema.index({ project: 1 });
FileShareSchema.index({ sharedBy: 1 });

export default mongoose.model<IFileShare>('FileShare', FileShareSchema);
