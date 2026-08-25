"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import ProfileSettings from '@/components/settings/ProfileSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import HierarchySettings from '@/components/settings/HierarchySettings';
import CurrencySettings from '@/components/settings/CurrencySettings';
import ActiveSessions from '@/components/user/ActiveSessions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/api';
import { withCsrf } from '@/lib/api/csrf';
import toast, { Toaster } from 'react-hot-toast';
import {
  Bell,
  Coins,
  Command,
  Globe,
  IndianRupee,
  Loader2,
  Monitor,
  Palette,
  Search,
  Settings as SettingsIcon,
  Shield,
  User,
  Users
} from 'lucide-react';

type AccountingMode = 'western' | 'indian';

interface TabDefinition {
  value: string;
  label: string;
  icon: typeof User;
  description: string;
  /** Words the ⌘K search matches against. */
  keywords: string[];
  render: () => React.ReactNode;
  /** Rendered bare, without the surrounding titled card. */
  bare?: boolean;
}

const TABS: TabDefinition[] = [
  {
    value: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Your name, contact details and photo',
    keywords: ['name', 'email', 'phone', 'bio', 'avatar', 'photo', 'timezone', 'personal'],
    render: () => <ProfileSettings />
  },
  {
    value: 'sessions',
    label: 'Sessions',
    icon: Monitor,
    description: 'Devices currently signed in to your account',
    keywords: ['devices', 'sign out', 'logout', 'revoke', 'browser', 'active'],
    render: () => <ActiveSessions />,
    bare: true
  },
  {
    value: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Choose what you are told about and how',
    keywords: ['email', 'push', 'sound', 'alerts', 'reports', 'reminders', 'digest'],
    render: () => <NotificationSettings />,
    bare: true
  },
  {
    value: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme, text size and layout density',
    keywords: ['theme', 'dark', 'light', 'font', 'size', 'compact', 'sidebar', 'display'],
    render: () => <AppearanceSettings />
  },
  {
    value: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Password, two-factor authentication and policy',
    keywords: ['password', '2fa', 'two-factor', 'totp', 'authenticator', 'lockout', 'recovery', 'policy'],
    render: () => <SecuritySettings />
  },
  {
    value: 'hierarchy',
    label: 'Hierarchy',
    icon: Users,
    description: 'Where you sit in the organisation',
    keywords: ['org', 'organisation', 'manager', 'role', 'reporting', 'contact'],
    render: () => <HierarchySettings />
  },
  {
    value: 'currency',
    label: 'Currency',
    icon: Coins,
    description: 'How amounts are displayed to you',
    keywords: ['money', 'inr', 'usd', 'format', 'lakhs', 'crores', 'million', 'number'],
    render: () => <CurrencySettings />
  }
];

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const canManageOrgSettings = hasPermission('settings.edit');

  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [accountingMode, setAccountingMode] = useState<AccountingMode | null>(null);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [confirmModeSwitch, setConfirmModeSwitch] = useState(false);

  // Only administrators can read organisation settings, so a 403 here is an
  // expected outcome for ordinary users rather than an error worth surfacing.
  const loadAccountingMode = useCallback(async () => {
    if (!canManageOrgSettings) return;
    try {
      const { data } = await api.get('/settings');
      setAccountingMode(data?.accountingMode === 'indian' ? 'indian' : 'western');
    } catch {
      setAccountingMode(null);
    }
  }, [canManageOrgSettings]);

  useEffect(() => {
    loadAccountingMode();
  }, [loadAccountingMode]);

  const targetMode: AccountingMode = accountingMode === 'indian' ? 'western' : 'indian';

  const switchAccountingMode = async () => {
    setSwitchingMode(true);
    setConfirmModeSwitch(false);

    try {
      const endpoint =
        targetMode === 'indian' ? '/settings/convert-to-indian' : '/settings/convert-to-western';

      // Not retried: converting creates party ledgers, so a repeated call on a
      // slow response is not something to do automatically.
      const { data } = await withCsrf(headers => api.post(endpoint, {}, { headers }));

      setAccountingMode(targetMode);
      toast.success(data?.message || `Switched to ${targetMode} accounting mode`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not switch accounting mode');
    } finally {
      setSwitchingMode(false);
    }
  };

  const matches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return TABS.filter(
      tab =>
        tab.label.toLowerCase().includes(query) ||
        tab.description.toLowerCase().includes(query) ||
        tab.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowSearch(open => !open);
        return;
      }

      if (event.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
        return;
      }

      if ((event.metaKey || event.ctrlKey) && /^[1-7]$/.test(event.key)) {
        event.preventDefault();
        setActiveTab(TABS[Number(event.key) - 1].value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const openTab = (value: string) => {
    setActiveTab(value);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Toaster position="top-right" />

        <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
          {/* Header */}
          <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-xl dark:bg-slate-900/80">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#CD2E4F] p-3 shadow-lg">
                    <SettingsIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="bg-gradient-to-r from-[#970E2C] to-[#CD2E4F] bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                      Settings
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage your account, preferences and security
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)} className="gap-2">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                    <kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
                      <Command className="h-3 w-3" />K
                    </kbd>
                  </Button>

                  {/* Switching mode rewrites ledger data, so it is offered only to
                      administrators and always behind a confirmation. */}
                  {canManageOrgSettings && accountingMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmModeSwitch(true)}
                      disabled={switchingMode}
                      className="gap-2"
                    >
                      {switchingMode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : accountingMode === 'indian' ? (
                        <IndianRupee className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      {accountingMode === 'indian' ? 'Indian' : 'Western'} accounting
                    </Button>
                  )}
                </div>
              </div>

              {showSearch && (
                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search settings… (Esc to close)"
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>

                  {searchQuery.trim() && (
                    <div className="space-y-1 rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                      {matches.length === 0 ? (
                        <p className="px-2 py-3 text-sm text-muted-foreground">
                          Nothing matches “{searchQuery}”.
                        </p>
                      ) : (
                        matches.map(tab => (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => openTab(tab.value)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <tab.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm font-medium">{tab.label}</span>
                            <span className="truncate text-xs text-muted-foreground">{tab.description}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border bg-white/80 p-1.5 shadow-lg backdrop-blur-xl dark:bg-slate-900/80 sm:grid-cols-4 lg:grid-cols-7">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#CD2E4F] data-[state=active]:text-white"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-8 space-y-6">
                <ErrorBoundary>
                  {tab.bare ? (
                    tab.render()
                  ) : (
                    <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-xl dark:bg-slate-900/80">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                          <div className="rounded-xl bg-gradient-to-br from-[#970E2C] to-[#CD2E4F] p-2">
                            <tab.icon className="h-5 w-5 text-white" />
                          </div>
                          {tab.label}
                        </CardTitle>
                        <CardDescription className="text-base">{tab.description}</CardDescription>
                      </CardHeader>
                      <CardContent>{tab.render()}</CardContent>
                    </Card>
                  )}
                </ErrorBoundary>
              </TabsContent>
            ))}
          </Tabs>

          {/* Shortcuts */}
          <Card className="border-0 bg-slate-50 shadow-sm dark:bg-slate-900">
            <CardContent className="flex flex-wrap items-center justify-center gap-6 p-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 font-mono text-xs shadow-sm dark:bg-slate-700">
                  ⌘K
                </kbd>
                <span>Search</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 font-mono text-xs shadow-sm dark:bg-slate-700">
                  ⌘1–7
                </kbd>
                <span>Switch tabs</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-white px-2 py-1 font-mono text-xs shadow-sm dark:bg-slate-700">
                  Esc
                </kbd>
                <span>Close search</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={confirmModeSwitch} onOpenChange={setConfirmModeSwitch}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Switch to {targetMode === 'indian' ? 'Indian' : 'Western'} accounting mode?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    This changes the accounting mode for the entire organisation, not just your account.
                  </p>
                  {targetMode === 'indian' ? (
                    <p>
                      Party ledgers will be created for every active asset and liability account that does not
                      already have one. Existing ledgers are left untouched.
                    </p>
                  ) : (
                    <p>
                      Party ledgers are preserved for reference but stop being used for new entries.
                    </p>
                  )}
                  <Badge variant="outline">Affects all users</Badge>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={switchAccountingMode}>
                Switch to {targetMode === 'indian' ? 'Indian' : 'Western'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
}
