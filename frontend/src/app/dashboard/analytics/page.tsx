"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle, Calendar, Download, Award, Target, MessageSquare, FileText, Phone, Package, ShoppingCart, Clock, AlertTriangle, Star, Activity } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  emerald: '#10b981'
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [department, setDepartment] = useState('all');
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 24,
    onlineEmployees: 18,
    activeChats: 7,
    pendingTasks: 12
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        onlineEmployees: prev.onlineEmployees + Math.floor(Math.random() * 3) - 1,
        activeChats: prev.activeChats + Math.floor(Math.random() * 2) - 1,
        pendingTasks: prev.pendingTasks + Math.floor(Math.random() * 2) - 1
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const productivityData = [
    { week: 'W1', productivity: 85, tasks: 24, hours: 40, attendance: 92 },
    { week: 'W2', productivity: 78, tasks: 28, hours: 42, attendance: 88 },
    { week: 'W3', productivity: 92, tasks: 31, hours: 38, attendance: 95 },
    { week: 'W4', productivity: 88, tasks: 26, hours: 41, attendance: 91 }
  ];

  const taskDistribution = [
    { name: 'Completed', value: 145, color: COLORS.success },
    { name: 'In Progress', value: 32, color: COLORS.primary },
    { name: 'Pending', value: 18, color: COLORS.warning },
    { name: 'Overdue', value: 8, color: COLORS.danger }
  ];

  const chatMetrics = [
    { day: 'Mon', messages: 245, files: 12, activeUsers: 18 },
    { day: 'Tue', messages: 189, files: 8, activeUsers: 22 },
    { day: 'Wed', messages: 312, files: 15, activeUsers: 20 },
    { day: 'Thu', messages: 278, files: 11, activeUsers: 24 },
    { day: 'Fri', messages: 156, files: 6, activeUsers: 16 }
  ];

  const fileShareData = [
    { type: 'Documents', shared: 45, downloads: 128 },
    { type: 'Images', shared: 32, downloads: 89 },
    { type: 'PDFs', shared: 28, downloads: 76 },
    { type: 'Spreadsheets', shared: 15, downloads: 42 }
  ];

  const departmentPerformance = [
    { name: 'Development', productivity: 92, tasks: 45, employees: 8, color: COLORS.primary },
    { name: 'Design', productivity: 88, tasks: 32, employees: 5, color: COLORS.purple },
    { name: 'Marketing', productivity: 85, tasks: 28, employees: 6, color: COLORS.orange },
    { name: 'HR', productivity: 90, tasks: 22, employees: 4, color: COLORS.pink },
    { name: 'Finance', productivity: 87, tasks: 18, employees: 3, color: COLORS.info }
  ];

  const projectProgress = [
    { name: 'ERP Module Update', progress: 85, status: 'On Track', priority: 'High', dueDate: '2025-11-15' },
    { name: 'Mobile App Development', progress: 45, status: 'At Risk', priority: 'Medium', dueDate: '2025-11-20' },
    { name: 'Database Migration', progress: 30, status: 'Delayed', priority: 'Critical', dueDate: '2025-11-12' },
    { name: 'UI/UX Redesign', progress: 72, status: 'On Track', priority: 'Medium', dueDate: '2025-11-25' }
  ];

  const inventoryData = [
    { category: 'Office Supplies', inStock: 245, lowStock: 12, outOfStock: 3 },
    { category: 'IT Equipment', inStock: 89, lowStock: 5, outOfStock: 1 },
    { category: 'Furniture', inStock: 156, lowStock: 8, outOfStock: 2 }
  ];

  const orderAnalytics = [
    { month: 'Jul', orders: 45, revenue: 12500, completed: 42 },
    { month: 'Aug', orders: 52, revenue: 15200, completed: 48 },
    { month: 'Sep', orders: 38, revenue: 11800, completed: 35 },
    { month: 'Oct', orders: 61, revenue: 18900, completed: 58 },
    { month: 'Nov', orders: 29, revenue: 8700, completed: 25 }
  ];

  const topPerformers = [
    { name: 'Sarah Johnson', tasksCompleted: 28, efficiency: 94, department: 'Development', rating: 4.9 },
    { name: 'Mike Chen', tasksCompleted: 25, efficiency: 91, department: 'Design', rating: 4.8 },
    { name: 'Emily Davis', tasksCompleted: 23, efficiency: 89, department: 'Marketing', rating: 4.7 },
    { name: 'John Smith', tasksCompleted: 21, efficiency: 87, department: 'Development', rating: 4.6 }
  ];

  const projectDues = [
    { name: 'ERP Module Update', progress: 85, status: 'On Track', priority: 'High', dueDate: '2025-11-15', remainingDays: 5 },
    { name: 'Mobile App Development', progress: 45, status: 'At Risk', priority: 'Medium', dueDate: '2025-11-20', remainingDays: 10 },
    { name: 'Database Migration', progress: 30, status: 'Delayed', priority: 'Critical', dueDate: '2025-11-12', remainingDays: 2 },
    { name: 'UI/UX Redesign', progress: 72, status: 'On Track', priority: 'Medium', dueDate: '2025-11-25', remainingDays: 15 }
  ];

  const projectData = [
    { month: 'Jul', rate: 78 },
    { month: 'Aug', rate: 82 },
    { month: 'Sep', rate: 85 },
    { month: 'Oct', rate: 88 },
    { month: 'Nov', rate: 84 }
  ];

  const attendanceData = [
    { day: 'Mon', rate: 92 },
    { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 95 },
    { day: 'Thu', rate: 91 },
    { day: 'Fri', rate: 87 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'bg-green-500';
      case 'At Risk': return 'bg-yellow-500';
      case 'Delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Comprehensive ERP insights and real-time performance metrics</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Live Updates Active</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{realTimeData.activeUsers}</div>
            <p className="text-xs text-blue-200">Currently online</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Employees Present</CardTitle>
            <Users className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{realTimeData.onlineEmployees}</div>
            <p className="text-xs text-green-200">Checked in today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{realTimeData.activeChats}</div>
            <p className="text-xs text-purple-200">Ongoing conversations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{realTimeData.pendingTasks}</div>
            <p className="text-xs text-orange-200">Require attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-100">Files Shared</CardTitle>
            <FileText className="h-4 w-4 text-cyan-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">156</div>
            <p className="text-xs text-cyan-200">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-600 to-pink-700 border-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-100">Contacts</CardTitle>
            <Phone className="h-4 w-4 text-pink-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">342</div>
            <p className="text-xs text-pink-200">Total managed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-indigo-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1,247</div>
            <p className="text-xs text-indigo-200">In stock</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">89</div>
            <p className="text-xs text-emerald-200">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Employee Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">88.5%</div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+5.2% from last month
            </p>
            <Progress value={88.5} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Project Completion</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">84.2%</div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+2.1% from last month
            </p>
            <Progress value={84.2} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">78.4%</div>
            <p className="text-xs text-yellow-400 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />-1.3% from last week
            </p>
            <Progress value={78.4} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Attendance Rate</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">91.7%</div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+3.4% from last week
            </p>
            <Progress value={91.7} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Productivity & Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Employee Productivity & Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="productivity" stroke={COLORS.primary} strokeWidth={2} name="Productivity %" />
                  <Line type="monotone" dataKey="attendance" stroke={COLORS.success} strokeWidth={2} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Dues Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Project Dues & Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectDues.map((project: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{project.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                      <Badge className={`${getStatusColor(project.status)} text-white`}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Due: {project.dueDate}</span>
                    <span>{project.remainingDays} days remaining</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="text-xs text-gray-400 mt-1">{project.progress}% complete</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Project Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="rate" stroke={COLORS.success} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Bar dataKey="rate" fill={COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Top Performing Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((employee: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{employee.name}</div>
                    <div className="text-sm text-gray-400">{employee.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{employee.tasksCompleted} tasks</div>
                  <div className="text-sm text-green-400">{employee.efficiency}% efficiency</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
