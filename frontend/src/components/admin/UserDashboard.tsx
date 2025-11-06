'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, FolderOpen, Settings, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function UserDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/onboarding/user/${user?._id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await response.json();
      setUserProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching user projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'root': return 'bg-red-100 text-red-800';
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600 mt-1">Here's your ERP dashboard overview</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'root') && (
          <Button onClick={() => router.push('/dashboard/admin/onboarding')}>
            <Plus className="h-4 w-4 mr-2" />
            Onboard User
          </Button>
        )}
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <Badge className={getRoleColor(user?.role || '')}>
                {user?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Assigned Projects ({userProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProjects.map((userProject) => (
                <div key={userProject._id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{userProject.projectId.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{userProject.projectId.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {userProject.accessLevel}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(userProject.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>
              View All Projects
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/tasks')}>
              My Tasks
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
              Account Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}