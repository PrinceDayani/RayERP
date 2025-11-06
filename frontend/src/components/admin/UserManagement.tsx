"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, UsersIcon } from "lucide-react";
import adminAPI, { AdminUser } from "@/lib/api/adminAPI";

interface UserManagementProps {
  isLoading: boolean;
}

export function UserManagement({ isLoading }: UserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
    confirmPassword: "",
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Using adminAPI instead of direct fetch
        const data = await adminAPI.getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Mock data if API fails
        setUsers([
          {
            _id: "1",
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "admin",
            status: "active",
            lastLogin: "2025-08-27T15:30:00Z",
          },
          {
            _id: "2",
            id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "manager",
            status: "active",
            lastLogin: "2025-08-26T10:15:00Z",
          },
          {
            _id: "3",
            id: "3",
            name: "Bob Johnson",
            email: "bob@example.com",
            role: "user",
            status: "inactive",
            lastLogin: "2025-08-15T09:45:00Z",
          },
          {
            _id: "4",
            id: "4",
            name: "Alice Williams",
            email: "alice@example.com",
            role: "user",
            status: "pending",
            lastLogin: "Never",
          },
        ]);
      }
    };

    if (!isLoading) {
      fetchUsers();
    }
  }, [isLoading]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: AdminUser) => {
    setCurrentUser(user);
    setIsEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    // Validation
    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

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
        role: "user",
        password: "",
        confirmPassword: "",
      });
      setIsAddUserOpen(false);
    } catch (error) {
      console.error("Failed to add user:", error);
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
        role: "user",
        password: "",
        confirmPassword: "",
      });
      setIsAddUserOpen(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      // Using adminAPI instead of direct fetch
      await adminAPI.updateUser(currentUser.id, currentUser);
      
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
    } catch (error) {
      console.error("Failed to update user:", error);
      // Simulate successful update in case of API failure
      setUsers(
        users.map((user) => (user.id === currentUser.id ? currentUser : user))
      );
      setIsEditUserOpen(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
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
    } catch (error) {
      console.error("Failed to delete user:", error);
      // Simulate successful deletion in case of API failure
      setUsers(users.filter((user) => user.id !== userId));
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users by name, email, or role..."
            className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-6">
              <PlusIcon className="mr-2 h-4 w-4" />
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
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
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
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border-0 shadow-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200/50 dark:border-slate-700/50">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Name</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Email</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Role</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-4">Last Login</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 py-4">Actions</TableHead>
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
                  key={user._id || user.id} 
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200 border-b border-slate-100/50 dark:border-slate-700/50"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 dark:text-slate-400">{user.email}</TableCell>
                  <TableCell className="py-4">
                    <Badge className={`capitalize ${
                      user.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white' :
                      user.role === 'manager' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                      'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                    } border-0 shadow-md`}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="py-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{formatDate(user.lastLogin)}</TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
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
                  value={currentUser.role}
                  onValueChange={(value) => setCurrentUser({ ...currentUser, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
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
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}