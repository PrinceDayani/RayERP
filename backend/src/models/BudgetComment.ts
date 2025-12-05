import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetComment extends Document {
  budget: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  mentions: mongoose.Types.ObjectId[];
  parentComment?: mongoose.Types.ObjectId;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  reactions: {
    userId: mongoose.Types.ObjectId;
    type: 'like' | 'approve' | 'concern' | 'question';
  }[];
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetCommentSchema = new Schema<IBudgetComment>({
  budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  parentComment: { type: Schema.Types.ObjectId, ref: 'BudgetComment' },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['like', 'approve', 'concern', 'question'] }
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number
  }]
}, { timestamps: true });

BudgetCommentSchema.index({ budget: 1, createdAt: -1 });
BudgetCommentSchema.index({ author: 1, createdAt: -1 });
BudgetCommentSchema.index({ mentions: 1 });
BudgetCommentSchema.index({ parentComment: 1 });

export default mongoose.model<IBudgetComment>('BudgetComment', BudgetCommentSchema);
