"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Shield, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department } from "@/lib/api/departments";

const AVAILABLE_PERMISSIONS = [
    // Core Department Permissions
    { id: "departments.view", name: "View Departments", category: "Core", description: "View department list and basic information" },
    { id: "departments.details", name: "View Details", category: "Core", description: "View full department details and information" },
    { id: "departments.create", name: "Create Department", category: "Management", description: "Create new departments" },
    { id: "departments.edit", name: "Edit Department", category: "Management", description: "Modify department information" },
    { id: "departments.delete", name: "Delete Department", category: "Management", description: "Delete departments permanently" },
    { id: "departments.manage", name: "Manage Departments", category: "Management", description: "Full department management control" },

    // Member Management
    { id: "departments.view_members", name: "View Members", category: "Members", description: "View department members and team" },
    { id: "departments.assign_members", name: "Assign Members", category: "Members", description: "Add or remove employees from department" },
    { id: "departments.manage_members", name: "Manage Members", category: "Members", description: "Full member management control" },

    // Budget & Finance
    { id: "departments.view_budget", name: "View Budget", category: "Finance", description: "View budget information and allocations" },
    { id: "departments.edit_budget", name: "Edit Budget", category: "Finance", description: "Modify budget allocations" },
    { id: "departments.adjust_budget", name: "Adjust Budget", category: "Finance", description: "Make budget adjustments and reallocations" },

    // Performance & Analytics
    { id: "departments.view_performance", name: "View Performance", category: "Performance", description: "View performance metrics and analytics" },

    // Settings & Permissions
    { id: "departments.view_settings", name: "View Settings", category: "Settings", description: "View department settings and configuration" },
    { id: "departments.edit_settings", name: "Edit Settings", category: "Settings", description: "Modify department settings" },
    { id: "departments.manage_permissions", name: "Manage Permissions", category: "Settings", description: "Control department permissions and access" },

    // Archival & Data Management
    { id: "departments.archive", name: "Archive Department", category: "Data", description: "Archive inactive departments without deleting" },
    { id: "departments.restore", name: "Restore Department", category: "Data", description: "Restore archived departments" },
    { id: "departments.export", name: "Export Data", category: "Data", description: "Export department data to CSV/Excel" },

    // Reporting & Analytics
    { id: "departments.view_reports", name: "View Reports", category: "Reports", description: "Access department reports and insights" },
    { id: "departments.generate_reports", name: "Generate Reports", category: "Reports", description: "Create custom department reports" },
    { id: "departments.edit_performance", name: "Edit Performance", category: "Reports", description: "Modify performance metrics and KPIs" },

    // Budget Approvals & Expenses
    { id: "departments.approve_budget", name: "Approve Budget", category: "Finance", description: "Approve budget changes and adjustments" },
    { id: "departments.view_expenses", name: "View Expenses", category: "Finance", description: "View detailed expense breakdowns" },

    // Advanced Operations
    { id: "departments.clone", name: "Clone Department", category: "Advanced", description: "Duplicate department structure and settings" },
    { id: "departments.transfer_members", name: "Transfer Members", category: "Advanced", description: "Move employees between departments" },
    { id: "departments.view_history", name: "View History", category: "Audit", description: "Access audit logs and change history" },

    // Goals & Planning
    { id: "departments.view_goals", name: "View Goals", category: "Planning", description: "View department goals and objectives" },
    { id: "departments.manage_goals", name: "Manage Goals", category: "Planning", description: "Create and manage department goals" },
];

export default function DepartmentSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [deptRes, permRes] = await Promise.all([
                departmentApi.getById(params.id as string),
                departmentApi.getPermissions(params.id as string),
            ]);
            setDepartment(deptRes.data);
            setPermissions(permRes.data.permissions || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddPermissions = async () => {
        if (selectedPermissions.length === 0) return;

        try {
            // Add all selected permissions
            await Promise.all(
                selectedPermissions.map(permission =>
                    departmentApi.addPermission(params.id as string, permission)
                )
            );
            setPermissions([...permissions, ...selectedPermissions]);
            toast({
                title: "Success",
                description: `${selectedPermissions.length} permission(s) added successfully`,
            });
            setIsPermissionDialogOpen(false);
            setSelectedPermissions([]);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to add permissions",
                variant: "destructive",
            });
        }
    };

    const handleRemovePermission = async (permission: string) => {
        try {
            await departmentApi.removePermission(params.id as string, permission);
            setPermissions(permissions.filter((p) => p !== permission));
            toast({
                title: "Success",
                description: "Permission removed successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to remove permission",
                variant: "destructive",
            });
        }
    };

    const handleDeleteDepartment = async () => {
        if (deleteConfirmText !== department?.name) {
            toast({
                title: "Error",
                description: "Department name does not match",
                variant: "destructive",
            });
            return;
        }

        try {
            setDeleting(true);
            await departmentApi.delete(params.id as string);
            toast({
                title: "Success",
                description: "Department deleted successfully",
            });
            router.push("/dashboard/departments");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete department",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    const availableToAdd = AVAILABLE_PERMISSIONS.filter((p) => !permissions.includes(p.id));

    const togglePermission = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Department Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage permissions, configuration, and advanced settings
                </p>
            </div>

            {/* Permissions */}
            <Card className="card-modern">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle>Permissions</CardTitle>
                        <CardDescription>Manage access control for this department</CardDescription>
                    </div>
                    <Button onClick={() => setIsPermissionDialogOpen(true)} className="btn-primary-gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Permissions
                    </Button>
                </CardHeader>
                <CardContent>
                    {permissions.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No permissions assigned yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {permissions.map((permission) => {
                                const permInfo = AVAILABLE_PERMISSIONS.find((p) => p.id === permission);
                                return (
                                    <div
                                        key={permission}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{permInfo?.name || permission}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {permInfo?.description || permission}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {permInfo && <Badge variant="outline">{permInfo.category}</Badge>}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemovePermission(permission)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Deleting a department is permanent and cannot be undone. All associated data will be
                            removed.
                        </AlertDescription>
                    </Alert>

                    <Button
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="w-full"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Department
                    </Button>
                </CardContent>
            </Card>

            {/* Bulk Add Permissions Dialog */}
            <Dialog open={isPermissionDialogOpen} onOpenChange={(open) => {
                setIsPermissionDialogOpen(open);
                if (!open) setSelectedPermissions([]);
            }}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Add Permissions</DialogTitle>
                        <DialogDescription>Select multiple permissions to add to this department</DialogDescription>
                    </DialogHeader>

                    {availableToAdd.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">All permissions have been assigned</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b pb-3">
                                <p className="text-sm text-muted-foreground">
                                    {selectedPermissions.length} permission(s) selected
                                </p>
                                {selectedPermissions.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedPermissions([])}
                                    >
                                        Clear Selection
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2">
                                {["Core", "Management", "Members", "Finance", "Performance", "Settings", "Data", "Reports", "Advanced", "Audit", "Planning"].map(category => {
                                    const categoryPerms = AVAILABLE_PERMISSIONS.filter(
                                        p => p.category === category && !permissions.includes(p.id)
                                    );
                                    if (categoryPerms.length === 0) return null;

                                    return (
                                        <div key={category} className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-2">
                                                {category}
                                            </h4>
                                            {categoryPerms.map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedPermissions.includes(permission.id)
                                                        ? "bg-primary/10 border-primary"
                                                        : "hover:bg-accent"
                                                        }`}
                                                    onClick={() => togglePermission(permission.id)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            checked={selectedPermissions.includes(permission.id)}
                                                            onCheckedChange={() => togglePermission(permission.id)}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="font-medium">{permission.name}</p>
                                                                <Badge variant="outline" className="flex-shrink-0">{permission.category}</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsPermissionDialogOpen(false);
                            setSelectedPermissions([]);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPermissions}
                            disabled={selectedPermissions.length === 0}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add {selectedPermissions.length > 0 && `(${selectedPermissions.length})`} Permission{selectedPermissions.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the department and all
                            associated data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Please type <strong>{department?.name}</strong> to confirm deletion
                            </AlertDescription>
                        </Alert>

                        <Input
                            placeholder={department?.name}
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteDepartment}
                            disabled={deleteConfirmText !== department?.name || deleting}
                        >
                            {deleting ? "Deleting..." : "Delete Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
