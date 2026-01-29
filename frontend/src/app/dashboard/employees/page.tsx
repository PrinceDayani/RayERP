"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionLoader } from '@/components/PageLoader';
import { 
  Plus, 
  Users, 
  Calendar, 
  Coins,
  Clock,
  UserCheck,
  UserX,
  Search,
  Edit,
  Trash2,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  User
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { employeesAPI } from "@/lib/api/employeesAPI";
import attendanceAPI from "@/lib/api/attendanceAPI";
import leaveAPI, { Leave } from "@/lib/api/leaveAPI";
import employeeReportAPI from "@/lib/api/employeeReportAPI";
import { EmployeeList } from "@/components/employee";
import EmployeeFilters from "@/components/employee/EmployeeFilters";

interface LeaveCreateRequest {
  employee: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  departments?: string[];
  position: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  hireDate: string;
}

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  terminatedEmployees: number;
  presentToday: number;
  onLeave: number;
}

interface AttendanceRecord {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  date: string;
  checkIn: string;
  checkOut?: string;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

const EmployeeManagementDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    terminatedEmployees: 0,
    presentToday: 0,
    onLeave: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    position: '',
    status: '',
    hireYear: '',
    skills: []
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUpdate = () => {
      fetchData();
    };

    if (typeof window !== 'undefined' && (window as any).io) {
      const socket = (window as any).io();
      socket.on('attendance:updated', handleUpdate);
      socket.on('leave:created', handleUpdate);
      socket.on('leave:updated', handleUpdate);

      return () => {
        socket.off('attendance:updated', handleUpdate);
        socket.off('leave:created', handleUpdate);
        socket.off('leave:updated', handleUpdate);
      };
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees first (most important)
      let employeesData = [];
      try {
        const response = await employeesAPI.getAll();
        employeesData = Array.isArray(response) ? response : (response?.data || []);
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        // Continue with empty array if employees fail
      }
      
      // Fetch stats with individual error handling
      let todayStats = { presentToday: 0 };
      let leaveStats = { onLeave: 0 };
      
      try {
        todayStats = await attendanceAPI.getTodayStats();
      } catch (error) {
        console.warn("Attendance stats unavailable:", error);
      }
      
      try {
        leaveStats = await leaveAPI.getTodayLeaves();
      } catch (error) {
        console.warn("Leave stats unavailable:", error);
      }

      const calculatedStats = {
        totalEmployees: employeesData.length,
        activeEmployees: employeesData.filter((e: Employee) => e.status === 'active').length,
        inactiveEmployees: employeesData.filter((e: Employee) => e.status === 'inactive').length,
        terminatedEmployees: employeesData.filter((e: Employee) => e.status === 'terminated').length,
        presentToday: todayStats.presentToday || 0,
        onLeave: leaveStats.onLeave || 0,
      };
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast({
        title: "Error",
        description: "Failed to load some employee data. Check your permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    // Search filter
    const searchLower = (filters.search || searchTerm).toLowerCase();
    const nameMatch = `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchLower);
    const idMatch = employee.employeeId.toLowerCase().includes(searchLower);
    const emailMatch = employee.email.toLowerCase().includes(searchLower);
    const deptMatch = employee.department?.toLowerCase().includes(searchLower) || false;
    const deptsMatch = employee.departments?.some(dept => dept.toLowerCase().includes(searchLower)) || false;
    
    const searchMatches = !searchLower || nameMatch || idMatch || emailMatch || deptMatch || deptsMatch;
    
    // Department filter
    const departmentMatches = !filters.department || 
      employee.department === filters.department ||
      employee.departments?.includes(filters.department);
    
    // Position filter
    const positionMatches = !filters.position || employee.position === filters.position;
    
    // Status filter
    const statusMatches = !filters.status || employee.status === filters.status;
    
    // Hire year filter
    const hireYearMatches = !filters.hireYear || 
      new Date(employee.hireDate).getFullYear().toString() === filters.hireYear;
    
    // Skills filter (would need skills data in employee object)
    const skillsMatch = filters.skills.length === 0; // Placeholder for skills filtering
    
    return searchMatches && departmentMatches && positionMatches && statusMatches && hireYearMatches && skillsMatch;
  });

  // Get unique values for filters
  const departments = [...new Set(employees.flatMap(emp => 
    emp.departments && emp.departments.length > 0 ? emp.departments : [emp.department]
  ).filter(Boolean))];
  const positions = [...new Set(employees.map(emp => emp.position).filter(Boolean))];
  const skills = []; // Placeholder - would come from employee skills data

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'terminated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleDeleteEmployee = (employeeId: string, employeeName: string) => {
    setEmployeeToDelete({ id: employeeId, name: employeeName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    try {
      await employeesAPI.delete(employeeToDelete.id);
      toast({
        title: "Success",
        description: `Employee ${employeeToDelete.name} deleted successfully`,
      });
      setEmployees(employees.filter(emp => emp._id !== employeeToDelete.id));
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="card-modern max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">Please log in to access Employee Management</p>
            <Button onClick={() => router.push("/login")} className="btn-primary-gradient w-full">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#970E2C] via-[#800020] to-[#970E2C] bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-muted-foreground text-base">Manage your workforce efficiently with real-time insights</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">Live</span>
            </div>
            <Button onClick={() => router.push("/dashboard/resources")} variant="outline" size="default" className="h-11 hover:bg-[#970E2C]/5 hover:border-[#970E2C]/30 shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Resources
            </Button>
            <Button onClick={() => router.push("/dashboard/employees/create")} className="h-11 bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Total Employees</p>
                  <p className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.totalEmployees}</p>
                  <p className="text-xs text-muted-foreground">All workforce</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Active</p>
                  <p className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.activeEmployees}</p>
                  <p className="text-xs text-[#970E2C]">Currently working</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Present Today</p>
                  <p className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.presentToday}</p>
                  <p className="text-xs text-[#970E2C]">In office now</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">On Leave</p>
                  <p className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{stats.onLeave}</p>
                  <p className="text-xs text-[#970E2C]">Away today</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                  <UserX className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-xl border border-border/50">
            <TabsTrigger value="overview" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Overview</TabsTrigger>
            <TabsTrigger value="employees" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Employees</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Attendance</TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Leaves</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-[#970E2C]" />
                  Recent Employees
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {employees.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No employees found</p>
                    <Button onClick={() => router.push("/dashboard/employees/create")} className="mt-4 bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employees.slice(0, 5).map((employee) => (
                      <div 
                        key={employee._id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => router.push(`/dashboard/employees/${employee._id}`)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#970E2C]/20 to-[#800020]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <span className="text-[#970E2C] font-semibold text-base">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-[#970E2C] transition-colors">{employee.firstName} {employee.lastName}</h3>
                            <p className="text-sm text-muted-foreground truncate">{employee.position} • {employee.department}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className={getStatusColor(employee.status)} variant="secondary">
                                {employee.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">{employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-1">Joined</p>
                          <p className="font-medium text-sm">{new Date(employee.hireDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            {/* Enhanced Filters */}
            <EmployeeFilters
              filters={filters}
              onFiltersChange={setFilters}
              departments={departments}
              positions={positions}
              skills={skills}
            />
            
            <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5 text-[#970E2C]" />
                    All Employees
                    <Badge variant="secondary" className="ml-2">{filteredEmployees.length}</Badge>
                  </CardTitle>
                  <Button onClick={() => router.push("/dashboard/employees/create")} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">No employees found</p>
                    <p className="text-xs text-muted-foreground mb-4">Try adjusting your filters or add a new employee</p>
                    <Button onClick={() => router.push("/dashboard/employees/create")} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">ID</th>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Employee</th>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Department</th>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Position</th>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Hire Date</th>
                          <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredEmployees.map((employee) => (
                          <tr 
                            key={employee._id} 
                            className="hover:bg-accent/30 transition-colors cursor-pointer"
                            onClick={() => router.push(`/dashboard/employees/${employee._id}`)}
                          >
                            <td className="p-4">
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{employee.employeeId}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#970E2C]/20 to-[#800020]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-[#970E2C] font-semibold text-sm">
                                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm truncate">{employee.firstName} {employee.lastName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {employee.departments && employee.departments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {employee.departments.map((dept, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                      {dept}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                  {employee.department || 'N/A'}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-sm">{employee.position}</td>
                            <td className="p-4">
                              <Badge className={getStatusColor(employee.status)} variant="secondary">
                                {employee.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{new Date(employee.hireDate).toLocaleDateString()}</td>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/employees/${employee._id}`)}
                                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                                  title="View Details"
                                >
                                  <User className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/employees/${employee._id}/edit`)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteEmployee(employee._id, `${employee.firstName} ${employee.lastName}`)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Employee</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p>Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>?</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This action cannot be undone. All employee data will be permanently removed.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={confirmDeleteEmployee}>
                        Delete Employee
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <TodayAttendance />
          </TabsContent>

          <TabsContent value="leaves">
            <LeaveManagement />
          </TabsContent>


          <TabsContent value="reports">
            <EmployeeReports />
          </TabsContent>
        </Tabs>
    </div>
  );
};

// Leave Management Component
const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateLeaveOpen, setIsCreateLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await leaveAPI.getAll();
      setLeaves(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch leaves", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateLeave = async () => {
    try {
      await leaveAPI.create(leaveForm);
      toast({ title: "Success", description: "Leave request created successfully" });
      setIsCreateLeaveOpen(false);
      setLeaveForm({ employee: '', leaveType: '', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create leave request", variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (leaveId: string, status: string, rejectionReason?: string) => {
    try {
      await leaveAPI.updateStatus(leaveId, { status, rejectionReason });
      toast({ title: "Success", description: "Leave status updated successfully" });
      fetchLeaves();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update leave status", variant: "destructive" });
    }
  };

  return (
    <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-[#970E2C]" />
            Leave Management
          </CardTitle>
          <Button onClick={() => setIsCreateLeaveOpen(true)} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
            <Plus className="h-4 w-4 mr-2" />
            New Leave Request
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {leaves.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-2">No leave requests found</p>
            <Button onClick={() => setIsCreateLeaveOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Leave Request
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave: any) => (
              <div key={leave._id} className="border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {leave.employee?.firstName || 'N/A'} {leave.employee?.lastName || ''}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {leave.leaveType} - {leave.totalDays} days
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm mt-2">{leave.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {leave.status}
                    </Badge>
                    {leave.status === 'pending' && (
                      <>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600" onClick={() => handleStatusUpdate(leave._id, 'approved')}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleStatusUpdate(leave._id, 'rejected', 'Not approved')}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isCreateLeaveOpen} onOpenChange={setIsCreateLeaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select onValueChange={(value) => setLeaveForm({...leaveForm, employee: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {`${emp.firstName} ${emp.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Leave Type</Label>
                <Select onValueChange={(value) => setLeaveForm({...leaveForm, leaveType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateLeaveOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateLeave}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};


// Employee Reports Component
const EmployeeReports = () => {
  const [reportData, setReportData] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: ''
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [report, deptSummary, attSummary] = await Promise.all([
        employeeReportAPI.getEmployeeReport(filters),
        employeeReportAPI.getDepartmentSummary(),
        employeeReportAPI.getAttendanceSummary(
          (new Date().getMonth() + 1).toString(),
          new Date().getFullYear().toString()
        )
      ]);
      setReportData(report);
      setDepartmentSummary(deptSummary);
      setAttendanceSummary(attSummary);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-[#970E2C]" />
            Employee Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Select onValueChange={(value) => setFilters({...filters, department: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Department Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {departmentSummary.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No department data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {departmentSummary.map((dept: any) => (
                  <div key={dept._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{dept._id}</p>
                      <p className="text-xs text-muted-foreground">{dept.count} employees</p>
                    </div>
                    <p className="font-semibold text-sm">₹{Math.round(dept.avgSalary).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {attendanceSummary.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No attendance data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceSummary.map((att: any) => (
                  <div key={att._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="font-semibold text-sm capitalize">{att._id}</p>
                      <p className="text-xs text-muted-foreground">{att.count} days</p>
                    </div>
                    <p className="font-semibold text-sm">{Math.round(att.totalHours)}h</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Report Table */}
      <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Employee Performance Report</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No report data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Employee</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Department</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Attendance</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Hours</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Leaves</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.map((emp: any) => (
                    <tr key={emp.employee._id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-sm">{emp.employee.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employee.employeeId}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{emp.employee.department}</td>
                      <td className="p-3">
                        <div className="text-xs">
                          <p className="font-medium">{emp.attendance.presentDays}/{emp.attendance.totalDays} days</p>
                          <p className="text-muted-foreground">{emp.attendance.lateDays} late</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm font-medium">{Math.round(emp.attendance.totalHours)}h</td>
                      <td className="p-3 text-sm">{emp.leaves.totalLeaves} days</td>
                      <td className="p-3 text-sm font-semibold">₹{emp.employee.salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Today Attendance Component
const TodayAttendance = () => {
  const router = useRouter();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const params = {
        startDate: today,
        endDate: today
      };
      const data = await attendanceAPI.getAll(params);
      setTodayAttendance(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half-day': return 'bg-blue-100 text-blue-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-0 shadow-lg shadow-[#970E2C]/5">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-[#970E2C]" />
            Today's Attendance
          </CardTitle>
          <Button onClick={() => router.push("/dashboard/employees/attendance")} className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20">
            <BarChart3 className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <SectionLoader text="Loading attendance..." />
        ) : todayAttendance.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No attendance records for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAttendance.map((record) => (
              <div key={record._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {record.employee.firstName} {record.employee.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{record.employee.employeeId}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      In: {new Date(record.checkIn).toLocaleTimeString()}
                    </span>
                    {record.checkOut ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Out: {new Date(record.checkOut).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        Present
                      </span>
                    )}
                    <span>{record.totalHours.toFixed(1)}h</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeManagementDashboard;
