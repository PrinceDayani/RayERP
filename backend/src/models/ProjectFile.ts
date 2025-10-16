//path: backend/src/models/ProjectFile.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectFile extends Document {
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  project: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFileSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
ProjectFileSchema.index({ project: 1 });
ProjectFileSchema.index({ uploadedBy: 1 });

export default mongoose.model<IProjectFile>('ProjectFile', ProjectFileSchema);