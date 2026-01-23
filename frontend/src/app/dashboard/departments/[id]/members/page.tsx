"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Users,
    UserPlus,
    UserMinus,
    Search,
    Filter,
    Loader2,
    Mail,
    Phone,
    Briefcase,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { SectionLoader } from '@/components/PageLoader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Employee } from "@/lib/api/departments";

export default function DepartmentMembersPage() {
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [employeesRes, allEmpsRes] = await Promise.all([
                departmentApi.getEmployees(params.id as string),
                departmentApi.getAllEmployees(),
            ]);

            setEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : employeesRes.data?.data || []);
            setAllEmployees(Array.isArray(allEmpsRes.data) ? allEmpsRes.data : allEmpsRes.data?.data || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load employees",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignEmployees = async () => {
        if (selectedEmployees.length === 0) return;

        try {
            setSubmitting(true);
            await departmentApi.assignEmployees(params.id as string, selectedEmployees);
            toast({
                title: "Success",
                description: `${selectedEmployees.length} employee(s) assigned successfully`,
            });
            setIsAssignDialogOpen(false);
            setSelectedEmployees([]);
            await loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to assign employees",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnassignEmployee = async (employeeId: string) => {
        if (!window.confirm("Are you sure you want to unassign this employee?")) return;

        try {
            await departmentApi.unassignEmployee(params.id as string, employeeId);
            toast({
                title: "Success",
                description: "Employee unassigned successfully",
            });
            await loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to unassign employee",
                variant: "destructive",
            });
        }
    };

    const filteredEmployees = employees.filter((emp) => {
        const matchesSearch =
            searchQuery === "" ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.position?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const availableEmployees = allEmployees.filter(
        (emp) => !employees.find((e) => e._id === emp._id)
    );

    if (loading) {
        return <SectionLoader />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-[#970E2C] via-[#800020] to-[#970E2C] bg-clip-text text-transparent">Department Members</h2>
                    <p className="text-muted-foreground mt-2 text-base">
                        {employees.length} member{employees.length !== 1 ? "s" : ""} in this department
                    </p>
                </div>
                <Button onClick={() => setIsAssignDialogOpen(true)} className="h-11 bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20 transition-all">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Employees
                </Button>
            </div>

            {/* Filters */}
            <Card className="glass-morphism">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 border-2 focus:border-[#970E2C] transition-colors"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[180px] h-11 border-2 focus:border-[#970E2C]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {/* Employee List */}
            {filteredEmployees.length === 0 ? (
                <Card className="glass-morphism">
                    <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#970E2C]/20 to-[#970E2C]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-[#970E2C]" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No employees found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.map((employee) => (
                        <Card key={employee._id} className="glass-morphism hover:shadow-lg hover:shadow-[#970E2C]/10 transition-all duration-300 hover:-translate-y-1">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {employee.firstName} {employee.lastName}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Briefcase className="w-3 h-3" />
                                            {employee.position || "No position"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={employee.status === "active" ? "default" : "secondary"} className={employee.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200" : ""}>
                                        {employee.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{employee.email}</span>
                                    </div>
                                    {employee.phone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <span>{employee.phone}</span>
                                        </div>
                                    )}
                                    <div className="pt-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleUnassignEmployee(employee._id)}
                                        >
                                            <UserMinus className="w-4 h-4 mr-2" />
                                            Unassign
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assign Employees Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Employees</DialogTitle>
                        <DialogDescription>
                            Select employees to assign to this department
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? "s" : ""} selected
                            </p>
                            {selectedEmployees.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => setSelectedEmployees([])}>
                                    Clear Selection
                                </Button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-3">
                            {availableEmployees.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">All employees are already assigned</p>
                                </div>
                            ) : (
                                availableEmployees.map((employee) => (
                                    <div
                                        key={employee._id}
                                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${selectedEmployees.includes(employee._id)
                                            ? "bg-primary/10 border-primary"
                                            : "hover:bg-accent"
                                            }`}
                                    >
                                        <Checkbox
                                            checked={selectedEmployees.includes(employee._id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedEmployees((prev) =>
                                                    checked
                                                        ? [...prev, employee._id]
                                                        : prev.filter((id) => id !== employee._id)
                                                );
                                            }}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {employee.firstName} {employee.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{employee.position}</p>
                                        </div>
                                        <Badge variant="outline">{employee.status}</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAssignDialogOpen(false);
                                setSelectedEmployees([]);
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAssignEmployees} disabled={submitting || selectedEmployees.length === 0}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Assign {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
