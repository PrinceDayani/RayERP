"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import preferencesAPI, { DEFAULT_PREFERENCES, type UserPreferences } from '@/lib/api/preferencesAPI';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface PreferencesContextValue {
  preferences: UserPreferences;
  loading: boolean;
  saveState: SaveState;
  /** Last save failure, surfaced by the settings UI. */
  saveError: string | null;
  /** Applies immediately and persists after a short debounce. */
  update: (changes: Partial<UserPreferences>) => void;
  /** Persists any pending change right away; resolves once the server responds. */
  flush: () => Promise<void>;
  reload: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 600;

/**
 * Applies preferences that affect global layout to the document element, and
 * mirrors the currency choices into localStorage where utils/currency.ts and
 * its many callers already read them. The server stays the source of truth;
 * localStorage is the synchronous cache those formatters need.
 */
const applyToDocument = (preferences: UserPreferences) => {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-font-size', preferences.fontSize);
  document.documentElement.classList.toggle('compact-mode', preferences.compactMode);

  try {
    localStorage.setItem('preferredCurrency', preferences.currency);
    localStorage.setItem('numberFormat', preferences.numberFormat);
  } catch {
    // Storage can be unavailable (private mode); formatting falls back to defaults.
  }
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const { setTheme } = useTheme();

  // Changes accumulate here between debounced flushes so a burst of toggles
  // becomes one request rather than one request per control.
  const pending = useRef<Partial<UserPreferences>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth-token')) {
      setLoading(false);
      return;
    }

    try {
      const loaded = await preferencesAPI.get();
      setPreferences(loaded);
      applyToDocument(loaded);
      setTheme(loaded.theme);
    } catch {
      // An unreachable or unauthorised server leaves the defaults in place;
      // the settings screen reports the failure when the user tries to save.
      applyToDocument(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async () => {
    const changes = pending.current;
    pending.current = {};

    if (Object.keys(changes).length === 0) return;

    setSaveState('saving');
    setSaveError(null);

    try {
      const saved = await preferencesAPI.update(changes);
      setPreferences(saved);
      applyToDocument(saved);
      setSaveState('saved');
    } catch (error: any) {
      // Put the failed changes back so a later flush retries them, and tell the
      // user rather than silently dropping the edit.
      pending.current = { ...changes, ...pending.current };
      setSaveError(error?.response?.data?.message || 'Could not save your preferences');
      setSaveState('error');
    }
  }, []);

  const update = useCallback(
    (changes: Partial<UserPreferences>) => {
      // Reflect the change locally first so the UI never lags the interaction.
      setPreferences(current => {
        const next = { ...current, ...changes };
        applyToDocument(next);
        return next;
      });

      if (changes.theme) setTheme(changes.theme);

      pending.current = { ...pending.current, ...changes };

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(persist, SAVE_DEBOUNCE_MS);
    },
    [persist, setTheme]
  );

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await persist();
  }, [persist]);

  // A pending debounced change must still reach the server if the user
  // navigates away or closes the tab inside the debounce window - cancelling
  // the timer alone would silently discard the edit.
  useEffect(() => {
    const flushPending = () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      timer.current = null;
      void persist();
    };

    window.addEventListener('pagehide', flushPending);
    return () => {
      window.removeEventListener('pagehide', flushPending);
      flushPending();
    };
  }, [persist]);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const id = setTimeout(() => setSaveState('idle'), 2000);
    return () => clearTimeout(id);
  }, [saveState]);

  return (
    <PreferencesContext.Provider
      value={{ preferences, loading, saveState, saveError, update, flush, reload: load }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextValue => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
