"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, DollarSign, User, Clock, 
  FileText, BarChart3, Briefcase, Award, TrendingUp, Activity, Users, 
  CheckCircle2, XCircle, AlertCircle, Target, Zap
} from 'lucide-react';
import Link from 'next/link';
import { employeesAPI } from '@/lib/api/employeesAPI';
import attendanceAPI from '@/lib/api/attendanceAPI';
import leaveAPI from '@/lib/api/leaveAPI';
import { toast } from '@/components/ui/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeDetailPage() {
  const { currency, formatAmount } = useCurrency();
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0, presentDays: 0, lateDays: 0, halfDays: 0, totalHours: 0, averageHours: 0
  });
  const [leaveBalance, setLeaveBalance] = useState({
    sick: { used: 0, total: 12 }, vacation: { used: 0, total: 21 }, personal: { used: 0, total: 5 }
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
      fetchAttendanceStats();
      fetchLeaveBalance();
      fetchRecentAttendance();
      fetchRecentLeaves();
    }
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const data = await employeesAPI.getById(employeeId);
      setEmployee(data);
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      toast({ title: "Error", description: "Failed to fetch employee details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
      setLeaveBalance(balance);
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
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/employees')} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => router.push(`/dashboard/employees/${employee._id}/edit`)} className="bg-white text-purple-600 hover:bg-white/90">
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{employee.firstName} {employee.lastName}</h1>
              <p className="text-xl text-white/90 mb-3">{employee.position}</p>
              <div className="flex flex-wrap gap-3">
                <Badge className={`${getStatusBadge(employee.status)} px-4 py-1 text-sm font-semibold`}>
                  {employee.status.toUpperCase()}
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 border-0">
                  <Briefcase className="w-3 h-3 mr-1" /> {employee.department}
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 border-0">
                  <Calendar className="w-3 h-3 mr-1" /> {getTenure()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Employee ID</p>
                <p className="text-2xl font-bold">{employee.employeeId}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Annual Salary</p>
                <p className="text-2xl font-bold">{formatAmount(employee.salary)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Attendance</p>
                <p className="text-2xl font-bold">{getAttendanceRate()}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Hours/Day</p>
                <p className="text-2xl font-bold">{attendanceStats.averageHours.toFixed(1)}h</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="w-4 h-4 mr-2" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4 mr-2" /> Leaves
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4 mr-2" /> Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" /> Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{employee.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                    <p className="font-medium">{employee.address.street}</p>
                    <p className="text-sm text-muted-foreground">{employee.address.city}, {employee.address.state} {employee.address.zipCode}</p>
                    <p className="text-sm text-muted-foreground">{employee.address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" /> Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                  <p className="font-semibold text-lg mb-1">{employee.emergencyContact.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">{employee.emergencyContact.relationship}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">{employee.emergencyContact.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills & Employment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                      <Zap className="w-3 h-3 mr-1" /> {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <span className="font-semibold">{employee.department}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Position</span>
                  <span className="font-semibold">{employee.position}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Hire Date</span>
                  <span className="font-semibold">{new Date(employee.hireDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Tenure</span>
                  <span className="font-semibold">{getTenure()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{attendanceStats.presentDays}</p>
                <p className="text-sm text-muted-foreground">Present Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-600">{attendanceStats.lateDays}</p>
                <p className="text-sm text-muted-foreground">Late Days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{attendanceStats.totalHours.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">{attendanceStats.averageHours.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendance.map((record: any) => (
                  <div key={record._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.checkIn).toLocaleTimeString()} - {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'In Progress'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={record.status === 'present' ? 'bg-green-100 text-green-800' : record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {record.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{record.totalHours.toFixed(1)}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-6">
          {/* Leave Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance (Current Year)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(leaveBalance).map(([type, balance]) => (
                  <div key={type} className="p-4 border rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold capitalize">{type}</h4>
                      <span className="text-sm text-muted-foreground">{balance.used}/{balance.total}</span>
                    </div>
                    <Progress value={(balance.used / balance.total) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">{balance.total - balance.used} days remaining</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leaves */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeaves.map((leave: any) => (
                  <div key={leave._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold capitalize">{leave.leaveType} Leave</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{leave.totalDays} days</p>
                    </div>
                    <Badge className={leave.status === 'approved' ? 'bg-green-100 text-green-800' : leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {leave.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Performance Metrics Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Track KPIs, goals, reviews, and achievements in this section
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
