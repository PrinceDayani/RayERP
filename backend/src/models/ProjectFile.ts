//path: backend/src/models/ProjectFile.ts

import mongoose, { Document, Schema } from 'mongoose';

export const PROJECT_FILE_CATEGORIES = [
  'drawing',
  'final-drawing',
  'as-built',
  'certificate',
  'report',
  'contract',
  'photo',
  'other'
] as const;

export type ProjectFileCategory = (typeof PROJECT_FILE_CATEGORIES)[number];

export interface IProjectFile extends Document {
  name: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  project: mongoose.Types.ObjectId;
  // Document register fields. A drawing or certificate is identified by
  // documentNumber + revision; uncategorised uploads stay 'other'.
  category: ProjectFileCategory;
  documentNumber?: string;
  revision?: string;
  phase?: mongoose.Types.ObjectId;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  issuedDate?: Date;
  uploadedBy: mongoose.Types.ObjectId;
  sharedWithDepartments: mongoose.Types.ObjectId[];
  sharedWithUsers: mongoose.Types.ObjectId[];
  shareType: 'department' | 'user' | 'both';
  fileData?: Buffer;
  storageType: 'disk' | 'database';
  compressed: boolean;
  originalSize: number;
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
  category: {
    type: String,
    enum: PROJECT_FILE_CATEGORIES,
    default: 'other'
  },
  documentNumber: {
    type: String,
    trim: true
  },
  revision: {
    type: String,
    trim: true
  },
  phase: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectPhase'
  },
  approvalStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  issuedDate: {
    type: Date
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWithDepartments: [{
    type: Schema.Types.ObjectId,
    ref: 'Department'
  }],
  sharedWithUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  shareType: {
    type: String,
    enum: ['department', 'user', 'both'],
    default: 'department'
  },
  fileData: {
    type: Buffer
  },
  storageType: {
    type: String,
    enum: ['disk', 'database'],
    default: 'database'
  },
  compressed: {
    type: Boolean,
    default: false
  },
  originalSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
ProjectFileSchema.index({ project: 1 });
ProjectFileSchema.index({ uploadedBy: 1 });
ProjectFileSchema.index({ project: 1, category: 1, createdAt: -1 });
ProjectFileSchema.index({ project: 1, documentNumber: 1, revision: 1 });
ProjectFileSchema.index({ phase: 1 });

export default mongoose.model<IProjectFile>('ProjectFile', ProjectFileSchema);