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
    return <div className="animate-pulse space-y-6">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      {saveIndicator && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          Auto-saved
        </div>
      )}

      {/* Theme Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </Label>
        <Select value={theme} onValueChange={handleThemeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Dark
              </div>
            </SelectItem>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                System
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <Label>Font Size</Label>
        <Select value={fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compact Mode */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Compact Mode</Label>
          <p className="text-sm text-gray-500">Reduce spacing and padding</p>
        </div>
        <Switch
          checked={compactMode}
          onCheckedChange={handleCompactModeChange}
        />
      </div>

      {/* Sidebar Collapsed */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Collapsed Sidebar</Label>
          <p className="text-sm text-gray-500">Start with sidebar collapsed</p>
        </div>
        <Switch
          checked={sidebarCollapsed}
          onCheckedChange={handleSidebarChange}
        />
      </div>

      <div className="text-sm text-gray-500">
        Changes are applied immediately and saved automatically
      </div>
    </div>
  );
}