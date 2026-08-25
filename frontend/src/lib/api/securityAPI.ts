import api from './api';
import { withCsrf } from './csrf';

export interface TwoFactorStatus {
  /** False when the server has no TWO_FACTOR_ENCRYPTION_KEY configured. */
  available: boolean;
  enabled: boolean;
  enrolledAt?: string;
  recoveryCodesRemaining: number;
  issuer: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export interface SecurityPolicy {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireStrongPassword: boolean;
  minPasswordLength: number;
  passwordHistoryCount: number;
}

export interface PolicyLimits {
  [field: string]: { min: number; max: number };
}

export interface LoginHistoryEntry {
  _id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
}

/**
 * These endpoints answer 401 when the password or code in the request body is
 * wrong, while the caller's session stays valid. Without this the shared
 * client would treat a typo as an expired session and sign the user out.
 */
const CREDENTIAL_CHECK = { skipAuthRedirect: true } as const;

const securityAPI = {
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await withCsrf(headers =>
      api.put('/auth/change-password', { currentPassword, newPassword }, { headers, ...CREDENTIAL_CHECK })
    );
  },

  async getTwoFactorStatus(): Promise<TwoFactorStatus> {
    const { data } = await api.get('/auth/2fa/status');
    return data;
  },

  /** Starts enrolment and returns the secret plus the otpauth:// URI for the QR. */
  async setupTwoFactor(password: string): Promise<TwoFactorSetup> {
    const { data } = await withCsrf(headers =>
      api.post('/auth/2fa/setup', { password }, { headers, ...CREDENTIAL_CHECK })
    );
    return data;
  },

  /** Confirms enrolment; the recovery codes are returned only from this call. */
  async enableTwoFactor(code: string): Promise<string[]> {
    const { data } = await withCsrf(headers =>
      api.post('/auth/2fa/enable', { code }, { headers, ...CREDENTIAL_CHECK })
    );
    return data.recoveryCodes || [];
  },

  async disableTwoFactor(password: string, code: string): Promise<void> {
    await withCsrf(headers =>
      api.post('/auth/2fa/disable', { password, code }, { headers, ...CREDENTIAL_CHECK })
    );
  },

  async regenerateRecoveryCodes(password: string, code: string): Promise<string[]> {
    const { data } = await withCsrf(headers =>
      api.post('/auth/2fa/recovery-codes', { password, code }, { headers, ...CREDENTIAL_CHECK })
    );
    return data.recoveryCodes || [];
  },

  async getSecurityPolicy(): Promise<{ policy: SecurityPolicy; limits: PolicyLimits }> {
    const { data } = await api.get('/security-policy');
    return { policy: data.policy, limits: data.limits };
  },

  async updateSecurityPolicy(changes: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    const { data } = await withCsrf(headers => api.put('/security-policy', changes, { headers }));
    return data.policy;
  },

  async getLoginHistory(): Promise<LoginHistoryEntry[]> {
    const { data } = await api.get('/users/login-history');
    return Array.isArray(data) ? data : [];
  }
};

export default securityAPI;
