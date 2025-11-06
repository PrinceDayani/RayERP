"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";

interface Permission {
  _id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleCreated: (role: any) => void;
}

export function CreateRoleDialog({ open, onOpenChange, onRoleCreated }: CreateRoleDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const permissionsData = await adminAPI.getPermissions();
        setPermissions(permissionsData);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
      }
    };

    if (open) {
      fetchPermissions();
    }
  }, [open]);

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const createdRole = await adminAPI.createRole(newRole);
      onRoleCreated(createdRole);
      setNewRole({ name: "", description: "", permissions: [] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Role created successfully"
      });
    } catch (error: any) {
      console.error("Failed to create role:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create role",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    const updatedPermissions = checked
      ? [...newRole.permissions, permissionName]
      : newRole.permissions.filter(p => p !== permissionName);
    setNewRole({ ...newRole, permissions: updatedPermissions });
  };

  const handleClose = () => {
    setNewRole({ name: "", description: "", permissions: [] });
    onOpenChange(false);
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <DialogTitle className="text-xl font-semibold">Create New Role</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Define a new role with specific permissions
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-6">
            {/* Role Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter role name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Role Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter role description (optional)"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full min-h-[80px] resize-none"
              />
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Permissions</Label>
              <div className="space-y-6">
                {Object.entries(groupedPermissions)
                  .filter(([category]) => category !== 'Order Management' && category !== 'Product Management')
                  .map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-base text-gray-900">{category}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {categoryPermissions.map((permission) => (
                        <div key={permission._id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`new-${permission.name}`}
                            checked={newRole.permissions.includes(permission.name)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.name, checked as boolean)
                            }
                            className="rounded-full"
                          />
                          <Label 
                            htmlFor={`new-${permission.name}`} 
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateRole} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}