import mongoose, { Document, Model, Schema } from 'mongoose';
import { LEAVE_TYPES, LeaveType } from '../../hr/leave/Leave';

export interface ILeaveTypePolicy {
  type: LeaveType;
  annualQuota: number;
  carryForward: boolean;
  maxCarryForward: number;
}

export interface ILeavePolicy extends Document {
  types: ILeaveTypePolicy[];
  // Weekly offs and holidays inside a leave's date range are not charged.
  excludeNonWorkingDays: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface ILeavePolicyModel extends Model<ILeavePolicy> {
  getPolicy(): Promise<ILeavePolicy>;
  invalidateCache(): void;
}

// The quotas in force before leave policy became configurable.
export const DEFAULT_ANNUAL_QUOTAS: Record<LeaveType, number> = {
  sick: 12,
  vacation: 21,
  personal: 5,
  maternity: 90,
  paternity: 15,
  emergency: 3,
};

const leaveTypePolicySchema = new Schema<ILeaveTypePolicy>({
  type: { type: String, enum: LEAVE_TYPES, required: true },
  annualQuota: { type: Number, required: true, min: 0, max: 366 },
  carryForward: { type: Boolean, default: false },
  maxCarryForward: { type: Number, default: 0, min: 0, max: 366 },
}, { _id: false });

const leavePolicySchema = new Schema<ILeavePolicy>({
  types: {
    type: [leaveTypePolicySchema],
    default: () => LEAVE_TYPES.map(type => ({
      type, annualQuota: DEFAULT_ANNUAL_QUOTAS[type], carryForward: false, maxCarryForward: 0,
    })),
  },
  excludeNonWorkingDays: { type: Boolean, default: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

let cached: { policy: ILeavePolicy; expires: number } | null = null;
const CACHE_TTL_MS = 60000;

leavePolicySchema.statics.getPolicy = async function (): Promise<ILeavePolicy> {
  if (cached && cached.expires > Date.now()) return cached.policy;
  const policy = await this.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  cached = { policy, expires: Date.now() + CACHE_TTL_MS };
  return policy;
};

leavePolicySchema.statics.invalidateCache = function (): void {
  cached = null;
};

export default mongoose.model<ILeavePolicy, ILeavePolicyModel>('LeavePolicy', leavePolicySchema);
