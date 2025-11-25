"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Building, Edit, Trash2, Users, Search, Filter, TrendingUp, Mail, Phone, MapPin, Calendar, BarChart3, Loader2, UserPlus, X, CheckCircle2, AlertCircle, Shield, Activity, Bell, FolderOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department, DepartmentStats, Employee, employeeApi } from "@/lib/api/departments";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function DepartmentsPage() {
  const { currency, formatAmount } = useCurrency();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [deptProjects, setDeptProjects] = useState<any[]>([]);
  const [deptNotifications, setDeptNotifications] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [deptPermissions, setDeptPermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    manager: { name: "", email: "", phone: "" },
    location: "", 
    budget: 0, 
    status: "active" as "active" | "inactive",
    managerId: "",
    employeeIds: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptResponse, statsResponse] = await Promise.all([
          departmentApi.getAll(searchQuery, statusFilter),
          departmentApi.getStats()
        ]);
        setDepartments(deptResponse.data);
        setStats(statsResponse.data);
        await fetchAllEmployees();
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll(searchQuery, statusFilter);
      console.log('Fetched departments:', response.data);
      console.log('First department permissions:', response.data[0]?.permissions);
      setDepartments(response.data);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to fetch departments", variant: "destructive" });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await departmentApi.getStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await departmentApi.getAllEmployees();
      const employees = Array.isArray(response.data) ? response.data : response.data?.data || [];
      console.log('Fetched employees:', employees.length);
      console.log('Sample employee:', employees[0]);
      setAllEmployees(employees);
      return employees;
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast({ title: "Warning", description: "Could not load employees. You may not have permission.", variant: "destructive" });
      setAllEmployees([]);
      return [];
    }
  };

  const fetchDeptEmployees = async (deptId: string) => {
    try {
      const response = await departmentApi.getEmployees(deptId);
      setDeptEmployees(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to fetch department employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      console.log('=== SUBMITTING FORM DATA ===');
      console.log('Form data:', JSON.stringify(formData, null, 2));
      console.log('Employee IDs count:', formData.employeeIds.length);
      console.log('Manager ID:', formData.managerId);
      
      if (editingDept) {
        const response = await departmentApi.update(editingDept._id, formData);
        console.log('Update response:', response);
        toast({ title: "Success", description: "Department updated successfully" });
      } else {
        const response = await departmentApi.create(formData as any);
        console.log('Create response:', response);
        toast({ title: "Success", description: "Department created successfully" });
      }
      setIsDialogOpen(false);
      setFormData({ name: "", description: "", manager: { name: "", email: "", phone: "" }, location: "", budget: 0, status: "active", managerId: "", employeeIds: [] });
      setEditingDept(null);
      await fetchDepartments();
      await fetchStats();
      await fetchAllEmployees();
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      toast({ title: "Error", description: error.response?.data?.message || "Operation failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (dept: Department) => {
    setEditingDept(dept);
    setLoading(true);
    
    try {
      const [allEmpResponse, deptEmpResponse] = await Promise.all([
        departmentApi.getAllEmployees(),
        departmentApi.getEmployees(dept._id)
      ]);
      
      const allEmps = Array.isArray(allEmpResponse.data) ? allEmpResponse.data : allEmpResponse.data?.data || [];
      const currentEmployees = Array.isArray(deptEmpResponse.data) ? deptEmpResponse.data : deptEmpResponse.data?.data || [];
      
      console.log('All employees loaded:', allEmps.length);
      console.log('Current dept employees:', currentEmployees);
      
      setAllEmployees(allEmps);
      
      const employeeIds = currentEmployees.map((emp: Employee) => emp._id);
      
      let managerId = "";
      if (dept.manager?.email) {
        const managerEmp = allEmps.find((e: Employee) => e.email === dept.manager.email);
        if (managerEmp) {
          managerId = managerEmp._id;
        }
      }
      
      const newFormData = { 
        name: dept.name, 
        description: dept.description, 
        manager: dept.manager,
        location: dept.location, 
        budget: dept.budget, 
        status: dept.status,
        managerId,
        employeeIds: employeeIds.filter((id: string) => id !== managerId)
      };
      
      console.log('Form data set:', newFormData);
      console.log('Employee IDs:', employeeIds);
      setFormData(newFormData);
      setTimeout(() => setIsDialogOpen(true), 100);
    } catch (error) {
      console.error('Failed to load department employees:', error);
      setFormData({ 
        name: dept.name, 
        description: dept.description, 
        manager: dept.manager,
        location: dept.location, 
        budget: dept.budget, 
        status: dept.status,
        managerId: "",
        employeeIds: []
      });
      setIsDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (dept: Department) => {
    setDepartmentToDelete(dept);
    setDeleteConfirmText("");
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete || deleteConfirmText !== departmentToDelete.name) {
      toast({ title: "Error", description: "Please type the department name exactly to confirm deletion", variant: "destructive" });
      return;
    }
    
    try {
      setSubmitting(true);
      await departmentApi.deleteWithConfirmation(departmentToDelete._id, deleteConfirmText);
      toast({ title: "Success", description: "Department deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
      setDeleteConfirmText("");
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete department", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingDept(null);
    setFormData({ name: "", description: "", manager: { name: "", email: "", phone: "" }, location: "", budget: 0, status: "active", managerId: "", employeeIds: [] });
    console.log('Opening dialog with employees:', allEmployees);
    setIsDialogOpen(true);
  };

  const openAssignDialog = async (dept: Department) => {
    setSelectedDept(dept);
    setSelectedEmployees([]);
    await fetchDeptEmployees(dept._id);
    await fetchAllEmployees();
    setIsAssignDialogOpen(true);
  };

  const openPermissionDialog = async (dept: Department) => {
    setSelectedDept(dept);
    console.log('Opening permissions for department:', dept);
    console.log('Department permissions from card:', dept.permissions);
    try {
      const response = await departmentApi.getPermissions(dept._id);
      console.log('Permissions API response:', response);
      setDeptPermissions(response.data.permissions || []);
      setIsPermissionDialogOpen(true);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      toast({ title: "Error", description: "Failed to load permissions", variant: "destructive" });
    }
  };

  const handleAssignEmployees = async () => {
    if (!selectedDept || selectedEmployees.length === 0) return;
    try {
      setSubmitting(true);
      await departmentApi.assignEmployees(selectedDept._id, selectedEmployees);
      toast({ title: "Success", description: "Employees assigned successfully" });
      setIsAssignDialogOpen(false);
      setSelectedEmployees([]);
      await fetchDepartments();
      await fetchStats();
      if (selectedDept) await fetchDeptEmployees(selectedDept._id);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to assign employees", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignEmployee = async (deptId: string, employeeId: string) => {
    try {
      await departmentApi.unassignEmployee(deptId, employeeId);
      toast({ title: "Success", description: "Employee unassigned successfully" });
      fetchDeptEmployees(deptId);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to unassign employee", variant: "destructive" });
    }
  };

  const handleAddPermission = async (permission: string) => {
    if (!selectedDept) return;
    try {
      await departmentApi.addPermission(selectedDept._id, permission);
      setDeptPermissions([...deptPermissions, permission]);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to add permission", variant: "destructive" });
    }
  };

  const handleRemovePermission = async (permission: string) => {
    if (!selectedDept) return;
    try {
      await departmentApi.removePermission(selectedDept._id, permission);
      setDeptPermissions(deptPermissions.filter(p => p !== permission));
      toast({ title: "Success", description: "Permission removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to remove permission", variant: "destructive" });
    }
  };

  const openAnalyticsDialog = async (dept: Department) => {
    setSelectedDept(dept);
    try {
      setLoading(true);
      const [analyticsRes, projectsRes, notificationsRes, logsRes] = await Promise.all([
        departmentApi.getAnalytics(dept._id),
        departmentApi.getProjects(dept._id),
        departmentApi.getNotifications(dept._id),
        departmentApi.getActivityLogs(dept._id, { limit: 20 })
      ]);
      
      setAnalytics(analyticsRes.data);
      setDeptProjects(projectsRes.data);
      setDeptNotifications(notificationsRes.data);
      setActivityLogs(logsRes.data.logs || []);
      setIsAnalyticsDialogOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openViewDialog = async (dept: Department) => {
    setSelectedDept(dept);
    try {
      setLoading(true);
      const [employeesRes, projectsRes, notificationsRes] = await Promise.all([
        departmentApi.getEmployees(dept._id),
        departmentApi.getProjects(dept._id),
        departmentApi.getNotifications(dept._id)
      ]);
      
      setDeptEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : employeesRes.data?.data || []);
      setDeptProjects(projectsRes.data);
      setDeptNotifications(notificationsRes.data.slice(0, 10));
      setIsViewDialogOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load department details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage organizational departments</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.active} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalBudget)}</div>
              <p className="text-xs text-muted-foreground mt-1">Annual allocation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Team Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTeamSize}</div>
              <p className="text-xs text-muted-foreground mt-1">Employees per dept</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search departments, managers, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No departments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
          <Card key={dept._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{dept.name}</CardTitle>
                      <Badge variant={dept.status === "active" ? "default" : "secondary"}>
                        {dept.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">{dept.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{dept.manager?.name || 'No manager assigned'}</p>
                      {dept.manager?.email && (
                        <p className="text-xs text-muted-foreground">{dept.manager.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{dept.location}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Employees</p>
                    <p className="text-lg font-bold">{dept.employeeCount}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-lg font-bold">{formatAmount(dept.budget)}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Permissions</p>
                    <p className="text-lg font-bold">{dept.permissions?.length || 0}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openViewDialog(dept)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openAnalyticsDialog(dept)}>
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openAssignDialog(dept)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPermissionDialog(dept)}>
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(dept)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" key={editingDept?._id || 'new'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {editingDept ? "Edit Department" : "Create New Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDept ? "Update department information and team assignments" : "Set up a new department with manager and team members"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
                  <Label htmlFor="budget">Annual Budget ($)</Label>
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
                  <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}>
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

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Assignment
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{allEmployees.length} available</Badge>
                    <Button type="button" variant="ghost" size="sm" onClick={fetchAllEmployees}>
                      <Loader2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerId">Department Manager</Label>
                    <Select value={formData.managerId || "none"} onValueChange={(value) => {
                      console.log('Manager selected:', value);
                      if (value === "none") {
                        setFormData(prev => ({ ...prev, managerId: "", manager: { name: "", email: "", phone: "" } }));
                      } else {
                        const emp = allEmployees.find(e => e._id === value);
                        console.log('Found employee:', emp);
                        if (emp) {
                          setFormData(prev => ({ 
                            ...prev, 
                            managerId: value,
                            manager: { name: `${emp.firstName} ${emp.lastName}`, email: emp.email, phone: emp.phone || '' }
                          }));
                        }
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {allEmployees.map((emp) => (
                          <SelectItem key={emp._id} value={emp._id}>
                            <div className="flex items-center gap-2">
                              <span>{emp.firstName} {emp.lastName}</span>
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
                      <div className="max-h-[200px] overflow-y-auto p-3 space-y-2">
                        {allEmployees.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No employees available</p>
                            <p className="text-xs mt-1">Add employees from Employee Management first</p>
                          </div>
                        ) : allEmployees.filter(e => e._id !== formData.managerId).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Manager selected. Add more employees to assign them.</p>
                          </div>
                        ) : (
                          allEmployees.filter(e => e._id !== formData.managerId).map((emp) => {
                            const isChecked = formData.employeeIds.includes(emp._id);
                            const isInCurrentDept = emp.departments?.includes(formData.name) || emp.departments?.includes(editingDept?.name || '');
                            const otherDepts = emp.departments?.filter(d => d !== formData.name && d !== editingDept?.name) || [];
                            return (
                            <div 
                              key={emp._id}
                              className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                            >
                              <Checkbox
                                id={`emp-${emp._id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  console.log('Checkbox changed:', emp.firstName, checked);
                                  setFormData(prev => ({
                                    ...prev,
                                    employeeIds: checked 
                                      ? [...prev.employeeIds, emp._id]
                                      : prev.employeeIds.filter(id => id !== emp._id)
                                  }));
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {emp.position}
                                  {otherDepts.length > 0 && ` • Also in: ${otherDepts.join(', ')}`}
                                  {!emp.departments?.length && ' • No departments'}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">{emp.status}</Badge>
                            </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Select employees to assign to this department</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingDept ? "Update Department" : "Create Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Employees to {selectedDept?.name}</DialogTitle>
            <DialogDescription>Select employees to assign to this department</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="assign">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">Assign New</TabsTrigger>
              <TabsTrigger value="current">Current Employees</TabsTrigger>
            </TabsList>
            <TabsContent value="assign" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                </p>
                {selectedEmployees.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEmployees([])}>
                    Clear Selection
                  </Button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {allEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No employees available</p>
                  </div>
                ) : (
                  allEmployees.map((employee) => {
                    const isInDept = deptEmployees.find(de => de._id === employee._id);
                    const otherDepts = employee.departments?.filter(d => d !== selectedDept?.name) || [];
                    return (
                    <div 
                      key={employee._id} 
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
                        selectedEmployees.includes(employee._id) 
                          ? 'bg-primary/10 border-primary' 
                          : isInDept
                          ? 'bg-green-50 border-green-200'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <Checkbox
                        checked={selectedEmployees.includes(employee._id) || !!isInDept}
                        disabled={!!isInDept}
                        onCheckedChange={(checked) => {
                          setSelectedEmployees(prev =>
                            checked ? [...prev, employee._id] : prev.filter(id => id !== employee._id)
                          );
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.position} • {employee.email}
                          {isInDept && ' • Already assigned'}
                          {otherDepts.length > 0 && ` • Also in: ${otherDepts.join(', ')}`}
                        </p>
                      </div>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status}
                      </Badge>
                    </div>
                    );
                  })
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleAssignEmployees} disabled={submitting || selectedEmployees.length === 0}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Assign {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="current" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {deptEmployees.length} employee{deptEmployees.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {deptEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No employees assigned yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Switch to "Assign New" tab to add employees</p>
                  </div>
                ) : (
                  deptEmployees.map((employee) => (
                    <div key={employee._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{employee.position} • {employee.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => selectedDept && handleUnassignEmployee(selectedDept._id, employee._id)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Manage Permissions - {selectedDept?.name}
            </DialogTitle>
            <DialogDescription>
              Select permissions for this department. All employees will inherit these permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Available Permissions</h4>
              <Badge variant="outline">{deptPermissions.length} selected</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { category: 'Projects', permissions: ['projects.view', 'projects.create', 'projects.update', 'projects.delete'] },
                { category: 'Tasks', permissions: ['tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign'] },
                { category: 'Employees', permissions: ['employees.view', 'employees.create', 'employees.update', 'employees.delete', 'employees.manage'] },
                { category: 'Attendance', permissions: ['attendance.view', 'attendance.manage'] },
                { category: 'Leave', permissions: ['leave.view', 'leave.approve', 'leave.manage'] },
                { category: 'Finance', permissions: ['finance.view', 'finance.manage'] },
                { category: 'Budgets', permissions: ['budgets.view', 'budgets.create', 'budgets.update', 'budgets.delete'] },
                { category: 'Expenses', permissions: ['expenses.view', 'expenses.approve', 'expenses.manage'] },
                { category: 'Reports', permissions: ['reports.view', 'reports.export'] },
                { category: 'Analytics', permissions: ['analytics.view'] },
                { category: 'Contacts', permissions: ['contacts.view', 'contacts.create', 'contacts.update', 'contacts.delete'] },
                { category: 'Settings', permissions: ['settings.view', 'settings.manage'] },
              ].map((group) => (
                <div key={group.category} className="border rounded-lg p-3">
                  <h5 className="font-semibold text-sm mb-2">{group.category}</h5>
                  <div className="space-y-2">
                    {group.permissions.map((perm) => (
                      <div key={perm} className="flex items-center space-x-2">
                        <Checkbox
                          checked={deptPermissions.includes(perm)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleAddPermission(perm);
                            } else {
                              handleRemovePermission(perm);
                            }
                          }}
                        />
                        <label className="text-sm cursor-pointer" onClick={() => {
                          if (deptPermissions.includes(perm)) {
                            handleRemovePermission(perm);
                          } else {
                            handleAddPermission(perm);
                          }
                        }}>
                          {perm.split('.')[1]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Department
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the department and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">
                Department: {departmentToDelete?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Employees: {departmentToDelete?.employeeCount} • Budget: {departmentToDelete && formatAmount(departmentToDelete.budget)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmText" className="text-sm font-medium">
                Type <span className="font-mono bg-muted px-1 rounded">{departmentToDelete?.name}</span> to confirm:
              </Label>
              <Input
                id="confirmText"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter department name"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={submitting || deleteConfirmText !== departmentToDelete?.name}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics - {selectedDept?.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive analytics and insights for this department
            </DialogDescription>
          </DialogHeader>
          {analytics && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.overview.totalEmployees}</div>
                      <p className="text-xs text-muted-foreground">Total Employees</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.overview.totalProjects}</div>
                      <p className="text-xs text-muted-foreground">Total Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{formatAmount(analytics.overview.budget)}</div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.performance.projectCompletionRate}%</div>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Employee Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.employeeStats.byPosition).map(([position, count]) => (
                          <div key={position} className="flex justify-between items-center">
                            <span className="text-sm">{position}</span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Project Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.projectStats.byStatus).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{status}</span>
                            <Badge variant={status === 'completed' ? 'default' : 'secondary'}>{count as number}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="employees" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Employee Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(analytics.employeeStats.byStatus).map(([status, count]) => (
                        <div key={status} className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{count as number}</div>
                          <p className="text-sm text-muted-foreground capitalize">{status}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="projects" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.overview.activeProjects}</div>
                      <p className="text-xs text-muted-foreground">Active Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.overview.completedProjects}</div>
                      <p className="text-xs text-muted-foreground">Completed Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{formatAmount(analytics.projectStats.totalBudget)}</div>
                      <p className="text-xs text-muted-foreground">Project Budget</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {deptProjects.slice(0, 5).map((project) => (
                        <div key={project._id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.description}</p>
                          </div>
                          <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.activityTrends.totalActivities}</div>
                      <p className="text-xs text-muted-foreground">Total Activities</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{Object.keys(analytics.activityTrends.activityByType).length}</div>
                      <p className="text-xs text-muted-foreground">Activity Types</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.activityTrends.recentActivities.length}</div>
                      <p className="text-xs text-muted-foreground">Recent Activities</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Activity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.activityTrends.activityByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{type}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Activity Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {activityLogs.map((log) => (
                        <div key={log._id} className="flex items-start gap-2 p-2 border rounded text-sm">
                          <Activity className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{log.action} - {log.resource}</p>
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                            <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnalyticsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Department Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {selectedDept?.name} - Department Overview
            </DialogTitle>
            <DialogDescription>
              View employees, projects, and notifications for this department
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="employees" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="employees">Employees ({deptEmployees.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({deptProjects.length})</TabsTrigger>
              <TabsTrigger value="notifications">Notifications ({deptNotifications.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="employees" className="space-y-4">
              <div className="grid gap-4">
                {deptEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No employees assigned</p>
                  </div>
                ) : (
                  deptEmployees.map((employee) => (
                    <Card key={employee._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                              <p className="text-sm text-muted-foreground">{employee.position}</p>
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-4">
              <div className="grid gap-4">
                {deptProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No projects found</p>
                  </div>
                ) : (
                  deptProjects.map((project) => (
                    <Card key={project._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Budget: {formatAmount(project.budget || 0)}</span>
                              <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                              {project.endDate && <span>End: {new Date(project.endDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <Badge variant={project.status === 'completed' ? 'default' : project.status === 'active' ? 'secondary' : 'outline'}>
                            {project.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <div className="grid gap-4">
                {deptNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  deptNotifications.map((notification) => (
                    <Card key={notification._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Bell className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.action} - {notification.resource}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.details}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.timestamp).toLocaleString()} • {notification.userName}
                            </p>
                          </div>
                          <Badge variant={notification.status === 'success' ? 'default' : notification.status === 'error' ? 'destructive' : 'secondary'}>
                            {notification.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
