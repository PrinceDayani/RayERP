"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, Loader2, X, Building, MapPin, Wallet, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLoader } from '@/components/PageLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department } from "@/lib/api/departments";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";

export default function EditDepartmentPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { displayCurrency } = useGlobalCurrency();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [department, setDepartment] = useState<Department | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        budget: "",
        status: "active" as "active" | "inactive",
        managerName: "",
        managerEmail: "",
        managerPhone: "",
    });

    useEffect(() => {
        loadDepartment();
    }, [params.id]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasChanges]);

    const loadDepartment = async () => {
        try {
            setLoading(true);
            const response = await departmentApi.getById(params.id as string);
            const dept = response.data?.data || response.data;
            setDepartment(dept);
            setFormData({
                name: dept.name || "",
                description: dept.description || "",
                location: dept.location || "",
                budget: dept.budget?.toString() || "",
                status: dept.status || "active",
                managerName: dept.manager?.name || "",
                managerEmail: dept.manager?.email || "",
                managerPhone: dept.manager?.phone || "",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to load department",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.description || !formData.location) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            setSaving(true);
            await departmentApi.update(params.id as string, {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                budget: parseFloat(formData.budget) || 0,
                status: formData.status,
                manager: {
                    name: formData.managerName,
                    email: formData.managerEmail,
                    phone: formData.managerPhone,
                },
            });

            toast({
                title: "Success",
                description: "Department updated successfully",
            });
            setHasChanges(false);
            router.push(`/dashboard/departments/${params.id}`);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update department",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <SectionLoader />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/departments/${params.id}`)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Edit Department
                        </h1>
                        <p className="text-muted-foreground mt-1">Update department information and settings</p>
                    </div>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Unsaved changes</span>
                    </div>
                )}
            </div>

            {/* Form Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card className="card-modern">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Building className="w-5 h-5 text-primary" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Essential department details</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">
                                    Department Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="e.g., Engineering"
                                    className="h-11 border-2 focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold">
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Describe the department's role and responsibilities..."
                                    rows={4}
                                    className="border-2 focus:border-indigo-500 transition-colors resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        Location <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange("location", e.target.value)}
                                        placeholder="e.g., New York Office"
                                        className="h-11 border-2 focus:border-indigo-500 transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-sm font-semibold">
                                        Status
                                    </Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: "active" | "inactive") => handleInputChange("status", value)}
                                    >
                                        <SelectTrigger className="h-11 border-2 focus:border-indigo-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget" className="text-sm font-semibold flex items-center gap-1">
                                    <Wallet className="w-3 h-3" />
                                    Annual Budget ({displayCurrency})
                                </Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => handleInputChange("budget", e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    className="h-11 border-2 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Manager Information */}
                    <Card className="card-modern">
                        <CardHeader className="pb-4">
                            <CardTitle>Manager Information</CardTitle>
                            <CardDescription>Department head contact details</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="managerName" className="text-sm font-semibold">
                                    Manager Name
                                </Label>
                                <Input
                                    id="managerName"
                                    value={formData.managerName}
                                    onChange={(e) => handleInputChange("managerName", e.target.value)}
                                    placeholder="John Doe"
                                    className="h-11 border-2 focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="managerEmail" className="text-sm font-semibold">
                                        Email
                                    </Label>
                                    <Input
                                        id="managerEmail"
                                        type="email"
                                        value={formData.managerEmail}
                                        onChange={(e) => handleInputChange("managerEmail", e.target.value)}
                                        placeholder="john.doe@company.com"
                                        className="h-11 border-2 focus:border-indigo-500 transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="managerPhone" className="text-sm font-semibold">
                                        Phone
                                    </Label>
                                    <Input
                                        id="managerPhone"
                                        type="tel"
                                        value={formData.managerPhone}
                                        onChange={(e) => handleInputChange("managerPhone", e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                        className="h-11 border-2 focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions Sidebar - Right Column */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        {/* Save Actions */}
                        <Card className="card-modern">
                            <CardHeader className="pb-4 bg-gradient-to-br from-primary/10 to-primary/5">
                                <CardTitle className="text-base">Actions</CardTitle>
                                <CardDescription className="text-xs">Save or discard changes</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="w-full h-12 btn-primary-gradient"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (hasChanges) {
                                            if (confirm("Discard unsaved changes?")) {
                                                router.push(`/dashboard/departments/${params.id}`);
                                            }
                                        } else {
                                            router.push(`/dashboard/departments/${params.id}`);
                                        }
                                    }}
                                    className="w-full h-12"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Department Info */}
                        {department && (
                            <Card className="card-modern">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base">Department Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Employees</span>
                                        <span className="font-semibold">{department.employeeCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="font-semibold">
                                            {new Date(department.createdAt!).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span className="font-semibold">
                                            {new Date(department.updatedAt!).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
