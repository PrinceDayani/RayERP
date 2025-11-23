'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { onboardingAPI } from '@/lib/api/onboardingAPI';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
}

interface UserProject {
  _id: string;
  userId: User;
  projectId: Project;
  accessLevel: 'read' | 'write' | 'admin';
  assignedAt: string;
}

export default function ProjectAccessManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<'read' | 'write' | 'admin'>('read');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch projects and roles
      const resourcesData = await onboardingAPI.getResources();
      setProjects(resourcesData.projects || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    }
  };

  const fetchUserProjects = async (userId: string) => {
    try {
      const data = await onboardingAPI.getUserProjects(userId);
      setUserProjects(data.projects || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load user projects',
        variant: 'destructive'
      });
    }
  };

  const handleAssignProject = async () => {
    if (!selectedUser || !selectedProject) {
      toast({
        title: 'Error',
        description: 'Please select both user and project',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await onboardingAPI.assignUserToProject(selectedUser, selectedProject, accessLevel);
      toast({
        title: 'Success',
        description: 'User assigned to project successfully'
      });
      
      // Refresh user projects if the same user is selected
      if (selectedUser) {
        await fetchUserProjects(selectedUser);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign user to project',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProject = async (userId: string, projectId: string) => {
    try {
      await onboardingAPI.removeUserFromProject(userId, projectId);
      toast({
        title: 'Success',
        description: 'User removed from project successfully'
      });
      
      // Refresh user projects
      if (selectedUser === userId) {
        await fetchUserProjects(userId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user from project',
        variant: 'destructive'
      });
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'write': return 'bg-yellow-100 text-yellow-800';
      case 'read': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Access Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={accessLevel} onValueChange={(value: any) => setAccessLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAssignProject} disabled={loading}>
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </div>

          {/* User Projects Display */}
          {selectedUser && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Projects for {users.find(u => u._id === selectedUser)?.name}
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => fetchUserProjects(selectedUser)}
                >
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userProjects.map(userProject => (
                  <Card key={userProject._id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{userProject.projectId.name}</h4>
                        <Badge className={getAccessLevelColor(userProject.accessLevel)}>
                          {userProject.accessLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {userProject.projectId.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Assigned: {new Date(userProject.assignedAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveProject(selectedUser, userProject.projectId._id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {userProjects.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No projects assigned to this user
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}