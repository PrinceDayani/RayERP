import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectPermission extends Document {
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  permissions: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectPermissionSchema = new Schema<IProjectPermission>({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permissions: [{ type: String, required: true }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

projectPermissionSchema.index({ project: 1, user: 1 }, { unique: true });

export default mongoose.model<IProjectPermission>('ProjectPermission', projectPermissionSchema);
