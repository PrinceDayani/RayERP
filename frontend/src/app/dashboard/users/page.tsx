"use client";

import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  Shield, 
  UserCog, 
  RefreshCw,
  Search,
  FileText,
  Check,
  X,
  Settings
} from "lucide-react";
import { UnifiedRoleManagement } from '@/components/admin/UnifiedRoleManagement';

interface User {
  _id: string;
  name: string;
  email: string;
  role: any; // Can be string or object with name property
  createdAt: string;
}

const UserManagement = () => {
  const { user: currentUser, hasMinimumLevel, roles, hasPermission } = useAuth();
  
  const hasMinimumRole = (role: UserRole) => {
    if (!hasMinimumLevel) return false;
    const levels: Record<UserRole, number> = {
      [UserRole.ROOT]: 100,
      [UserRole.SUPER_ADMIN]: 90,
      [UserRole.ADMIN]: 80,
      [UserRole.MANAGER]: 70,
      [UserRole.EMPLOYEE]: 60,
      [UserRole.NORMAL]: 50
    };
    return hasMinimumLevel(levels[role] || 0);
  };
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
      setFilteredUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!newUser.roleId) {
        toast({
          title: "Error",
          description: "Please select a role",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      const data = await response.json();
      if (data.success) {
        setOpenDialog(false);
        fetchUsers();
        setNewUser({
          name: '',
          email: '',
          password: '',
          roleId: ''
        });
        toast({
          title: "Success",
          description: "User created successfully",
          variant: "default"
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      toast({
        title: "Error",
        description: err.message || 'Failed to create user',
        variant: "destructive"
      });
    }
  };

  // Update user role
  const handleRoleChange = async (userId: string, newRoleName: UserRole) => {
    try {
      setError(null);
      // Find the role ID from the role name
      const roleObj = roles.find(r => r.name === newRoleName);
      if (!roleObj) {
        throw new Error('Role not found');
      }
      
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      await adminAPI.updateUserRole(userId, roleObj._id);
      
      fetchUsers();
      toast({
        title: "Success",
        description: "User role updated successfully",
        variant: "default"
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
      toast({
        title: "Error",
        description: err.message || 'Failed to update user role',
        variant: "destructive"
      });
    }
  };

  // Filter users based on search query and active tab
  useEffect(() => {
    let result = users;
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by role tab
    if (activeTab !== 'all') {
      result = result.filter(user => {
        const roleName = getRoleName(user.role);
        const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '');
        const normalizedTab = activeTab.toLowerCase().replace(/\s+/g, '');
        return normalizedRole === normalizedTab;
      });
    }
    
    setFilteredUsers(result);
  }, [searchQuery, activeTab, users]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Get role name from role object or string
  const getRoleName = (role: any): string => {
    return typeof role === 'string' ? role : role?.name || '';
  };
  
  // Get role color for badge
  const getRoleBadgeColor = (role: any) => {
    const roleName = getRoleName(role);
    switch(roleName) {
      case UserRole.ROOT:
      case 'Root':
        return "bg-red-100 text-red-800 border-red-200";
      case UserRole.SUPER_ADMIN:
      case 'Superadmin':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case UserRole.ADMIN:
      case 'Admin':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case UserRole.NORMAL:
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <RoleGuard minimumRole={UserRole.ADMIN}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage user accounts and permissions across the system
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="default" 
                  onClick={fetchUsers}
                  title="Refresh user list"
                  className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/50 transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {hasPermission('users.create') && (
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        size="default" 
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                      <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Create New User
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Add a new user to the system with appropriate role and permissions
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser}>
                        <div className="grid gap-6 py-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-foreground">
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={newUser.name}
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              placeholder="John Doe"
                              required
                              className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              placeholder="john.doe@example.com"
                              required
                              className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground">
                              Password
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              placeholder="•••••••••"
                              required
                              className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                            />
                            <p className="text-xs text-muted-foreground">
                              Password must be at least 6 characters long
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role" className="text-sm font-medium text-foreground">
                              User Role
                            </Label>
                            <Select
                              value={newUser.roleId}
                              onValueChange={(value) => setNewUser({...newUser, roleId: value})}
                            >
                              <SelectTrigger className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50">
                                {roles.map((role) => {
                                  const roleName = role.name;
                                  if (roleName === 'Root' && !hasMinimumRole(UserRole.ROOT)) return null;
                                  if (roleName === 'Superadmin' && !hasMinimumRole(UserRole.ROOT)) return null;
                                  if (roleName === 'Admin' && !hasMinimumRole(UserRole.SUPER_ADMIN)) return null;
                                  
                                  return (
                                    <SelectItem key={role._id} value={role._id} className="focus:bg-accent/50">
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2 text-primary" />
                                        {roleName}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter className="pt-6">
                          <Button 
                            type="submit" 
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            Create User
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-1 mb-8">
                  <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    User Management
                  </TabsTrigger>
                  {hasPermission('roles.view') && (
                    <TabsTrigger value="roles" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Role Management
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="users" className="space-y-6">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {error}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-8 space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                      <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Search users by name or email..."
                          className="pl-12 h-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300 rounded-xl"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
                      <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-xl p-1">
                        <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                          All Users
                        </TabsTrigger>
                        {hasMinimumRole(UserRole.ROOT) && (
                          <TabsTrigger value={UserRole.ROOT} className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                            Root
                          </TabsTrigger>
                        )}
                        {hasMinimumRole(UserRole.ROOT) && (
                          <TabsTrigger value={UserRole.SUPER_ADMIN} className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                            Super Admin
                          </TabsTrigger>
                        )}
                        {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                          <TabsTrigger value={UserRole.ADMIN} className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                            Admin
                          </TabsTrigger>
                        )}
                        <TabsTrigger value={UserRole.NORMAL} className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                          Normal
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                </div>
                
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline" className="bg-muted/50 text-foreground border-border/50 px-3 py-1 rounded-full">
                        Total: {users.length}
                      </Badge>
                      {activeTab !== 'all' && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full">
                          Filter: {activeTab}
                        </Badge>
                      )}
                      {searchQuery && (
                        <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent/50 px-3 py-1 rounded-full">
                          Search: {searchQuery}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-2xl border border-border/50 backdrop-blur-sm">
                      <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">No users found</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {searchQuery 
                          ? `No users match your search query "${searchQuery}"` 
                          : `No users with role "${activeTab}"`}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm shadow-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 border-b border-border/50 hover:bg-muted/40">
                            <TableHead className="font-semibold text-foreground py-4 px-6">User</TableHead>
                            <TableHead className="font-semibold text-foreground py-4 px-6">Role</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-foreground py-4 px-6">Created</TableHead>
                            {(hasPermission('users.edit') || hasPermission('users.delete') || hasPermission('users.assign_roles')) && (
                              <TableHead className="font-semibold text-foreground py-4 px-6">Actions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user._id} className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-200">
                              <TableCell className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-primary">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                {hasPermission('users.assign_roles') && user._id !== currentUser?._id ? (
                                  <Select
                                    value={getRoleName(user.role)}
                                    onValueChange={(value) => handleRoleChange(user._id, value as UserRole)}
                                    disabled={
                                      (getRoleName(user.role) === UserRole.ROOT && getRoleName(currentUser?.role) !== UserRole.ROOT) ||
                                      (getRoleName(user.role) === UserRole.SUPER_ADMIN && getRoleName(currentUser?.role) !== UserRole.ROOT)
                                    }
                                  >
                                    <SelectTrigger className="w-[160px] bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300">
                                      <SelectValue>
                                        <Badge className={`${getRoleBadgeColor(user.role)} border-0`}>
                                          {getRoleName(user.role)}
                                        </Badge>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50">
                                      {roles.map((role) => {
                                        const roleName = role.name;
                                        if (roleName === 'Root' && !hasMinimumRole(UserRole.ROOT)) return null;
                                        if (roleName === 'Superadmin' && !hasMinimumRole(UserRole.ROOT)) return null;
                                        if (roleName === 'Admin' && !hasMinimumRole(UserRole.SUPER_ADMIN)) return null;
                                        
                                        return (
                                          <SelectItem key={role._id} value={roleName} className="focus:bg-accent/50">
                                            <div className="flex items-center">
                                              <Shield className="h-4 w-4 mr-2 text-primary" />
                                              {roleName}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge className={`${getRoleBadgeColor(user.role)} border-0 px-3 py-1`}>
                                    {getRoleName(user.role)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell py-4 px-6 text-muted-foreground">
                                {formatDate(user.createdAt)}
                              </TableCell>
                              {(hasPermission('users.edit') || hasPermission('users.delete')) && (
                                <TableCell className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    {user._id === currentUser?._id ? (
                                      <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30 px-3 py-1">
                                        Current User
                                      </Badge>
                                    ) : (
                                      <>
                                        {hasPermission('users.edit') && (
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="bg-background/50 border-border/50 hover:bg-accent/50 transition-all duration-300 hover:scale-105"
                                            onClick={() => {
                                              toast({
                                                title: "User Details",
                                                description: `${user.name} (${user.email}) - Role: ${getRoleName(user.role)}`
                                              });
                                            }}
                                            title="View user details"
                                          >
                                            <FileText className="h-4 w-4" />
                                            <span className="sr-only">View</span>
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
              
                  {/* Role Permissions Info */}
                  <div className="mt-8 p-6 bg-muted/20 rounded-2xl border border-border/50 backdrop-blur-sm">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Role Permissions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-red-100 text-red-800 border-red-200 mt-0.5">Root</Badge>
                          <p className="text-muted-foreground">Full system access, can create and manage all user types</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 mt-0.5">Super Admin</Badge>
                          <p className="text-muted-foreground">Extended administrative access, can manage Admins and Normal users</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 mt-0.5">Admin</Badge>
                          <p className="text-muted-foreground">Administrative access to manage system content and Normal users</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-green-100 text-green-800 border-green-200 mt-0.5">Normal</Badge>
                          <p className="text-muted-foreground">Standard access to perform day-to-day operations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {hasPermission('roles.view') && (
                  <TabsContent value="roles">
                    <UnifiedRoleManagement isLoading={loading} />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
};

export default UserManagement;
