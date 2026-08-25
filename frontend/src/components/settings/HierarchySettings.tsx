"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Crown, Mail, Phone, Shield, User as UserIcon, UserCheck, Users } from 'lucide-react';
import api from '@/lib/api/api';
import { useAuth } from '@/contexts/AuthContext';

interface DirectoryUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: { _id: string; name: string; level: number } | string;
  department?: { name?: string } | string;
}

/**
 * Roles are Role documents with a numeric `level` (Root is 100) - higher means
 * more senior. Presentation is derived from that level rather than from a
 * hardcoded list of role names, which drifts as soon as a role is renamed.
 */
const bandFor = (level: number) => {
  if (level >= 100) return { label: 'Root', icon: Crown, color: 'bg-purple-600' };
  if (level >= 90) return { label: 'Executive', icon: Shield, color: 'bg-red-600' };
  if (level >= 80) return { label: 'Administrator', icon: UserCheck, color: 'bg-blue-600' };
  if (level >= 50) return { label: 'Manager', icon: Users, color: 'bg-green-600' };
  return { label: 'Team Member', icon: UserIcon, color: 'bg-slate-600' };
};

const roleOf = (user?: DirectoryUser | null) =>
  typeof user?.role === 'object' && user?.role ? user.role : null;

const levelOf = (user?: DirectoryUser | null) => roleOf(user)?.level ?? 0;

const roleNameOf = (user?: DirectoryUser | null) =>
  roleOf(user)?.name ?? (typeof user?.role === 'string' ? user.role : 'Unassigned');

const departmentOf = (user?: DirectoryUser | null) =>
  typeof user?.department === 'object' ? user?.department?.name : user?.department;

const initialsOf = (name: string) =>
  (name || '')
    .split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

export default function HierarchySettings() {
  const { hasPermission } = useAuth();
  const canViewDirectory = hasPermission('users.view');

  const [currentUser, setCurrentUser] = useState<DirectoryUser | null>(null);
  const [superiors, setSuperiors] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const meResponse = await api.get('/auth/me');
      const me: DirectoryUser = meResponse.data?.user ?? meResponse.data;
      setCurrentUser(me);

      // Listing every user needs users.view; without it we still show the
      // user their own position rather than failing the whole tab.
      if (!canViewDirectory) {
        setSuperiors([]);
        return;
      }

      const usersResponse = await api.get('/users');
      const payload = usersResponse.data;
      const all: DirectoryUser[] = Array.isArray(payload)
        ? payload
        : payload?.users ?? payload?.data ?? [];

      const myLevel = levelOf(me);

      setSuperiors(
        all
          .filter(user => user._id !== me?._id && levelOf(user) > myLevel)
          .sort((a, b) => levelOf(b) - levelOf(a))
      );
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setSuperiors([]);
      } else {
        setError(err?.response?.data?.message || 'Could not load the organisation hierarchy.');
      }
    } finally {
      setLoading(false);
    }
  }, [canViewDirectory]);

  useEffect(() => {
    load();
  }, [load]);

  const myBand = useMemo(() => bandFor(levelOf(currentUser)), [currentUser]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {currentUser && (
        <Card className="border-2 border-[#970E2C]/20 bg-[#970E2C]/5 dark:bg-[#970E2C]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Position
            </CardTitle>
            <CardDescription>Where you sit in the organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-br from-[#970E2C] to-[#CD2E4F] text-lg text-white">
                  {initialsOf(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{currentUser.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge className={`${myBand.color} text-white`}>{roleNameOf(currentUser)}</Badge>
                  <span className="text-xs text-muted-foreground">Level {levelOf(currentUser)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{currentUser.email}</p>
                {departmentOf(currentUser) && (
                  <p className="text-sm text-muted-foreground">Department: {departmentOf(currentUser)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            People Above You
          </CardTitle>
          <CardDescription>Contact details for more senior roles in your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          {!canViewDirectory ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your role does not include permission to browse the user directory, so this list is hidden.
              </AlertDescription>
            </Alert>
          ) : superiors.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Crown className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>You are at the top of the hierarchy.</p>
              <p className="text-sm">There are no more senior roles to display.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {superiors.map(user => {
                const band = bandFor(levelOf(user));
                return (
                  <div
                    key={user._id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{user.name}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge className={`${band.color} text-xs text-white`}>{roleNameOf(user)}</Badge>
                          <span className="text-xs text-muted-foreground">Level {levelOf(user)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {departmentOf(user) && (
                          <p className="text-xs text-muted-foreground">{departmentOf(user)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="gap-1">
                        <a href={`mailto:${user.email}`}>
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      </Button>
                      {user.phone && (
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <a href={`tel:${user.phone}`}>
                            <Phone className="h-3 w-3" />
                            Call
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
