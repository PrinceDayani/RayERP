import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { generateSecret, generateURI, verify as verifyOtp } from 'otplib';
import SecurityPolicy, { ISecurityPolicy } from '../models/SecurityPolicy';
import { IUser } from '../models/User';

// Accept the adjacent 30s step on either side so a phone with mild clock drift
// still authenticates.
const EPOCH_TOLERANCE_SECONDS = 30;

export const TOTP_ISSUER = process.env.COMPANY_NAME || 'RayERP';
export const RECOVERY_CODE_COUNT = 10;

export const getPolicy = (): Promise<ISecurityPolicy> => SecurityPolicy.getPolicy();

/* ------------------------------------------------------------------ *
 * Password policy
 * ------------------------------------------------------------------ */

export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

const STRENGTH_RULES: Array<{ test: RegExp; label: string }> = [
  { test: /[A-Z]/, label: 'an uppercase letter' },
  { test: /[a-z]/, label: 'a lowercase letter' },
  { test: /[0-9]/, label: 'a number' },
  { test: /[^A-Za-z0-9]/, label: 'a special character' }
];

export const validatePasswordAgainstPolicy = (
  password: string,
  policy: ISecurityPolicy
): PasswordCheck => {
  if (typeof password !== 'string' || password.length < policy.minPasswordLength) {
    return {
      valid: false,
      message: `Password must be at least ${policy.minPasswordLength} characters`
    };
  }

  if (policy.requireStrongPassword) {
    const missing = STRENGTH_RULES.filter(rule => !rule.test.test(password)).map(rule => rule.label);
    if (missing.length > 0) {
      return { valid: false, message: `Password must contain ${missing.join(', ')}` };
    }
  }

  return { valid: true };
};

/**
 * True when the candidate matches the current password or any retained
 * historical hash. Caller must have selected +password +passwordHistory.
 */
export const isPasswordReused = async (
  user: IUser,
  candidate: string,
  policy: ISecurityPolicy
): Promise<boolean> => {
  if (policy.passwordHistoryCount <= 0) return false;

  const hashes = [user.password, ...(user.passwordHistory || [])]
    .filter(Boolean)
    .slice(0, policy.passwordHistoryCount + 1);

  for (const hash of hashes) {
    if (await bcrypt.compare(candidate, hash)) return true;
  }

  return false;
};

/**
 * Moves the current password hash into history and trims to the retained
 * count. Call before assigning the new password, while user.password still
 * holds the outgoing hash.
 */
export const recordPasswordInHistory = (user: IUser, policy: ISecurityPolicy): void => {
  if (policy.passwordHistoryCount <= 0) {
    user.passwordHistory = [];
    return;
  }

  const history = [user.password, ...(user.passwordHistory || [])].filter(Boolean);
  user.passwordHistory = history.slice(0, policy.passwordHistoryCount);
};

/* ------------------------------------------------------------------ *
 * Lockout
 * ------------------------------------------------------------------ */

export const isLocked = (user: IUser): boolean =>
  Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now());

/**
 * Records a failed attempt and locks the account once the policy threshold is
 * reached. Returns the lock expiry when this attempt triggered a lock.
 */
export const registerFailedLogin = async (
  user: IUser,
  policy: ISecurityPolicy
): Promise<Date | null> => {
  if (policy.maxLoginAttempts <= 0) return null;

  const attempts = (user.failedLoginAttempts || 0) + 1;
  user.failedLoginAttempts = attempts;

  if (attempts >= policy.maxLoginAttempts) {
    const lockedUntil = new Date(Date.now() + policy.lockoutDurationMinutes * 60000);
    user.lockedUntil = lockedUntil;
    user.failedLoginAttempts = 0;
    await user.save();
    return lockedUntil;
  }

  await user.save();
  return null;
};

export const clearLoginFailures = async (user: IUser): Promise<void> => {
  if (!user.failedLoginAttempts && !user.lockedUntil) return;

  // $unset rather than assigning undefined, so the field is genuinely removed
  // regardless of how the document was selected. updateOne on the document does
  // not run the findOneAndUpdate guard that protects the Root user.
  await user.updateOne({ $set: { failedLoginAttempts: 0 }, $unset: { lockedUntil: 1 } });

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
};

/* ------------------------------------------------------------------ *
 * TOTP secret encryption at rest
 * ------------------------------------------------------------------ */

export class TwoFactorKeyMissingError extends Error {
  constructor() {
    super(
      'TWO_FACTOR_ENCRYPTION_KEY is not configured. Set a 32-byte hex or base64 key before enabling two-factor authentication.'
    );
    this.name = 'TwoFactorKeyMissingError';
  }
}

/**
 * Dedicated key rather than a JWT_SECRET derivative, so rotating JWT signing
 * keys does not invalidate every enrolled authenticator.
 */
const getEncryptionKey = (): Buffer => {
  const raw = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!raw) throw new TwoFactorKeyMissingError();

  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }

  return key;
};

export const isTwoFactorConfigured = (): boolean => {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
};

export const encryptSecret = (plaintext: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
};

export const decryptSecret = (payload: string): string => {
  const [iv, tag, data] = payload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
};

/* ------------------------------------------------------------------ *
 * TOTP + recovery codes
 * ------------------------------------------------------------------ */

export const generateTotpSecret = (): string => generateSecret();

export const buildOtpAuthUri = (email: string, secret: string): string =>
  generateURI({ issuer: TOTP_ISSUER, label: email, secret });

export const verifyTotp = async (token: string, secret: string): Promise<boolean> => {
  if (!/^\d{6}$/.test(token || '')) return false;
  try {
    const result = await verifyOtp({ secret, token, epochTolerance: EPOCH_TOLERANCE_SECONDS });
    return result.valid;
  } catch {
    return false;
  }
};

/** Recovery codes are high-entropy, so a fast digest is sufficient here. */
const hashRecoveryCode = (code: string): string =>
  crypto.createHash('sha256').update(code.replace(/-/g, '').toUpperCase()).digest('hex');

export const generateRecoveryCodes = (): { codes: string[]; hashes: string[] } => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters
  const codes: string[] = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const bytes = crypto.randomBytes(10);
    const body = Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
    codes.push(`${body.slice(0, 5)}-${body.slice(5, 10)}`);
  }

  return { codes, hashes: codes.map(hashRecoveryCode) };
};

/**
 * Returns the remaining hashes with the used code removed, or null when the
 * code does not match. Comparison is constant-time per candidate.
 */
export const consumeRecoveryCode = (code: string, hashes: string[]): string[] | null => {
  const candidate = Buffer.from(hashRecoveryCode(code), 'hex');
  let matchedIndex = -1;

  hashes.forEach((stored, index) => {
    const storedBuffer = Buffer.from(stored, 'hex');
    if (
      storedBuffer.length === candidate.length &&
      crypto.timingSafeEqual(storedBuffer, candidate)
    ) {
      matchedIndex = index;
    }
  });

  if (matchedIndex === -1) return null;
  return hashes.filter((_, index) => index !== matchedIndex);
};
