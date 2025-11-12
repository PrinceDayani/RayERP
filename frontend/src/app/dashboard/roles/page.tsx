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
import { Shield, Plus, Trash2, Edit, X } from "lucide-react";

const PERMISSIONS = {
  Projects: ['projects.view', 'projects.create', 'projects.update', 'projects.delete'],
  Tasks: ['tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign'],
  Employees: ['employees.view', 'employees.create', 'employees.update', 'employees.delete', 'employees.manage'],
  Attendance: ['attendance.view', 'attendance.manage'],
  Leave: ['leave.view', 'leave.approve', 'leave.manage'],
  Finance: ['finance.view', 'finance.manage'],
  Budgets: ['budgets.view', 'budgets.create', 'budgets.update', 'budgets.delete'],
  Expenses: ['expenses.view', 'expenses.approve', 'expenses.manage'],
  Reports: ['reports.view', 'reports.export'],
  Analytics: ['analytics.view'],
  Contacts: ['contacts.view', 'contacts.create', 'contacts.update', 'contacts.delete'],
  Settings: ['settings.view', 'settings.manage'],
};

export default function RolesPage() {
  const { roles, fetchRoles, hasRole } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', level: 50 });
  const [editRole, setEditRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

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

  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) return;
    if (!confirm(`Delete ${selectedRoles.length} role(s)?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/roles/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ roleIds: selectedRoles })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        if (data.errors) {
          data.errors.forEach((err: string) => toast.error(err));
        }
        setSelectedRoles([]);
        setBulkMode(false);
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to delete roles');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete roles');
    }
  };

  const handleEditRole = (role: any) => {
    setEditRole(role);
    setSelectedPermissions(role.permissions || []);
    setEditDialog(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/roles/${editRole._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          name: editRole.name,
          description: editRole.description,
          level: editRole.level,
          permissions: selectedPermissions
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Role updated successfully');
        setEditDialog(false);
        setEditRole(null);
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to update role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSelectAll = () => {
    const selectableRoles = roles.filter(r => !r.isDefault && r.name?.toLowerCase() !== 'root');
    if (selectedRoles.length === selectableRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(selectableRoles.map(r => r._id));
    }
  };

  const cancelBulkMode = () => {
    setBulkMode(false);
    setSelectedRoles([]);
  };

  const selectableRolesCount = roles.filter(r => !r.isDefault && r.name?.toLowerCase() !== 'root').length;

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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Role Management</CardTitle>
              <CardDescription>
                {bulkMode ? `${selectedRoles.length} of ${selectableRolesCount} roles selected` : 'Manage system roles and permissions'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!bulkMode ? (
                <>
                  <Button variant="outline" onClick={() => setBulkMode(true)}>
                    Bulk Select
                  </Button>
                  <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={cancelBulkMode}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleBulkDelete}
                    disabled={selectedRoles.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedRoles.length})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bulkMode && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <Checkbox
                checked={selectedRoles.length === selectableRolesCount && selectableRolesCount > 0}
                onCheckedChange={toggleSelectAll}
                id="select-all"
                disabled={selectableRolesCount === 0}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectableRolesCount} selectable roles)
              </label>
            </div>
          )}
          <div className="space-y-3">
            {roles.map((role) => (
              <div 
                key={role._id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  selectedRoles.includes(role._id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {bulkMode && !role.isDefault && role.name?.toLowerCase() !== 'root' && (
                    <Checkbox
                      checked={selectedRoles.includes(role._id)}
                      onCheckedChange={() => toggleRoleSelection(role._id)}
                    />
                  )}
                  <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{role.name}</h3>
                      {role.isDefault && (
                        <Badge variant="outline">System</Badge>
                      )}
                      <Badge variant="secondary">Level {role.level}</Badge>
                      {role.permissions && role.permissions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} permissions
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                  </div>
                </div>
                {!bulkMode && !role.isDefault && role.name?.toLowerCase() !== 'root' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(role._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {roles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No roles found. Create your first role to get started.
            </div>
          )}
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          {editRole && (
            <form onSubmit={handleUpdateRole}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Role Name</Label>
                    <Input
                      id="edit-name"
                      value={editRole.name}
                      onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                      disabled={editRole.isDefault}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editRole.description}
                      onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-level">Level (1-79)</Label>
                    <Input
                      id="edit-level"
                      type="number"
                      min="1"
                      max="79"
                      value={editRole.level}
                      onChange={(e) => setEditRole({ ...editRole, level: parseInt(e.target.value) })}
                      disabled={editRole.isDefault}
                      required
                    />
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
                              id={`edit-${perm}`}
                              checked={selectedPermissions.includes(perm)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions([...selectedPermissions, perm]);
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                                }
                              }}
                            />
                            <label htmlFor={`edit-${perm}`} className="text-sm cursor-pointer">
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
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Role'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
