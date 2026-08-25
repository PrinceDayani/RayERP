import { Request, Response } from 'express';
import SecurityPolicy, { SECURITY_POLICY_LIMITS } from '../models/SecurityPolicy';
import { logger } from '../utils/logger';

const NUMERIC_FIELDS = [
  'sessionTimeoutMinutes',
  'maxLoginAttempts',
  'lockoutDurationMinutes',
  'minPasswordLength',
  'passwordHistoryCount'
] as const;

/** Read the organisation-wide security policy. */
export const getSecurityPolicy = async (_req: Request, res: Response) => {
  try {
    const policy = await SecurityPolicy.getPolicy();
    return res.json({ success: true, policy, limits: SECURITY_POLICY_LIMITS });
  } catch (error: any) {
    logger.error(`Get security policy error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error retrieving security policy' });
  }
};

/**
 * Update the policy. Only the known fields are read off the body, and each
 * numeric field is range-checked here rather than relying on the schema alone,
 * so a bad value returns 400 instead of a 500 from a validation throw.
 */
export const updateSecurityPolicy = async (req: Request, res: Response) => {
  try {
    const updates: Record<string, unknown> = {};

    for (const field of NUMERIC_FIELDS) {
      if (req.body[field] === undefined) continue;

      const value = Number(req.body[field]);
      const { min, max } = SECURITY_POLICY_LIMITS[field];

      if (!Number.isInteger(value) || value < min || value > max) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a whole number between ${min} and ${max}`
        });
      }

      updates[field] = value;
    }

    if (req.body.requireStrongPassword !== undefined) {
      if (typeof req.body.requireStrongPassword !== 'boolean') {
        return res.status(400).json({ success: false, message: 'requireStrongPassword must be a boolean' });
      }
      updates.requireStrongPassword = req.body.requireStrongPassword;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No recognised security policy fields supplied' });
    }

    // Written straight through rather than by mutating the cached document, so
    // a failed write cannot leave the in-process cache holding values that were
    // never persisted.
    const policy = await SecurityPolicy.findOneAndUpdate(
      {},
      { $set: { ...updates, updatedBy: req.user?._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    // Drop the cached copy so the next authenticated request reads the change.
    SecurityPolicy.invalidateCache();

    logger.info('Security policy updated', {
      userId: req.user?._id?.toString(),
      fields: Object.keys(updates)
    });

    return res.json({ success: true, message: 'Security policy updated', policy });
  } catch (error: any) {
    logger.error(`Update security policy error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error updating security policy' });
  }
};
