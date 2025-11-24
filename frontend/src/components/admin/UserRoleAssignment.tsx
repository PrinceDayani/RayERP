"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, UserIcon, ShieldIcon } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles?: Role[];
  status: string;
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
}

interface UserRoleAssignmentProps {
  isLoading: boolean;
}

export function UserRoleAssignment({ isLoading }: UserRoleAssignmentProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use a ref to store the user data for the confirmation step
  const userForConfirmation = useRef<User | null>(null);
  const rolesForConfirmation = useRef<string[]>([]);

  // Fetch users and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          adminAPI.getUsers(),
          adminAPI.getRoles()
        ]);
        
        console.log('Fetched users:', usersData);
        console.log('Fetched roles:', rolesData);
        
        setUsers(usersData as unknown as User[]);
        setRoles(rolesData);
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch users and roles",
          variant: "destructive"
        });
      }
    };

    if (!isLoading) {
      fetchData();
    }
  }, [isLoading]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRoles = (user: User) => {
    setCurrentUser(user);
    // Extract role IDs from the user's current roles
    const currentRoleIds = user.roles?.map(role => role._id) || [];
    setSelectedRoles(currentRoleIds);
    setIsAssignRoleOpen(true);
  };

  const handleSaveRoleAssignment = () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive"
      });
      return;
    }
    
    // Store the user and roles in refs for the confirmation step
    userForConfirmation.current = currentUser;
    rolesForConfirmation.current = selectedRoles;
    
    // Logging selected roles
    const selectedRoleNames = roles
      .filter(role => selectedRoles.includes(role._id))
      .map(role => role.name);
    
    console.log('=== Role Assignment Details ===');
    console.log('User:', currentUser.name, '(' + currentUser.email + ')');
    console.log('Selected Role IDs:', selectedRoles);
    console.log('Selected Role Names:', selectedRoleNames);
    console.log('Previous Roles:', currentUser.roles?.map(r => r.name) || []);
    
    // Show confirmation dialog
    setIsConfirmOpen(true);
  };

  const confirmSaveRoles = async () => {
    // Get the user and roles from the refs
    const user = userForConfirmation.current;
    const rolesToAssign = rolesForConfirmation.current;
    
    if (!user || !user._id) {
      console.error('No current user found or user ID is missing');
      toast({
        title: "Error",
        description: "User information is missing. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Starting role assignment for:', user.name);
    console.log('Selected roles:', rolesToAssign);
    
    setIsSaving(true);
    try {
      const updatedUser = await adminAPI.assignRolesToUser(user._id, rolesToAssign);
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === user._id ? (updatedUser as unknown as User) : u
        )
      );
      
      const userName = user.name;
      
      // Close dialogs and reset state
      setIsConfirmOpen(false);
      setIsAssignRoleOpen(false);
      setCurrentUser(null);
      setSelectedRoles([]);
      
      // Clear the refs
      userForConfirmation.current = null;
      rolesForConfirmation.current = [];
      
      // Success logging
      console.log('✅ Roles successfully assigned to:', userName);
      
      toast({
        title: "Success",
        description: `Roles updated for ${userName}`
      });
    } catch (error: any) {
      console.error('❌ Failed to assign roles:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign roles",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    const roleName = roles.find(r => r._id === roleId)?.name || 'Unknown';
    
    if (checked) {
      setSelectedRoles([...selectedRoles, roleId]);
      console.log('✅ Added role:', roleName);
    } else {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
      console.log('❌ Removed role:', roleName);
    }
  };

  // Reset all state when dialogs are closed
  const resetState = () => {
    setIsAssignRoleOpen(false);
    setIsConfirmOpen(false);
    setCurrentUser(null);
    setSelectedRoles([]);
    userForConfirmation.current = null;
    rolesForConfirmation.current = [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Legacy Role</TableHead>
              <TableHead>RBAC Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, userIndex) => (
                <TableRow key={`user-row-${user._id}-${userIndex}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, index) => (
                          <Badge key={`user-${user._id}-role-${role._id}-${index}`} variant="secondary" className="text-xs">
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No RBAC roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className={user.status === 'active' ? 'bg-green-500' : ''}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignRoles(user)}
                    >
                      <ShieldIcon className="mr-2 h-4 w-4" />
                      Assign Roles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Roles Dialog */}
      <Dialog open={isAssignRoleOpen} onOpenChange={(open) => {
        if (!open) {
          resetState();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Roles</DialogTitle>
            <DialogDescription>
              Select roles for {currentUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Label>Available Roles</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {roles.map((role, roleIndex) => (
                  <div key={`role-${role._id}-${roleIndex}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`checkbox-${role._id}`}
                      checked={selectedRoles.includes(role._id)}
                      onCheckedChange={(checked) => 
                        handleRoleChange(role._id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`checkbox-${role._id}`} className="text-sm font-medium">
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.permissions.slice(0, 3).map((permission, permIndex) => (
                          <Badge key={`perm-${role._id}-${permission}-${permIndex}`} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge key={`more-${role._id}`} variant="outline" className="text-xs">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={resetState}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRoleAssignment}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={(open) => {
        if (!open && !isSaving) {
          setIsConfirmOpen(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Role Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to update roles for {userForConfirmation.current?.name || currentUser?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Roles:</p>
              <div className="flex flex-wrap gap-1">
                {rolesForConfirmation.current.length > 0 ? (
                  roles
                    .filter(role => rolesForConfirmation.current.includes(role._id))
                    .map(role => (
                      <Badge key={role._id} variant="secondary" className="text-xs">
                        {role.name}
                      </Badge>
                    ))
                ) : (
                  <span className="text-muted-foreground text-sm">No roles selected</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSaveRoles}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
