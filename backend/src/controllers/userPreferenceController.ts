import { Request, Response } from 'express';
import UserPreference, { THEMES, FONT_SIZES, NUMBER_FORMATS } from '../models/UserPreference';
import { logger } from '../utils/logger';

// Only these keys are writable. Anything else in the body is ignored, which
// keeps the collection a fixed-shape preference document rather than an
// open key-value store any authenticated caller can grow without bound.
const ENUM_FIELDS: Record<string, readonly string[]> = {
  theme: THEMES,
  fontSize: FONT_SIZES,
  numberFormat: NUMBER_FORMATS
};

const BOOLEAN_FIELDS = ['compactMode', 'sidebarCollapsed'] as const;

/** Preferences for the signed-in user, created with defaults on first read. */
export const getMyPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Upsert so two tabs loading at once cannot race into a duplicate-key error
    // against the unique index on `user`.
    const preferences = await UserPreference.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, preferences });
  } catch (error: any) {
    logger.error(`Get user preferences error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error retrieving preferences' });
  }
};

/**
 * Partial update of the signed-in user's own preferences. Accepts any subset of
 * the known keys so the client can batch several changes into one request.
 */
export const updateMyPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const updates: Record<string, unknown> = {};

    for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
      if (req.body[field] === undefined) continue;

      if (!allowed.includes(req.body[field])) {
        return res.status(400).json({
          success: false,
          message: `${field} must be one of: ${allowed.join(', ')}`
        });
      }

      updates[field] = req.body[field];
    }

    for (const field of BOOLEAN_FIELDS) {
      if (req.body[field] === undefined) continue;

      if (typeof req.body[field] !== 'boolean') {
        return res.status(400).json({ success: false, message: `${field} must be a boolean` });
      }

      updates[field] = req.body[field];
    }

    if (req.body.currency !== undefined) {
      const currency = String(req.body.currency).toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) {
        return res.status(400).json({
          success: false,
          message: 'currency must be a three-letter ISO 4217 code'
        });
      }
      updates.currency = currency;
    }

    if (req.body.timezone !== undefined) {
      const timezone = String(req.body.timezone);
      try {
        new Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        return res.status(400).json({ success: false, message: 'Unrecognised IANA timezone' });
      }
      updates.timezone = timezone;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No recognised preference fields supplied' });
    }

    const preferences = await UserPreference.findOneAndUpdate(
      { user: userId },
      { $set: updates, $setOnInsert: { user: userId } },
      { new: true, upsert: true, runValidators: true }
    );

    // Let this user's other open tabs and devices pick the change up live.
    try {
      const { io } = await import('../server');
      io.to(`user-${userId}`).emit('preferences:updated', {
        preferences,
        timestamp: new Date()
      });
    } catch (error: any) {
      logger.warn(`Could not broadcast preference update: ${error.message}`);
    }

    return res.json({ success: true, preferences });
  } catch (error: any) {
    logger.error(`Update user preferences error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error saving preferences' });
  }
};
