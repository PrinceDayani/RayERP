"use client";

import { useState, useEffect } from "react";
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
import { adminAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { logActivity } from "@/lib/activityLogger";

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // Role management states
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
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
    const fetchData = async () => {
      try {
        const [rolesData, usersData, permissionsData] = await Promise.all([
          adminAPI.getRoles(),
          adminAPI.getUsers(),
          adminAPI.getPermissions()
        ]);
        setRoles(rolesData);
        setUsers(usersData);
        setPermissions(permissionsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive"
        });
      }
    };

    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

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

  const handleCreateRole = async () => {
    try {
      const createdRole = await adminAPI.createRole({ ...newRole, isActive: true });
      setRoles([...roles, createdRole]);
      await logActivity({
        action: 'create',
        resource: 'role',
        details: `Created role: ${newRole.name} with ${newRole.permissions.length} permissions`
      });
      setNewRole({ name: "", description: "", permissions: [] });
      setIsAddRoleOpen(false);
      toast({ title: "Success", description: "Role created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create role", variant: "destructive" });
    }
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
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete role", variant: "destructive" });
    }
  };

  const handleAssignRoles = async () => {
    if (!currentUser) return;
    try {
      const selectedRoleNames = activeRoles.filter(role => selectedRoles.includes(role._id)).map(role => role.name);
      const updatedUser = await adminAPI.assignRolesToUser(currentUser._id, selectedRoles);
      setUsers(users.map(u => u._id === currentUser._id ? updatedUser : u));
      await logActivity({
        action: 'update',
        resource: 'user',
        details: `Assigned roles [${selectedRoleNames.join(', ')}] to user: ${currentUser.name}`
      });
      setIsAssignRoleOpen(false);
      setCurrentUser(null);
      setSelectedRoles([]);
      toast({ title: "Success", description: `Roles updated for ${currentUser.name}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign roles", variant: "destructive" });
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
            <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>Define a new role with specific permissions</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      className="col-span-3"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Textarea
                      id="description"
                      className="col-span-3"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right">Permissions</Label>
                    <div className="col-span-3 space-y-4">
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-sm">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {categoryPermissions.map((permission) => (
                              <div key={permission._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`new-${permission.name}`}
                                  checked={newRole.permissions.includes(permission.name)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.name, checked as boolean)
                                  }
                                />
                                <Label htmlFor={`new-${permission.name}`} className="text-sm">
                                  {permission.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateRole}>Create Role</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentRole({ ...role });
                              setIsEditRoleOpen(true);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
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
                  <TableHead>Assigned Roles</TableHead>
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
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role._id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No roles assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentUser(user);
                          setSelectedRoles(user.roles?.map(role => role._id) || []);
                          setIsAssignRoleOpen(true);
                        }}
                      >
                        <ShieldIcon className="mr-2 h-4 w-4" />
                        Assign Roles
                      </Button>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details and permissions</DialogDescription>
          </DialogHeader>
          {currentRole && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  className="col-span-3"
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Description</Label>
                <Textarea
                  id="edit-description"
                  className="col-span-3"
                  value={currentRole.description || ""}
                  onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Permissions</Label>
                <div className="col-span-3 space-y-4">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm">{category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryPermissions.map((permission) => (
                          <div key={permission._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.name}`}
                              checked={currentRole.permissions.includes(permission.name)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission.name, checked as boolean, true)
                              }
                            />
                            <Label htmlFor={`edit-${permission.name}`} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Roles</DialogTitle>
            <DialogDescription>
              Select active roles for {currentUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Label>Available Active Roles</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeRoles.map((role) => (
                  <div key={role._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assign-${role._id}`}
                      checked={selectedRoles.includes(role._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role._id]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(id => id !== role._id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`assign-${role._id}`} className="text-sm font-medium">
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignRoles}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}