"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from '@/lib/api/api';
import { useNotifications } from '@/hooks/useNotifications';
import { primeNotificationPreferences } from '@/hooks/useNotificationPreferences';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Coins,
  FileText,
  Loader2,
  Mail,
  Package,
  Settings,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  orderNotifications: boolean;
  inventoryAlerts: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
  budgetAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  maintenanceNotices: boolean;
}

// Matches the backend NotificationSettings schema defaults.
const DEFAULTS: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  orderNotifications: true,
  inventoryAlerts: true,
  projectUpdates: true,
  taskReminders: true,
  budgetAlerts: true,
  dailyReports: false,
  weeklyReports: true,
  monthlyReports: true,
  systemAlerts: true,
  securityAlerts: true,
  maintenanceNotices: true
};

type Key = keyof NotificationPreferences;

const GROUPS: Array<{
  title: string;
  description: string;
  icon: typeof Bell;
  items: Array<{ key: Key; label: string; hint: string; icon: typeof Bell }>;
}> = [
  {
    title: 'Delivery',
    description: 'How notifications reach you',
    icon: Bell,
    items: [
      { key: 'emailNotifications', label: 'Email', hint: 'Send notifications to your email address', icon: Mail },
      { key: 'pushNotifications', label: 'In-app', hint: 'Show notifications inside the application', icon: Bell },
      { key: 'soundEnabled', label: 'Sound', hint: 'Play a sound for new notifications', icon: Zap }
    ]
  },
  {
    title: 'Work',
    description: 'Projects, tasks and orders',
    icon: TrendingUp,
    items: [
      { key: 'projectUpdates', label: 'Project updates', hint: 'Status changes on projects you follow', icon: Users },
      { key: 'taskReminders', label: 'Task reminders', hint: 'Upcoming and overdue task deadlines', icon: Settings },
      { key: 'orderNotifications', label: 'Orders', hint: 'New and updated orders', icon: Package },
      { key: 'inventoryAlerts', label: 'Inventory alerts', hint: 'Low stock and inventory changes', icon: Package },
      { key: 'budgetAlerts', label: 'Budget alerts', hint: 'Threshold breaches and variance warnings', icon: Coins }
    ]
  },
  {
    title: 'Reports',
    description: 'Scheduled summaries',
    icon: FileText,
    items: [
      { key: 'dailyReports', label: 'Daily summary', hint: 'One digest each working day', icon: FileText },
      { key: 'weeklyReports', label: 'Weekly summary', hint: 'A digest at the end of each week', icon: FileText },
      { key: 'monthlyReports', label: 'Monthly summary', hint: 'A digest at the end of each month', icon: FileText }
    ]
  },
  {
    title: 'System',
    description: 'Platform and security notices',
    icon: AlertTriangle,
    items: [
      { key: 'systemAlerts', label: 'System alerts', hint: 'Outages and platform issues', icon: AlertTriangle },
      { key: 'securityAlerts', label: 'Security alerts', hint: 'New sign-ins and security events', icon: AlertTriangle },
      { key: 'maintenanceNotices', label: 'Maintenance', hint: 'Planned maintenance windows', icon: Settings }
    ]
  }
];

export default function NotificationSettings() {
  const { sendTestNotification: sendTest } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Batches rapid toggles into one request.
  const pending = useRef<Partial<NotificationPreferences>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const { data } = await api.get('/notification-settings');
      const loaded = { ...DEFAULTS, ...(data?.settings || {}) };
      setPreferences(loaded);
      primeNotificationPreferences(loaded);
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.message || 'Could not load your notification settings.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async () => {
    const changes = pending.current;
    pending.current = {};
    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { data } = await api.put('/notification-settings', changes);
      const saved = { ...DEFAULTS, ...(data?.settings || {}) };
      setPreferences(saved);
      // Keep the notification bell and toast handlers in step with the change.
      primeNotificationPreferences(saved);
      setSavedAt(new Date());
    } catch (error: any) {
      // Re-queue the failed changes ahead of anything newer so they are not
      // lost. The toggles keep showing the user's intent, and the banner makes
      // clear it is not stored yet.
      pending.current = { ...changes, ...pending.current };
      setSaveError(error?.response?.data?.message || 'Could not save your notification settings');
    } finally {
      setSaving(false);
    }
  }, []);

  /** Re-sends whatever failed to save. */
  const retry = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    void persist();
  }, [persist]);

  // Flush rather than cancel: a toggle followed by navigating away inside the
  // debounce window must still be saved.
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

  const toggle = (key: Key) => (checked: boolean) => {
    setPreferences(current => ({ ...current, [key]: checked }));
    pending.current = { ...pending.current, [key]: checked };

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(persist, 600);
  };

  const handleTestNotification = () => {
    sendTest();
    toast.success('Test notification sent - check your notification panel');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
            <div className="h-5 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{saveError} Your changes are not stored yet.</span>
            <Button variant="outline" size="sm" onClick={retry} disabled={saving}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>Send yourself a notification to confirm delivery is working</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleTestNotification} className="gap-2">
            <Bell className="h-4 w-4" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>

      {GROUPS.map(group => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <group.icon className="h-5 w-5" />
              {group.title}
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map(item => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#970E2C]/40 dark:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor={item.key} className="cursor-pointer text-sm font-medium">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                </div>
                <Switch id={item.key} checked={preferences[item.key]} onCheckedChange={toggle(item.key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-800/50">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving…</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>
              {savedAt ? `Saved at ${savedAt.toLocaleTimeString()}` : 'Changes save to your account automatically'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
