"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Plus,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import attendanceAPI, { TodayStats } from '@/lib/api/attendanceAPI';
import employeeAPI from '@/lib/api/employeesAPI';
import AttendanceDashboard from '@/components/employee/AttendanceDashboard';

interface AttendanceRecord {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
  };
  date: string;
  checkIn: string;
  checkOut?: string;
  breakTime: number;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

const AttendanceManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '09:00',
    checkOut: '17:00',
    notes: ''
  });
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalHours: 0,
    averageHours: 0
  });
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalEmployees: 0,
    presentToday: 0,
    lateArrivals: 0,
    totalHours: 0,
    avgHours: 0,
    attendanceRecords: []
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      fetchAttendance();
      fetchStats();
      fetchTodayStats();
    }
  }, [isAuthenticated, selectedDate, selectedEmployee]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for attendance events
    const handleAttendanceUpdate = () => {
      fetchTodayStats();
      fetchAttendance();
    };

    // Add event listeners if socket is available
    if (typeof window !== 'undefined' && (window as any).io) {
      const socket = (window as any).io();
      socket.on('attendance:checkin', handleAttendanceUpdate);
      socket.on('attendance:checkout', handleAttendanceUpdate);
      socket.on('attendance:marked', handleAttendanceUpdate);
      socket.on('attendance:updated', handleAttendanceUpdate);

      return () => {
        socket.off('attendance:checkin', handleAttendanceUpdate);
        socket.off('attendance:checkout', handleAttendanceUpdate);
        socket.off('attendance:marked', handleAttendanceUpdate);
        socket.off('attendance:updated', handleAttendanceUpdate);
      };
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAttendance(), fetchStats(), fetchTodayStats()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const data = await attendanceAPI.getTodayStats();
      setTodayStats(data);
    } catch (error: any) {
      console.error('Error fetching today stats:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch today's stats",
        variant: "destructive"
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeAPI.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch employees",
        variant: "destructive"
      });
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      // For today's attendance, use current date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (selectedDate) {
        params.startDate = selectedDate;
        params.endDate = selectedDate;
      } else {
        // Default to today if no date selected
        params.startDate = todayStr;
        params.endDate = todayStr;
      }
      
      if (selectedEmployee && selectedEmployee !== 'all') {
        params.employee = selectedEmployee;
      }
      
      console.log('Fetching attendance with params:', params);
      const data = await attendanceAPI.getAll(params);
      console.log('Received attendance data:', data);
      const attendanceData = Array.isArray(data) ? data : [];
      setAttendance(attendanceData);
      
      // Calculate today's real-time stats
      calculateTodayStats(attendanceData);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch attendance records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayStats = (attendanceData: AttendanceRecord[]) => {
    // This function is now replaced by fetchTodayStats from the backend
    fetchTodayStats();
  };

  const fetchStats = async () => {
    try {
      const currentDate = new Date();
      const params = {
        employeeId: selectedEmployee && selectedEmployee !== 'all' ? selectedEmployee : undefined,
        month: (currentDate.getMonth() + 1).toString(),
        year: currentDate.getFullYear().toString()
      };
      
      const data = await attendanceAPI.getStats(params);
      setStats(data || {
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalHours: 0,
        averageHours: 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setStats({
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalHours: 0,
        averageHours: 0
      });
    }
  };

  const handleCheckIn = async (employeeId: string) => {
    try {
      await attendanceAPI.checkIn(employeeId);
      toast({
        title: "Success",
        description: "Check-in recorded successfully"
      });
      await Promise.all([fetchAttendance(), fetchStats(), fetchTodayStats()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check in",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    try {
      await attendanceAPI.checkOut(employeeId);
      toast({
        title: "Success",
        description: "Check-out recorded successfully"
      });
      await Promise.all([fetchAttendance(), fetchStats(), fetchTodayStats()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check out",
        variant: "destructive"
      });
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const data = {
        employee: attendanceForm.employee,
        date: attendanceForm.date,
        status: attendanceForm.status,
        checkIn: `${attendanceForm.date}T${attendanceForm.checkIn}:00`,
        checkOut: attendanceForm.checkOut ? `${attendanceForm.date}T${attendanceForm.checkOut}:00` : undefined,
        notes: attendanceForm.notes
      };
      
      await attendanceAPI.markAttendance(data);
      toast({
        title: "Success",
        description: "Attendance marked successfully"
      });
      setIsMarkAttendanceOpen(false);
      setAttendanceForm({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: '09:00',
        checkOut: '17:00',
        notes: ''
      });
      await Promise.all([fetchAttendance(), fetchStats(), fetchTodayStats()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark attendance",
        variant: "destructive"
      });
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

  if (!isAuthenticated) {
    return (
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-4">Please log in to access Attendance Management</p>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Attendance Management</h1>
              <p className="text-muted-foreground">Track and manage employee attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Live Updates</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                  <p className="text-2xl font-bold">{todayStats.presentToday}</p>
                  <p className="text-xs text-muted-foreground">of {todayStats.totalEmployees} employees</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
                  <p className="text-2xl font-bold">{todayStats.lateArrivals}</p>
                  <p className="text-xs text-muted-foreground">today</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{todayStats.totalHours.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">today</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Hours/Day</p>
                  <p className="text-2xl font-bold">{todayStats.avgHours.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">today</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList>
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
            <TabsTrigger value="records">Attendance Records</TabsTrigger>
            <TabsTrigger value="checkin">Quick Check-in/out</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Today's Attendance</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={refreshData}>
                      Refresh
                    </Button>
                    <Button onClick={() => setIsMarkAttendanceOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No attendance records for today</p>
                    </div>
                  ) : (
                    attendance.map((record) => (
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            <AttendanceDashboard
              attendanceData={attendance}
              employees={employees}
              onRefresh={refreshData}
              onMarkAttendance={handleMarkAttendance}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          </TabsContent>

          <TabsContent value="checkin">
            <Card>
              <CardHeader>
                <CardTitle>Quick Check-in/Check-out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => {
                    const todayAttendance = attendance.find(
                      a => a.employee._id === employee._id && 
                      new Date(a.date).toDateString() === new Date().toDateString()
                    );
                    
                    return (
                      <div key={employee._id} className="border rounded-lg p-4">
                        <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{employee.employeeId}</p>
                        
                        {!todayAttendance ? (
                          <Button 
                            className="w-full" 
                            onClick={() => handleCheckIn(employee._id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In
                          </Button>
                        ) : !todayAttendance.checkOut ? (
                          <div className="space-y-2">
                            <Badge className={getStatusColor(todayAttendance.status)}>
                              {todayAttendance.status} - Checked In
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              In: {new Date(todayAttendance.checkIn).toLocaleTimeString()}
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleCheckOut(employee._id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Check Out
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <Badge className={getStatusColor(todayAttendance.status)}>
                              {todayAttendance.status} - Complete
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              In: {new Date(todayAttendance.checkIn).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Out: {new Date(todayAttendance.checkOut).toLocaleTimeString()}
                            </p>
                            <p className="text-sm font-medium">
                              {todayAttendance.totalHours.toFixed(1)} hours
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mark Attendance Dialog */}
        <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Select value={attendanceForm.employee} onValueChange={(value) => setAttendanceForm({...attendanceForm, employee: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {`${emp.firstName} ${emp.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={attendanceForm.status} onValueChange={(value) => setAttendanceForm({...attendanceForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Time</Label>
                  <Input 
                    type="time" 
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm({...attendanceForm, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Check-out Time</Label>
                  <Input 
                    type="time" 
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm({...attendanceForm, checkOut: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input 
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAttendance}>
                Mark Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default AttendanceManagement;
