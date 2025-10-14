// Real-time notification settings
"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import { CheckCircle, Bell, Mail, Package, TrendingUp, Users } from 'lucide-react';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications, emailLoading] = useRealTimeSetting('emailNotifications', true);
  const [orderNotifications, setOrderNotifications, orderLoading] = useRealTimeSetting('orderNotifications', true);
  const [inventoryAlerts, setInventoryAlerts, inventoryLoading] = useRealTimeSetting('inventoryAlerts', true);
  const [weeklyReports, setWeeklyReports, weeklyLoading] = useRealTimeSetting('weeklyReports', true);
  const [supplierUpdates, setSupplierUpdates, supplierLoading] = useRealTimeSetting('supplierUpdates', true);
  
  const [saveIndicator, setSaveIndicator] = React.useState(false);
  
  const isLoading = emailLoading || orderLoading || inventoryLoading || weeklyLoading || supplierLoading;
  
  const showSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const handleToggle = (setter: (value: boolean) => void) => (checked: boolean) => {
    setter(checked);
    showSaveIndicator();
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
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

      {/* Email Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </Label>
          <p className="text-sm text-gray-500">Receive notifications via email</p>
        </div>
        <Switch
          checked={emailNotifications}
          onCheckedChange={handleToggle(setEmailNotifications)}
        />
      </div>

      {/* Order Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Notifications
          </Label>
          <p className="text-sm text-gray-500">Get notified about order updates</p>
        </div>
        <Switch
          checked={orderNotifications}
          onCheckedChange={handleToggle(setOrderNotifications)}
        />
      </div>

      {/* Inventory Alerts */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Inventory Alerts
          </Label>
          <p className="text-sm text-gray-500">Low stock and inventory warnings</p>
        </div>
        <Switch
          checked={inventoryAlerts}
          onCheckedChange={handleToggle(setInventoryAlerts)}
        />
      </div>

      {/* Weekly Reports */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Weekly Reports
          </Label>
          <p className="text-sm text-gray-500">Receive weekly performance reports</p>
        </div>
        <Switch
          checked={weeklyReports}
          onCheckedChange={handleToggle(setWeeklyReports)}
        />
      </div>

      {/* Supplier Updates */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Supplier Updates
          </Label>
          <p className="text-sm text-gray-500">Updates from suppliers and vendors</p>
        </div>
        <Switch
          checked={supplierUpdates}
          onCheckedChange={handleToggle(setSupplierUpdates)}
        />
      </div>

      <div className="text-sm text-gray-500">
        Notification preferences are saved automatically
      </div>
    </div>
  );
}