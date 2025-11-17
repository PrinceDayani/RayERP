"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, FileText, Users, Target, MessageSquare, Phone, Calendar, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle, Star, ChevronDown, FileSpreadsheet, File } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToCSV, exportToText, ExportData } from '@/lib/exportUtils';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899'
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [department, setDepartment] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Prepare export data
  const getExportData = (): ExportData => ({
    selectedReport,
    dateRange,
    department,
    employeeData,
    projectReports,
    taskAnalytics,
    chatReports,
    contactReports
  });

  // Export handlers
  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      await exportToPDF(getExportData());
      toast.success('PDF exported successfully!', { id: 'pdf-export' });
    } catch (error) {
      toast.error('Failed to export PDF. Please try again.', { id: 'pdf-export' });
      console.error('PDF Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      toast.loading('Generating Excel file...', { id: 'excel-export' });
      exportToExcel(getExportData());
      toast.success('Excel file exported successfully!', { id: 'excel-export' });
    } catch (error) {
      toast.error('Failed to export Excel file. Please try again.', { id: 'excel-export' });
      console.error('Excel Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      toast.loading('Generating CSV file...', { id: 'csv-export' });
      exportToCSV(getExportData());
      toast.success('CSV file exported successfully!', { id: 'csv-export' });
    } catch (error) {
      toast.error('Failed to export CSV file. Please try again.', { id: 'csv-export' });
      console.error('CSV Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      toast.loading('Generating text file...', { id: 'text-export' });
      exportToText(getExportData());
      toast.success('Text file exported successfully!', { id: 'text-export' });
    } catch (error) {
      toast.error('Failed to export text file. Please try again.', { id: 'text-export' });
      console.error('Text Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Employee Reports Data
  const employeeData = [
    { name: 'Sarah Johnson', department: 'Development', tasksCompleted: 28, hoursWorked: 160, efficiency: 94, attendance: 98 },
    { name: 'Mike Chen', department: 'Design', tasksCompleted: 25, hoursWorked: 155, efficiency: 91, attendance: 95 },
    { name: 'Emily Davis', department: 'Marketing', tasksCompleted: 23, hoursWorked: 158, efficiency: 89, attendance: 97 },
    { name: 'John Smith', department: 'Development', tasksCompleted: 21, hoursWorked: 152, efficiency: 87, attendance: 92 }
  ];

  // Project Reports Data
  const projectReports = [
    { name: 'ERP Module Update', status: 'On Track', progress: 85, budget: 50000, spent: 42500, team: 8, dueDate: '2025-11-15' },
    { name: 'Mobile App Development', status: 'At Risk', progress: 45, budget: 75000, spent: 38000, team: 6, dueDate: '2025-11-20' },
    { name: 'Database Migration', status: 'Delayed', progress: 30, budget: 30000, spent: 25000, team: 4, dueDate: '2025-11-12' },
    { name: 'UI/UX Redesign', status: 'On Track', progress: 72, budget: 40000, spent: 28000, team: 5, dueDate: '2025-11-25' }
  ];

  // Task Reports Data
  const taskAnalytics = [
    { category: 'Development', total: 145, completed: 128, pending: 12, overdue: 5 },
    { category: 'Design', total: 89, completed: 76, pending: 8, overdue: 5 },
    { category: 'Marketing', total: 67, completed: 58, pending: 6, overdue: 3 },
    { category: 'Testing', total: 45, completed: 38, pending: 5, overdue: 2 }
  ];

  // Chat & Communication Reports
  const chatReports = [
    { week: 'W1', messages: 1245, files: 89, activeUsers: 24, avgResponseTime: 12 },
    { week: 'W2', messages: 1189, files: 76, activeUsers: 22, avgResponseTime: 15 },
    { week: 'W3', messages: 1356, files: 95, activeUsers: 26, avgResponseTime: 10 },
    { week: 'W4', messages: 1278, files: 82, activeUsers: 25, avgResponseTime: 13 }
  ];

  // File Sharing Reports
  const fileReports = [
    { type: 'Documents', shared: 156, downloaded: 423, departments: 5, users: 18 },
    { type: 'Images', shared: 89, downloaded: 267, departments: 4, users: 15 },
    { type: 'PDFs', shared: 67, downloaded: 189, departments: 3, users: 12 },
    { type: 'Spreadsheets', shared: 45, downloaded: 134, departments: 4, users: 10 }
  ];

  // Contact Reports
  const contactReports = [
    { category: 'Clients', total: 156, active: 142, newThisMonth: 12, interactions: 89 },
    { category: 'Vendors', total: 89, active: 78, newThisMonth: 5, interactions: 45 },
    { category: 'Partners', total: 34, active: 32, newThisMonth: 2, interactions: 23 },
    { category: 'Leads', total: 67, active: 45, newThisMonth: 18, interactions: 34 }
  ];

  const attendanceData = [
    { month: 'Jul', rate: 94.5 },
    { month: 'Aug', rate: 92.8 },
    { month: 'Sep', rate: 96.2 },
    { month: 'Oct', rate: 93.7 },
    { month: 'Nov', rate: 95.1 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'bg-green-500';
      case 'At Risk': return 'bg-yellow-500';
      case 'Delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">24</div>
            <p className="text-xs text-green-400">+2 this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-blue-400">3 completing this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">346</div>
            <p className="text-xs text-green-400">78% completion rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$189K</div>
            <p className="text-xs text-green-400">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Monthly Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="rate" stroke={COLORS.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Project Progress Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectReports}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Area type="monotone" dataKey="progress" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEmployeeReport = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Employee Performance Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Employee</th>
                  <th className="text-left py-3 px-4 text-gray-300">Department</th>
                  <th className="text-left py-3 px-4 text-gray-300">Tasks</th>
                  <th className="text-left py-3 px-4 text-gray-300">Hours</th>
                  <th className="text-left py-3 px-4 text-gray-300">Efficiency</th>
                  <th className="text-left py-3 px-4 text-gray-300">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((employee, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 px-4 text-white font-medium">{employee.name}</td>
                    <td className="py-3 px-4 text-gray-300">{employee.department}</td>
                    <td className="py-3 px-4 text-white">{employee.tasksCompleted}</td>
                    <td className="py-3 px-4 text-white">{employee.hoursWorked}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={employee.efficiency} className="w-16 h-2" />
                        <span className="text-white text-xs">{employee.efficiency}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={employee.attendance >= 95 ? 'bg-green-500' : employee.attendance >= 90 ? 'bg-yellow-500' : 'bg-red-500'}>
                        {employee.attendance}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectReport = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            Project Status & Budget Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectReports.map((project, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">{project.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                    <span className="text-sm text-gray-300">{project.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Progress</span>
                    <div className="text-white font-medium">{project.progress}%</div>
                    <Progress value={project.progress} className="mt-1 h-2" />
                  </div>
                  <div>
                    <span className="text-gray-400">Budget</span>
                    <div className="text-white font-medium">${project.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Spent</span>
                    <div className="text-white font-medium">${project.spent.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Team Size</span>
                    <div className="text-white font-medium">{project.team} members</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTaskReport = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-400" />
            Task Analytics by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {taskAnalytics.map((category, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-3">{category.category}</h3>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="text-lg font-bold text-blue-400">{category.total}</div>
                      <div className="text-gray-400">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">{category.completed}</div>
                      <div className="text-gray-400">Done</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-400">{category.pending}</div>
                      <div className="text-gray-400">Pending</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">{category.overdue}</div>
                      <div className="text-gray-400">Overdue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Bar dataKey="completed" fill={COLORS.success} name="Completed" />
                  <Bar dataKey="pending" fill={COLORS.warning} name="Pending" />
                  <Bar dataKey="overdue" fill={COLORS.danger} name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderChatReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              Communication Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chatReports}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="messages" stroke={COLORS.purple} strokeWidth={2} name="Messages" />
                  <Line type="monotone" dataKey="files" stroke={COLORS.orange} strokeWidth={2} name="Files" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              File Sharing Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileReports.map((file, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-medium">{file.type}</h4>
                    <Badge className="bg-blue-500">{file.shared} shared</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-300">
                    <span>Downloads: {file.downloaded}</span>
                    <span>Departments: {file.departments}</span>
                    <span>Users: {file.users}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContactReport = () => (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Phone className="h-5 w-5 text-pink-400" />
          Contact Management Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactReports.map((contact, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-3">{contact.category}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white font-medium">{contact.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active</span>
                  <span className="text-green-400 font-medium">{contact.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New</span>
                  <span className="text-blue-400 font-medium">{contact.newThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interactions</span>
                  <span className="text-purple-400 font-medium">{contact.interactions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );



  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview': return renderOverviewReport();
      case 'employees': return renderEmployeeReport();
      case 'projects': return renderProjectReport();
      case 'tasks': return renderTaskReport();
      case 'chat': return renderChatReport();
      case 'contacts': return renderContactReport();

      default: return renderOverviewReport();
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports Dashboard</h1>
          <p className="text-gray-400 mt-1">Comprehensive ERP system reports and analytics</p>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={handleExportText} 
                className="text-white hover:bg-gray-700 cursor-pointer"
                disabled={isExporting}
              >
                <File className="h-4 w-4 mr-2" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportPDF} 
                className="text-white hover:bg-gray-700 cursor-pointer"
                disabled={isExporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportExcel} 
                className="text-white hover:bg-gray-700 cursor-pointer"
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportCSV} 
                className="text-white hover:bg-gray-700 cursor-pointer"
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Navigation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'projects', label: 'Projects', icon: Target },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle },
              { id: 'chat', label: 'Communication', icon: MessageSquare },
              { id: 'contacts', label: 'Contacts', icon: Phone },

            ].map((report) => {
              const Icon = report.icon;
              return (
                <Button
                  key={report.id}
                  variant={selectedReport === report.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedReport(report.id)}
                  className={`${selectedReport === report.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {report.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div id="report-content">
        {renderReportContent()}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-sm py-4">
        <p>Report generated on: {new Date().toLocaleString()} • Data updated in real-time</p>
      </div>
    </div>
  );
}