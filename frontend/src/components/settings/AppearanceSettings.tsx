"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePreferences } from '@/contexts/PreferencesContext';
import type { FontSize, Theme } from '@/lib/api/preferencesAPI';
import { AlertCircle, CheckCircle, Loader2, Monitor, Moon, Palette, Sun } from 'lucide-react';

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun; accent: string }> = [
  { value: 'light', label: 'Light', icon: Sun, accent: 'from-yellow-400 to-orange-500' },
  { value: 'dark', label: 'Dark', icon: Moon, accent: 'from-indigo-500 to-purple-600' },
  { value: 'system', label: 'System', icon: Monitor, accent: 'from-slate-500 to-slate-700' }
];

const FONT_SIZE_OPTIONS: Array<{ value: FontSize; label: string; hint: string; className: string }> = [
  { value: 'small', label: 'Small', hint: 'Fits more on screen', className: 'text-sm' },
  { value: 'medium', label: 'Medium', hint: 'Default', className: 'text-base' },
  { value: 'large', label: 'Large', hint: 'Easier to read', className: 'text-lg' }
];

export default function AppearanceSettings() {
  const { preferences, loading, saveState, saveError, update, flush } = usePreferences();

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="space-y-4">
          <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{saveError} Your changes are not stored yet.</span>
            <Button variant="outline" size="sm" onClick={() => flush()} disabled={saveState === 'saving'}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Theme */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Palette className="h-5 w-5" />
            Theme
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">Choose your preferred colour scheme</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon, accent }) => {
            const selected = preferences.theme === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ theme: value })}
                className={`relative rounded-2xl border-2 p-6 transition-all hover:scale-[1.02] ${
                  selected
                    ? 'border-[#970E2C] bg-[#970E2C]/5 shadow-lg dark:bg-[#970E2C]/15'
                    : 'border-slate-200 hover:border-[#970E2C]/40 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`rounded-xl bg-gradient-to-br p-3 shadow-lg ${accent}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                {selected && <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-[#970E2C]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Font Size</Label>
          <p className="mt-1 text-sm text-muted-foreground">Applies across the whole application</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FONT_SIZE_OPTIONS.map(({ value, label, hint, className }) => {
            const selected = preferences.fontSize === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ fontSize: value })}
                className={`relative rounded-2xl border-2 p-6 transition-all hover:scale-[1.02] ${
                  selected
                    ? 'border-[#970E2C] bg-[#970E2C]/5 shadow-lg dark:bg-[#970E2C]/15'
                    : 'border-slate-200 hover:border-[#970E2C]/40 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className={`font-medium ${className}`}>{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </div>
                {selected && <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-[#970E2C]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Layout</Label>
          <p className="mt-1 text-sm text-muted-foreground">Customise your workspace density</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#970E2C]/40 dark:border-slate-700 dark:bg-slate-800">
            <div className="space-y-1">
              <Label htmlFor="compactMode" className="cursor-pointer text-sm font-medium">
                Compact Mode
              </Label>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding to fit more content</p>
            </div>
            <Switch
              id="compactMode"
              checked={preferences.compactMode}
              onCheckedChange={checked => update({ compactMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#970E2C]/40 dark:border-slate-700 dark:bg-slate-800">
            <div className="space-y-1">
              <Label htmlFor="sidebarCollapsed" className="cursor-pointer text-sm font-medium">
                Collapsed Sidebar
              </Label>
              <p className="text-xs text-muted-foreground">Start with the sidebar minimised</p>
            </div>
            <Switch
              id="sidebarCollapsed"
              checked={preferences.sidebarCollapsed}
              onCheckedChange={checked => update({ sidebarCollapsed: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-800/50">
        {saveState === 'saving' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving…</span>
          </>
        ) : saveState === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>Your last change could not be saved</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Changes apply instantly and save to your account automatically</span>
          </>
        )}
      </div>
    </div>
  );
}
