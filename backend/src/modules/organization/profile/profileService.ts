import { Settings, ISettings } from '../../../models/Settings';

// Emails and PDFs read the company name on every send, so the singleton is
// held in process and dropped whenever the profile is saved.
let cached: { settings: ISettings; expires: number } | null = null;
const CACHE_TTL_MS = 60000;

// Schema default for companyName; treated as "not set yet".
const PLACEHOLDER_NAME = 'My Company';

export const invalidateProfileCache = (): void => {
  cached = null;
};

export const getOrganizationSettings = async (): Promise<ISettings> => {
  if (cached && cached.expires > Date.now()) return cached.settings;
  const settings = await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  cached = { settings, expires: Date.now() + CACHE_TTL_MS };
  return settings;
};

/** The name shown on emails and documents: the saved profile, else COMPANY_NAME. */
export const getCompanyName = async (): Promise<string> => {
  const name = (await getOrganizationSettings()).companyName?.trim();
  return name && name !== PLACEHOLDER_NAME ? name : process.env.COMPANY_NAME || 'RayERP';
};
