"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  User,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { employeesAPI } from '@/lib/api';
import attendanceAPI from '@/lib/api/attendanceAPI';
import leaveAPI from '@/lib/api/leaveAPI';
import { toast } from '@/components/ui/use-toast';

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
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalHours: 0,
    averageHours: 0
  });
  const [leaveBalance, setLeaveBalance] = useState({
    sick: { used: 0, total: 12 },
    vacation: { used: 0, total: 21 },
    personal: { used: 0, total: 5 },
    maternity: { used: 0, total: 90 },
    paternity: { used: 0, total: 15 },
    emergency: { used: 0, total: 3 }
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
      toast({
        title: "Error",
        description: "Failed to fetch employee details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const currentDate = new Date();
      const stats = await attendanceAPI.getStats({
        employeeId,
        month: (currentDate.getMonth() + 1).toString(),
        year: currentDate.getFullYear().toString()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half-day': return 'bg-blue-100 text-blue-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Loading...</h1>
              <p className="text-gray-600">Fetching employee details</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Employee Not Found</h1>
              <p className="text-gray-600">The requested employee could not be found</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h1>
              <p className="text-gray-600">{employee.position} - {employee.department}</p>
            </div>
          </div>
          <Link href={`/dashboard/employees/${employee._id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Employee
            </Button>
          </Link>
        </div>

        {/* Employee Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{employee.employeeId}</h3>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">${employee.salary.toLocaleString()}</h3>
                  <p className="text-sm text-muted-foreground">Annual Salary</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">{new Date(employee.hireDate).toLocaleDateString()}</h3>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <p>{employee.address.street}</p>
                      <p>{employee.address.city}, {employee.address.state} {employee.address.zipCode}</p>
                      <p>{employee.address.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{employee.emergencyContact.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.emergencyContact.relationship}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{employee.emergencyContact.phone}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{employee.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="font-medium">
                      {Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <div className="space-y-6">
              {/* Attendance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{attendanceStats.presentDays}</p>
                      <p className="text-sm text-muted-foreground">Present Days</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateDays}</p>
                      <p className="text-sm text-muted-foreground">Late Days</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalHours.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{attendanceStats.averageHours.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                    </div>
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
                      <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.checkIn).toLocaleTimeString()} - 
                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'Not checked out'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getAttendanceStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {record.totalHours.toFixed(1)}h
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaves">
            <div className="space-y-6">
              {/* Leave Balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Leave Balance (Current Year)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(leaveBalance).map(([type, balance]) => (
                      <div key={type} className="p-3 border rounded-lg">
                        <h4 className="font-medium capitalize">{type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {balance.used} / {balance.total} days used
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(balance.used / balance.total) * 100}%` }}
                          ></div>
                        </div>
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
                      <div key={leave._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{leave.leaveType} Leave</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{leave.totalDays} days</p>
                        </div>
                        <Badge className={getLeaveStatusColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
                  <p className="text-muted-foreground mb-4">
                    Performance tracking and evaluation features coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}