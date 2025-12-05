"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";

export default function NotificationSettingsTab() {
  const [settings, setSettings] = useState<any>({ email: { enabled: false }, inApp: { enabled: false } });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getNotificationSettings();
      setSettings(response.data || settings);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch settings", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminAPI.updateNotificationSettingsNew(settings);
      toast({ title: "Success", description: "Settings updated" });
    } catch (error) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={settings.email?.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, email: { ...settings.email, enabled: checked } })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="inapp-notifications">In-App Notifications</Label>
            <Switch
              id="inapp-notifications"
              checked={settings.inApp?.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, inApp: { ...settings.inApp, enabled: checked } })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch
              id="push-notifications"
              checked={settings.push?.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, push: { ...settings.push, enabled: checked } })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
