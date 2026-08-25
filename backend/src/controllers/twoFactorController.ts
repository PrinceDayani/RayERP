import { Request, Response } from 'express';
import User from '../models/User';
import { logger } from '../utils/logger';
import {
  buildOtpAuthUri,
  consumeRecoveryCode,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  isTwoFactorConfigured,
  verifyTotp,
  TwoFactorKeyMissingError,
  TOTP_ISSUER
} from '../services/accountSecurity.service';

const keyMissingResponse = (res: Response) =>
  res.status(503).json({
    success: false,
    message:
      'Two-factor authentication is unavailable because TWO_FACTOR_ENCRYPTION_KEY is not configured on the server.',
    code: 'TWO_FACTOR_NOT_CONFIGURED'
  });

/** Enrolment state for the signed-in user. Never returns the secret itself. */
export const getTwoFactorStatus = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('+twoFactor.recoveryCodes');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      available: isTwoFactorConfigured(),
      enabled: Boolean(user.twoFactor?.enabled),
      enrolledAt: user.twoFactor?.enrolledAt,
      recoveryCodesRemaining: user.twoFactor?.recoveryCodes?.length || 0,
      issuer: TOTP_ISSUER
    });
  } catch (error: any) {
    logger.error(`Two-factor status error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error retrieving two-factor status' });
  }
};

/**
 * Issues a fresh secret and the otpauth URI the client renders as a QR code.
 * The secret is stored encrypted but stays inactive until `enableTwoFactor`
 * confirms the user can produce a valid code from it.
 */
export const setupTwoFactor = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Confirm your password to begin enrolment' });
    }

    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!(await user.comparePassword(password))) {
      logger.warn(`Two-factor setup rejected: wrong password for ${user.email}`);
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }

    if (user.twoFactor?.enabled) {
      return res.status(409).json({
        success: false,
        message: 'Two-factor authentication is already enabled. Disable it before re-enrolling.'
      });
    }

    const secret = generateTotpSecret();

    user.twoFactor = { enabled: false, secret: encryptSecret(secret) };
    user.markModified('twoFactor');
    await user.save();

    logger.info(`Two-factor enrolment started for ${user.email}`);

    return res.json({
      success: true,
      // Returned once so the user can enter it manually if they cannot scan.
      secret,
      otpauthUrl: buildOtpAuthUri(user.email, secret)
    });
  } catch (error: any) {
    if (error instanceof TwoFactorKeyMissingError) return keyMissingResponse(res);
    logger.error(`Two-factor setup error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error starting two-factor enrolment' });
  }
};

/** Confirms enrolment and hands back the recovery codes, shown only this once. */
export const enableTwoFactor = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Enter the code from your authenticator app' });
    }

    const user = await User.findById(req.user?._id).select('+twoFactor.secret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.twoFactor?.enabled) {
      return res.status(409).json({ success: false, message: 'Two-factor authentication is already enabled' });
    }

    if (!user.twoFactor?.secret) {
      return res.status(400).json({ success: false, message: 'Start enrolment before confirming a code' });
    }

    if (!(await verifyTotp(code, decryptSecret(user.twoFactor.secret)))) {
      logger.warn(`Two-factor enrolment code rejected for ${user.email}`);
      return res.status(401).json({ success: false, message: 'That code is not valid. Check your device clock and try again.' });
    }

    const { codes, hashes } = generateRecoveryCodes();

    user.twoFactor.enabled = true;
    user.twoFactor.recoveryCodes = hashes;
    user.twoFactor.enrolledAt = new Date();
    user.markModified('twoFactor');
    await user.save();

    logger.info(`Two-factor authentication enabled for ${user.email}`);

    return res.json({
      success: true,
      message: 'Two-factor authentication is now enabled',
      recoveryCodes: codes
    });
  } catch (error: any) {
    if (error instanceof TwoFactorKeyMissingError) return keyMissingResponse(res);
    logger.error(`Two-factor enable error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error enabling two-factor authentication' });
  }
};

/** Turning the second factor off requires both the password and a live code. */
export const disableTwoFactor = async (req: Request, res: Response) => {
  try {
    const { password, code, recoveryCode } = req.body;

    if (!password || (!code && !recoveryCode)) {
      return res.status(400).json({
        success: false,
        message: 'Confirm your password and an authenticator or recovery code'
      });
    }

    const user = await User.findById(req.user?._id).select('+password +twoFactor.secret +twoFactor.recoveryCodes');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactor?.enabled || !user.twoFactor.secret) {
      return res.status(409).json({ success: false, message: 'Two-factor authentication is not enabled' });
    }

    if (!(await user.comparePassword(password))) {
      logger.warn(`Two-factor disable rejected: wrong password for ${user.email}`);
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }

    const verified = recoveryCode
      ? consumeRecoveryCode(recoveryCode, user.twoFactor.recoveryCodes || []) !== null
      : await verifyTotp(code, decryptSecret(user.twoFactor.secret));

    if (!verified) {
      logger.warn(`Two-factor disable rejected: bad code for ${user.email}`);
      return res.status(401).json({ success: false, message: 'That code is not valid' });
    }

    user.twoFactor = { enabled: false };
    user.markModified('twoFactor');
    await user.save();

    logger.info(`Two-factor authentication disabled for ${user.email}`);

    return res.json({ success: true, message: 'Two-factor authentication has been disabled' });
  } catch (error: any) {
    if (error instanceof TwoFactorKeyMissingError) return keyMissingResponse(res);
    logger.error(`Two-factor disable error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error disabling two-factor authentication' });
  }
};

/** Replaces the recovery code set; any previously issued codes stop working. */
export const regenerateRecoveryCodes = async (req: Request, res: Response) => {
  try {
    const { password, code } = req.body;

    if (!password || !code) {
      return res.status(400).json({
        success: false,
        message: 'Confirm your password and a code from your authenticator app'
      });
    }

    const user = await User.findById(req.user?._id).select('+password +twoFactor.secret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactor?.enabled || !user.twoFactor.secret) {
      return res.status(409).json({ success: false, message: 'Two-factor authentication is not enabled' });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }

    if (!(await verifyTotp(code, decryptSecret(user.twoFactor.secret)))) {
      return res.status(401).json({ success: false, message: 'That code is not valid' });
    }

    const { codes, hashes } = generateRecoveryCodes();
    user.twoFactor.recoveryCodes = hashes;
    user.markModified('twoFactor');
    await user.save();

    logger.info(`Recovery codes regenerated for ${user.email}`);

    return res.json({
      success: true,
      message: 'New recovery codes generated. Your previous codes no longer work.',
      recoveryCodes: codes
    });
  } catch (error: any) {
    if (error instanceof TwoFactorKeyMissingError) return keyMissingResponse(res);
    logger.error(`Recovery code regeneration error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error regenerating recovery codes' });
  }
};
