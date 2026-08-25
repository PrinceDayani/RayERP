import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISecurityPolicy extends Document {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireStrongPassword: boolean;
  minPasswordLength: number;
  passwordHistoryCount: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISecurityPolicyModel extends Model<ISecurityPolicy> {
  getPolicy(): Promise<ISecurityPolicy>;
  invalidateCache(): void;
}

// Values chosen so an installation that has never opened the policy editor keeps
// behaving as it did before this model existed. Idle timeout is opt-in (0 = off).
export const SECURITY_POLICY_DEFAULTS = {
  sessionTimeoutMinutes: 0,
  maxLoginAttempts: 10,
  lockoutDurationMinutes: 15,
  requireStrongPassword: true,
  minPasswordLength: 8,
  passwordHistoryCount: 3
};

export const SECURITY_POLICY_LIMITS = {
  sessionTimeoutMinutes: { min: 0, max: 43200 },
  maxLoginAttempts: { min: 0, max: 20 },
  lockoutDurationMinutes: { min: 1, max: 1440 },
  minPasswordLength: { min: 8, max: 128 },
  passwordHistoryCount: { min: 0, max: 24 }
};

const SecurityPolicySchema = new Schema<ISecurityPolicy>(
  {
    // 0 disables idle expiry entirely.
    sessionTimeoutMinutes: {
      type: Number,
      default: SECURITY_POLICY_DEFAULTS.sessionTimeoutMinutes,
      min: SECURITY_POLICY_LIMITS.sessionTimeoutMinutes.min,
      max: SECURITY_POLICY_LIMITS.sessionTimeoutMinutes.max
    },
    // 0 disables lockout entirely.
    maxLoginAttempts: {
      type: Number,
      default: SECURITY_POLICY_DEFAULTS.maxLoginAttempts,
      min: SECURITY_POLICY_LIMITS.maxLoginAttempts.min,
      max: SECURITY_POLICY_LIMITS.maxLoginAttempts.max
    },
    lockoutDurationMinutes: {
      type: Number,
      default: SECURITY_POLICY_DEFAULTS.lockoutDurationMinutes,
      min: SECURITY_POLICY_LIMITS.lockoutDurationMinutes.min,
      max: SECURITY_POLICY_LIMITS.lockoutDurationMinutes.max
    },
    requireStrongPassword: {
      type: Boolean,
      default: SECURITY_POLICY_DEFAULTS.requireStrongPassword
    },
    minPasswordLength: {
      type: Number,
      default: SECURITY_POLICY_DEFAULTS.minPasswordLength,
      min: SECURITY_POLICY_LIMITS.minPasswordLength.min,
      max: SECURITY_POLICY_LIMITS.minPasswordLength.max
    },
    // 0 disables the reuse check.
    passwordHistoryCount: {
      type: Number,
      default: SECURITY_POLICY_DEFAULTS.passwordHistoryCount,
      min: SECURITY_POLICY_LIMITS.passwordHistoryCount.min,
      max: SECURITY_POLICY_LIMITS.passwordHistoryCount.max
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// getPolicy() is called from auth middleware on every authenticated request, so the
// singleton is held in process and refreshed on write or after the TTL lapses.
let cached: { policy: ISecurityPolicy; expires: number } | null = null;
const CACHE_TTL_MS = 60000;

SecurityPolicySchema.statics.getPolicy = async function (): Promise<ISecurityPolicy> {
  if (cached && cached.expires > Date.now()) {
    return cached.policy;
  }

  // Upsert rather than find-then-create: this runs on the first authenticated
  // request after a cold start, where several requests can race.
  const policy = await this.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  cached = { policy, expires: Date.now() + CACHE_TTL_MS };
  return policy;
};

SecurityPolicySchema.statics.invalidateCache = function (): void {
  cached = null;
};

export const SecurityPolicy = mongoose.model<ISecurityPolicy, ISecurityPolicyModel>(
  'SecurityPolicy',
  SecurityPolicySchema
);

export default SecurityPolicy;
