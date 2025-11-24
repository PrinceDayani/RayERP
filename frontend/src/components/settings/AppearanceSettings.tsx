// Real-time appearance settings
"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import { CheckCircle, Palette, Monitor, Sun, Moon } from 'lucide-react';

export default function AppearanceSettings() {
  const [theme, setTheme, themeLoading] = useRealTimeSetting('theme', 'system');
  const [compactMode, setCompactMode, compactLoading] = useRealTimeSetting('compactMode', false);
  const [fontSize, setFontSize, fontSizeLoading] = useRealTimeSetting('fontSize', 'medium');
  const [sidebarCollapsed, setSidebarCollapsed, sidebarLoading] = useRealTimeSetting('sidebarCollapsed', false);
  
  const [saveIndicator, setSaveIndicator] = React.useState(false);
  
  const isLoading = themeLoading || compactLoading || fontSizeLoading || sidebarLoading;
  
  const showSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    showSaveIndicator();
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', value);
  };

  const handleCompactModeChange = (checked: boolean) => {
    setCompactMode(checked);
    showSaveIndicator();
    // Apply compact mode immediately
    document.body.classList.toggle('compact-mode', checked);
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    showSaveIndicator();
    // Apply font size immediately
    document.documentElement.setAttribute('data-font-size', value);
  };

  const handleSidebarChange = (checked: boolean) => {
    setSidebarCollapsed(checked);
    showSaveIndicator();
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Auto-save indicator */}
      {saveIndicator && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-950 px-4 py-2 rounded-full border border-green-200 dark:border-green-800 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">Saved</span>
        </div>
      )}

      {/* Theme Selection */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Palette className="h-5 w-5" />
            Theme Preference
          </Label>
          <p className="text-sm text-muted-foreground mt-1">Choose your preferred color scheme</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
              theme === 'light' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Sun className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium">Light</span>
              {theme === 'light' && (
                <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
              theme === 'dark' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Moon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium">Dark</span>
              {theme === 'dark' && (
                <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>
          
          <button
            onClick={() => handleThemeChange('system')}
            className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
              theme === 'system' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl shadow-lg">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium">System</span>
              {theme === 'system' && (
                <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-blue-600" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Font Size</Label>
          <p className="text-sm text-muted-foreground mt-1">Adjust text size for better readability</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleFontSizeChange('small')}
            className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
              fontSize === 'small' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium">Small</span>
              <span className="text-xs text-muted-foreground">Compact view</span>
            </div>
          </button>
          
          <button
            onClick={() => handleFontSizeChange('medium')}
            className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
              fontSize === 'medium' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-base font-medium">Medium</span>
              <span className="text-xs text-muted-foreground">Default</span>
            </div>
          </button>
          
          <button
            onClick={() => handleFontSizeChange('large')}
            className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
              fontSize === 'large' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg font-medium">Large</span>
              <span className="text-xs text-muted-foreground">Easy reading</span>
            </div>
          </button>
        </div>
      </div>

      {/* Layout Options */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Layout Options</Label>
          <p className="text-sm text-muted-foreground mt-1">Customize your workspace layout</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding for more content</p>
            </div>
            <Switch
              checked={compactMode}
              onCheckedChange={handleCompactModeChange}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="space-y-1">
              <Label className="text-sm font-medium cursor-pointer">Collapsed Sidebar</Label>
              <p className="text-xs text-muted-foreground">Start with sidebar minimized by default</p>
            </div>
            <Switch
              checked={sidebarCollapsed}
              onCheckedChange={handleSidebarChange}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <span>Changes are applied instantly and saved automatically</span>
      </div>
    </div>
  );
}
