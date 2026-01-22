"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building, Save, Loader2, Users as UsersIcon, MapPin, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Employee } from "@/lib/api/departments";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function NewDepartmentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        manager: { name: "", email: "", phone: "" },
        location: "",
        budget: 0,
        status: "active" as "active" | "inactive",
        managerId: "",
        employeeIds: [] as string[],
    });

    useEffect(() => {
        fetchAllEmployees();
    }, []);

    const fetchAllEmployees = async () => {
        try {
            const response = await departmentApi.getAllEmployees();
            const employees = Array.isArray(response.data) ? response.data : response.data?.data || [];
            setAllEmployees(employees);
        } catch (error: any) {
            console.error("Failed to fetch employees:", error);
            toast({
                title: "Warning",
                description: "Could not load employees",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await departmentApi.create(formData as any);
            toast({
                title: "Success",
                description: "Department created successfully",
            });
            router.push("/dashboard/departments");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create department",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/dashboard/departments" className="hover:text-foreground transition-colors">
                    Departments
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">New Department</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Create New Department</h1>
                    <p className="text-muted-foreground mt-1">
                        Set up a new department with manager and team members
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard/departments")}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5" />
                            Basic Information
                        </CardTitle>
                        <CardDescription>Enter the core details of the department</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name" className="flex items-center gap-1">
                                    Department Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Engineering, Sales, HR"
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description" className="flex items-center gap-1">
                                    Description <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the department's role and responsibilities"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Location <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Building A, Floor 3"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Annual Budget</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min="0"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                    placeholder="100000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "active" | "inactive") =>
                                        setFormData({ ...formData, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">✓ Active</SelectItem>
                                        <SelectItem value="inactive">✗ Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UsersIcon className="w-5 h-5" />
                            Team Assignment
                        </CardTitle>
                        <CardDescription>Assign manager and team members to this department</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="managerId">Department Manager</Label>
                            <Select
                                value={formData.managerId || "none"}
                                onValueChange={(value) => {
                                    if (value === "none") {
                                        setFormData((prev) => ({
                                            ...prev,
                                            managerId: "",
                                            manager: { name: "", email: "", phone: "" },
                                        }));
                                    } else {
                                        const emp = allEmployees.find((e) => e._id === value);
                                        if (emp) {
                                            setFormData((prev) => ({
                                                ...prev,
                                                managerId: value,
                                                manager: {
                                                    name: `${emp.firstName} ${emp.lastName}`,
                                                    email: emp.email,
                                                    phone: emp.phone || "",
                                                },
                                            }));
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a manager (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Manager</SelectItem>
                                    {allEmployees.map((emp) => (
                                        <SelectItem key={emp._id} value={emp._id}>
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {emp.firstName} {emp.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">• {emp.position}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                <span>Team Members</span>
                                {formData.employeeIds.length > 0 && (
                                    <Badge variant="secondary">{formData.employeeIds.length} selected</Badge>
                                )}
                            </Label>
                            <div className="border rounded-lg">
                                <div className="max-h-[300px] overflow-y-auto p-3 space-y-2">
                                    {allEmployees.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No employees available</p>
                                        </div>
                                    ) : (
                                        allEmployees
                                            .filter((e) => e._id !== formData.managerId)
                                            .map((emp) => {
                                                const isChecked = formData.employeeIds.includes(emp._id);
                                                return (
                                                    <div
                                                        key={emp._id}
                                                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                                                    >
                                                        <Checkbox
                                                            id={`emp-${emp._id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    employeeIds: checked
                                                                        ? [...prev.employeeIds, emp._id]
                                                                        : prev.employeeIds.filter((id) => id !== emp._id),
                                                                }));
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {emp.firstName} {emp.lastName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {emp.status}
                                                        </Badge>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/departments")}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Create Department
                    </Button>
                </div>
            </form>
        </div>
    );
}
