"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Settings, Save, RefreshCw, Globe, 
  Briefcase, Users, Shield, Eye, Grid3X3, List, 
  BarChart3, FileText, Upload, Download
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
}

interface ProjectSettings {
  defaultView: 'grid' | 'list' | 'kanban';
  autoAssignDepartments: boolean;
  requireApprovalForStatusChange: boolean;
  enableTaskDragDrop: boolean;
  defaultTaskColumns: string[];
  fileSharePermissions: 'project-members' | 'department-members' | 'all-users';
}

interface Settings {
  currency: string;
  currencyConfig: CurrencyConfig;
  projectSettings: ProjectSettings;
}

const CurrencyProjectSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    currency: 'USD',
    currencyConfig: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      decimalPlaces: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      symbolPosition: 'before'
    },
    projectSettings: {
      defaultView: 'grid',
      autoAssignDepartments: false,
      requireApprovalForStatusChange: false,
      enableTaskDragDrop: true,
      defaultTaskColumns: ['todo', 'in-progress', 'review', 'completed'],
      fileSharePermissions: 'project-members'
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSettings(prev => ({
        ...prev,
        currency: currencyCode,
        currencyConfig: {
          ...prev.currencyConfig,
          code: currency.code,
          symbol: currency.symbol,
          name: currency.name
        }
      }));
    }
  };

  const handleCurrencyConfigChange = (field: keyof CurrencyConfig, value: any) => {
    setSettings(prev => ({
      ...prev,
      currencyConfig: {
        ...prev.currencyConfig,
        [field]: value
      }
    }));
  };

  const handleProjectSettingsChange = (field: keyof ProjectSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      projectSettings: {
        ...prev.projectSettings,
        [field]: value
      }
    }));
  };

  const handleTaskColumnsChange = (columns: string[]) => {
    setSettings(prev => ({
      ...prev,
      projectSettings: {
        ...prev.projectSettings,
        defaultTaskColumns: columns
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: "Success",
        description: "Settings saved successfully"
      });

      // Emit settings update event for real-time updates
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrencyPreview = (amount: number) => {
    const { symbol, decimalPlaces, thousandsSeparator, decimalSeparator, symbolPosition } = settings.currencyConfig;
    
    const formattedNumber = amount.toFixed(decimalPlaces)
      .replace('.', decimalSeparator)
      .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    return symbolPosition === 'before' ? `${symbol}${formattedNumber}` : `${formattedNumber}${symbol}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Currency</Label>
                <Select value={settings.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground">- {currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Decimal Places</Label>
                  <Select 
                    value={settings.currencyConfig.decimalPlaces.toString()} 
                    onValueChange={(value) => handleCurrencyConfigChange('decimalPlaces', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Symbol Position</Label>
                  <Select 
                    value={settings.currencyConfig.symbolPosition} 
                    onValueChange={(value: 'before' | 'after') => handleCurrencyConfigChange('symbolPosition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before ($100)</SelectItem>
                      <SelectItem value="after">After (100$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Thousands Separator</Label>
                  <Input
                    value={settings.currencyConfig.thousandsSeparator}
                    onChange={(e) => handleCurrencyConfigChange('thousandsSeparator', e.target.value)}
                    placeholder=","
                    maxLength={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Decimal Separator</Label>
                  <Input
                    value={settings.currencyConfig.decimalSeparator}
                    onChange={(e) => handleCurrencyConfigChange('decimalSeparator', e.target.value)}
                    placeholder="."
                    maxLength={1}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Preview</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Small amount:</span>
                    <span className="font-mono">{formatCurrencyPreview(123.45)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Large amount:</span>
                    <span className="font-mono">{formatCurrencyPreview(1234567.89)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zero decimals:</span>
                    <span className="font-mono">{formatCurrencyPreview(1000)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Currency Impact
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Project budgets and expenses</li>
                  <li>• Financial reports and analytics</li>
                  <li>• Invoice generation</li>
                  <li>• Cost tracking and billing</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Project Management Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Project View</Label>
                <Select 
                  value={settings.projectSettings.defaultView} 
                  onValueChange={(value: 'grid' | 'list' | 'kanban') => handleProjectSettingsChange('defaultView', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        Grid View
                      </div>
                    </SelectItem>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        List View
                      </div>
                    </SelectItem>
                    <SelectItem value="kanban">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Kanban View
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>File Sharing Permissions</Label>
                <Select 
                  value={settings.projectSettings.fileSharePermissions} 
                  onValueChange={(value: any) => handleProjectSettingsChange('fileSharePermissions', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project-members">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Project Members Only
                      </div>
                    </SelectItem>
                    <SelectItem value="department-members">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Department Members
                      </div>
                    </SelectItem>
                    <SelectItem value="all-users">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        All Users
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-assign Departments</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign user's department to new projects
                    </p>
                  </div>
                  <Switch
                    checked={settings.projectSettings.autoAssignDepartments}
                    onCheckedChange={(checked) => handleProjectSettingsChange('autoAssignDepartments', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Status Change Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Require manager approval for project status changes
                    </p>
                  </div>
                  <Switch
                    checked={settings.projectSettings.requireApprovalForStatusChange}
                    onCheckedChange={(checked) => handleProjectSettingsChange('requireApprovalForStatusChange', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Task Drag & Drop</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow drag and drop reordering of tasks
                    </p>
                  </div>
                  <Switch
                    checked={settings.projectSettings.enableTaskDragDrop}
                    onCheckedChange={(checked) => handleProjectSettingsChange('enableTaskDragDrop', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Default Task Columns</Label>
            <div className="flex flex-wrap gap-2">
              {settings.projectSettings.defaultTaskColumns.map((column, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {column}
                  <button
                    onClick={() => {
                      const newColumns = settings.projectSettings.defaultTaskColumns.filter((_, i) => i !== index);
                      handleTaskColumnsChange(newColumns);
                    }}
                    className="ml-1 text-xs hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new column"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const value = input.value.trim();
                    if (value && !settings.projectSettings.defaultTaskColumns.includes(value)) {
                      handleTaskColumnsChange([...settings.projectSettings.defaultTaskColumns, value]);
                      input.value = '';
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaultColumns = ['todo', 'in-progress', 'review', 'completed'];
                  handleTaskColumnsChange(defaultColumns);
                }}
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} className="min-w-32">
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CurrencyProjectSettings;