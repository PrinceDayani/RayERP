"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Shield, Search, CheckCircle2, Circle } from "lucide-react";
import adminAPI from "@/lib/api/adminAPI";
import { toast } from "@/components/ui/use-toast";

interface Permission {
  _id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
}

interface ModernRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  role?: any;
  mode: 'create' | 'edit';
}

export function ModernRoleDialog({ open, onOpenChange, onSuccess, role, mode }: ModernRoleDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({ name: "", description: "", permissions: [] as string[] });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPermissions();
    }
  }, [open]);

  useEffect(() => {
    if (open && permissions.length > 0) {
      if (mode === 'edit' && role) {
        const rolePermissions = role.name?.toLowerCase() === 'root' 
          ? permissions.map(p => p.name)
          : role.permissions || [];
        setFormData({ name: role.name, description: role.description || "", permissions: rolePermissions });
      } else {
        setFormData({ name: "", description: "", permissions: [] });
      }
    }
  }, [open, role, mode, permissions.length]);

  const fetchPermissions = async () => {
    try {
      const data = await adminAPI.getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Role name is required", variant: "destructive" });
      return;
    }

    if (formData.name.toLowerCase() === 'root') {
      toast({ title: "Error", description: "Cannot modify Root role permissions", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'edit') {
        await adminAPI.updateRole(role._id, formData);
        toast({ title: "Success", description: "Role updated successfully" });
      } else {
        await adminAPI.createRole(formData);
        toast({ title: "Success", description: "Role created successfully" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Operation failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (permName: string) => {
    if (role?.name?.toLowerCase() === 'root') return;
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...new Set([...prev.permissions, permName])]
    }));
  };

  const toggleCategory = (category: string, perms: Permission[]) => {
    if (role?.name?.toLowerCase() === 'root') return;
    const categoryPerms = perms.map(p => p.name);
    const allSelected = categoryPerms.every(p => formData.permissions.includes(p));
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !categoryPerms.includes(p))
        : [...new Set([...prev.permissions, ...categoryPerms])]
    }));
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const filteredCategories = Object.entries(groupedPermissions).filter(([category, perms]) =>
    searchTerm === "" || 
    category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perms.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show all permissions as selected for Root role
  const totalSelected = role?.name?.toLowerCase() === 'root' ? permissions.length : formData.permissions.length;
  const totalPermissions = permissions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {mode === 'edit' ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'edit' ? 'Edit Role' : 'Create New Role'}
                </h2>
                <p className="text-sm text-gray-600">
                  {mode === 'edit' ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-96 border-r bg-gray-50 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Role Name *</Label>
                <Input
                  placeholder="e.g., Finance Manager"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Description</Label>
                <Textarea
                  placeholder="Describe the role's responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="bg-white resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Permission Summary</Label>
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Selected</span>
                    <Badge variant="default" className="text-base px-3 py-1">
                      {totalSelected} / {totalPermissions}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(totalSelected / totalPermissions) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => role?.name?.toLowerCase() !== 'root' && setFormData({ ...formData, permissions: [...new Set(permissions.map(p => p.name))] })}
                      disabled={role?.name?.toLowerCase() === 'root'}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => role?.name?.toLowerCase() !== 'root' && setFormData({ ...formData, permissions: [] })}
                      disabled={role?.name?.toLowerCase() === 'root'}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={handleSubmit} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? "Saving..." : mode === 'edit' ? "Update Role" : "Create Role"}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>

          {/* Right Panel - Permissions */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search permissions or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Permissions List */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {filteredCategories.map(([category, perms]) => {
                  const categorySelected = role?.name?.toLowerCase() === 'root' 
                    ? perms.length 
                    : perms.filter(p => formData.permissions.includes(p.name)).length;
                  const categoryTotal = perms.length;
                  const allSelected = categorySelected === categoryTotal;

                  return (
                    <div key={category} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      {/* Category Header */}
                      <div 
                        className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
                        onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleCategory(category, perms)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">{category}</h3>
                              <p className="text-xs text-gray-500">{categoryTotal} permissions available</p>
                            </div>
                          </div>
                          <Badge variant={allSelected ? "default" : "secondary"} className="text-sm">
                            {categorySelected} / {categoryTotal}
                          </Badge>
                        </div>
                      </div>

                      {/* Permissions Grid */}
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {perms.map((perm) => {
                          const isSelected = role?.name?.toLowerCase() === 'root' || formData.permissions.includes(perm.name);
                          return (
                            <div
                              key={perm._id}
                              onClick={() => togglePermission(perm.name)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium leading-tight ${
                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                  }`}>
                                    {perm.name.split('.').pop()?.replace(/_/g, ' ')}
                                  </p>
                                  {perm.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
