// frontend/src/components/settings/NotificationSettings.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getSettings, bulkUpdateSettings } from '@/lib/api/index';
import { SettingScope, NotificationSettings as NotificationSettingsType } from '@/types/settings';

const defaultNotificationSettings: NotificationSettingsType = {
  emailNotifications: true,
  orderNotifications: true,
  inventoryAlerts: true,
  weeklyReports: true,
  supplierUpdates: true
};

export default function NotificationSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsType>(defaultNotificationSettings);
  
  // Load existing notification settings
  useEffect(() => {
    async function loadNotificationSettings() {
      try {
        setIsLoading(true);
        const fetchedSettings = await getSettings(SettingScope.USER, 'notifications', 'keyValue');
        
        if (fetchedSettings && fetchedSettings.notifications) {
          setSettings(fetchedSettings.notifications as NotificationSettingsType);
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
        toast({
          title: "Error",
          description: "Failed to load notification settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadNotificationSettings();
  }, [toast]);
  
  const handleToggle = (key: keyof NotificationSettingsType) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Save notification settings
      await bulkUpdateSettings([
        { key: 'notifications', value: settings }
      ], SettingScope.USER);
      
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={() => handleToggle('emailNotifications')}
          />
        </div>
        
        {/* Order Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="orderNotifications" className="text-base">Order Updates</Label>
            <p className="text-sm text-muted-foreground">Receive notifications about order status changes</p>
          </div>
          <Switch
            id="orderNotifications"
            checked={settings.orderNotifications}
            onCheckedChange={() => handleToggle('orderNotifications')}
          />
        </div>
        
        {/* Inventory Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="inventoryAlerts" className="text-base">Inventory Alerts</Label>
            <p className="text-sm text-muted-foreground">Get notified when inventory levels are low</p>
          </div>
          <Switch
            id="inventoryAlerts"
            checked={settings.inventoryAlerts}
            onCheckedChange={() => handleToggle('inventoryAlerts')}
          />
        </div>
        
        {/* Weekly Reports */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="weeklyReports" className="text-base">Weekly Reports</Label>
            <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
          </div>
          <Switch
            id="weeklyReports"
            checked={settings.weeklyReports}
            onCheckedChange={() => handleToggle('weeklyReports')}
          />
        </div>
        
        {/* Supplier Updates */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="supplierUpdates" className="text-base">Supplier Updates</Label>
            <p className="text-sm text-muted-foreground">Get notifications about supplier changes</p>
          </div>
          <Switch
            id="supplierUpdates"
            checked={settings.supplierUpdates}
            onCheckedChange={() => handleToggle('supplierUpdates')}
          />
        </div>
      </div>
      
      {/* Save Button */}
      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}