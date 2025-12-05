"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Permissions ({newRole.permissions.length} selected)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allPermissionNames = permissions.map(p => p.name);
                      setNewRole({ ...newRole, permissions: allPermissionNames });
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewRole({ ...newRole, permissions: [] })}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                  const categorySelected = categoryPermissions.filter(p => 
                    newRole.permissions.includes(p.name)
                  ).length;
                  const categoryTotal = categoryPermissions.length;
                  
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`category-new-${category}`}
                            checked={categorySelected === categoryTotal}
                            onCheckedChange={(checked) => {
                              const categoryPermissionNames = categoryPermissions.map(p => p.name);
                              if (checked) {
                                const newPermissions = [...new Set([...newRole.permissions, ...categoryPermissionNames])];
                                setNewRole({ ...newRole, permissions: newPermissions });
                              } else {
                                const newPermissions = newRole.permissions.filter(
                                  p => !categoryPermissionNames.includes(p)
                                );
                                setNewRole({ ...newRole, permissions: newPermissions });
                              }
                            }}
                          />
                          <Label htmlFor={`category-new-${category}`} className="font-semibold text-sm cursor-pointer">
                            {category}
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            {categorySelected}/{categoryTotal}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 ml-6">
                        {categoryPermissions.map((permission) => (
                          <div key={permission._id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`new-${permission.name}`}
                              checked={newRole.permissions.includes(permission.name)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission.name, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <Label 
                                htmlFor={`new-${permission.name}`} 
                                className="text-sm font-normal cursor-pointer leading-tight"
                              >
                                {permission.name.replace(/_/g, ' ')}
                              </Label>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
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
