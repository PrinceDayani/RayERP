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
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchLower);
    const idMatch = employee.employeeId.toLowerCase().includes(searchLower);
    const deptMatch = employee.department?.toLowerCase().includes(searchLower) || false;
    const deptsMatch = employee.departments?.some(dept => dept.toLowerCase().includes(searchLower)) || false;
    return nameMatch || idMatch || deptMatch || deptsMatch;
  });

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage your workforce efficiently with real-time insights</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">Live Data</span>
            </div>
            <Button onClick={() => router.push("/dashboard/employees/create")} className="btn-primary-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalEmployees}</p>
                  <p className="text-xs text-muted-foreground mt-1">All workforce</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeEmployees}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Currently working</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                  <p className="text-3xl font-bold text-foreground">{stats.presentToday}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">In office now</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                  <p className="text-3xl font-bold text-foreground">{stats.onLeave}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Away today</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                  <UserX className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="employees" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Employees</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Attendance</TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Leaves</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Employees */}
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Recent Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees.slice(0, 5).map((employee) => (
                    <div key={employee._id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                          <span className="text-primary font-semibold text-lg">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{employee.firstName} {employee.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{employee.position} • {employee.department}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(employee.status)} variant="secondary">
                              {employee.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">{employee.employeeId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="font-medium text-sm">{new Date(employee.hireDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    All Employees
                  </CardTitle>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64 bg-muted/50 border-0 focus:bg-background"
                      />
                    </div>
                    <Button onClick={() => router.push("/dashboard/employees/create")} className="btn-primary-gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                </div>
              </CardHeader>
                <CardContent>
                <div className="overflow-x-auto">
                  <div className="table-modern rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-4 font-semibold text-muted-foreground">Employee ID</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Name</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Department</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Position</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Hire Date</th>
                          <th className="text-left p-4 font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((employee) => (
                          <tr 
                            key={employee._id} 
                            className="table-row-hover border-b border-border/50 cursor-pointer"
                            onClick={() => router.push(`/dashboard/employees/${employee._id}`)}
                          >
                            <td className="p-4">
                              <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">{employee.employeeId}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                  <span className="text-primary font-semibold text-sm">
                                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{employee.firstName} {employee.lastName}</p>
                                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {employee.departments && employee.departments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {employee.departments.map((dept, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                                      {dept}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                                  {employee.department || 'N/A'}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-foreground font-medium">{employee.position}</td>
                            <td className="p-4">
                              <Badge className={getStatusColor(employee.status)} variant="secondary">
                                {employee.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-muted-foreground">{new Date(employee.hireDate).toLocaleDateString()}</td>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/employees/${employee._id}`)}
                                  className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                  title="View Details"
                                >
                                  <User className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/employees/${employee._id}/edit`)}
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                  title="Edit Employee"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteEmployee(employee._id, `${employee.firstName} ${employee.lastName}`)}
                                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
                </div>

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Leave Management</CardTitle>
          <Button onClick={() => setIsCreateLeaveOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Leave Request
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaves.map((leave: any) => (
            <div key={leave._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {leave.employee?.firstName || 'N/A'} {leave.employee?.lastName || ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {leave.leaveType} - {leave.totalDays} days
                  </p>
                  <p className="text-sm">
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
                      <Button size="sm" onClick={() => handleStatusUpdate(leave._id, 'approved')}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(leave._id, 'rejected', 'Not approved')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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
      <Card>
        <CardHeader>
          <CardTitle>Employee Reports & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label>Department</Label>
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
        <Card>
          <CardHeader>
            <CardTitle>Department Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentSummary.map((dept: any) => (
                <div key={dept._id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{dept._id}</p>
                    <p className="text-sm text-muted-foreground">{dept.count} employees</p>
                  </div>
                  <p className="font-medium">₹{Math.round(dept.avgSalary).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceSummary.map((att: any) => (
                <div key={att._id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium capitalize">{att._id}</p>
                    <p className="text-sm text-muted-foreground">{att.count} days</p>
                  </div>
                  <p className="font-medium">{Math.round(att.totalHours)}h</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-left p-2">Department</th>
                  <th className="text-left p-2">Attendance</th>
                  <th className="text-left p-2">Hours</th>
                  <th className="text-left p-2">Leaves</th>
                  <th className="text-left p-2">Salary</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((emp: any) => (
                  <tr key={emp.employee._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{emp.employee.name}</p>
                        <p className="text-sm text-muted-foreground">{emp.employee.employeeId}</p>
                      </div>
                    </td>
                    <td className="p-2">{emp.employee.department}</td>
                    <td className="p-2">
                      <div className="text-sm">
                        <p>{emp.attendance.presentDays}/{emp.attendance.totalDays} days</p>
                        <p className="text-muted-foreground">{emp.attendance.lateDays} late</p>
                      </div>
                    </td>
                    <td className="p-2">{Math.round(emp.attendance.totalHours)}h</td>
                    <td className="p-2">{emp.leaves.totalLeaves} days</td>
                    <td className="p-2">₹{emp.employee.salary.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Today's Attendance</CardTitle>
          <Button onClick={() => router.push("/dashboard/employees/attendance")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Attendance
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading attendance...</p>
          </div>
        ) : todayAttendance.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No attendance records for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAttendance.map((record) => (
              <div key={record._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">
                    {record.employee.firstName} {record.employee.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{record.employee.employeeId}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>Check-in: {new Date(record.checkIn).toLocaleTimeString()}</span>
                    {record.checkOut ? (
                      <span>Check-out: {new Date(record.checkOut).toLocaleTimeString()}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Currently Present</span>
                    )}
                    <span>Hours: {record.totalHours.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                  {!record.checkOut && (
                    <p className="text-xs text-green-600 mt-1">Active</p>
                  )}
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
