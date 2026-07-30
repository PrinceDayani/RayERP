import mongoose, { Document, Schema } from 'mongoose';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ISkill {
  skill: string;
  level: SkillLevel;
  yearsOfExperience?: number;
  lastUpdated?: Date;
}

export interface IDocument {
  _id?: mongoose.Types.ObjectId;
  name: string;
  type: 'Resume' | 'Certificate' | 'ID' | 'Other';
  url: string;
  size: number;
  uploadDate: Date;
}

export interface INotificationSettings {
  email: {
    projectUpdates: boolean;
    taskAssignments: boolean;
    mentions: boolean;
    systemAlerts: boolean;
  };
  sms: {
    projectUpdates: boolean;
    taskAssignments: boolean;
    mentions: boolean;
    systemAlerts: boolean;
  };
}

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  // Unset on records created by signup approval; HR fills these in later.
  phone?: string;
  department?: string;
  departments?: string[];
  position?: string;
  jobTitle?: string;
  salary?: number;
  hireDate: Date;
  status: 'active' | 'inactive' | 'terminated';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  skills: string[]; // Legacy field for backward compatibility
  skillsEnhanced: ISkill[]; // New enhanced skills field
  socialProfiles?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    other?: string;
  };
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  documents?: IDocument[];
  notificationSettings?: INotificationSettings;
  timezone?: string;
  avatarUrl?: string;
  manager?: mongoose.Types.ObjectId;
  supervisor?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  // Blank when a single-word name is split at signup approval.
  lastName: { type: String, required: false, default: '' },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  department: { type: String, required: false },
  departments: { type: [String], default: [] },
  position: { type: String, required: false },
  jobTitle: { type: String },
  salary: { type: Number, required: false },
  hireDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  skills: [String], // Legacy field for backward compatibility
  skillsEnhanced: [{
    skill: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
    yearsOfExperience: { type: Number, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }],
  socialProfiles: {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    twitter: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    other: { type: String, trim: true }
  },
  bio: { type: String, maxlength: 500 },
  socialLinks: {
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    twitter: { type: String, trim: true },
    portfolio: { type: String, trim: true }
  },
  documents: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['Resume', 'Certificate', 'ID', 'Other'], required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now }
  }],
  notificationSettings: {
    email: {
      projectUpdates: { type: Boolean, default: true },
      taskAssignments: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true }
    },
    sms: {
      projectUpdates: { type: Boolean, default: false },
      taskAssignments: { type: Boolean, default: false },
      mentions: { type: Boolean, default: false },
      systemAlerts: { type: Boolean, default: false }
    }
  },
  timezone: { type: String, default: 'UTC' },
  avatarUrl: { type: String },
  manager: { type: Schema.Types.ObjectId, ref: 'Employee' },
  supervisor: { type: Schema.Types.ObjectId, ref: 'Employee' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
  if (this.isModified('user') || this.isNew) {
    const User = mongoose.model('User');
    const userExists = await User.findById(this.user);
    if (!userExists) throw new Error('User must exist');
  }
  next();
});

employeeSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  const userId = update.user || update.$set?.user;
  if (userId) {
    const User = mongoose.model('User');
    const userExists = await User.findById(userId);
    if (!userExists) throw new Error('User must exist');
  }
  next();
});

export default mongoose.model<IEmployee>('Employee', employeeSchema);