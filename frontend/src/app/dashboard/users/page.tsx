"use client";

import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import { SectionLoader } from '@/components/PageLoader';
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
  Settings,
  KeyRound,
  Mail,
  Calendar,
  Clock,
  User,
  Hash,
  Briefcase,
  Building,
  Phone,
  MapPin
} from "lucide-react";
import { UnifiedRoleManagement } from '@/components/admin/UnifiedRoleManagement';

interface User {
  _id: string;
  name: string;
  email: string;
  role: any;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  lastLogin?: string;
}

interface EmployeeDetails {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  departments?: string[];
  position?: string;
  hireDate?: string;
  status: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [changePassword, setChangePassword] = useState({ newPassword: '', confirmPassword: '' });
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | 'disabled' | 'pending_approval'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

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

  // Fetch employee details
  const fetchEmployeeDetails = async (userId: string) => {
    try {
      setLoadingEmployee(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        const employees = await response.json();
        const employee = employees.find((emp: any) => emp.user?._id === userId || emp.user === userId);
        setEmployeeDetails(employee || null);
      }
    } catch (err) {
      console.error('Failed to fetch employee details:', err);
    } finally {
      setLoadingEmployee(false);
    }
  };

  // Fetch pending status requests
  const fetchPendingRequests = async () => {
    if (!hasPermission('users.approve_status')) return;
    try {
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      const requests = await adminAPI.getPendingStatusRequests();
      setPendingRequests(requests);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  };

  // Update user status
  const handleStatusChange = async () => {
    if (!selectedUser) return;

    try {
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      const response = await adminAPI.updateUserStatus(selectedUser._id, selectedStatus, statusReason);
      
      if (response.requiresApproval) {
        toast({
          title: "Approval Required",
          description: "Status change request submitted for approval",
          variant: "default"
        });
        fetchPendingRequests();
      } else {
        toast({
          title: "Success",
          description: `User status updated to ${selectedStatus.replace('_', ' ')}`,
          variant: "default"
        });
        fetchUsers();
      }
      
      setIsStatusDialogOpen(false);
      setSelectedUser(null);
      setStatusReason('');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update user status',
        variant: "destructive"
      });
    }
  };

  // Approve status request
  const handleApproveRequest = async (requestId: string) => {
    try {
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      await adminAPI.approveStatusRequest(requestId);
      toast({
        title: "Success",
        description: "Status change request approved",
        variant: "default"
      });
      fetchPendingRequests();
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to approve request',
        variant: "destructive"
      });
    }
  };

  // Reject status request
  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      await adminAPI.rejectStatusRequest(requestId, reason);
      toast({
        title: "Success",
        description: "Status change request rejected",
        variant: "default"
      });
      fetchPendingRequests();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to reject request',
        variant: "destructive"
      });
    }
  };

  // Change user password
  const handleChangePassword = async () => {
    if (!selectedUser) return;

    if (changePassword.newPassword !== changePassword.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (changePassword.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      await adminAPI.changeUserPassword(selectedUser._id, changePassword.newPassword);
      
      toast({
        title: "Success",
        description: `Password changed successfully for ${selectedUser.name}`,
        variant: "default"
      });
      setIsChangePasswordOpen(false);
      setChangePassword({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to change password',
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
    fetchPendingRequests();
  }, []);

  // Get role name from role object or string
  const getRoleName = (role: any): string => {
    return typeof role === 'string' ? role : role?.name || '';
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch(status) {
      case 'active':
        return "bg-green-100 text-green-800 border-green-200";
      case 'inactive':
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 'disabled':
        return "bg-red-100 text-red-800 border-red-200";
      case 'pending_approval':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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
                    <SectionLoader text="Loading users..." />
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
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-foreground">{user.name}</p>
                                      {user.status && user.status !== 'active' && (
                                        <Badge className={`${getStatusBadgeColor(user.status)} text-[10px] px-1.5 py-0`}>
                                          {user.status.replace('_', ' ')}
                                        </Badge>
                                      )}
                                    </div>
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
                                        {hasPermission('users.activate_deactivate') && (
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="bg-background/50 border-border/50 hover:bg-blue-100 hover:text-blue-600 transition-all duration-300 hover:scale-105"
                                            onClick={() => {
                                              setSelectedUser(user);
                                              setSelectedStatus(user.status as any || 'active');
                                              setIsStatusDialogOpen(true);
                                            }}
                                            title="Change status"
                                          >
                                            <Settings className="h-4 w-4" />
                                            <span className="sr-only">Status</span>
                                          </Button>
                                        )}
                                        {hasPermission('users.change_password') && (
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="bg-background/50 border-border/50 hover:bg-amber-100 hover:text-amber-600 transition-all duration-300 hover:scale-105"
                                            onClick={() => {
                                              setSelectedUser(user);
                                              setIsChangePasswordOpen(true);
                                            }}
                                            title="Change password"
                                          >
                                            <KeyRound className="h-4 w-4" />
                                            <span className="sr-only">Change Password</span>
                                          </Button>
                                        )}
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="bg-background/50 border-border/50 hover:bg-accent/50 transition-all duration-300 hover:scale-105"
                                          onClick={() => {
                                            setSelectedUser(user);
                                            fetchEmployeeDetails(user._id);
                                            setIsViewDetailsOpen(true);
                                          }}
                                          title="View user details"
                                        >
                                          <FileText className="h-4 w-4" />
                                          <span className="sr-only">View</span>
                                        </Button>
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
              
                  {/* View User Details Dialog */}
                  <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
                    <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-card backdrop-blur-xl border shadow-2xl p-0">
                      <DialogHeader className="sticky top-0 z-10 bg-card border-b px-6 py-4">
                        <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
                        <DialogDescription>Complete account information</DialogDescription>
                      </DialogHeader>
                      {selectedUser && (
                        <div className="px-6 py-4">
                          {/* Header */}
                          <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-lg mb-5">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-2xl font-bold text-white">{selectedUser.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3"/>{selectedUser.email}</p>
                            </div>
                            <Badge className={getRoleBadgeColor(selectedUser.role)}>{getRoleName(selectedUser.role)}</Badge>
                          </div>

                          {/* Content Grid */}
                          <div className="grid grid-cols-3 gap-5 mb-5">
                            {/* Column 1: Account */}
                            <div>
                              <h4 className="text-xs font-semibold mb-2.5 flex items-center gap-1"><User className="h-3 w-3"/>Account</h4>
                              <div className="space-y-2.5">
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">User ID</div>
                                  <div className="font-mono truncate">{selectedUser._id}</div>
                                </div>
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">Email</div>
                                  <div className="truncate">{selectedUser.email}</div>
                                </div>
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">Name</div>
                                  <div>{selectedUser.name}</div>
                                </div>
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">Status</div>
                                  <Badge className={`${getStatusBadgeColor(selectedUser.status)} mt-1`}>
                                    {selectedUser.status?.replace('_', ' ') || 'active'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {/* Column 2: Role */}
                            <div>
                              <h4 className="text-xs font-semibold mb-2.5 flex items-center gap-1"><Shield className="h-3 w-3"/>Role</h4>
                              <div className="p-3.5 bg-primary/5 rounded border border-primary/20">
                                <Badge className={getRoleBadgeColor(selectedUser.role)}>{getRoleName(selectedUser.role)}</Badge>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {getRoleName(selectedUser.role) === 'Root' && 'Full system access'}
                                  {getRoleName(selectedUser.role) === 'Superadmin' && 'Extended admin access'}
                                  {getRoleName(selectedUser.role) === 'Admin' && 'Admin access'}
                                  {(getRoleName(selectedUser.role) === 'Normal' || getRoleName(selectedUser.role) === 'Employee') && 'Standard access'}
                                </p>
                              </div>
                            </div>

                            {/* Column 3: Timeline */}
                            <div>
                              <h4 className="text-xs font-semibold mb-2.5 flex items-center gap-1"><Clock className="h-3 w-3"/>Timeline</h4>
                              <div className="space-y-2.5">
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">Created</div>
                                  <div>{formatDate(selectedUser.createdAt)}</div>
                                  <div className="text-muted-foreground text-[10px]">{new Date(selectedUser.createdAt).toLocaleTimeString()}</div>
                                </div>
                                {selectedUser.updatedAt && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="text-muted-foreground">Updated</div>
                                    <div>{formatDate(selectedUser.updatedAt)}</div>
                                    <div className="text-muted-foreground text-[10px]">{new Date(selectedUser.updatedAt).toLocaleTimeString()}</div>
                                  </div>
                                )}
                                {selectedUser.lastLogin && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="text-muted-foreground">Last Login</div>
                                    <div>{selectedUser.lastLogin === 'Never' ? 'Never' : formatDate(selectedUser.lastLogin)}</div>
                                    {selectedUser.lastLogin !== 'Never' && (
                                      <div className="text-muted-foreground text-[10px]">{new Date(selectedUser.lastLogin).toLocaleTimeString()}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Employee Info */}
                          {loadingEmployee ? (
                            <SectionLoader />
                          ) : employeeDetails ? (
                            <div className="mt-5">
                              <h4 className="text-xs font-semibold mb-2.5 flex items-center gap-1"><Briefcase className="h-3 w-3"/>Employee</h4>
                              <div className="grid grid-cols-3 gap-2.5">
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">Employee ID</div>
                                  <div className="font-mono">{employeeDetails.employeeId}</div>
                                </div>
                                {employeeDetails.position && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="text-muted-foreground">Position</div>
                                    <div>{employeeDetails.position}</div>
                                  </div>
                                )}
                                {(employeeDetails.department || employeeDetails.departments) && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="text-muted-foreground">Department</div>
                                    <div>{employeeDetails.departments?.join(', ') || employeeDetails.department}</div>
                                  </div>
                                )}
                                {employeeDetails.phone && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="text-muted-foreground">Phone</div>
                                    <div>{employeeDetails.phone}</div>
                                  </div>
                                )}
                                {employeeDetails.hireDate && (
                                  <div className="p-2 bg-muted/50 rounded text-xs">
                                    <div className="text-muted-foreground">Hire Date</div>
                                    <div>{formatDate(employeeDetails.hireDate)}</div>
                                  </div>
                                )}
                                {employeeDetails.address && (
                                  <div className="p-2 bg-muted/50 rounded text-xs col-span-2">
                                    <div className="text-muted-foreground">Address</div>
                                    <div className="text-xs">
                                      {typeof employeeDetails.address === 'string' 
                                        ? employeeDetails.address 
                                        : `${employeeDetails.address.street || ''}, ${employeeDetails.address.city || ''}, ${employeeDetails.address.state || ''} ${employeeDetails.address.zipCode || ''}, ${employeeDetails.address.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')}
                                    </div>
                                  </div>
                                )}
                                <div className="p-2 bg-muted/50 rounded text-xs">
                                  <div className="text-muted-foreground">Status</div>
                                  <Badge variant={employeeDetails.status === 'active' ? 'default' : 'secondary'} className="mt-1">{employeeDetails.status}</Badge>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                      <DialogFooter className="sticky bottom-0 bg-card border-t px-6 py-4 gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsViewDetailsOpen(false);
                            setSelectedUser(null);
                            setEmployeeDetails(null);
                          }}
                        >
                          Close
                        </Button>
                        {selectedUser && selectedUser._id !== currentUser?._id && (
                          <>
                            {hasPermission('users.activate_deactivate') && (
                              <Button 
                                onClick={() => {
                                  setSelectedStatus(selectedUser.status as any || 'active');
                                  setIsViewDetailsOpen(false);
                                  setIsStatusDialogOpen(true);
                                }}
                                variant="outline"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Change Status
                              </Button>
                            )}
                            {hasPermission('users.change_password') && (
                              <Button 
                                onClick={() => {
                                  setIsViewDetailsOpen(false);
                                  setIsChangePasswordOpen(true);
                                }}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Change Password
                              </Button>
                            )}
                          </>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Change Status Dialog */}
                  <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                      <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Change User Status
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Update the status for {selectedUser?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm font-medium text-foreground">
                            Status
                          </Label>
                          <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                            <SelectTrigger className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card/95 backdrop-blur-xl border border-border/50">
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Active
                                </div>
                              </SelectItem>
                              <SelectItem value="inactive">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                  Inactive
                                </div>
                              </SelectItem>
                              <SelectItem value="disabled">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  Disabled
                                </div>
                              </SelectItem>
                              <SelectItem value="pending_approval">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  Needs Approval
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">
                            {selectedStatus === 'active' && 'User can access the system normally'}
                            {selectedStatus === 'inactive' && 'User account is temporarily inactive'}
                            {selectedStatus === 'disabled' && 'User is blocked from accessing the system'}
                            {selectedStatus === 'pending_approval' && 'User requires approval before accessing'}
                          </p>
                        </div>
                        {((selectedUser?.status === 'active' && selectedStatus === 'disabled') || 
                          (selectedUser?.status === 'disabled' && selectedStatus === 'active')) && (
                          <div className="space-y-2">
                            <Label htmlFor="reason" className="text-sm font-medium text-foreground">
                              Reason (Required for Approval)
                            </Label>
                            <Input
                              id="reason"
                              value={statusReason}
                              onChange={(e) => setStatusReason(e.target.value)}
                              placeholder="Provide reason for status change"
                              className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                            />
                            <p className="text-xs text-yellow-600">
                              ⚠️ This change requires approval from a higher authority
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="pt-6">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsStatusDialogOpen(false);
                            setSelectedUser(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleStatusChange}
                          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          Update Status
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Change Password Dialog */}
                  <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                      <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Change User Password
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Set a new password for {selectedUser?.name}. The user will be able to login with this new password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                            New Password
                          </Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={changePassword.newPassword}
                            onChange={(e) => setChangePassword({ ...changePassword, newPassword: e.target.value })}
                            placeholder="•••••••••"
                            className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={changePassword.confirmPassword}
                            onChange={(e) => setChangePassword({ ...changePassword, confirmPassword: e.target.value })}
                            placeholder="•••••••••"
                            className="bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-6">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsChangePasswordOpen(false);
                            setChangePassword({ newPassword: '', confirmPassword: '' });
                            setSelectedUser(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleChangePassword}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          Change Password
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Pending Approval Requests */}
                  {hasPermission('users.approve_status') && pendingRequests.length > 0 && (
                    <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Pending Status Change Requests ({pendingRequests.length})
                      </h4>
                      <div className="space-y-3">
                        {pendingRequests.map((request) => (
                          <div key={request._id} className="p-4 bg-card rounded-lg border border-border/50 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{request.user?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.currentStatus} → {request.requestedStatus}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Requested by: {request.requestedBy?.name} • {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                              {request.reason && (
                                <p className="text-xs text-muted-foreground mt-1">Reason: {request.reason}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveRequest(request._id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleRejectRequest(request._id, reason);
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
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
