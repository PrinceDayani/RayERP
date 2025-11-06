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
  X
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const UserManagement = () => {
  const { user: currentUser, hasMinimumRole } = useAuth();
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
    role: UserRole.NORMAL
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users`, {
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
      if (data.success) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch users',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
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
          role: UserRole.NORMAL
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
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setError(null);
      const { default: adminAPI } = await import('@/lib/api/adminAPI');
      await adminAPI.updateUserRole(userId, newRole);
      
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
      result = result.filter(user => user.role === activeTab);
    }
    
    setFilteredUsers(result);
  }, [searchQuery, activeTab, users]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Get role color for badge
  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case UserRole.ROOT:
        return "bg-red-100 text-red-800 border-red-200";
      case UserRole.SUPER_ADMIN:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case UserRole.ADMIN:
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
      <div className="p-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers}
                  title="Refresh user list"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system with appropriate role
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              value={newUser.name}
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              placeholder="john.doe@example.com"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              placeholder="•••••••••"
                              required
                            />
                            <p className="text-xs text-gray-500">
                              Password must be at least 6 characters long
                            </p>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                {hasMinimumRole(UserRole.ROOT) && (
                                  <SelectItem value={UserRole.ROOT}>
                                    <div className="flex items-center">
                                      <Shield className="h-4 w-4 mr-2 text-red-500" />
                                      Root (System Owner)
                                    </div>
                                  </SelectItem>
                                )}
                                {hasMinimumRole(UserRole.ROOT) && (
                                  <SelectItem value={UserRole.SUPER_ADMIN}>
                                    <div className="flex items-center">
                                      <Shield className="h-4 w-4 mr-2 text-purple-500" />
                                      Super Admin (Director/CEO)
                                    </div>
                                  </SelectItem>
                                )}
                                {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                                  <SelectItem value={UserRole.ADMIN}>
                                    <div className="flex items-center">
                                      <UserCog className="h-4 w-4 mr-2 text-blue-500" />
                                      Admin (Manager)
                                    </div>
                                  </SelectItem>
                                )}
                                <SelectItem value={UserRole.NORMAL}>
                                  <div className="flex items-center">
                                    <UserCog className="h-4 w-4 mr-2 text-green-500" />
                                    Normal (Employee)
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create User</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4 space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList>
                      <TabsTrigger value="all">All Users</TabsTrigger>
                      {hasMinimumRole(UserRole.ROOT) && (
                        <TabsTrigger value={UserRole.ROOT}>Root</TabsTrigger>
                      )}
                      {hasMinimumRole(UserRole.ROOT) && (
                        <TabsTrigger value={UserRole.SUPER_ADMIN}>Super Admin</TabsTrigger>
                      )}
                      {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                        <TabsTrigger value={UserRole.ADMIN}>Admin</TabsTrigger>
                      )}
                      <TabsTrigger value={UserRole.NORMAL}>Normal</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-gray-100">
                    Total: {users.length}
                  </Badge>
                  {activeTab !== 'all' && (
                    <Badge variant="outline" className={getRoleBadgeColor(activeTab as UserRole)}>
                      Filter: {activeTab}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      Search: {searchQuery}
                    </Badge>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                  <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? `No users match your search query "${searchQuery}"` 
                      : `No users with role "${activeTab}"`}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                          <TableHead>Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasMinimumRole(UserRole.SUPER_ADMIN) && user._id !== currentUser?._id ? (
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user._id, value as UserRole)}
                                disabled={
                                  // Disable if current user can't modify this role
                                  (user.role === UserRole.ROOT && currentUser?.role !== UserRole.ROOT) ||
                                  (user.role === UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.ROOT)
                                }
                              >
                                <SelectTrigger className={`w-[140px] ${getRoleBadgeColor(user.role)}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hasMinimumRole(UserRole.ROOT) && (
                                    <SelectItem value={UserRole.ROOT}>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2 text-red-500" />
                                        Root
                                      </div>
                                    </SelectItem>
                                  )}
                                  {hasMinimumRole(UserRole.ROOT) && (
                                    <SelectItem value={UserRole.SUPER_ADMIN}>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2 text-purple-500" />
                                        Super Admin
                                      </div>
                                    </SelectItem>
                                  )}
                                  {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                                    <SelectItem value={UserRole.ADMIN}>
                                      <div className="flex items-center">
                                        <UserCog className="h-4 w-4 mr-2 text-blue-500" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                  )}
                                  <SelectItem value={UserRole.NORMAL}>
                                    <div className="flex items-center">
                                      <UserCog className="h-4 w-4 mr-2 text-green-500" />
                                      Normal
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          {hasMinimumRole(UserRole.SUPER_ADMIN) && (
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {/* Additional actions can be added here */}
                                {user._id === currentUser?._id ? (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                    Current User
                                  </Badge>
                                ) : (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="hidden md:flex"
                                      onClick={() => {
                                        // Additional action here, e.g. view user details
                                      }}
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
              
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  <strong>Role permissions:</strong>
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Root:</strong> Full system access, can create and manage all user types</li>
                  <li><strong>Super Admin:</strong> Extended administrative access, can manage Admins and Normal users</li>
                  <li><strong>Admin:</strong> Administrative access to manage system content and Normal users</li>
                  <li><strong>Normal:</strong> Standard access to perform day-to-day operations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
      </div>
    </RoleGuard>
  );
};

export default UserManagement;