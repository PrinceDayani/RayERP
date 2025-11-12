"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Users, Crown, Shield, UserCheck, User } from 'lucide-react';
import api from '@/lib/api/api';
import toast from 'react-hot-toast';

interface RoleUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  avatarUrl?: string;
}

const ROLE_HIERARCHY = {
  'root': { level: 0, icon: Crown, color: 'bg-purple-600' },
  'super_admin': { level: 1, icon: Shield, color: 'bg-red-600' },
  'admin': { level: 2, icon: UserCheck, color: 'bg-blue-600' },
  'manager': { level: 3, icon: Users, color: 'bg-green-600' },
  'employee': { level: 4, icon: User, color: 'bg-gray-600' }
};

export default function HierarchySettings() {
  const [currentUser, setCurrentUser] = useState<RoleUser | null>(null);
  const [superiorUsers, setSuperiorUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      
      // Get current user info
      const userResponse = await api.get('/users/me');
      const user = userResponse.data;
      setCurrentUser(user);

      // Get users with higher roles
      const currentRoleLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY]?.level ?? 999;
      
      const usersResponse = await api.get('/users');
      const allUsers = usersResponse.data;
      
      const superiors = allUsers.filter((u: RoleUser) => {
        const userRoleLevel = ROLE_HIERARCHY[u.role as keyof typeof ROLE_HIERARCHY]?.level ?? 999;
        return userRoleLevel < currentRoleLevel && u._id !== user._id;
      }).sort((a: RoleUser, b: RoleUser) => {
        const aLevel = ROLE_HIERARCHY[a.role as keyof typeof ROLE_HIERARCHY]?.level ?? 999;
        const bLevel = ROLE_HIERARCHY[b.role as keyof typeof ROLE_HIERARCHY]?.level ?? 999;
        return aLevel - bLevel;
      });

      setSuperiorUsers(superiors);
    } catch (error) {
      console.error('Failed to fetch hierarchy data:', error);
      toast.error('Failed to load hierarchy information');
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || ROLE_HIERARCHY.employee;
  };

  const handleContactUser = (user: RoleUser, method: 'email' | 'phone') => {
    if (method === 'email' && user.email) {
      window.open(`mailto:${user.email}`, '_blank');
      toast.success(`Opening email to ${user.firstName} ${user.lastName}`);
    } else if (method === 'phone' && user.phone) {
      window.open(`tel:${user.phone}`, '_blank');
      toast.success(`Calling ${user.firstName} ${user.lastName}`);
    } else {
      toast.error(`${method === 'email' ? 'Email' : 'Phone'} not available`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Info */}
      {currentUser && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Position
            </CardTitle>
            <CardDescription>Your current role in the organization hierarchy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.avatarUrl} />
                <AvatarFallback className="text-lg">
                  {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {React.createElement(getRoleInfo(currentUser.role).icon, {
                    className: "h-4 w-4 text-white"
                  })}
                  <Badge className={`${getRoleInfo(currentUser.role).color} text-white`}>
                    {currentUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{currentUser.email}</p>
                {currentUser.department && (
                  <p className="text-sm text-muted-foreground">Department: {currentUser.department}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Superior Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Organization Hierarchy
          </CardTitle>
          <CardDescription>
            Contact information for users with higher roles in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {superiorUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You are at the top of the hierarchy!</p>
              <p className="text-sm">No superior roles to display.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {superiorUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {React.createElement(roleInfo.icon, {
                            className: "h-3 w-3 text-white"
                          })}
                          <Badge className={`${roleInfo.color} text-white text-xs`}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.department && (
                          <p className="text-xs text-muted-foreground">
                            {user.department}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactUser(user, 'email')}
                        className="gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </Button>
                      {user.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactUser(user, 'phone')}
                          className="gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          Call
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

      {/* Hierarchy Legend */}
      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-sm">Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(ROLE_HIERARCHY).map(([role, info]) => (
              <div key={role} className="flex items-center gap-2 text-xs">
                {React.createElement(info.icon, {
                  className: "h-3 w-3 text-white"
                })}
                <Badge className={`${info.color} text-white text-xs`}>
                  {role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            You can only see and contact users with roles higher than yours in the hierarchy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}