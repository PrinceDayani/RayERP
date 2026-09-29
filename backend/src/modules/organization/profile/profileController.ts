import { Request, Response } from 'express';
import { logger } from '../../../utils/logger';
import { appTimezone } from '../../../utils/timezoneHelper';
import { getOrganizationSettings, invalidateProfileCache } from './profileService';

const TEXT_FIELDS = ['companyName', 'legalName', 'phone', 'email', 'website', 'gstin', 'pan', 'cin'] as const;
const ADDRESS_FIELDS = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const;

const FORMATS: Partial<Record<typeof TEXT_FIELDS[number], { re: RegExp; message: string }>> = {
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'email is not a valid address' },
  website: { re: /^https?:\/\/[^\s]+$/i, message: 'website must start with http:// or https://' },
  gstin: { re: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, message: 'GSTIN must be 15 characters, e.g. 24ABCDE1234F1Z5' },
  pan: { re: /^[A-Z]{5}\d{4}[A-Z]$/, message: 'PAN must look like ABCDE1234F' },
  cin: { re: /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/, message: 'CIN must be 21 characters, e.g. U12345GJ2020PTC123456' },
};

// Raster formats only: an SVG logo could carry script into every page that shows it.
const LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_LOGO_CHARS = 400_000; // about 300 KB of image data

const shape = (s: any) => ({
  companyName: s.companyName,
  legalName: s.legalName || '',
  address: {
    line1: s.address?.line1 || '',
    line2: s.address?.line2 || '',
    city: s.address?.city || '',
    state: s.address?.state || '',
    postalCode: s.address?.postalCode || '',
    country: s.address?.country || '',
  },
  phone: s.phone || '',
  email: s.email || '',
  website: s.website || '',
  gstin: s.gstin || '',
  pan: s.pan || '',
  cin: s.cin || '',
  logo: s.logo || '',
  fiscalYearStart: s.fiscalYearStart,
  currency: s.currency,
  // Deployment-level (APP_TIMEZONE); shown so admins can see which zone the rules run in.
  timezone: appTimezone(),
});

export const getProfile = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: shape(await getOrganizationSettings()) });
  } catch (error: any) {
    logger.error('Get organisation profile error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error retrieving organisation profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const updates: Record<string, unknown> = {};

    for (const field of TEXT_FIELDS) {
      if (body[field] === undefined) continue;
      const value = String(body[field] ?? '').trim();
      const normalised = ['gstin', 'pan', 'cin'].includes(field) ? value.toUpperCase() : value;
      if (value.length > 200) return res.status(400).json({ success: false, message: `${field} is too long` });
      const format = FORMATS[field];
      if (normalised && format && !format.re.test(normalised)) {
        return res.status(400).json({ success: false, message: format.message });
      }
      updates[field] = normalised;
    }
    if (updates.companyName === '') {
      return res.status(400).json({ success: false, message: 'companyName is required' });
    }

    if (body.address !== undefined) {
      if (typeof body.address !== 'object' || body.address === null) {
        return res.status(400).json({ success: false, message: 'address must be an object' });
      }
      for (const field of ADDRESS_FIELDS) {
        if (body.address[field] === undefined) continue;
        const value = String(body.address[field] ?? '').trim();
        if (value.length > 200) return res.status(400).json({ success: false, message: `address.${field} is too long` });
        updates[`address.${field}`] = value;
      }
    }

    if (body.fiscalYearStart !== undefined) {
      const m = /^(\d{2})-(\d{2})$/.exec(String(body.fiscalYearStart));
      if (!m || +m[1] < 1 || +m[1] > 31 || +m[2] < 1 || +m[2] > 12) {
        return res.status(400).json({ success: false, message: 'fiscalYearStart must be a DD-MM date' });
      }
      updates.fiscalYearStart = body.fiscalYearStart;
    }

    if (body.currency !== undefined) {
      const currency = String(body.currency).trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) {
        return res.status(400).json({ success: false, message: 'currency must be a three-letter ISO 4217 code' });
      }
      updates.currency = currency;
    }

    if (body.logo !== undefined) {
      const logo = String(body.logo ?? '');
      if (logo && (!LOGO.test(logo) || logo.length > MAX_LOGO_CHARS)) {
        return res.status(400).json({ success: false, message: 'Logo must be a PNG, JPEG or WebP image under 300 KB' });
      }
      updates.logo = logo;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No profile fields supplied' });
    }

    const settings = await getOrganizationSettings();
    settings.set(updates);
    await settings.save();
    invalidateProfileCache();

    logger.info('Organisation profile updated', {
      userId: req.user?._id?.toString(),
      fields: Object.keys(updates),
    });
    res.json({ success: true, data: shape(settings) });
  } catch (error: any) {
    logger.error('Update organisation profile error', { message: error.message });
    res.status(500).json({ success: false, message: 'Error updating organisation profile' });
  }
};
