"use client";

import React, { useState, useEffect } from 'react';
import { useAuth, Role } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import { Shield, Plus, Trash2 } from "lucide-react";

const PERMISSIONS = {
  Users: ['view_users', 'create_user', 'update_user', 'delete_user'],
  Projects: ['view_projects', 'create_project', 'update_project', 'delete_project'],
  Tasks: ['view_tasks', 'create_task', 'update_task', 'delete_task'],
  Employees: ['view_employees', 'create_employee', 'update_employee', 'delete_employee'],
  Departments: ['view_departments', 'create_department', 'update_department', 'delete_department'],
  Finance: ['view_finance', 'create_finance', 'update_finance', 'delete_finance'],
  Reports: ['view_reports', 'export_reports'],
  Settings: ['view_settings', 'update_settings'],
};

export default function RolesPage() {
  const { roles, fetchRoles, hasRole } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', level: 50 });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          ...newRole,
          permissions: selectedPermissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Role created successfully');
        setNewRole({ name: '', description: '', level: 50 });
        setSelectedPermissions([]);
        setOpenDialog(false);
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to create role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Role deleted successfully');
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to delete role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  if (!hasRole('Root')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Only Root user can manage roles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Role Management</CardTitle>
            <CardDescription>
              Manage system roles and permissions
            </CardDescription>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{role.name}</h3>
                      {role.isDefault && (
                        <Badge variant="outline">Default</Badge>
                      )}
                      <Badge variant="secondary">Level {role.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
                {!role.isDefault && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRole(role._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a custom role for your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., Project Manager"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Brief description of the role"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="level">Level (1-79)</Label>
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    max="79"
                    value={newRole.level}
                    onChange={(e) => setNewRole({ ...newRole, level: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher levels have more privileges. Superadmin (90), Admin (80). Custom roles: 1-79
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(PERMISSIONS).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-sm">{category}</h4>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {perms.map((perm) => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm}
                            checked={selectedPermissions.includes(perm)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions([...selectedPermissions, perm]);
                              } else {
                                setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                              }
                            }}
                          />
                          <label htmlFor={perm} className="text-sm cursor-pointer">
                            {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || selectedPermissions.length === 0}>
                {loading ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
