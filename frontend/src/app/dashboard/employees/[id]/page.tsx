"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Coins, User, Clock,
  FileText, BarChart3, Briefcase, Award, TrendingUp, Activity, Users,
  CheckCircle2, XCircle, AlertCircle, Target, Zap, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { ResourceAllocation, Task, TaskStats, SkillMatrixData, Skill, LeaveBalance, LeaveBalanceType, Achievement, WorkSummary, CareerEvent } from '@/types/employee-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { employeesAPI } from '@/lib/api/employeesAPI';
import { getAllProjects } from '@/lib/api/projectsAPI';
import attendanceAPI from '@/lib/api/attendanceAPI';
import leaveAPI from '@/lib/api/leaveAPI';
import { resourceApi } from '@/lib/api/resources';
import { toast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { generateProfilePDF } from '@/lib/utils/profile-pdf';
import SkillMatrix from '@/components/employee/SkillMatrix';
import ProjectHistory from '@/components/employee/ProjectHistory';
import AttendanceInsights from '@/components/employee/AttendanceInsights';
import SalaryManagement from '@/components/employee/SalaryManagement';
import CareerTimeline from '@/components/employee/CareerTimeline';
import WorkSummaryDashboard from '@/components/employee/WorkSummaryDashboard';
import AchievementsSection from '@/components/employee/AchievementsSection';
import { achievementAPI, careerAPI } from '@/lib/api/employeeProfileAPI';

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  skills: string[];
  projects?: any[];
  skillsMatrix?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [additionalLoading, setAdditionalLoading] = useState(true);

  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0, presentDays: 0, lateDays: 0, halfDays: 0, totalHours: 0, averageHours: 0
  });
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    sick: { used: 0, total: 12 }, vacation: { used: 0, total: 21 }, personal: { used: 0, total: 5 }
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);

  const [projects, setProjects] = useState<ResourceAllocation[]>([]);
  const [skillsMatrix, setSkillsMatrix] = useState<Skill[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ completed: 0, inProgress: 0, overdue: 0, total: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [workSummary, setWorkSummary] = useState<WorkSummary | null>(null);
  const [careerEvents, setCareerEvents] = useState<any[]>([]);

  useEffect(() => {
    if (employeeId) {
      loadAllData();
    }
  }, [employeeId]);

  const loadAllData = async () => {
    setLoading(true);
    setAdditionalLoading(true);

    // Critical Data First
    await fetchEmployeeDetails();

    // Secondary Data - Parallel Fetch
    try {
      await Promise.all([
        fetchAttendanceStats(),
        fetchLeaveBalance(),
        fetchRecentAttendance(),
        fetchRecentLeaves(),
        fetchProjects(),
        fetchSkillsMatrix(),
        fetchTasks(),
        fetchTaskStats(),
        fetchAchievements(),
        fetchCareerEvents()
      ]);
    } catch (e) {
      console.error("Error loading secondary data", e);
    } finally {
      setAdditionalLoading(false);
    }
  };

  const fetchEmployeeDetails = async () => {
    try {
      const data = await employeesAPI.getById(employeeId);
      setEmployee(data);
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      toast({ title: "Error", description: "Failed to fetch employee details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ... keep other fetch functions but remove their individual try-catches if desired, 
  // or keep them for granular error handling. For safety, I'll keep them as robust separate functions 
  // but call them via Promise.all above.

  // NOTE: I am NOT removing the existing fetch functions below, just updating the useEffect and state above.
  // ...

  const fetchAttendanceStats = async () => {
    try {
      const currentDate = new Date();
      const stats = await attendanceAPI.getStats({
        employeeId, month: (currentDate.getMonth() + 1).toString(), year: currentDate.getFullYear().toString()
      });
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const balance = await leaveAPI.getBalance(employeeId);
      setLeaveBalance(balance as unknown as LeaveBalance);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const data = await attendanceAPI.getAll({
        employee: employeeId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      setRecentAttendance(data);
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
    }
  };

  const fetchRecentLeaves = async () => {
    try {
      const data = await leaveAPI.getAll({ employee: employeeId });
      setRecentLeaves(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent leaves:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      // Try to get resource allocations first
      const allocationsResponse = await resourceApi.getResourceAllocations({ employeeId });
      const allocations = allocationsResponse.data || [];
      
      // If no allocations, try to get projects where employee is in team
      if (allocations.length === 0) {
        const allProjectsResponse = await getAllProjects();
        const allProjects = allProjectsResponse || [];
        
        // Filter projects where employee is in the team
        const employeeProjects = allProjects
          .filter(project => {
            return project.team && (
              project.team.includes(employeeId) || 
              project.team.some((member: any) => 
                typeof member === 'object' ? member._id === employeeId : member === employeeId
              )
            );
          })
          .map(project => ({
            _id: project._id,
            project: {
              _id: project._id,
              name: project.name,
              status: project.status,
              startDate: project.startDate,
              endDate: project.endDate
            },
            employee: {
              _id: employeeId,
              firstName: employee?.firstName || '',
              lastName: employee?.lastName || ''
            },
            role: 'Team Member',
            status: project.status || 'active',
            startDate: project.startDate,
            endDate: project.endDate,
            allocatedHours: 40, // Default allocation
            team: project.team
          }));
        
        setProjects(employeeProjects as unknown as ResourceAllocation[]);
      } else {
        setProjects(allocations as unknown as ResourceAllocation[]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchSkillsMatrix = async () => {
    try {
      const response = await resourceApi.getSkillMatrix({ employee: employeeId });
      const data = response.data as any; // Cast to avoid strict type checks for now, or define interface
      if (Array.isArray(data)) {
        setSkillsMatrix(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.matrix)) {
        setSkillsMatrix(data.matrix);
      } else {
        setSkillsMatrix([]);
      }
    } catch (error) {
      console.error('Error fetching skills matrix:', error);
      setSkillsMatrix([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await employeesAPI.getTasks(employeeId);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const data = await employeesAPI.getTaskStats(employeeId);
      setTaskStats(data || { completed: 0, inProgress: 0, overdue: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const fetchAchievements = async () => {
    if (!employeeId) return;
    try {
      const data = await achievementAPI.getEmployeeAchievements(employeeId);
      setAchievements(data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      setAchievements([]);
    }
  };

  const fetchCareerEvents = async () => {
    if (!employeeId) return;
    try {
      const data = await careerAPI.getEmployeeCareer(employeeId);
      setCareerEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch career events:', error);
      setCareerEvents([]);
    }
  };

  const handleProjectsUpdate = (updatedProjects: any[]) => {
    setProjects(updatedProjects);
    // Here you would also call API to update projects
  };

  const handleSkillsUpdate = (updatedSkills: any[]) => {
    setSkillsMatrix(updatedSkills);
    // Here you would also call API to update skills
  };

  // Calculate work summary from existing data
  const calculateWorkSummary = (): WorkSummary => {
    const years = employee ? Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0;

    // Get unique roles from projects
    const uniqueRoles = [...new Set(projects.map(p => p.role))].filter(Boolean);

    // Get top skills from skill matrix
    const topSkills = skillsMatrix
      .filter(s => s.level === 'Expert' || s.level === 'Advanced')
      .map(s => s.skill)
      .slice(0, 5);

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalHours: attendanceStats.totalHours || 0,
      totalTasks: taskStats.total,
      completedTasks: taskStats.completed,
      attendanceRate: getAttendanceRate(),
      topSkills: topSkills.length > 0 ? topSkills : employee?.skills.slice(0, 5) || [],
      topRoles: uniqueRoles.slice(0, 3),
      yearsOfExperience: years
    };
  };


  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      inactive: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      terminated: 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500 text-white';
  };

  const getTenure = () => {
    if (!employee) return '0 years';
    const years = Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((new Date().getTime() - new Date(employee.hireDate).getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    return `${years}y ${months}m`;
  };

  const getAttendanceRate = () => {
    if (attendanceStats.totalDays === 0) return 0;
    return Math.round((attendanceStats.presentDays / attendanceStats.totalDays) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Employee Not Found</h2>
            <p className="text-muted-foreground">The requested employee could not be found</p>
            <Button onClick={() => router.push('/dashboard/employees')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Employees
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/employees')} className="print:hidden">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-muted-foreground">{employee.position} • {employee.department}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusBadge(employee.status)} px-3 py-1`}>
            {employee.status.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const summary = calculateWorkSummary();
              generateProfilePDF(
                employee,
                projects,
                skillsMatrix,
                tasks,
                taskStats,
                attendanceStats,
                leaveBalance,
                summary,
                achievements
              );
            }}
            className="print:hidden"
          >
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={() => router.push(`/dashboard/employees/${employee._id}/edit`)} className="btn-primary-gradient print:hidden">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                <p className="text-xl font-bold text-foreground">{employee.employeeId}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Salary</p>
                <p className="text-xl font-bold text-foreground">₹{employee.salary.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <p className="text-xl font-bold text-foreground">{getAttendanceRate()}%</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-xl font-bold text-foreground">{projects.length}</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tenure</p>
                <p className="text-xl font-bold text-foreground">{getTenure()}</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card dark:bg-card shadow-sm border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="allocation">Resource Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Work Summary */}
          {additionalLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : employee ? (
            <WorkSummaryDashboard summary={calculateWorkSummary()} />
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact & Personal Info */}
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">Email</span>
                    </div>
                    <span className="font-medium text-sm">{employee.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Phone</span>
                    </div>
                    <span className="font-medium text-sm">{employee.phone}</span>
                  </div>
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">Address</span>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{employee.address.street}</p>
                      <p className="text-muted-foreground">{employee.address.city}, {employee.address.state}</p>
                    </div>
                  </div>
                </div>
                
                {/* Emergency Contact */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" /> Emergency Contact
                  </h4>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <p className="font-medium">{employee.emergencyContact.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.emergencyContact.relationship}</p>
                    <p className="text-sm font-medium">{employee.emergencyContact.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment & Skills */}
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Department</span>
                    <span className="font-medium text-sm">{employee.department}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Position</span>
                    <span className="font-medium text-sm">{employee.position}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Hire Date</span>
                    <span className="font-medium text-sm">{new Date(employee.hireDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Salary</span>
                    <span className="font-medium text-sm">₹{employee.salary.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Skills */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {employee.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{employee.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-modern border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Present Days</p>
                    <p className="text-xl font-bold">{attendanceStats.presentDays}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-modern border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Late Days</p>
                    <p className="text-xl font-bold">{attendanceStats.lateDays}</p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-modern border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                    <p className="text-xl font-bold">{attendanceStats.totalHours.toFixed(0)}h</p>
                  </div>
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-modern border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Hours/Day</p>
                    <p className="text-xl font-bold">{attendanceStats.averageHours.toFixed(1)}h</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attendance */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentAttendance.map((record: any) => (
                  <div key={record._id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={record.status === 'present' ? 'bg-green-100 text-green-800' : record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {record.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{record.totalHours.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="projects">
          {additionalLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <ProjectHistory
              employeeId={employeeId}
              projects={projects}
              onProjectsUpdate={(updated) => {
                console.log("Project updated:", updated);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="skills">
          {additionalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6">
              <SkillMatrix
                employeeId={employeeId}
                skills={skillsMatrix as any}
                onSkillsUpdate={(updated) => {
                  console.log("Skills updated:", updated);
                }}
                editable={false}
              />
              <AchievementsSection
                employeeId={employeeId}
                achievements={achievements}
                editable={false}
              />
            </div>
          )}
        </TabsContent>



        <TabsContent value="allocation" className="space-y-6">
          {/* Employee Resource Allocation Timeline */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Resource Allocation Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {additionalLoading ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : (
                <div className="space-y-4">
                  {/* Timeline Header */}
                  <div className="grid grid-cols-[150px_1fr] gap-4">
                    <div className="font-semibold text-sm">Period</div>
                    <div className="grid grid-cols-6 gap-2 text-center text-xs font-medium text-muted-foreground">
                      {['This Month', 'Next Month', 'Month +2', 'Month +3', 'Month +4', 'Month +5'].map((month, idx) => (
                        <div key={idx}>{month}</div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Employee Timeline */}
                  <div className="grid grid-cols-[150px_1fr] gap-4 items-center py-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-semibold text-xs">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                    <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {[0, 1, 2, 3, 4, 5].map(monthOffset => {
                        const currentDate = new Date();
                        const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
                        
                        // Check if employee has projects in this month
                        const monthProjects = projects.filter(project => {
                          if (!project.team?.includes(employee._id)) return false;
                          const start = new Date(project.startDate);
                          const end = new Date(project.endDate);
                          const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
                          const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
                          return start <= monthEnd && end >= monthStart;
                        });
                        
                        const workload = monthProjects.length > 0 ? 50 : 0;
                        const widthPercent = 100 / 6;
                        const leftPercent = monthOffset * widthPercent;
                        const colorClass = workload > 0 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700';

                        return (
                          <div 
                            key={monthOffset}
                            className={`absolute h-full flex items-center justify-center text-xs font-medium ${colorClass}`}
                            style={{ 
                              left: `${leftPercent}%`, 
                              width: `${widthPercent}%`,
                              borderRight: monthOffset < 5 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                            }}
                            title={`${targetMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}: ${workload > 0 ? `${workload}% - ${monthProjects.map(p => p.name).join(', ')}` : 'Free'}`}
                          >
                            {workload > 0 ? `${workload}%` : 'Free'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Current Projects */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Current Project Assignments</h4>
                    <div className="space-y-2">
                      {projects.filter(project => {
                        // Check if employee is assigned to this project
                        return project.project || project.team?.includes(employee._id) || project.employee?._id === employee._id;
                      }).map(project => (
                        <div key={project._id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{project.project?.name || project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className={(project.status || project.project?.status) === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {project.status || project.project?.status || 'active'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{project.allocatedHours || 40}h allocation</p>
                          </div>
                        </div>
                      ))}
                      {projects.filter(project => {
                        return project.project || project.team?.includes(employee._id) || project.employee?._id === employee._id;
                      }).length === 0 && (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No current project assignments</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {additionalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="card-modern border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                        <p className="text-xl font-bold">{taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%</p>
                      </div>
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-modern border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                        <p className="text-xl font-bold">{projects.length}</p>
                      </div>
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-modern border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Skills</p>
                        <p className="text-xl font-bold">{skillsMatrix.length}</p>
                      </div>
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-modern border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                        <p className="text-xl font-bold">{taskStats.total}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Task Breakdown & Career Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-modern">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" /> Task Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <span className="text-sm font-medium">Completed</span>
                        <span className="font-bold text-green-600">{taskStats.completed}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <span className="text-sm font-medium">In Progress</span>
                        <span className="font-bold text-blue-600">{taskStats.inProgress}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <span className="text-sm font-medium">Overdue</span>
                        <span className="font-bold text-red-600">{taskStats.overdue}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-modern">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {achievements.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No achievements recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {achievements.slice(0, 3).map((achievement, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <div>
                              <p className="font-medium text-sm">{achievement.title}</p>
                              <p className="text-xs text-muted-foreground">{new Date(achievement.dateEarned).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Career Timeline */}
              <CareerTimeline
                employeeId={employeeId}
                hireDate={employee.hireDate}
                currentPosition={employee.position}
                currentDepartment={employee.department}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
