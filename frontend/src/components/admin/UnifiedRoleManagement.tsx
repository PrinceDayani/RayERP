"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, UserIcon, ShieldIcon, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { ModernRoleDialog } from "./ModernRoleDialog";
import { useAuth } from "@/contexts/AuthContext";

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles?: Role[];
  status: string;
  [key: string]: any;
}

interface Permission {
  _id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
}

interface UnifiedRoleManagementProps {
  isLoading: boolean;
}

export function UnifiedRoleManagement({ isLoading }: UnifiedRoleManagementProps) {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const hasFetchedRef = useRef(false);
  
  // Role management states
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  // User role assignment states
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    const fetchData = async () => {
      try {
        const [rolesData, usersData, permissionsData] = await Promise.all([
          adminAPI.getRoles(),
          adminAPI.getUsers(),
          adminAPI.getPermissions()
        ]);
        setRoles(rolesData);
        setUsers(usersData as unknown as User[]);
        setPermissions(permissionsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, []);

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && role.isActive) ||
      (statusFilter === "inactive" && !role.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const activeRoles = roles.filter(role => role.isActive);

  const handleRoleCreated = async (createdRole: any) => {
    setRoles([...roles, createdRole]);
    await logActivity({
      action: 'create',
      resource: 'role',
      details: `Created role: ${createdRole.name} with ${createdRole.permissions.length} permissions`
    });
  };

  const handleUpdateRole = async () => {
    if (!currentRole) return;
    try {
      const updatedRole = await adminAPI.updateRole(currentRole._id, currentRole);
      setRoles(roles.map(role => role._id === currentRole._id ? updatedRole : role));
      await logActivity({
        action: 'update',
        resource: 'role',
        details: `Updated role: ${currentRole.name}`
      });
      setIsEditRoleOpen(false);
      toast({ title: "Success", description: "Role updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  const handleToggleRoleStatus = async (roleId: string, isActive: boolean) => {
    try {
      const role = roles.find(r => r._id === roleId);
      const updatedRole = await adminAPI.updateRole(roleId, { isActive });
      setRoles(roles.map(role => role._id === roleId ? { ...role, isActive } : role));
      await logActivity({
        action: 'update',
        resource: 'role',
        details: `${isActive ? 'Activated' : 'Deactivated'} role: ${role?.name}`
      });
      toast({ 
        title: "Success", 
        description: `Role ${isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role status", variant: "destructive" });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const role = roles.find(r => r._id === roleId);
      await adminAPI.deleteRole(roleId);
      setRoles(roles.filter(role => role._id !== roleId));
      await logActivity({
        action: 'delete',
        resource: 'role',
        details: `Deleted role: ${role?.name}`
      });
      toast({ title: "Success", description: "Role deleted successfully" });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete role";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleAssignRoles = async () => {
    if (!currentUser) return;
    try {
      if (selectedRoles.length === 0) {
        // No role selected - clear roles
        const updatedUser = await adminAPI.assignRolesToUser(currentUser._id, []);
        setUsers(users.map(u => u._id === currentUser._id ? {
          ...u,
          roles: []
        } : u));
        
        await logActivity({
          action: 'update',
          resource: 'user',
          details: `Removed all roles from user: ${currentUser.name}`
        });
        
        toast({ title: "Success", description: `Roles cleared for ${currentUser.name}` });
      } else {
        // Single role selected
        const selectedRole = activeRoles.find(role => role._id === selectedRoles[0]);
        const updatedUser = await adminAPI.assignRolesToUser(currentUser._id, selectedRoles);
        
        // Update the user in the local state
        setUsers(users.map(u => u._id === currentUser._id ? {
          ...u,
          roles: selectedRole ? [selectedRole] : []
        } : u));
        
        await logActivity({
          action: 'update',
          resource: 'user',
          details: `Assigned role "${selectedRole?.name}" to user: ${currentUser.name}`
        });
        
        toast({ title: "Success", description: `Role updated for ${currentUser.name}` });
      }
      
      setIsAssignRoleOpen(false);
      setCurrentUser(null);
      setSelectedRoles([]);
    } catch (error: any) {
      console.error('Role assignment error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to assign role", 
        variant: "destructive" 
      });
    }
  };

  const handlePermissionChange = (permissionName: string, checked: boolean, isEdit = false) => {
    if (isEdit && currentRole) {
      const updatedPermissions = checked
        ? [...currentRole.permissions, permissionName]
        : currentRole.permissions.filter(p => p !== permissionName);
      setCurrentRole({ ...currentRole, permissions: updatedPermissions });
    } else {
      const updatedPermissions = checked
        ? [...newRole.permissions, permissionName]
        : newRole.permissions.filter(p => p !== permissionName);
      setNewRole({ ...newRole, permissions: updatedPermissions });
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          <TabsTrigger value="assignments">Assign Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasPermission('roles.create') && (
              <Button onClick={() => { setDialogMode('create'); setIsAddRoleOpen(true); }}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No roles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role._id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description || "-"}</TableCell>
                      <TableCell>
                        {role.permissions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No permissions</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 2).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {role.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission('roles.edit') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleRoleStatus(role._id, !role.isActive)}
                            >
                              {role.isActive ? 
                                <ToggleRightIcon className="h-4 w-4" /> : 
                                <ToggleLeftIcon className="h-4 w-4" />
                              }
                            </Button>
                          )}
                          {hasPermission('roles.edit') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCurrentRole({ ...role });
                                setDialogMode('edit');
                                setIsEditRoleOpen(true);
                              }}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('roles.delete') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{role.name}"? 
                                  {users.some(user => user.roles?.some(userRole => userRole._id === role._id)) && (
                                    <span className="text-red-500 block mt-2">
                                      Warning: This role is currently assigned to users. Please reassign users before deletion.
                                    </span>
                                  )}
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRole(role._id)}
                                  className="bg-red-500 hover:bg-red-600"
                                  disabled={users.some(user => user.roles?.some(userRole => userRole._id === role._id))}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Show primary role first */}
                        {user.role && typeof user.role === 'string' && (
                          <Badge variant="default" className="text-xs">
                            {user.role.toUpperCase()}
                          </Badge>
                        )}
                        {/* Show RBAC roles */}
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role._id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          !user.role && <span className="text-muted-foreground text-sm">No roles assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasPermission('users.assign_roles') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentUser(user);
                            // Set the first RBAC role as selected, or empty if none
                            setSelectedRoles(user.roles && user.roles.length > 0 ? [user.roles[0]._id] : []);
                            setIsAssignRoleOpen(true);
                          }}
                        >
                          <ShieldIcon className="mr-2 h-4 w-4" />
                          Assign Role
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Edit Role</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Modify role details and permissions for {currentRole?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {currentRole && (
            <Tabs defaultValue="details" className="flex-1">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <EditIcon className="h-4 w-4" />
                  Role Details
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4" />
                  Permissions ({currentRole.permissions.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">Role Name *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Enter role name"
                      value={currentRole.name}
                      onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Badge variant={currentRole.isActive ? "default" : "secondary"}>
                        {currentRole.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe the role's purpose and responsibilities"
                    value={currentRole.description || ""}
                    onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Manage Permissions</h3>
                    <Badge variant="outline" className="text-xs">
                      {currentRole.permissions.length} selected
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allPermissionNames = permissions.map(p => p.name);
                        setCurrentRole({ ...currentRole, permissions: allPermissionNames });
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentRole({ ...currentRole, permissions: [] })}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                  <div className="p-4 space-y-6">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                      const categorySelected = categoryPermissions.filter(p => 
                        currentRole.permissions.includes(p.name)
                      ).length;
                      const categoryTotal = categoryPermissions.length;
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-3 pb-2 border-b">
                            <Checkbox
                              id={`category-${category}`}
                              checked={categorySelected === categoryTotal}
                              onCheckedChange={(checked) => {
                                const categoryPermissionNames = categoryPermissions.map(p => p.name);
                                if (checked) {
                                  const newPermissions = [...new Set([...currentRole.permissions, ...categoryPermissionNames])];
                                  setCurrentRole({ ...currentRole, permissions: newPermissions });
                                } else {
                                  const newPermissions = currentRole.permissions.filter(
                                    p => !categoryPermissionNames.includes(p)
                                  );
                                  setCurrentRole({ ...currentRole, permissions: newPermissions });
                                }
                              }}
                            />
                            <Label htmlFor={`category-${category}`} className="font-semibold cursor-pointer">
                              {category}
                            </Label>
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {categorySelected}/{categoryTotal}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pl-6">
                            {categoryPermissions.map((permission) => (
                              <div key={permission._id} className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50">
                                <Checkbox
                                  id={`edit-${permission.name}`}
                                  checked={currentRole.permissions.includes(permission.name)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.name, checked as boolean, true)
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <Label 
                                    htmlFor={`edit-${permission.name}`} 
                                    className="text-sm cursor-pointer block"
                                  >
                                    {permission.name.replace(/_/g, ' ')}
                                  </Label>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="border-t pt-4 mt-6">
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={!currentRole?.name.trim()} className="min-w-[120px]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Select a role for {currentUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Label>Select Role</Label>
              <Select 
                value={selectedRoles[0] || "no-role"} 
                onValueChange={(value) => setSelectedRoles(value && value !== "no-role" ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-role">No Role</SelectItem>
                  {activeRoles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignRoles}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern Role Dialogs */}
      <ModernRoleDialog
        open={isAddRoleOpen || isEditRoleOpen}
        onOpenChange={(open) => {
          setIsAddRoleOpen(false);
          setIsEditRoleOpen(false);
          if (!open) setCurrentRole(null);
        }}
        onSuccess={() => {
          const fetchData = async () => {
            try {
              const rolesData = await adminAPI.getRoles();
              setRoles(rolesData);
            } catch (error) {
              console.error('Failed to refresh roles:', error);
            }
          };
          fetchData();
        }}
        role={currentRole}
        mode={dialogMode}
      />
    </div>
  );
}