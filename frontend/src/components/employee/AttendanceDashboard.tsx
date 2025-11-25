"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  XCircle, 
  Plus,
  Download,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Target
} from "lucide-react";
import { format } from "date-fns";

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
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

interface AttendanceDashboardProps {
  attendanceData: AttendanceRecord[];
  employees: any[];
  onRefresh: () => void;
  onMarkAttendance: (data: any) => void;
  onCheckIn: (employeeId: string) => void;
  onCheckOut: (employeeId: string) => void;
}

export default function AttendanceDashboard({ 
  attendanceData, 
  employees, 
  onRefresh, 
  onMarkAttendance,
  onCheckIn,
  onCheckOut 
}: AttendanceDashboardProps) {
  const [filters, setFilters] = useState({
    dateRange: { from: new Date(), to: new Date() },
    department: '',
    status: '',
    employee: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'calendar'>('table');
  const [showFilters, setShowFilters] = useState(false);

  const filteredData = attendanceData.filter(record => {
    const searchMatch = !filters.search || 
      `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.employee.employeeId.toLowerCase().includes(filters.search.toLowerCase());
    
    const departmentMatch = !filters.department || record.employee.department === filters.department;
    const statusMatch = !filters.status || record.status === filters.status;
    const employeeMatch = !filters.employee || record.employee._id === filters.employee;
    
    const recordDate = new Date(record.date);
    const dateMatch = recordDate >= filters.dateRange.from && recordDate <= filters.dateRange.to;
    
    return searchMatch && departmentMatch && statusMatch && employeeMatch && dateMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'half-day': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getAttendanceStats = () => {
    const total = filteredData.length;
    const present = filteredData.filter(r => r.status === 'present').length;
    const late = filteredData.filter(r => r.status === 'late').length;
    const halfDay = filteredData.filter(r => r.status === 'half-day').length;
    const absent = filteredData.filter(r => r.status === 'absent').length;
    const totalHours = filteredData.reduce((sum, r) => sum + r.totalHours, 0);
    const avgHours = total > 0 ? totalHours / total : 0;
    const attendanceRate = total > 0 ? ((present + late + halfDay) / total) * 100 : 0;

    return { total, present, late, halfDay, absent, totalHours, avgHours, attendanceRate };
  };

  const stats = getAttendanceStats();
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  const exportData = () => {
    const csvContent = [
      ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Notes'],
      ...filteredData.map(record => [
        record.employee.employeeId,
        `${record.employee.firstName} ${record.employee.lastName}`,
        record.employee.department,
        new Date(record.date).toLocaleDateString(),
        new Date(record.checkIn).toLocaleTimeString(),
        record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '',
        record.totalHours.toFixed(1),
        record.status,
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={onRefresh}>
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Department</Label>
                <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Employee</Label>
                <Select value={filters.employee} onValueChange={(value) => setFilters({ ...filters, employee: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All employees</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {`${emp.firstName} ${emp.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-muted-foreground">Present</div>
            <div className="text-xs text-green-600">
              {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-muted-foreground">Late</div>
            <div className="text-xs text-yellow-600">
              {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
            <div className="text-xs text-red-600">
              {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.attendanceRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Attendance Rate</div>
            <div className="text-xs text-muted-foreground">
              {stats.avgHours.toFixed(1)}h avg
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <div className="flex justify-between items-center">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {attendanceData.length} records
        </div>
      </div>

      {/* Data Display */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Employee</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Check In</th>
                    <th className="text-left p-4 font-semibold">Check Out</th>
                    <th className="text-left p-4 font-semibold">Hours</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{record.employee.firstName} {record.employee.lastName}</div>
                          <div className="text-sm text-muted-foreground">{record.employee.employeeId}</div>
                          <div className="text-xs text-muted-foreground">{record.employee.department}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm">
                          {new Date(record.checkIn).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : (
                            <span className="text-green-600 font-medium">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{record.totalHours.toFixed(1)}h</div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {!record.checkOut && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCheckOut(record.employee._id)}
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((record) => (
            <Card key={record._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{record.employee.firstName} {record.employee.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{record.employee.employeeId}</p>
                    <p className="text-xs text-muted-foreground">{record.employee.department}</p>
                  </div>
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check In:</span>
                    <span className="font-mono">{new Date(record.checkIn).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check Out:</span>
                    <span className="font-mono">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hours:</span>
                    <span className="font-semibold">{record.totalHours.toFixed(1)}h</span>
                  </div>
                </div>

                {!record.checkOut && (
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => onCheckOut(record.employee._id)}
                  >
                    Check Out
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
              <p className="text-muted-foreground">
                Calendar view with attendance visualization coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}