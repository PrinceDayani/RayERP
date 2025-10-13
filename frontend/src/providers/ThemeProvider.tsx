//path: frontend/src/providers/ThemeProvider.tsx
"use client";

import React, { createContext, useEffect, useState, useMemo } from 'react';
import { getSettings } from '@/lib/api/index';
import { SettingScope, AppearanceSettings as AppearanceSettingsType } from '@/types/settings';

// Enhanced theme settings type 
export interface EnhancedAppearanceSettings extends AppearanceSettingsType {
  reduceAnimations: boolean;
  highContrastMode: boolean;
  customAccentColor: string;
  fontFamily: 'system' | 'serif' | 'mono' | 'dyslexic';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  contentWidth: 'narrow' | 'medium' | 'wide' | 'full';
  lineHeight: number;
  autoSave: boolean;
  darkModeContrast: 'low' | 'medium' | 'high';
  focusHighlight: boolean;
  motionReduction: 'none' | 'minimal' | 'full';
  touchMode: boolean;
  letterSpacing: number;
  customCSS: string;
  useThemeSchedule: boolean;
  darkModeStartTime: string;
  darkModeEndTime: string;
  themeDirection: 'ltr' | 'rtl' | 'auto';
  paragraphSpacing: number;
  textAlign: 'left' | 'justify' | 'center' | 'right';
}

// Environment-based settings
const getEnvironmentSettings = (): EnhancedAppearanceSettings => ({
  theme: (process.env.NEXT_PUBLIC_THEME as 'light' | 'dark' | 'system') || 'system',
  compactMode: process.env.NEXT_PUBLIC_COMPACT_MODE === 'true',
  fontSize: (process.env.NEXT_PUBLIC_FONT_SIZE as 'small' | 'medium' | 'large') || 'medium',
  sidebarCollapsed: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSED === 'true',
  reduceAnimations: process.env.NEXT_PUBLIC_REDUCE_ANIMATIONS === 'true',
  highContrastMode: process.env.NEXT_PUBLIC_HIGH_CONTRAST === 'true',
  customAccentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || '#0284c7',
  fontFamily: (process.env.NEXT_PUBLIC_FONT_FAMILY as 'system' | 'serif' | 'mono' | 'dyslexic') || 'system',
  borderRadius: (process.env.NEXT_PUBLIC_BORDER_RADIUS as 'none' | 'small' | 'medium' | 'large') || 'medium',
  contentWidth: (process.env.NEXT_PUBLIC_CONTENT_WIDTH as 'narrow' | 'medium' | 'wide' | 'full') || 'medium',
  lineHeight: parseFloat(process.env.NEXT_PUBLIC_LINE_HEIGHT || '1.5'),
  autoSave: process.env.NEXT_PUBLIC_AUTO_SAVE !== 'false',
  darkModeContrast: (process.env.NEXT_PUBLIC_DARK_MODE_CONTRAST as 'low' | 'medium' | 'high') || 'medium',
  focusHighlight: process.env.NEXT_PUBLIC_FOCUS_HIGHLIGHT !== 'false',
  motionReduction: (process.env.NEXT_PUBLIC_MOTION_REDUCTION as 'none' | 'minimal' | 'full') || 'none',
  touchMode: process.env.NEXT_PUBLIC_TOUCH_MODE === 'true',
  letterSpacing: parseFloat(process.env.NEXT_PUBLIC_LETTER_SPACING || '0'),
  customCSS: process.env.NEXT_PUBLIC_CUSTOM_CSS || '',
  useThemeSchedule: process.env.NEXT_PUBLIC_USE_THEME_SCHEDULE === 'true',
  darkModeStartTime: process.env.NEXT_PUBLIC_DARK_MODE_START || '20:00',
  darkModeEndTime: process.env.NEXT_PUBLIC_DARK_MODE_END || '07:00',
  themeDirection: (process.env.NEXT_PUBLIC_THEME_DIRECTION as 'ltr' | 'rtl' | 'auto') || 'auto',
  paragraphSpacing: parseFloat(process.env.NEXT_PUBLIC_PARAGRAPH_SPACING || '1'),
  textAlign: (process.env.NEXT_PUBLIC_TEXT_ALIGN as 'left' | 'justify' | 'center' | 'right') || 'left'
});

// Create theme context
interface ThemeContextType {
  settings: EnhancedAppearanceSettings;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleSetting: (key: keyof EnhancedAppearanceSettings) => void;
  updateSetting: <K extends keyof EnhancedAppearanceSettings>(
    key: K,
    value: EnhancedAppearanceSettings[K]
  ) => void;
  isLoaded: boolean;
  effectiveTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);



// Apply settings to DOM
const applySettingsToDOM = (settingsToApply: EnhancedAppearanceSettings) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply theme
  if (settingsToApply.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.classList.toggle('dark', settingsToApply.theme === 'dark');
    root.setAttribute('data-theme', settingsToApply.theme);
  }
  
  // Apply font size
  root.classList.remove('text-small', 'text-medium', 'text-large');
  root.classList.add(`text-${settingsToApply.fontSize}`);
  
  // Apply other classes
  root.classList.toggle('compact-mode', settingsToApply.compactMode);
  root.classList.toggle('high-contrast', settingsToApply.highContrastMode);
  root.classList.toggle('focus-highlight', settingsToApply.focusHighlight);
  root.classList.toggle('touch-mode', settingsToApply.touchMode);
  
  // Motion reduction
  root.classList.remove('motion-none', 'motion-minimal', 'motion-full');
  root.classList.add(`motion-${settingsToApply.motionReduction}`);
  
  // Dark mode contrast
  root.classList.remove('dark-contrast-low', 'dark-contrast-medium', 'dark-contrast-high');
  root.classList.add(`dark-contrast-${settingsToApply.darkModeContrast}`);
  
  // Text alignment
  root.classList.remove('text-left', 'text-right', 'text-center', 'text-justify');
  root.classList.add(`text-${settingsToApply.textAlign}`);
  
  // Set CSS custom properties
  root.style.setProperty('--accent-color', settingsToApply.customAccentColor);
  root.style.setProperty('--line-height', settingsToApply.lineHeight.toString());
  root.style.setProperty('--letter-spacing', `${settingsToApply.letterSpacing}px`);
  root.style.setProperty('--paragraph-spacing', `${settingsToApply.paragraphSpacing}em`);
  
  // Set text direction
  if (settingsToApply.themeDirection !== 'auto') {
    root.dir = settingsToApply.themeDirection;
  } else {
    root.removeAttribute('dir');
  }
  
  // Font family
  switch (settingsToApply.fontFamily) {
    case 'serif':
      root.style.setProperty('--font-family', '"Merriweather", Georgia, serif');
      break;
    case 'mono':
      root.style.setProperty('--font-family', '"JetBrains Mono", monospace');
      break;
    case 'dyslexic':
      root.style.setProperty('--font-family', '"OpenDyslexic", sans-serif');
      break;
    default:
      root.style.setProperty('--font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
  }
  
  // Border radius
  switch (settingsToApply.borderRadius) {
    case 'none':
      root.style.setProperty('--border-radius', '0px');
      break;
    case 'small':
      root.style.setProperty('--border-radius', '4px');
      break;
    case 'medium':
      root.style.setProperty('--border-radius', '8px');
      break;
    case 'large':
      root.style.setProperty('--border-radius', '12px');
      break;
  }
  
  // Content width
  switch (settingsToApply.contentWidth) {
    case 'narrow':
      root.style.setProperty('--content-width', '65ch');
      break;
    case 'medium':
      root.style.setProperty('--content-width', '85ch');
      break;
    case 'wide':
      root.style.setProperty('--content-width', '120ch');
      break;
    case 'full':
      root.style.setProperty('--content-width', '100%');
      break;
  }
  
  // Apply custom CSS if provided
  if (settingsToApply.customCSS) {
    let customStyleElement = document.getElementById('custom-appearance-css');
    
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'custom-appearance-css';
      document.head.appendChild(customStyleElement);
    }
    
    customStyleElement.textContent = settingsToApply.customCSS;
  }
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('appearance-settings-changed', {
    detail: settingsToApply
  }));
};

// Theme Provider Component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<EnhancedAppearanceSettings>(getEnvironmentSettings());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Calculate effective theme based on settings
  const effectiveTheme = useMemo((): 'light' | 'dark' => {
    if (settings.theme === 'dark') return 'dark';
    if (settings.theme === 'light') return 'light';
    
    // Handle system theme
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Check scheduled theme if enabled
      if (settings.useThemeSchedule) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const startTime = settings.darkModeStartTime;
        const endTime = settings.darkModeEndTime;
        
        // Determine if we're in the dark mode schedule
        if (startTime <= endTime) {
          // Simple case: e.g., 9:00 to 17:00
          return (currentTime >= startTime && currentTime < endTime) ? 'dark' : 'light';
        } else {
          // Overnight case: e.g., 22:00 to 6:00
          return (currentTime >= startTime || currentTime < endTime) ? 'dark' : 'light';
        }
      }
      
      return prefersDark ? 'dark' : 'light';
    }
    
    return 'light'; // Default fallback
  }, [settings.theme, settings.useThemeSchedule, settings.darkModeStartTime, settings.darkModeEndTime]);
  
  // Update isDarkMode when effectiveTheme changes
  useEffect(() => {
    setIsDarkMode(effectiveTheme === 'dark');
  }, [effectiveTheme]);
  
  // Load settings on mount
  useEffect(() => {
    const envSettings = getEnvironmentSettings();
    setSettings(envSettings);
    applySettingsToDOM(envSettings);
    setIsLoaded(true);
  }, []);
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => applySettingsToDOM(settings);
    
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings]);
  

  
  // Theme schedule effect
  useEffect(() => {
    if (!settings.useThemeSchedule || settings.theme !== 'system') return;
    
    const checkScheduledTheme = () => {
      applySettingsToDOM(settings);
    };
    
    // Set up scheduled theme changes
    const intervalId = setInterval(checkScheduledTheme, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [settings]);
  
  // Update setting and apply changes
  const updateSetting = useMemo(() => {
    return <K extends keyof EnhancedAppearanceSettings>(
      key: K, 
      value: EnhancedAppearanceSettings[K]
    ) => {
      setSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        applySettingsToDOM(newSettings);
        return newSettings;
      });
    };
  }, []);
  
  // Set theme shorthand
  const setTheme = useMemo(() => {
    return (theme: 'light' | 'dark' | 'system') => {
      updateSetting('theme', theme);
    };
  }, [updateSetting]);
  
  // Set font size shorthand
  const setFontSize = useMemo(() => {
    return (fontSize: 'small' | 'medium' | 'large') => {
      updateSetting('fontSize', fontSize);
    };
  }, [updateSetting]);
  
  // Toggle boolean setting
  const toggleSetting = useMemo(() => {
    return (key: keyof EnhancedAppearanceSettings) => {
      setSettings(prev => {
        const newSettings = { 
          ...prev, 
          [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key] 
        };
        applySettingsToDOM(newSettings);
        return newSettings;
      });
    };
  }, []);
  
  // Context value
  const contextValue = useMemo(() => ({
    settings,
    setTheme,
    setFontSize,
    toggleSetting,
    updateSetting,
    isLoaded,
    effectiveTheme
  }), [settings, setTheme, setFontSize, toggleSetting, updateSetting, isLoaded, effectiveTheme]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}