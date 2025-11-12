import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    browser?: string;
    os?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
    };
  };
}

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
  isGroup: boolean;
  groupName?: string;
  groupAdmin?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
  fileUrl: { type: String },
  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    device: { type: String },
    browser: { type: String },
    os: { type: String },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      city: { type: String },
      country: { type: String }
    }
  }
});

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    lastMessage: { type: String },
    lastMessageTime: { type: Date },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAdmin: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

const Chat = mongoose.model<IChat>('Chat', chatSchema);
export default Chat;
