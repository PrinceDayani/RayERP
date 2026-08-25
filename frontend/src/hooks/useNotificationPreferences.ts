"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api/api';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  orderNotifications: boolean;
  inventoryAlerts: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
  budgetAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  maintenanceNotices: boolean;
}

export const NOTIFICATION_DEFAULTS: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  orderNotifications: true,
  inventoryAlerts: true,
  projectUpdates: true,
  taskReminders: true,
  budgetAlerts: true,
  dailyReports: false,
  weeklyReports: true,
  monthlyReports: true,
  systemAlerts: true,
  securityAlerts: true,
  maintenanceNotices: true
};

// Shared across every consumer so mounting several notification-aware
// components issues one request rather than one each.
let cache: NotificationPreferences | null = null;
let inFlight: Promise<NotificationPreferences> | null = null;
const subscribers = new Set<(preferences: NotificationPreferences) => void>();

const fetchPreferences = (): Promise<NotificationPreferences> => {
  if (cache) return Promise.resolve(cache);

  if (!inFlight) {
    inFlight = api
      .get('/notification-settings')
      .then(response => {
        cache = { ...NOTIFICATION_DEFAULTS, ...(response.data?.settings || {}) };
        subscribers.forEach(notify => notify(cache!));
        return cache;
      })
      .catch(() => NOTIFICATION_DEFAULTS)
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
};

/** Lets the settings screen push freshly saved values to other consumers. */
export const primeNotificationPreferences = (preferences: NotificationPreferences): void => {
  cache = preferences;
  subscribers.forEach(notify => notify(preferences));
};

/** Read-only view of the signed-in user's notification preferences. */
export function useNotificationPreferences(): NotificationPreferences {
  const [preferences, setPreferences] = useState<NotificationPreferences>(cache || NOTIFICATION_DEFAULTS);

  useEffect(() => {
    let active = true;

    if (typeof window !== 'undefined' && !localStorage.getItem('auth-token')) {
      return;
    }

    fetchPreferences().then(loaded => {
      if (active) setPreferences(loaded);
    });

    subscribers.add(setPreferences);
    return () => {
      active = false;
      subscribers.delete(setPreferences);
    };
  }, []);

  return preferences;
}
