import api from './api';
import { withCsrf } from './csrf';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type NumberFormat = 'auto' | 'indian' | 'international';

export interface UserPreferences {
  theme: Theme;
  fontSize: FontSize;
  compactMode: boolean;
  sidebarCollapsed: boolean;
  currency: string;
  numberFormat: NumberFormat;
  timezone: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  compactMode: false,
  sidebarCollapsed: false,
  currency: 'INR',
  numberFormat: 'auto',
  timezone: 'UTC'
};

const preferencesAPI = {
  /** Preferences for the signed-in user. */
  async get(): Promise<UserPreferences> {
    const response = await api.get('/settings/me');
    return { ...DEFAULT_PREFERENCES, ...(response.data?.preferences || {}) };
  },

  /** Partial update - send only the keys that changed. */
  async update(changes: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await withCsrf(headers => api.put('/settings/me', changes, { headers }));
    return { ...DEFAULT_PREFERENCES, ...(response.data?.preferences || {}) };
  }
};

export default preferencesAPI;
