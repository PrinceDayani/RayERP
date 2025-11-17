"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, UsersIcon, KeyRoundIcon } from "lucide-react";
import adminAPI, { AdminUser } from "@/lib/api/adminAPI";
import { compareRoles, getRoleDisplayName } from "@/lib/roleUtils";

interface UserManagementProps {
  isLoading: boolean;
}

export function UserManagement({ isLoading }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState({ newPassword: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await adminAPI.getRoles();
        console.log('Fetched roles:', data);
        if (data && data.length > 0) {
          setRoles(data);
        } else {
          console.warn('No roles returned from API');
          toast.error('Failed to load roles. Please refresh the page.');
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        toast.error('Failed to load roles. Please check your connection.');
      }
    };

    if (!isLoading) {
      fetchRoles();
    }
  }, [isLoading]);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Using adminAPI instead of direct fetch
        const data = await adminAPI.getUsers();
        console.log('Fetched users:', data);
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error('Failed to load users. Please check your connection.');
      }
    };

    if (!isLoading) {
      fetchUsers();
    }
  }, [isLoading]);

  const filteredUsers = users.filter(
    (user) => {
      const roleStr = typeof user.role === 'object' ? (user.role as any).name : user.role;
      return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleStr.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  const handleEditUser = (user: AdminUser) => {
    console.log('Editing user:', user);
    // Create a copy to avoid mutating the original
    setCurrentUser({ ...user });
    setIsEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    if (!newUser.role) {
      toast.error("Please select a role");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      // Using adminAPI instead of direct fetch
      const response = await adminAPI.createUser(newUser);
      
      // Add user to the list
      setUsers([...users, response]);
      
      // Log activity
      try {
        const { logActivity } = await import('@/lib/activityLogger');
        await logActivity({
          action: 'create',
          resource: 'user',
          details: `Created user ${newUser.name} (${newUser.email})`,
          status: 'success'
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
      
      // Reset form and close dialog
      setNewUser({
        name: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
      setIsAddUserOpen(false);
      toast.success(`User ${newUser.name} created successfully`);
    } catch (error: any) {
      console.error("Failed to add user:", error);
      toast.error(error.message || "Failed to create user");
      // Simulate successful addition in case of API failure
      const newId = Date.now().toString();
      setUsers([
        ...users,
        {
          id: newId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: "active",
          lastLogin: "Never",
        },
      ]);
      
      // Reset form and close dialog
      setNewUser({
        name: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
      setIsAddUserOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      // Extract roleId properly - handle both object and string cases
      const roleId = typeof currentUser.role === 'object' ? (currentUser.role as any)._id : currentUser.role;
      console.log('Updating user role:', { userId: currentUser.id, roleId, originalRole: currentUser.role });
      
      // Update user role using the role endpoint
      await adminAPI.updateUserRole(currentUser.id, roleId);
      
      // Update user in the list
      setUsers(
        users.map((user) => (user.id === currentUser.id ? currentUser : user))
      );
      
      // Log activity
      try {
        const { logActivity } = await import('@/lib/activityLogger');
        await logActivity({
          action: 'update',
          resource: 'user',
          details: `Updated user ${currentUser.name} (${currentUser.email})`,
          status: 'success'
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
      
      setIsEditUserOpen(false);
      toast.success(`User ${currentUser.name} updated successfully`);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error.message || "Failed to update user");
      // Simulate successful update in case of API failure
      setUsers(
        users.map((user) => (user.id === currentUser.id ? currentUser : user))
      );
      setIsEditUserOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!currentUser) return;

    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (resetPassword.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAPI.resetPassword(currentUser.id, resetPassword.newPassword);
      
      // Log activity
      try {
        const { logActivity } = await import('@/lib/activityLogger');
        await logActivity({
          action: 'reset_password',
          resource: 'user',
          details: `Reset password for user ${currentUser.name} (${currentUser.email})`,
          status: 'success'
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
      
      toast.success(`Password reset successfully for ${currentUser.name}`);
      setResetPassword({ newPassword: "", confirmPassword: "" });
      setIsResetPasswordOpen(false);
    } catch (error: any) {
      console.error("Failed to reset password:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpdateRoles = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (!bulkRole) {
      toast.error("Please select a role");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminAPI.bulkUpdateUserRoles(selectedUsers, bulkRole);
      
      // Refresh users list
      const data = await adminAPI.getUsers();
      setUsers(data);
      
      toast.success(`Successfully updated ${result.updated} user(s)`);
      setSelectedUsers([]);
      setBulkRole("");
      setIsBulkEditOpen(false);
    } catch (error: any) {
      console.error("Failed to bulk update roles:", error);
      toast.error(error.message || "Failed to bulk update roles");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsSubmitting(true);
    try {
      // Using adminAPI instead of direct fetch
      await adminAPI.deleteUser(userId);
      
      // Get user info before deletion
      const userToDelete = users.find(user => user.id === userId);
      
      // Remove user from the list
      setUsers(users.filter((user) => user.id !== userId));
      
      // Log activity
      if (userToDelete) {
        try {
          const { logActivity } = await import('@/lib/activityLogger');
          await logActivity({
            action: 'delete',
            resource: 'user',
            details: `Deleted user ${userToDelete.name} (${userToDelete.email})`,
            status: 'success'
          });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      }
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error(error.message || "Failed to delete user");
      // Simulate successful deletion in case of API failure
      setUsers(users.filter((user) => user.id !== userId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === "Never") return "Never";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-md">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md">
            <div className="w-2 h-2 bg-white/70 rounded-full mr-2" />
            Inactive
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            Pending
          </Badge>
        );
      default:
        return <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold mt-1">{users.length}</h3>
            </div>
            <UsersIcon className="h-12 w-12 text-blue-200 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Active</p>
              <h3 className="text-3xl font-bold mt-1">{users.filter(u => u.status === 'active').length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-400/30 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <h3 className="text-3xl font-bold mt-1">{users.filter(u => u.status === 'pending').length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-400/30 flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-100 text-sm font-medium">Inactive</p>
              <h3 className="text-3xl font-bold mt-1">{users.filter(u => u.status === 'inactive').length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-400/30 flex items-center justify-center text-2xl">💤</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search users by name, email, or role..."
            className="pl-12 h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl shadow-sm transition-all duration-200 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <Button 
              onClick={() => setIsBulkEditOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 h-14 px-8 rounded-xl font-semibold"
            >
              <EditIcon className="mr-2 h-5 w-5" />
              Edit {selectedUsers.length} Selected
            </Button>
          )}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 h-14 px-8 rounded-xl font-semibold">
              <PlusIcon className="mr-2 h-5 w-5" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. They'll receive an email to set up their password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="col-span-3"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Loading roles...</div>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="col-span-3"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="col-span-3"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead className="font-bold text-slate-800 dark:text-slate-200 py-5 text-sm uppercase tracking-wider">Name</TableHead>
              <TableHead className="font-bold text-slate-800 dark:text-slate-200 py-5 text-sm uppercase tracking-wider">Email</TableHead>
              <TableHead className="font-bold text-slate-800 dark:text-slate-200 py-5 text-sm uppercase tracking-wider">Role</TableHead>
              <TableHead className="font-bold text-slate-800 dark:text-slate-200 py-5 text-sm uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-slate-800 dark:text-slate-200 py-5 text-sm uppercase tracking-wider">Last Login</TableHead>
              <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200 py-5 text-sm uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">No users found</div>
                    <div className="text-sm text-slate-400 dark:text-slate-500">Try adjusting your search criteria</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, index) => (
                <TableRow 
                  key={user.id || `user-${index}`} 
                  className="group hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all duration-200 border-b border-slate-100 dark:border-slate-700 cursor-pointer"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  <TableCell className="py-5">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">ID: {user.id?.slice(0, 8) || 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">{user.email}</div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge className={`capitalize px-3 py-1.5 text-xs font-bold ${
                      compareRoles(user.role, 'admin') ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white' :
                      compareRoles(user.role, 'manager') ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                      'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                    } border-0 shadow-md rounded-lg`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="py-5 text-slate-600 dark:text-slate-400 font-mono text-sm">{formatDate(user.lastLogin)}</TableCell>
                  <TableCell className="text-right py-5">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        className="h-9 w-9 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-lg hover:scale-110"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setCurrentUser(user); setIsResetPasswordOpen(true); }}
                        className="h-9 w-9 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 rounded-lg hover:scale-110"
                      >
                        <KeyRoundIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-9 w-9 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded-lg hover:scale-110"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-semibold">Delete User</AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>? This action cannot be undone and will permanently remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg"
                            >
                              Delete User
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {currentUser?.name}. The user will be able to login with this new password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                className="col-span-3"
                value={resetPassword.newPassword}
                onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-new-password" className="text-right">
                Confirm
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                className="col-span-3"
                value={resetPassword.confirmPassword}
                onChange={(e) => setResetPassword({ ...resetPassword, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsResetPasswordOpen(false); setResetPassword({ newPassword: "", confirmPassword: "" }); }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit User Roles</DialogTitle>
            <DialogDescription>
              Update roles for {selectedUsers.length} selected user(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulk-role" className="text-right">
                New Role
              </Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">Loading roles...</div>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateRoles} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  className="col-span-3"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  className="col-span-3"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select
                  value={typeof currentUser.role === 'object' ? (currentUser.role as any)._id : currentUser.role}
                  onValueChange={(value) => setCurrentUser({ ...currentUser, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Loading roles...</div>
                    ) : (
                      roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {role.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={currentUser.status}
                  onValueChange={(value) => setCurrentUser({ ...currentUser, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}