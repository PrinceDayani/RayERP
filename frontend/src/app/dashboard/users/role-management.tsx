"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Shield, Plus, Trash2, Edit, Search, Eye, Users, Settings2, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react";

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

export default function RoleManagement() {
  const { roles, fetchRoles, hasRole } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', level: 50 });
  const [editRole, setEditRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDialog, setViewDialog] = useState(false);
  const [viewRole, setViewRole] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleStats, setRoleStats] = useState({ total: 0, active: 0, system: 0, custom: 0 });

  useEffect(() => {
    fetchRoles();
    calculateStats();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [roles]);

  const calculateStats = () => {
    const total = roles.length;
    const active = roles.filter(r => !r.disabled).length;
    const system = roles.filter(r => r.isDefault).length;
    const custom = roles.filter(r => !r.isDefault).length;
    setRoleStats({ total, active, system, custom });
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !role.disabled) ||
      (statusFilter === 'system' && role.isDefault) ||
      (statusFilter === 'custom' && !role.isDefault);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!newRole.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Role name is required",
          variant: "destructive"
        });
        return;
      }

      if (newRole.level < 1 || newRole.level > 79) {
        toast({
          title: "Validation Error",
          description: "Role level must be between 1 and 79",
          variant: "destructive"
        });
        return;
      }

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
        toast({
          title: "Success",
          description: "Role created successfully",
          variant: "default"
        });
        setNewRole({ name: '', description: '', level: 50 });
        setSelectedPermissions([]);
        setOpenDialog(false);
        fetchRoles();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to create role',
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create role',
        variant: "destructive"
      });
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
        toast({
          title: "Success",
          description: "Role deleted successfully",
          variant: "default"
        });
        fetchRoles();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to delete role',
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete role',
        variant: "destructive"
      });
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
        toast({
          title: "Success",
          description: "Role updated successfully",
          variant: "default"
        });
        setEditDialog(false);
        setEditRole(null);
        fetchRoles();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to update role',
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update role',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('Root')) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-2xl border border-border/50 backdrop-blur-sm">
        <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          Only Root user can manage roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
              <p className="text-2xl font-bold">{roleStats.total}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
              <p className="text-2xl font-bold text-green-600">{roleStats.active}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Roles</p>
              <p className="text-2xl font-bold text-purple-600">{roleStats.system}</p>
            </div>
            <Settings2 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custom Roles</p>
              <p className="text-2xl font-bold text-orange-600">{roleStats.custom}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">Role Management</h2>
          <p className="text-muted-foreground text-lg">
            Manage system roles and permissions ({filteredRoles.length} of {roles.length} roles)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border/50 focus:border-primary/50 transition-all duration-300"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            setNewRole({ name: '', description: '', level: 50 });
            setSelectedPermissions([]);
            setOpenDialog(true);
          }} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="font-medium text-gray-600 py-4 px-6">Name</TableHead>
              <TableHead className="font-medium text-gray-600 py-4 px-6">Description</TableHead>
              <TableHead className="font-medium text-gray-600 py-4 px-6">Permissions</TableHead>
              <TableHead className="font-medium text-gray-600 py-4 px-6">Status</TableHead>
              <TableHead className="font-medium text-gray-600 py-4 px-6">Created</TableHead>
              <TableHead className="font-medium text-gray-600 py-4 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role._id} className="border-b hover:bg-gray-50/50 transition-colors">
                <TableCell className="py-4 px-6 font-medium text-gray-900">
                  {role.name}
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-600">
                  {role.description || '-'}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.length > 0 ? (
                      <>
                        {role.permissions.slice(0, 3).map((perm, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                            {perm.replace(/\./g, '.').replace(/_/g, '_')}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">*</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  {role.isDefault ? (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      System
                    </Badge>
                  ) : role.disabled ? (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Inactive
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-600">
                  {new Date(role.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={() => {
                        setViewRole(role);
                        setViewDialog(true);
                      }}
                      title="View role details"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Button>
                    {!role.isDefault && role.name?.toLowerCase() !== 'root' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteRole(role._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRoles.length === 0 && (
          <div className="text-center py-16">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No matching roles found' : 'No roles found'}
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first role to get started.'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Create New Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a custom role for your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-1">
                <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">Basic Info</TabsTrigger>
                <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">Role Name</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., Project Manager"
                    required
                    className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                  <Input
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Brief description of the role"
                    className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-medium text-foreground">Level (1-79)</Label>
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    max="79"
                    value={newRole.level}
                    onChange={(e) => setNewRole({ ...newRole, level: parseInt(e.target.value) })}
                    required
                    className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher levels have more privileges. Superadmin (90), Admin (80). Custom roles: 1-79
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4 max-h-96 overflow-y-auto py-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedPermissions.length} permissions
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allPerms = Object.values(PERMISSIONS).flat();
                        setSelectedPermissions(allPerms);
                      }}
                    >
                      Select All
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPermissions([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                {Object.entries(PERMISSIONS).map(([category, perms]) => (
                  <div key={category} className="space-y-2 border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {category}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const categorySelected = perms.every(p => selectedPermissions.includes(p));
                          if (categorySelected) {
                            setSelectedPermissions(selectedPermissions.filter(p => !perms.includes(p)));
                          } else {
                            setSelectedPermissions([...new Set([...selectedPermissions, ...perms])]);
                          }
                        }}
                      >
                        {perms.every(p => selectedPermissions.includes(p)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
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
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="bg-background/50 border-border/50 hover:bg-accent/50 transition-all duration-300">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {loading ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Edit Role</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          {editRole && (
            <form onSubmit={handleUpdateRole}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-1">
                  <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">Basic Info</TabsTrigger>
                  <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium text-foreground">Role Name</Label>
                    <Input
                      id="edit-name"
                      value={editRole.name}
                      onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                      disabled={editRole.isDefault}
                      required
                      className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-sm font-medium text-foreground">Description</Label>
                    <Input
                      id="edit-description"
                      value={editRole.description}
                      onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                      className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-level" className="text-sm font-medium text-foreground">Level (1-79)</Label>
                    <Input
                      id="edit-level"
                      type="number"
                      min="1"
                      max="79"
                      value={editRole.level}
                      onChange={(e) => setEditRole({ ...editRole, level: parseInt(e.target.value) })}
                      disabled={editRole.isDefault}
                      required
                      className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="permissions" className="space-y-4 max-h-96 overflow-y-auto py-6">
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
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)} className="bg-background/50 border-border/50 hover:bg-accent/50 transition-all duration-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {loading ? 'Updating...' : 'Update Role'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Role Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
              <Shield className="h-6 w-6" />
              {viewRole?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed information about this role
            </DialogDescription>
          </DialogHeader>
          {viewRole && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Role Name</Label>
                  <p className="text-sm bg-muted/50 p-2 rounded">{viewRole.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Level</Label>
                  <p className="text-sm bg-muted/50 p-2 rounded">{viewRole.level}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Description</Label>
                <p className="text-sm bg-muted/50 p-2 rounded">{viewRole.description || 'No description provided'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  {viewRole.isDefault ? (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Settings2 className="h-3 w-3 mr-1" />
                      System Role
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Users className="h-3 w-3 mr-1" />
                      Custom Role
                    </Badge>
                  )}
                  {viewRole.disabled ? (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions ({viewRole.permissions?.length || 0})
                </Label>
                <div className="max-h-60 overflow-y-auto bg-muted/50 p-3 rounded border">
                  {viewRole.permissions && viewRole.permissions.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(PERMISSIONS).map(([category, perms]) => {
                        const categoryPerms = perms.filter(p => viewRole.permissions.includes(p));
                        if (categoryPerms.length === 0) return null;
                        return (
                          <div key={category} className="space-y-2">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {category} ({categoryPerms.length})
                            </h5>
                            <div className="grid grid-cols-2 gap-1">
                              {categoryPerms.map((perm, index) => (
                                <Badge key={index} variant="outline" className="text-xs justify-start bg-white">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {viewRole.name === 'Root' ? 'Full system access (all permissions)' : 'No specific permissions assigned'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Created</Label>
                  <p className="text-sm bg-muted/50 p-2 rounded flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {new Date(viewRole.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Last Updated</Label>
                  <p className="text-sm bg-muted/50 p-2 rounded flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {new Date(viewRole.updatedAt || viewRole.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              Close
            </Button>
            {viewRole && !viewRole.isDefault && viewRole.name?.toLowerCase() !== 'root' && (
              <Button onClick={() => {
                setViewDialog(false);
                handleEditRole(viewRole);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}