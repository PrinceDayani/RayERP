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

// Workbook categories that drive PF / ESIC applicability for Indian payroll.
export const EMPLOYMENT_CATEGORIES = [
  'Skill - Above Limit (PF)',
  'Skill - Above Limit (W/o PF)',
  'Skill - Below Limit (W/o PF)',
  'Unskill - Above Limit (PF)',
  'Unskill - Below Limit (W/o PF)',
  'Retired Person',
] as const;

export type EmploymentCategory = (typeof EMPLOYMENT_CATEGORIES)[number];

export interface IBankDetails {
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
}

export interface IStatutoryDetails {
  uanNumber?: string;
  pfApplicable?: boolean;
  esicApplicable?: boolean;
}

// Monthly figures. `Employee.salary` stays the annual gross so existing
// salary views keep their meaning; these are the per-month breakdown.
export interface ICompensation {
  monthlyGross?: number;
  monthlyNet?: number; // take-home after the deductions below
  incrementAmount?: number;
  incrementPercent?: number; // whole percent, e.g. 15 for a 15% raise
  tds?: number;
  providentFund?: number;
  professionalTax?: number;
  esic?: number;
  effectiveFrom?: Date;
}

export interface ISalaryRevision {
  effectiveFrom: Date;
  label?: string; // payroll period the figure was recorded against, e.g. 'June-26'
  monthlyGross: number;
  reason?: string;
  recordedBy?: mongoose.Types.ObjectId;
  recordedAt?: Date;
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
  // Site / office the employee is posted at, and the project or department
  // they are booked against. Free text: the staff register names postings that
  // do not all correspond 1:1 to Project documents.
  workLocation?: string;
  projectAssignment?: string;
  // Named reporting line from the staff register. `manager` holds the resolved
  // Employee ref where the name matched an existing record.
  reportingAuthority?: string;
  qualification?: string;
  employmentCategory?: EmploymentCategory;
  dateOfBirth?: Date;
  dateOfRelieving?: Date;
  totalExperienceYears?: number;
  // Second contact number where the staff register lists two.
  alternatePhone?: string;
  // Service length exactly as the register states it, e.g. "25 Yrs - 1 m".
  // Kept verbatim alongside the value derived from hireDate, because a few
  // rows have no joining date for the derivation to work from.
  experienceInCompany?: string;
  // Row number in the source register, for reconciling against the workbook.
  registerSerialNo?: number;
  bankDetails?: IBankDetails;
  statutory?: IStatutoryDetails;
  compensation?: ICompensation;
  salaryHistory?: ISalaryRevision[];
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
  workLocation: { type: String, trim: true },
  projectAssignment: { type: String, trim: true },
  reportingAuthority: { type: String, trim: true },
  qualification: { type: String, trim: true },
  employmentCategory: { type: String, enum: EMPLOYMENT_CATEGORIES },
  dateOfBirth: { type: Date },
  dateOfRelieving: { type: Date },
  totalExperienceYears: { type: Number, min: 0 },
  alternatePhone: { type: String, trim: true },
  experienceInCompany: { type: String, trim: true },
  registerSerialNo: { type: Number },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true }
  },
  statutory: {
    uanNumber: { type: String, trim: true },
    pfApplicable: { type: Boolean, default: false },
    esicApplicable: { type: Boolean, default: false }
  },
  compensation: {
    monthlyGross: { type: Number, min: 0 },
    monthlyNet: { type: Number, min: 0 },
    incrementAmount: { type: Number },
    incrementPercent: { type: Number },
    tds: { type: Number, min: 0 },
    providentFund: { type: Number, min: 0 },
    professionalTax: { type: Number, min: 0 },
    esic: { type: Number, min: 0 },
    effectiveFrom: { type: Date }
  },
  salaryHistory: [{
    effectiveFrom: { type: Date, required: true },
    label: { type: String, trim: true },
    monthlyGross: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date, default: Date.now }
  }],
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

// Directory filters run on these columns.
employeeSchema.index({ status: 1, workLocation: 1 });
employeeSchema.index({ projectAssignment: 1 });
employeeSchema.index({ employmentCategory: 1 });

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