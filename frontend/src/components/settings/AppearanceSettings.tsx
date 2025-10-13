// frontend/src/components/settings/AppearanceSettings.tsx
"use client";

// ================ [1] IMPORTS & TYPES ================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { getSettings, bulkUpdateSettings } from '@/lib/api/index';
import { SettingScope, AppearanceSettings as AppearanceSettingsType } from '@/types/settings';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, RefreshCw, Check, Undo2, Settings2, Sun, Moon, 
  Laptop, Save, Download, Upload, Sparkles, Clock, EyeIcon,
  Smartphone, RotateCw, Palette, Languages, KeyRound, ArrowUpDown
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Enhanced settings type
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
  keyboardShortcuts: {
    toggleTheme: string;
    resetZoom: string;
  };
  savedThemePresets: ThemePreset[];
  paragraphSpacing: number;
  textAlign: 'left' | 'justify' | 'center' | 'right';
}

// Theme preset type
interface ThemePreset {
  id: string;
  name: string;
  settings: Partial<EnhancedAppearanceSettings>;
  createdAt: string;
}

// ================ [2] CONFIG & CONSTANTS ================
// Default values
const DEFAULT_SETTINGS: EnhancedAppearanceSettings = {
  theme: 'system',
  compactMode: false,
  fontSize: 'medium',
  sidebarCollapsed: false,
  reduceAnimations: false,
  highContrastMode: false,
  customAccentColor: '#0284c7',
  fontFamily: 'system',
  borderRadius: 'medium',
  contentWidth: 'medium',
  lineHeight: 1.5,
  autoSave: true,
  darkModeContrast: 'medium',
  focusHighlight: true,
  motionReduction: 'none',
  touchMode: false,
  letterSpacing: 0,
  customCSS: '',
  useThemeSchedule: false,
  darkModeStartTime: '20:00',
  darkModeEndTime: '07:00',
  themeDirection: 'auto',
  keyboardShortcuts: {
    toggleTheme: 'Alt+T',
    resetZoom: 'Alt+0',
  },
  savedThemePresets: [],
  paragraphSpacing: 1,
  textAlign: 'left',
};

// Available accent colors
const ACCENT_COLORS = [
  { name: 'Blue', value: '#0284c7' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Lime', value: '#84cc16' }
];

// Font options
const FONT_OPTIONS = [
  { 
    value: 'system', 
    label: 'System Default',
    style: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    description: 'Uses your device default fonts' 
  },
  { 
    value: 'serif', 
    label: 'Serif', 
    style: { fontFamily: '"Merriweather", Georgia, serif' },
    description: 'Better for long-form reading'
  },
  { 
    value: 'mono', 
    label: 'Monospace', 
    style: { fontFamily: '"JetBrains Mono", monospace' },
    description: 'Fixed-width font, ideal for code'
  },
  { 
    value: 'dyslexic', 
    label: 'Dyslexic Friendly', 
    style: { fontFamily: '"OpenDyslexic", sans-serif' },
    description: 'Designed to help with dyslexia'
  }
];

// Text alignment options
const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justified' }
];

// Direction options
const DIRECTION_OPTIONS = [
  { value: 'ltr', label: 'Left to Right' },
  { value: 'rtl', label: 'Right to Left' },
  { value: 'auto', label: 'Auto (Based on language)' }
];

// Default theme presets
const DEFAULT_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'preset-reading',
    name: 'Reading Mode',
    createdAt: new Date().toISOString(),
    settings: {
      theme: 'light',
      fontFamily: 'serif',
      fontSize: 'large',
      lineHeight: 1.8,
      contentWidth: 'narrow',
      paragraphSpacing: 1.5,
      letterSpacing: 0.5,
      highContrastMode: false,
    }
  },
  {
    id: 'preset-coding',
    name: 'Coding Mode',
    createdAt: new Date().toISOString(),
    settings: {
      theme: 'dark',
      fontFamily: 'mono',
      fontSize: 'medium',
      lineHeight: 1.4,
      contentWidth: 'wide',
      darkModeContrast: 'high',
    }
  },
];

// Event name for appearance settings changes
const APPEARANCE_CHANGE_EVENT = 'appearance-settings-changed';

// Local storage key
const STORAGE_KEY = 'app-appearance-settings';

// ================ [3] HOOKS & UTILITIES ================
// Utility: Local storage helper
function useLocalStorage<T>(key: string, initialValue: T) {
  // Function to get value from localStorage
  const getValueFromStorage = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  }, [initialValue, key]);

  // Save value to localStorage
  const saveValueToStorage = useCallback((value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key]);

  return { getValueFromStorage, saveValueToStorage };
}

// Utility: Media query hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    const updateMatches = () => setMatches(media.matches);
    
    updateMatches();
    media.addEventListener('change', updateMatches);
    
    return () => media.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

// Utility: Debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utility: Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ================ [4] MAIN COMPONENT SETUP & STATE ================
// Main settings component
export default function AppearanceSettings() {
  // Context and state
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { getValueFromStorage, saveValueToStorage } = useLocalStorage<EnhancedAppearanceSettings>(
    STORAGE_KEY, 
    DEFAULT_SETTINGS
  );
  
  // States
  const [settings, setSettings] = useState<EnhancedAppearanceSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<EnhancedAppearanceSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState<'interface' | 'text'>('interface');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [scheduleSupported, setScheduleSupported] = useState(false);
  const [isPreviewingTheme, setIsPreviewingTheme] = useState(false);
  const [previewedTheme, setPreviewedTheme] = useState<Partial<EnhancedAppearanceSettings> | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [cssError, setCssError] = useState<string | null>(null);
  
  // Refs
  const themeScheduleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cssTestElRef = useRef<HTMLDivElement | null>(null);
  
  // Derived state
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);
  
  // Debounced settings for auto-save
  const debouncedSettings = useDebounce(settings, 1000);
  
  // Determine current theme mode
  const effectiveTheme = useMemo(() => {
    if (isPreviewingTheme && previewedTheme?.theme) {
      return previewedTheme.theme;
    }
    
    if (settings.theme === 'system') {
      return isDarkMode ? 'dark' : 'light';
    }
    
    if (settings.useThemeSchedule && typeof window !== 'undefined') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const startTime = settings.darkModeStartTime;
      const endTime = settings.darkModeEndTime;
      
      // Check if current time is within the dark mode schedule
      // This handles both same-day schedules and overnight schedules
      if (startTime <= endTime) {
        // Simple case: e.g., 9:00 to 17:00
        return (currentTime >= startTime && currentTime < endTime) ? 'dark' : 'light';
      } else {
        // Overnight case: e.g., 22:00 to 6:00
        return (currentTime >= startTime || currentTime < endTime) ? 'dark' : 'light';
      }
    }
    
    return settings.theme;
  }, [isDarkMode, settings.theme, settings.useThemeSchedule, settings.darkModeStartTime, settings.darkModeEndTime, isPreviewingTheme, previewedTheme]);

  // ================ [5] EFFECT HANDLERS ================
  // Apply settings to DOM
  const applySettingsToDOM = useCallback((settingsToApply: EnhancedAppearanceSettings, isPreview = false) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const targetTheme = isPreview && previewedTheme?.theme ? previewedTheme.theme : settingsToApply.theme;
    
    // Apply theme
    if (targetTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.classList.toggle('dark', targetTheme === 'dark');
      root.setAttribute('data-theme', targetTheme);
    }
    
    // Apply other classes
    root.classList.toggle('compact-mode', settingsToApply.compactMode);
    root.classList.toggle('high-contrast', settingsToApply.highContrastMode);
    root.classList.toggle('focus-highlight', settingsToApply.focusHighlight);
    root.classList.toggle('touch-mode', settingsToApply.touchMode);
    
    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${settingsToApply.fontSize}`);
    
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
    
    // Apply custom CSS if not in preview mode
    if (!isPreview && settingsToApply.customCSS) {
      let customStyleElement = document.getElementById('custom-appearance-css');
      
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'custom-appearance-css';
        document.head.appendChild(customStyleElement);
      }
      
      customStyleElement.textContent = settingsToApply.customCSS;
    }
    
    // Dispatch event for other components
    if (!isPreview) {
      window.dispatchEvent(new CustomEvent(APPEARANCE_CHANGE_EVENT, {
        detail: settingsToApply
      }));
    }
    
  }, [previewedTheme]);
  
  // Load settings on component mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        setError(null);
        
        // First try to load from localStorage for immediate UI update
        const cachedSettings = getValueFromStorage();
        if (cachedSettings) {
          // Ensure all required fields exist
          const mergedSettings = { ...DEFAULT_SETTINGS, ...cachedSettings };
          
          setSettings(mergedSettings);
          setOriginalSettings(mergedSettings);
          applySettingsToDOM(mergedSettings);
        }
        
        // Then fetch from server
        const fetchedSettings = await getSettings(SettingScope.USER, 'appearance', 'keyValue');
        
        if (fetchedSettings && fetchedSettings.appearance) {
          const serverSettings = {
            ...DEFAULT_SETTINGS,
            ...fetchedSettings.appearance as EnhancedAppearanceSettings
          };
          
          // Update with server settings if they differ from cache
          if (JSON.stringify(serverSettings) !== JSON.stringify(cachedSettings)) {
            setSettings(serverSettings);
            setOriginalSettings(serverSettings);
            applySettingsToDOM(serverSettings);
            saveValueToStorage(serverSettings);
          }
        } else if (!cachedSettings) {
          // If no settings found anywhere, use defaults
          setSettings(DEFAULT_SETTINGS);
          setOriginalSettings(DEFAULT_SETTINGS);
          applySettingsToDOM(DEFAULT_SETTINGS);
        }
        
        // Check if Notification API is supported (for scheduling)
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setScheduleSupported(true);
        }
      } catch (error) {
        console.error('Failed to load appearance settings:', error);
        setError('Unable to load settings from server. Using cached or default settings.');
        
        // Fall back to cached or default
        const cachedSettings = getValueFromStorage();
        if (cachedSettings) {
          const mergedSettings = { ...DEFAULT_SETTINGS, ...cachedSettings };
          setSettings(mergedSettings);
          setOriginalSettings(mergedSettings);
          applySettingsToDOM(mergedSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
          setOriginalSettings(DEFAULT_SETTINGS);
          applySettingsToDOM(DEFAULT_SETTINGS);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, [applySettingsToDOM, getValueFromStorage, saveValueToStorage]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => applySettingsToDOM(settings);
    
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings, applySettingsToDOM]);
  
  // Auto-save effect
  useEffect(() => {
    if (!settings.autoSave || !isDirty) return;
    
    // Save to server when debounced settings change
    handleSave();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSettings]);
  
  // Theme scheduling effect
  useEffect(() => {
    // Clear existing timer
    if (themeScheduleTimerRef.current) {
      clearInterval(themeScheduleTimerRef.current);
    }
    
    // Set up scheduled theme changes if enabled
    if (settings.useThemeSchedule) {
      // Check every minute
      themeScheduleTimerRef.current = setInterval(() => {
        applySettingsToDOM(settings);
      }, 60000); // Check every minute
      
      // Initial application
      applySettingsToDOM(settings);
    }
    
    return () => {
      if (themeScheduleTimerRef.current) {
        clearInterval(themeScheduleTimerRef.current);
      }
    };
  }, [settings.useThemeSchedule, settings.darkModeStartTime, settings.darkModeEndTime, applySettingsToDOM, settings]);
  
  // Keyboard shortcuts effect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse the shortcut into components
      const toggleThemeShortcut = settings.keyboardShortcuts.toggleTheme.split('+');
      const resetZoomShortcut = settings.keyboardShortcuts.resetZoom.split('+');
      
      // Check for theme toggle shortcut
      const isToggleThemeShortcut = toggleThemeShortcut.every(key => {
        if (key.toLowerCase() === 'alt') return e.altKey;
        if (key.toLowerCase() === 'ctrl') return e.ctrlKey;
        if (key.toLowerCase() === 'shift') return e.shiftKey;
        return e.key.toLowerCase() === key.toLowerCase();
      });
      
      // Check for reset zoom shortcut
      const isResetZoomShortcut = resetZoomShortcut.every(key => {
        if (key.toLowerCase() === 'alt') return e.altKey;
        if (key.toLowerCase() === 'ctrl') return e.ctrlKey;
        if (key.toLowerCase() === 'shift') return e.shiftKey;
        return e.key.toLowerCase() === key.toLowerCase();
      });
      
      // Handle theme toggle
      if (isToggleThemeShortcut) {
        e.preventDefault();
        const newTheme = settings.theme === 'dark' ? 'light' : 
                         settings.theme === 'light' ? 'system' : 'dark';
        updateSetting('theme', newTheme);
      }
      
      // Handle zoom reset (could implement additional zoom functionality)
      if (isResetZoomShortcut) {
        e.preventDefault();
        // Reset zoom logic would go here
        toast({
          title: "Zoom Reset",
          description: "Page zoom has been reset to 100%",
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardShortcuts, toast]);
  
  // ================ [6] EVENT HANDLERS ================
  // Update a single setting
  const updateSetting = <K extends keyof EnhancedAppearanceSettings>(
    key: K, 
    value: EnhancedAppearanceSettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Apply changes immediately for preview
      applySettingsToDOM(newSettings);
      
      // Save to localStorage for persistence
      saveValueToStorage(newSettings);
      
      return newSettings;
    });
  };
  
  // Update a nested setting
  const updateNestedSetting = <K extends keyof EnhancedAppearanceSettings, NK extends keyof EnhancedAppearanceSettings[K]>(
    key: K,
    nestedKey: NK,
    value: EnhancedAppearanceSettings[K][NK]
  ) => {
    setSettings(prev => {
      const currentValue = prev[key] as Record<string, unknown>;
      const newNestedValue = {
        ...currentValue,
        [nestedKey]: value
      };
      
      const newSettings = { ...prev, [key]: newNestedValue };
      
      // Apply changes immediately for preview
      applySettingsToDOM(newSettings);
      
      // Save to localStorage for persistence
      saveValueToStorage(newSettings);
      
      return newSettings;
    });
  };
  
  // Toggle boolean settings
  const handleToggle = (key: keyof EnhancedAppearanceSettings) => {
    updateSetting(key, !settings[key] as any);
  };
  
  // Save settings to server
  const handleSave = async () => {
    if (!isDirty) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Save to server
      await bulkUpdateSettings([
        { key: 'appearance', value: settings }
      ], SettingScope.USER);
      
      // Update originalSettings to match current settings
      setOriginalSettings(settings);
      
      // Only show toast if not auto-saving
      if (!settings.autoSave) {
        toast({
          title: "Settings saved",
          description: "Your appearance preferences have been updated",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings to server. Changes are applied locally but may not persist across devices.');
      
      if (!settings.autoSave) {
        toast({
          title: "Save error",
          description: "Changes applied locally but failed to sync to server",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset changes (revert to last saved)
  const handleResetChanges = () => {
    setSettings(originalSettings);
    applySettingsToDOM(originalSettings);
    saveValueToStorage(originalSettings);
  };
  
  // Reset to default settings
  const handleResetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);
    saveValueToStorage(DEFAULT_SETTINGS);
    
    toast({
      title: "Reset to defaults",
      description: "All appearance settings have been reset to default values",
    });
  };
  
  // Import settings from JSON file
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        
        // Ensure all required properties exist
        const validatedSettings = {
          ...DEFAULT_SETTINGS,
          ...importedSettings
        };
        
        setSettings(validatedSettings);
        applySettingsToDOM(validatedSettings);
        saveValueToStorage(validatedSettings);
        
        toast({
          title: "Settings imported",
          description: "Your appearance settings have been imported successfully",
        });
      } catch (error) {
        console.error('Failed to import settings:', error);
        toast({
          title: "Import failed",
          description: "Could not import settings from this file",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };
  
  // Export settings to JSON file
  const handleExportSettings = () => {
    try {
      const settingsJson = JSON.stringify(settings, null, 2);
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appearance-settings.json';
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Settings exported",
        description: "Your appearance settings have been exported successfully",
      });
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast({
        title: "Export failed",
        description: "Could not export your settings",
        variant: "destructive",
      });
    }
  };
  
  // Preview a theme preset
  const handlePreviewTheme = (preset: ThemePreset) => {
    setIsPreviewingTheme(true);
    setPreviewedTheme(preset.settings);
    applySettingsToDOM({ ...settings, ...preset.settings }, true);
  };
  
  // Stop previewing
  const handleStopPreview = () => {
    setIsPreviewingTheme(false);
    setPreviewedTheme(null);
    applySettingsToDOM(settings);
  };
  
  // Apply a theme preset
  const handleApplyTheme = (preset: ThemePreset) => {
    const newSettings = { ...settings, ...preset.settings };
    setSettings(newSettings);
    applySettingsToDOM(newSettings);
    saveValueToStorage(newSettings);
    setIsPreviewingTheme(false);
    setPreviewedTheme(null);
    
    toast({
      title: "Theme applied",
      description: `The "${preset.name}" theme has been applied`,
    });
  };
  
  // Delete a theme preset
  const handleDeleteTheme = (presetId: string) => {
    setSettings(prev => {
      const newPresets = prev.savedThemePresets.filter(p => p.id !== presetId);
      const newSettings = { ...prev, savedThemePresets: newPresets };
      saveValueToStorage(newSettings);
      return newSettings;
    });
    
    toast({
      title: "Theme deleted",
      description: "The theme preset has been removed",
    });
  };
  
  // Save current settings as a new preset
  const handleSaveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your theme preset",
        variant: "destructive",
      });
      return;
    }
    
    const newPreset: ThemePreset = {
      id: generateId(),
      name: newPresetName.trim(),
      createdAt: new Date().toISOString(),
      settings: {
        theme: settings.theme,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        customAccentColor: settings.customAccentColor,
        darkModeContrast: settings.darkModeContrast,
        highContrastMode: settings.highContrastMode,
        borderRadius: settings.borderRadius,
        contentWidth: settings.contentWidth,
      }
    };
    
    setSettings(prev => {
      const newPresets = [...prev.savedThemePresets, newPreset];
      const newSettings = { ...prev, savedThemePresets: newPresets };
      saveValueToStorage(newSettings);
      return newSettings;
    });
    
    setNewPresetName('');
    
    toast({
      title: "Theme saved",
      description: `"${newPresetName}" has been added to your theme presets`,
    });
  };
  
  // Validate custom CSS
  const validateCustomCSS = (css: string) => {
    if (!css.trim()) {
      setCssError(null);
      return true;
    }
    
    try {
      // Create a test style element
      const styleEl = document.createElement('style');
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
      
      // If we get here, the CSS is valid
      document.head.removeChild(styleEl);
      setCssError(null);
      return true;
    } catch (error) {
      console.error('Invalid CSS:', error);
      setCssError('Invalid CSS. Please check your syntax.');
      return false;
    }
  };
  
  // Handle custom CSS changes
  const handleCustomCSSChange = (css: string) => {
    updateSetting('customCSS', css);
    validateCustomCSS(css);
  };

  // ================ [7] UI RENDERING FUNCTIONS - PART 1 ================
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  // Render error banner
  const renderErrorBanner = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };
  
  // Render theme selection
  const renderThemeSelector = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Theme</Label>
        {settings.useThemeSchedule && (
          <div className="flex items-center text-xs bg-muted p-1 rounded">
            <Clock className="h-3 w-3 mr-1" />
            <span>Scheduled: {settings.darkModeStartTime} - {settings.darkModeEndTime}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={settings.theme === 'light' ? 'default' : 'outline'}
          className={cn(
            "flex flex-col items-center justify-between h-24 p-4",
            settings.theme === 'light' && "border-2 border-primary"
          )}
          onClick={() => updateSetting('theme', 'light')}
        >
          <Sun className="h-8 w-8 mb-2" />
          <span>Light</span>
        </Button>
        <Button
          type="button"
          variant={settings.theme === 'dark' ? 'default' : 'outline'}
          className={cn(
            "flex flex-col items-center justify-between h-24 p-4",
            settings.theme === 'dark' && "border-2 border-primary"
          )}
          onClick={() => updateSetting('theme', 'dark')}
        >
          <Moon className="h-8 w-8 mb-2" />
          <span>Dark</span>
        </Button>
        <Button
          type="button"
          variant={settings.theme === 'system' ? 'default' : 'outline'}
          className={cn(
            "flex flex-col items-center justify-between h-24 p-4",
            settings.theme === 'system' && "border-2 border-primary"
          )}
          onClick={() => updateSetting('theme', 'system')}
        >
          <Laptop className="h-8 w-8 mb-2" />
          <span>System</span>
        </Button>
      </div>
      
      {/* Theme Schedule */}
      <div className="flex items-center justify-between border p-3 rounded-md mt-4">
        <div>
          <Label htmlFor="useThemeSchedule" className="font-medium">Scheduled Dark Mode</Label>
          <p className="text-sm text-muted-foreground">Automatically switch between light and dark</p>
        </div>
        <Switch
          id="useThemeSchedule"
          checked={settings.useThemeSchedule}
          onCheckedChange={() => handleToggle('useThemeSchedule')}
        />
      </div>
      
      {settings.useThemeSchedule && (
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
          <div>
            <Label htmlFor="darkModeStartTime" className="text-sm">Dark Mode Start</Label>
            <Input
              id="darkModeStartTime"
              type="time"
              value={settings.darkModeStartTime}
              onChange={(e) => updateSetting('darkModeStartTime', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="darkModeEndTime" className="text-sm">Dark Mode End</Label>
            <Input
              id="darkModeEndTime"
              type="time"
              value={settings.darkModeEndTime}
              onChange={(e) => updateSetting('darkModeEndTime', e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="col-span-2 text-xs text-muted-foreground">
            Current theme: <span className="font-semibold">{effectiveTheme.charAt(0).toUpperCase() + effectiveTheme.slice(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render theme presets
  const renderThemePresets = () => (
    <div className="space-y-3">
      <Label className="text-base font-medium">Theme Presets</Label>
      
      {/* Preview banner */}
      {isPreviewingTheme && (
        <Alert className="mb-4 bg-muted">
          <EyeIcon className="h-4 w-4" />
          <AlertTitle>Preview Mode</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>You're previewing a theme. No changes have been saved.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleStopPreview}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => previewedTheme && handleApplyTheme({
                  id: 'preview',
                  name: 'Preview',
                  createdAt: new Date().toISOString(),
                  settings: previewedTheme
                })}
              >
                Apply Theme
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Preset grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Default presets */}
        {DEFAULT_THEME_PRESETS.map(preset => (
          <Card key={preset.id} className="overflow-hidden">
            <div className="p-1 flex">
              <div 
                className={`flex-1 p-3 rounded-l-sm ${preset.settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                style={{
                  fontFamily: preset.settings.fontFamily === 'serif' 
                    ? '"Merriweather", Georgia, serif' 
                    : preset.settings.fontFamily === 'mono'
                      ? '"JetBrains Mono", monospace'
                      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                <div className="text-sm font-semibold">{preset.name}</div>
                <div className="text-xs opacity-70">Default Preset</div>
              </div>
              <div className="p-1 flex gap-1 items-start">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handlePreviewTheme(preset)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleApplyTheme(preset)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Apply</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Card>
        ))}
        
        {/* User presets */}
        {settings.savedThemePresets.map(preset => (
          <Card key={preset.id} className="overflow-hidden">
            <div className="p-1 flex">
              <div 
                className={`flex-1 p-3 rounded-l-sm ${preset.settings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                style={{
                  fontFamily: preset.settings.fontFamily === 'serif' 
                    ? '"Merriweather", Georgia, serif' 
                    : preset.settings.fontFamily === 'mono'
                      ? '"JetBrains Mono", monospace'
                      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                <div className="text-sm font-semibold">{preset.name}</div>
                <div className="text-xs opacity-70">Custom Preset</div>
              </div>
              <div className="p-1 flex gap-1 items-start">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handlePreviewTheme(preset)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleApplyTheme(preset)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Apply</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteTheme(preset.id)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Save current as preset */}
      <div className="flex gap-2 items-end mt-4">
        <div className="flex-1">
          <Label htmlFor="newPresetName" className="text-sm">Save current settings as preset</Label>
          <Input
            id="newPresetName"
            placeholder="My Theme Name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button 
          onClick={handleSaveAsPreset}
          disabled={!newPresetName.trim()}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Save Preset
        </Button>
      </div>
    </div>
  );
  
  // Render font section
  const renderFontSettings = () => (
    <div className="space-y-3">
      <Label className="text-base font-medium">Text Settings</Label>
      
      {/* Font Size */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Font Size</Label>
        <RadioGroup 
          value={settings.fontSize} 
          onValueChange={(value) => updateSetting('fontSize', value as 'small' | 'medium' | 'large')}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="small" id="small" />
            <Label htmlFor="small" className="text-sm">Small</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="medium" />
            <Label htmlFor="medium" className="text-base">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="large" id="large" />
            <Label htmlFor="large" className="text-lg">Large</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Font Family */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Font Family</Label>
        <RadioGroup 
          value={settings.fontFamily} 
          onValueChange={(value) => updateSetting('fontFamily', value as 'system' | 'serif' | 'mono' | 'dyslexic')}
          className="space-y-2"
        >
          {FONT_OPTIONS.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`font-${option.value}`} />
              <Label htmlFor={`font-${option.value}`} style={option.style}>
                {option.label}
                <span className="text-xs text-muted-foreground block">
                  {option.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Line Height */}
      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Line Height</Label>
          <span className="text-sm font-mono">{settings.lineHeight.toFixed(1)}</span>
        </div>
        <Slider
          value={[settings.lineHeight]}
          min={1.2}
          max={2.0}
          step={0.1}
          onValueChange={(value) => updateSetting('lineHeight', value[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Compact</span>
          <span>Spacious</span>
        </div>
      </div>
      
      {/* Letter Spacing */}
      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Letter Spacing</Label>
          <span className="text-sm font-mono">{settings.letterSpacing}px</span>
        </div>
        <Slider
          value={[settings.letterSpacing]}
          min={-1}
          max={2}
          step={0.1}
          onValueChange={(value) => updateSetting('letterSpacing', value[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Tighter</span>
          <span>Looser</span>
        </div>
      </div>
      
      {/* Paragraph Spacing */}
      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Paragraph Spacing</Label>
          <span className="text-sm font-mono">{settings.paragraphSpacing}em</span>
        </div>
        <Slider
          value={[settings.paragraphSpacing]}
          min={0.5}
          max={2.5}
          step={0.1}
          onValueChange={(value) => updateSetting('paragraphSpacing', value[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Closer</span>
          <span>More space</span>
        </div>
      </div>
      
      {/* Text Alignment */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Text Alignment</Label>
        <RadioGroup 
          value={settings.textAlign} 
          onValueChange={(value) => updateSetting('textAlign', value as 'left' | 'center' | 'right' | 'justify')}
          className="flex flex-wrap gap-4"
        >
          {TEXT_ALIGN_OPTIONS.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`align-${option.value}`} />
              <Label htmlFor={`align-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
  
  // Render layout settings
  const renderLayoutSettings = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Layout Settings</Label>
      
      {/* Compact Mode */}
      <div className="flex items-center justify-between border p-3 rounded-md">
        <div>
          <Label htmlFor="compactMode" className="font-medium">Compact Mode</Label>
          <p className="text-sm text-muted-foreground">Reduce spacing between elements</p>
        </div>
        <Switch
          id="compactMode"
          checked={settings.compactMode}
          onCheckedChange={() => handleToggle('compactMode')}
        />
      </div>
      
      {/* Touch Mode */}
      <div className="flex items-center justify-between border p-3 rounded-md">
        <div>
          <Label htmlFor="touchMode" className="font-medium">Touch Mode</Label>
          <p className="text-sm text-muted-foreground">Larger interactive elements for touch devices</p>
        </div>
        <Switch
          id="touchMode"
          checked={settings.touchMode}
          onCheckedChange={() => handleToggle('touchMode')}
        />
      </div>
      
      {/* Sidebar Collapsed */}
      <div className="flex items-center justify-between border p-3 rounded-md">
        <div>
          <Label htmlFor="sidebarCollapsed" className="font-medium">Start with Collapsed Sidebar</Label>
          <p className="text-sm text-muted-foreground">Minimize sidebar when app loads</p>
        </div>
        <Switch
          id="sidebarCollapsed"
          checked={settings.sidebarCollapsed}
          onCheckedChange={() => handleToggle('sidebarCollapsed')}
        />
      </div>
      
      {/* Content Width */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Content Width</Label>
        <RadioGroup 
          value={settings.contentWidth} 
          onValueChange={(value) => updateSetting('contentWidth', value as 'narrow' | 'medium' | 'wide' | 'full')}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="narrow" id="narrow" />
            <Label htmlFor="narrow">Narrow (Better for reading)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="medium-width" />
            <Label htmlFor="medium-width">Medium (Balanced)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="wide" id="wide" />
            <Label htmlFor="wide">Wide</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="full" />
            <Label htmlFor="full">Full Width</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Border Radius */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Border Radius</Label>
        <RadioGroup 
          value={settings.borderRadius} 
          onValueChange={(value) => updateSetting('borderRadius', value as 'none' | 'small' | 'medium' | 'large')}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none-radius" />
            <Label htmlFor="none-radius">None (Square corners)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="small" id="small-radius" />
            <Label htmlFor="small-radius">Small</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="medium-radius" />
            <Label htmlFor="medium-radius">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="large" id="large-radius" />
            <Label htmlFor="large-radius">Large</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Text Direction */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Text Direction</Label>
        <RadioGroup 
          value={settings.themeDirection} 
          onValueChange={(value) => updateSetting('themeDirection', value as 'ltr' | 'rtl' | 'auto')}
          className="space-y-2"
        >
          {DIRECTION_OPTIONS.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`dir-${option.value}`} />
              <Label htmlFor={`dir-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );

  // ================ [8] UI RENDERING FUNCTIONS - PART 2 & MAIN RENDER ================
  // Render accessibility settings
  const renderAccessibilitySettings = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Accessibility Settings</Label>
      
      {/* Motion Reduction */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Motion Reduction</Label>
        <RadioGroup 
          value={settings.motionReduction} 
          onValueChange={(value) => updateSetting('motionReduction', value as 'none' | 'minimal' | 'full')}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="motion-none" />
            <Label htmlFor="motion-none">Normal Animations</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="minimal" id="motion-minimal" />
            <Label htmlFor="motion-minimal">Reduced Animations</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="full" id="motion-full" />
            <Label htmlFor="motion-full">No Animations</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* High Contrast */}
      <div className="flex items-center justify-between border p-3 rounded-md">
        <div>
          <Label htmlFor="highContrastMode" className="font-medium">High Contrast Mode</Label>
          <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
        </div>
        <Switch
          id="highContrastMode"
          checked={settings.highContrastMode}
          onCheckedChange={() => handleToggle('highContrastMode')}
        />
      </div>
      
      {/* Focus Highlight */}
      <div className="flex items-center justify-between border p-3 rounded-md">
        <div>
          <Label htmlFor="focusHighlight" className="font-medium">Enhanced Focus Indicators</Label>
          <p className="text-sm text-muted-foreground">Improve visibility of focused elements</p>
        </div>
        <Switch
          id="focusHighlight"
          checked={settings.focusHighlight}
          onCheckedChange={() => handleToggle('focusHighlight')}
        />
      </div>
      
      {/* Dark Mode Contrast */}
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-2 block">Dark Mode Contrast</Label>
        <RadioGroup 
          value={settings.darkModeContrast} 
          onValueChange={(value) => updateSetting('darkModeContrast', value as 'low' | 'medium' | 'high')}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="low" id="contrast-low" />
            <Label htmlFor="contrast-low">Low (Softer dark mode)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="contrast-medium" />
            <Label htmlFor="contrast-medium">Medium (Default)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="high" id="contrast-high" />
            <Label htmlFor="contrast-high">High (Maximum contrast)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
  
  // Render keyboard shortcuts
  const renderKeyboardShortcuts = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Keyboard Shortcuts</Label>
      
      <div className="rounded-md border p-4 space-y-3">
        <div>
          <Label htmlFor="toggleTheme" className="text-sm font-medium">Toggle Theme</Label>
          <Input
            id="toggleTheme"
            value={settings.keyboardShortcuts.toggleTheme}
            onChange={(e) => updateNestedSetting('keyboardShortcuts', 'toggleTheme', e.target.value)}
            placeholder="e.g. Alt+T"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: Alt+T, Ctrl+Shift+D, etc.
          </p>
        </div>
        
        <div>
          <Label htmlFor="resetZoom" className="text-sm font-medium">Reset Zoom</Label>
          <Input
            id="resetZoom"
            value={settings.keyboardShortcuts.resetZoom}
            onChange={(e) => updateNestedSetting('keyboardShortcuts', 'resetZoom', e.target.value)}
            placeholder="e.g. Alt+0"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
  
  // Render advanced settings
  const renderAdvancedSettings = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Advanced Settings</Label>
      
      {/* Custom CSS */}
      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Custom CSS</Label>
          <span className="text-xs text-muted-foreground">For advanced users</span>
        </div>
        <textarea
          value={settings.customCSS}
          onChange={(e) => handleCustomCSSChange(e.target.value)}
          className="w-full h-32 p-2 border rounded font-mono text-sm"
          placeholder=":root { /* your custom CSS here */ }"
        />
        {cssError && (
          <p className="text-xs text-destructive mt-1">{cssError}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Add custom CSS styles to override the default appearance. Changes apply immediately.
        </p>
      </div>
    </div>
  );
  
  // Render appearance preview
  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Preview</Label>
        <div className="flex gap-2">
          <Button
            variant={previewMode === "interface" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode("interface")}
          >
            Interface
          </Button>
          <Button
            variant={previewMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode("text")}
          >
            Text
          </Button>
        </div>
      </div>
      
      {previewMode === "interface" ? (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-card p-4 border-b">
            <h3 className="text-lg font-semibold">UI Components Preview</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2">Card Component</h4>
                  <p className="text-sm text-muted-foreground">This shows how card components will appear with your settings.</p>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="demo-switch" checked />
                  <Label htmlFor="demo-switch">Toggle Switch</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="demo-checkbox" checked />
                  <Label htmlFor="demo-checkbox">Checkbox Item</Label>
                </div>
                
                <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-2/3"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="demo-select">Dropdown Example</Label>
              <Select defaultValue="option1">
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>This is how alerts will appear</span>
              </div>
            </Alert>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-6 space-y-4">
          <h2 className="text-2xl font-bold">Typography Preview</h2>
          <h3 className="text-xl font-semibold">Section Heading</h3>
          <p>This shows how your main content text will appear. The settings you've chosen affect line height, font size, spacing, and general readability.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
          <div>
            <code className="bg-muted px-1 py-0.5 rounded text-sm">This shows code formatting</code>
          </div>
          <blockquote className="border-l-4 pl-4 italic">
            This is a blockquote that demonstrates how quoted content will appear with your current settings.
          </blockquote>
          <ul className="list-disc pl-5 space-y-1">
            <li>First list item shows bullet formatting</li>
            <li>Second list item with slightly more text to demonstrate wrapping behavior in your current settings</li>
          </ul>
        </div>
      )}
    </div>
  );
  
  // Render color settings
  const renderColorSettings = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Color Settings</Label>
      
      <div className="rounded-md border p-4">
        <Label className="text-sm font-medium mb-3 block">Accent Color</Label>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <TooltipProvider key={color.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      settings.customAccentColor === color.value ? "ring-2 ring-offset-2 scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => updateSetting('customAccentColor', color.value)}
                    aria-label={`Set accent color to ${color.name}`}
                  />
                </TooltipTrigger>
                <TooltipContent>{color.name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          
          <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "h-8 w-8 rounded-full border flex items-center justify-center hover:scale-110 transition-all",
                  !ACCENT_COLORS.some(c => c.value === settings.customAccentColor) && 
                  "ring-2 ring-offset-2"
                )}
                style={{ 
                  background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` 
                }}
              >
                <div 
                  className="h-4 w-4 rounded-full" 
                  style={{ background: settings.customAccentColor }} 
                />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="p-2">
                <HexColorPicker 
                  color={settings.customAccentColor} 
                  onChange={(color) => updateSetting('customAccentColor', color)} 
                />
                <div className="flex gap-2 mt-3">
                  <Input
                    value={settings.customAccentColor}
                    onChange={(e) => updateSetting('customAccentColor', e.target.value)}
                    className="font-mono"
                  />
                  <Button 
                    size="sm"
                    onClick={() => setColorPickerOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
  
  // Render save settings
  const renderSaveSettings = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Save Behavior</Label>
      
      <div className="flex items-center justify-between border p-3 rounded-md">
        <div>
          <Label htmlFor="autoSave" className="font-medium">Auto-save Changes</Label>
          <p className="text-sm text-muted-foreground">Save changes automatically as you make them</p>
        </div>
        <Switch
          id="autoSave"
          checked={settings.autoSave}
          onCheckedChange={() => handleToggle('autoSave')}
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleExportSettings} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Settings
        </Button>
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import Settings
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleImportSettings}
            />
          </label>
        </Button>
      </div>
    </div>
  );
  
  // Main render
  return (
    <div className="space-y-6 pb-10">
      {/* Error Banner */}
      {renderErrorBanner()}
      
      {/* Preview Banner */}
      {isPreviewingTheme && (
        <Alert className="mb-4 bg-muted">
          <EyeIcon className="h-4 w-4" />
          <AlertTitle>Preview Mode</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>You're previewing a theme. No changes have been saved.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleStopPreview}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => previewedTheme && handleApplyTheme({
                  id: 'preview',
                  name: 'Preview',
                  createdAt: new Date().toISOString(),
                  settings: previewedTheme
                })}
              >
                Apply Theme
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          {renderThemeSelector()}
          {renderFontSettings()}
          {renderLayoutSettings()}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          {renderColorSettings()}
          {renderAccessibilitySettings()}
          {renderKeyboardShortcuts()}
          {renderAdvancedSettings()}
          {renderSaveSettings()}
        </TabsContent>
        
        <TabsContent value="presets" className="space-y-6">
          {renderThemePresets()}
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          {renderPreview()}
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 pt-4 border-t mt-6`}>
        {!settings.autoSave && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !isDirty}
            className={isMobile ? 'w-full' : 'flex-1'}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={handleResetChanges}
          disabled={isSaving || !isDirty || settings.autoSave}
          className={isMobile ? 'w-full' : ''}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Cancel Changes
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={handleResetToDefaults}
          disabled={isSaving}
          className={isMobile ? 'w-full' : 'ml-auto'}
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
      
      {/* Auto-save indicator */}
      {settings.autoSave && isDirty && (
        <div className="flex items-center text-sm text-muted-foreground">
          <div className={`h-2 w-2 rounded-full mr-2 ${isSaving ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          {isSaving ? "Saving changes..." : "Changes auto-saved"}
        </div>
      )}
    </div>
  );
}