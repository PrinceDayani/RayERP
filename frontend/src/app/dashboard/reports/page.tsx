"use client";

import React, { useState, useEffect } from 'react';
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
import { reportsAPI } from '@/lib/api/reportsAPI';
import { projectsAPI } from '@/lib/api/projectsAPI';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { formatCurrency, getUserPreferredCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

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
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [employeeReportsData, setEmployeeReportsData] = useState<any>(null);
  const [projectReportsData, setProjectReportsData] = useState<any>(null);
  const [taskReportsData, setTaskReportsData] = useState<any>(null);
  const [teamProductivityData, setTeamProductivityData] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [currency, setCurrency] = useState('INR');
  const router = useRouter();

  useEffect(() => {
    setCurrency(getUserPreferredCurrency());
  }, []);

  useEffect(() => {
    fetchAllReports();
  }, [dateRange]);

  const getDateRange = () => {
    const to = new Date().toISOString();
    const from = new Date();
    
    switch (dateRange) {
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
      case '90d':
        from.setDate(from.getDate() - 90);
        break;
      default:
        from.setDate(from.getDate() - 30);
    }
    
    return { from: from.toISOString(), to };
  };

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      
      // Fetch projects
      try {
        const projectsRes = await projectsAPI.getAll();
        const projects = projectsRes?.data?.projects || projectsRes?.data || projectsRes || [];
        setAllProjects(Array.isArray(projects) ? projects : []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setAllProjects([]);
      }
      
      // Fetch other reports with individual error handling
      try {
        const overviewRes = await reportsAPI.getOverview(dateParams);
        setOverviewData(overviewRes.data);
      } catch (err) {
        console.error('Error fetching overview:', err);
        setOverviewData(null);
      }

      try {
        const employeeRes = await reportsAPI.getEmployeeReports(dateParams);
        setEmployeeReportsData(employeeRes.data);
      } catch (err) {
        console.error('Error fetching employee reports:', err);
        setEmployeeReportsData(null);
      }

      try {
        const projectRes = await reportsAPI.getProjectReports(dateParams);
        setProjectReportsData(projectRes.data);
      } catch (err) {
        console.error('Error fetching project reports:', err);
        setProjectReportsData(null);
      }

      try {
        const taskRes = await reportsAPI.getTaskReports(dateParams);
        setTaskReportsData(taskRes.data);
      } catch (err) {
        console.error('Error fetching task reports:', err);
        setTaskReportsData(null);
      }

      try {
        const productivityRes = await reportsAPI.getTeamProductivity(dateParams);
        setTeamProductivityData(productivityRes.data || []);
      } catch (err) {
        console.error('Error fetching team productivity:', err);
        setTeamProductivityData([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Some reports failed to load. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare export data
  const getExportData = (): ExportData => ({
    selectedReport,
    dateRange,
    department,
    employeeData: teamProductivityData,
    projectReports: projectReportsData,
    taskAnalytics: taskReportsData,
    chatReports: [],
    contactReports: []
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

  // Transform API data for display
  const employeeData = teamProductivityData.map(emp => ({
    name: emp.name,
    department: department !== 'all' ? department : 'N/A',
    tasksCompleted: emp.completedTasks,
    hoursWorked: 0,
    efficiency: Math.round(emp.efficiency),
    attendance: Math.round(emp.completionRate)
  }));

  const projectReports = allProjects.map((proj: any) => ({
    _id: proj._id,
    name: proj.name,
    status: proj.status,
    progress: proj.progress || 0,
    budget: proj.budget || 0,
    spent: proj.spentBudget || 0,
    team: proj.team?.length || 0,
    dueDate: proj.endDate,
    priority: proj.priority,
    manager: proj.manager
  }));

  const taskAnalytics = taskReportsData?.statusBreakdown?.map((task: any) => ({
    category: task.status,
    total: task.count,
    completed: task.status === 'completed' ? task.count : 0,
    pending: task.status === 'pending' ? task.count : 0,
    overdue: taskReportsData?.overdueTasks || 0
  })) || [];

  const chatReports: any[] = [];
  const fileReports: any[] = [];
  const contactReports: any[] = [];
  const attendanceData = overviewData?.attendanceData || [];

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalEmployees || 0}</div>
            <p className="text-xs text-green-600">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalProjects || 0}</div>
            <p className="text-xs text-blue-600">{projectReportsData?.progress?.completedProjects || 0} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalTasks || 0}</div>
            <p className="text-xs text-green-600">{overviewData?.completionRate || 0}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">INR 189K</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
                  <Line type="monotone" dataKey="rate" stroke={COLORS.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Progress Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectReports}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Employee Performance Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Tasks</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Hours</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Efficiency</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No employee data available
                    </td>
                  </tr>
                ) : employeeData.map((employee, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4 font-medium">{employee.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{employee.department}</td>
                    <td className="py-3 px-4">{employee.tasksCompleted}</td>
                    <td className="py-3 px-4">{employee.hoursWorked}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={employee.efficiency} className="w-16 h-2" />
                        <span className="text-xs">{employee.efficiency}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={employee.attendance >= 95 ? 'default' : 'destructive'}>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Project Status & Budget Report
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/projects')}>
              View All Projects
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No project data available
              </div>
            ) : projectReports.map((project) => (
              <div key={project._id} className="bg-muted/50 p-4 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/dashboard/projects/${project._id}`} className="hover:underline">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      {project.name}
                      <ExternalLink className="h-4 w-4" />
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.priority === 'high' || project.priority === 'critical' ? 'destructive' : 'default'}>
                      {project.priority}
                    </Badge>
                    <Badge variant={project.status === 'completed' ? 'default' : project.status === 'active' ? 'secondary' : 'outline'}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Progress</span>
                    <div className="font-medium">{project.progress}%</div>
                    <Progress value={project.progress} className="mt-1 h-2" />
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget</span>
                    <div className="font-medium">{formatCurrency(project.budget, currency)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Spent</span>
                    <div className="font-medium text-orange-600">{formatCurrency(project.spent, currency)}</div>
                    <div className="text-xs text-muted-foreground">{project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0}% used</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Team Size</span>
                    <div className="font-medium">{project.team} members</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date</span>
                    <div className="font-medium text-xs">{new Date(project.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectReports.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-muted-foreground" angle={-45} textAnchor="end" height={80} />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                      <Bar dataKey="budget" fill={COLORS.primary} name="Budget" />
                      <Bar dataKey="spent" fill={COLORS.warning} name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: projectReports.filter(p => p.status === 'completed').length },
                          { name: 'Active', value: projectReports.filter(p => p.status === 'active').length },
                          { name: 'Planning', value: projectReports.filter(p => p.status === 'planning').length },
                          { name: 'On Hold', value: projectReports.filter(p => p.status === 'on-hold').length },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTaskReport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            Task Analytics by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {taskAnalytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No task data available
                </div>
              ) : taskAnalytics.map((category, index) => (
                <div key={index} className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">{category.category}</h3>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{category.total}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{category.completed}</div>
                      <div className="text-muted-foreground">Done</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">{category.pending}</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{category.overdue}</div>
                      <div className="text-muted-foreground">Overdue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Communication Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chatReports}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }} 
                  />
                  <Line type="monotone" dataKey="messages" stroke={COLORS.purple} strokeWidth={2} name="Messages" />
                  <Line type="monotone" dataKey="files" stroke={COLORS.orange} strokeWidth={2} name="Files" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-500" />
              File Sharing Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileReports.map((file, index) => (
                <div key={index} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{file.type}</h4>
                    <Badge variant="secondary">{file.shared} shared</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-pink-500" />
          Contact Management Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactReports.map((contact, index) => (
            <div key={index} className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">{contact.category}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{contact.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active</span>
                  <span className="text-green-600 font-medium">{contact.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New</span>
                  <span className="text-blue-600 font-medium">{contact.newThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interactions</span>
                  <span className="text-purple-600 font-medium">{contact.interactions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );



  const renderCompleteReport = () => (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">Complete ERP System Report</h2>
          <p className="text-blue-100">Comprehensive analysis of all modules and operations</p>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">1. Employee Management</h3>
        {renderEmployeeReport()}
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">2. Project Management</h3>
        {renderProjectReport()}
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">3. Task Analytics</h3>
        {renderTaskReport()}
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">4. Communication & Collaboration</h3>
        {renderChatReport()}
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">5. Contact Management</h3>
        {renderContactReport()}
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">6. Executive Summary</h3>
        {renderOverviewReport()}
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'complete': return renderCompleteReport();
      case 'overview': return renderOverviewReport();
      case 'employees': return renderEmployeeReport();
      case 'projects': return renderProjectReport();
      case 'tasks': return renderTaskReport();
      case 'chat': return renderChatReport();
      case 'contacts': return renderContactReport();
      default: return renderOverviewReport();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive ERP system reports and analytics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchAllReports} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40">
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
          
          <Select value={currency} onValueChange={(val) => { setCurrency(val); localStorage.setItem('preferredCurrency', val); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">? INR</SelectItem>
              <SelectItem value="USD">$ USD</SelectItem>
              <SelectItem value="EUR">ï¿½ EUR</SelectItem>
              <SelectItem value="GBP">ï¿½ GBP</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={handleExportText} 
                className="cursor-pointer"
                disabled={isExporting}
              >
                <File className="h-4 w-4 mr-2" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportPDF} 
                className="cursor-pointer"
                disabled={isExporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportExcel} 
                className="cursor-pointer"
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportCSV} 
                className="cursor-pointer"
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
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'complete', label: 'Complete ERP Report', icon: FileText },
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
      <div className="text-center text-muted-foreground text-sm py-4">
        <p>Report generated on: {new Date().toLocaleString()} ï¿½ Data updated in real-time</p>
      </div>
    </div>
  );
}

