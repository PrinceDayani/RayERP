'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function UserOnboarding() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'normal'
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/onboarding/data`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await response.json();
      setRoles(data.roles || []);
      setProjects(data.projects || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/onboarding/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          ...formData,
          roleIds: selectedRoles,
          projectIds: selectedProjects
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User onboarded successfully'
        });
        
        setFormData({ name: '', email: '', password: '', role: 'normal' });
        setSelectedRoles([]);
        setSelectedProjects([]);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to onboard user',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Base Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role Assignment */}
            <div>
              <Label>Additional Roles</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {roles.map(role => (
                  <div key={role._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role._id}
                      checked={selectedRoles.includes(role._id)}
                      onCheckedChange={() => handleRoleToggle(role._id)}
                    />
                    <Label htmlFor={role._id} className="text-sm">
                      {role.name} - {role.description}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Assignment */}
            <div>
              <Label>Project Assignments</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {projects.map(project => (
                  <div key={project._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={project._id}
                      checked={selectedProjects.includes(project._id)}
                      onCheckedChange={() => handleProjectToggle(project._id)}
                    />
                    <Label htmlFor={project._id} className="text-sm">
                      {project.name} - {project.description}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Onboarding...' : 'Onboard User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}