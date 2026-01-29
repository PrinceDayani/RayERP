'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionLoader } from '@/components/PageLoader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, MessageSquare, Share2, UserPlus, CheckCircle, Clock, Filter, Upload, Trash2, Edit, Eye, Activity as ActivityIcon, Calendar, RefreshCw, Search, X, Info, Shield, Database, User, Settings, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { exportToCSV, exportToExcel } from '@/lib/utils/activityExport';
import { ActivityCharts } from '@/components/ActivityCharts';
import { useToast } from '@/hooks/use-toast';

interface Activity {
  _id: string;
  timestamp: Date;
  userName: string;
  action: string;
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'user' | 'role' | 'department' | 'report' | 'notification' | 'system' | 'auth' | 'other';
  details: string;
  status: 'success' | 'error' | 'warning';
  projectId?: { _id: string; name: string };
  projectName?: string;
  metadata?: any;
  ipAddress?: string;
  visibility?: string;
  user?: { _id: string; name: string; email: string };
  requestId?: string;
  duration?: number;
  errorStack?: string;
  userAgent?: string;
  sessionId?: string;
  httpMethod?: string;
  endpoint?: string;
  changes?: { before?: any; after?: any };
}

interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  weekActivities: number;
  monthActivities: number;
  resourceTypeStats: { _id: string; count: number }[];
  actionStats: { _id: string; count: number }[];
}

const getActionIcon = (action: string, resourceType: string) => {
  if (action === 'share' && resourceType === 'file') return <Upload className="h-4 w-4" />;
  if (action === 'delete' && resourceType === 'file') return <Trash2 className="h-4 w-4" />;
  if (action === 'share') return <Share2 className="h-4 w-4" />;
  if (action === 'comment' || resourceType === 'comment') return <MessageSquare className="h-4 w-4" />;
  if (action === 'assign') return <UserPlus className="h-4 w-4" />;
  if (action === 'complete') return <CheckCircle className="h-4 w-4" />;
  if (action === 'update') return <Edit className="h-4 w-4" />;
  if (action === 'view') return <Eye className="h-4 w-4" />;
  if (action === 'delete') return <Trash2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'share': return 'bg-primary';
    case 'comment': return 'bg-primary/80';
    case 'create': return 'bg-primary';
    case 'update': return 'bg-primary/70';
    case 'delete': return 'bg-destructive';
    case 'complete': return 'bg-primary';
    default: return 'bg-muted-foreground';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

function ActivityPageContent() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userNameFilter, setUserNameFilter] = useState('');
  const [projectNameFilter, setProjectNameFilter] = useState('');
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const debouncedUserNameFilter = useDebounce(userNameFilter, 500);
  const debouncedProjectNameFilter = useDebounce(projectNameFilter, 500);

  const fetchActivities = async () => {
    if (!token) {
      console.warn('[Activity] No auth token available');
      return;
    }
    
    const startTime = performance.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.group(`[Activity] ${requestId} - Fetching activities`);
    console.log('Request Parameters:', {
      page,
      limit: 20,
      filters: {
        resourceType: filter !== 'all' ? filter : 'none',
        action: actionFilter !== 'all' ? actionFilter : 'none',
        status: statusFilter !== 'all' ? statusFilter : 'none',
        category: categoryFilter !== 'all' ? categoryFilter : 'none',
        userName: debouncedUserNameFilter || 'none'
      },
      dateRange: {
        start: startDate || 'none',
        end: endDate || 'none'
      },
      timestamp: new Date().toISOString()
    });
    
    try {
      setLoading(true);
      setError(null);
      const filterParam = filter !== 'all' ? `&resourceType=${filter}` : '';
      const dateParams = `${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
      const actionParam = actionFilter && actionFilter !== 'all' ? `&action=${actionFilter}` : '';
      const statusParam = statusFilter && statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const categoryParam = categoryFilter && categoryFilter !== 'all' ? `&category=${categoryFilter}` : '';
      const userParam = debouncedUserNameFilter ? `&userName=${debouncedUserNameFilter}` : '';
      const projectParam = debouncedProjectNameFilter ? `&projectName=${debouncedProjectNameFilter}` : '';
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/activity?page=${page}&limit=20${filterParam}${dateParams}${actionParam}${statusParam}${categoryParam}${userParam}${projectParam}`;
      console.log('Full Request URL:', url);
      console.log('Request Headers:', {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log('Response Received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Data Parsed Successfully:', {
          activitiesReceived: data.data?.length || 0,
          pagination: {
            currentPage: data.pagination?.page || 0,
            totalPages: data.pagination?.pages || 0,
            totalItems: data.pagination?.total || 0,
            hasMore: (data.pagination?.page || 0) < (data.pagination?.pages || 0)
          },
          firstActivity: data.data?.[0] ? {
            id: data.data[0]._id,
            user: data.data[0].userName,
            action: data.data[0].action,
            resource: data.data[0].resource,
            timestamp: data.data[0].timestamp
          } : null,
          lastActivity: data.data?.[data.data.length - 1] ? {
            id: data.data[data.data.length - 1]._id,
            user: data.data[data.data.length - 1].userName,
            action: data.data[data.data.length - 1].action,
            resource: data.data[data.data.length - 1].resource,
            timestamp: data.data[data.data.length - 1].timestamp
          } : null
        });
        setActivities(data.data);
        setTotalPages(data.pagination.pages);
        console.log(`✅ Success - Loaded ${data.data?.length || 0} activities in ${duration}ms`);
      } else {
        const errorText = await response.text();
        console.error('❌ Server Error:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          url
        });
        setError(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      const endTime = performance.now();
      console.error('❌ Network/Fetch Error:', {
        error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        possibleCauses: [
          'Backend server not running',
          'Network connectivity issue',
          'CORS configuration problem',
          'Invalid API URL'
        ]
      });
      setError('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5001');
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const fetchActivityStats = async () => {
    if (!token) {
      console.warn('[Activity Stats] No auth token available');
      return;
    }
    
    console.log('[Activity Stats] Fetching statistics...');
    const startTime = performance.now();
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/activity/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const endTime = performance.now();
      console.log(`[Activity Stats] Request completed in ${(endTime - startTime).toFixed(2)}ms`);

      if (response.ok) {
        const data = await response.json();
        console.log('[Activity Stats] Stats received:', {
          total: data.data?.totalActivities,
          today: data.data?.todayActivities,
          week: data.data?.weekActivities,
          month: data.data?.monthActivities,
          resourceTypes: data.data?.resourceTypeStats?.length || 0,
          actions: data.data?.actionStats?.length || 0
        });
        setStats(data.data);
      } else {
        console.error('[Activity Stats] Server error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[Activity Stats] Fetch error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const fetchActivityDetails = async (activityId: string) => {
    if (!token) {
      console.warn('[Activity Details] No auth token available');
      return;
    }
    
    console.log('[Activity Details] Fetching details for:', activityId);
    const startTime = performance.now();
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/activity/${activityId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const endTime = performance.now();
      console.log(`[Activity Details] Request completed in ${(endTime - startTime).toFixed(2)}ms`);

      if (response.ok) {
        const data = await response.json();
        console.log('[Activity Details] Details received:', {
          id: data.data?._id,
          action: data.data?.action,
          user: data.data?.userName,
          resource: data.data?.resource
        });
        setSelectedActivity(data.data);
        setShowDetailModal(true);
      } else {
        console.error('[Activity Details] Server error:', response.status, response.statusText);
        toast({ 
          title: 'Error', 
          description: 'Failed to load activity details', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('[Activity Details] Fetch error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({ 
        title: 'Error', 
        description: 'Failed to load activity details', 
        variant: 'destructive' 
      });
    }
  };

  const setQuickFilter = useCallback((preset: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        setStartDate(weekAgo);
        setEndDate(today);
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
        setStartDate(monthAgo);
        setEndDate(today);
        break;
    }
  }, []);

  const handleExport = useCallback((format: 'csv' | 'excel') => {
    console.log('[Activity Export] Starting export:', { format, count: activities.length });
    
    if (activities.length === 0) {
      console.warn('[Activity Export] No activities to export');
      toast({ title: 'No data', description: 'No activities to export', variant: 'destructive' });
      return;
    }
    
    try {
      const filename = `activities_${new Date().toISOString().split('T')[0]}`;
      if (format === 'csv') {
        exportToCSV(activities, `${filename}.csv`);
      } else {
        exportToExcel(activities, `${filename}.xlsx`);
      }
      console.log('[Activity Export] Export successful:', { format, filename, count: activities.length });
      toast({ title: 'Success', description: `Exported ${activities.length} activities` });
    } catch (error) {
      console.error('[Activity Export] Export failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({ title: 'Error', description: 'Failed to export activities', variant: 'destructive' });
    }
  }, [activities, toast]);

  const clearAllFilters = () => {
    setFilter('all');
    setActionFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setUserNameFilter('');
    setProjectNameFilter('');
    setStartDate('');
    setEndDate('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, filter, startDate, endDate, actionFilter, statusFilter, categoryFilter, debouncedUserNameFilter, debouncedProjectNameFilter]);

  useEffect(() => {
    fetchActivityStats();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <ActivityIcon className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activity Feed</h1>
            <p className="text-muted-foreground mt-1">Monitor all activities across your organization</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCharts(!showCharts)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {showCharts ? 'Hide' : 'Show'} Charts
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={fetchActivities} className="bg-primary hover:bg-primary/90 shadow-lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Activities</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalActivities}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Today</p>
                  <p className="text-3xl font-bold text-primary">{stats.todayActivities}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">This Week</p>
                  <p className="text-3xl font-bold text-primary">{stats.weekActivities}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">This Month</p>
                  <p className="text-3xl font-bold text-primary">{stats.monthActivities}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <ActivityIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      {showCharts && stats && <ActivityCharts stats={stats} />}

      {/* Filters Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('today')}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('yesterday')}>
                Yesterday
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('week')}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('month')}>
                This Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          {/* Filters */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="file">Files</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user name..."
                    value={userNameFilter}
                    onChange={(e) => setUserNameFilter(e.target.value)}
                    className="pl-10"
                    aria-label="Search activities by user name"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by project name..."
                    value={projectNameFilter}
                    onChange={(e) => setProjectNameFilter(e.target.value)}
                    className="pl-10"
                    aria-label="Search activities by project name"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                  aria-label="Start date"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                  aria-label="End date"
                />
              </div>

              {(filter !== 'all' || (actionFilter && actionFilter !== 'all') || (statusFilter && statusFilter !== 'all') || (categoryFilter && categoryFilter !== 'all') || userNameFilter || projectNameFilter || startDate || endDate) && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-destructive/10 rounded-full mb-4">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold mb-2">Connection Error</p>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">{error}</p>
            <Button onClick={fetchActivities}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex justify-center items-center py-16">
            <SectionLoader text="Loading activities..." />
          </CardContent>
        </Card>
      ) : activities.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">No activities found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card 
              key={activity._id} 
              className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden touch-manipulation active:scale-[0.98]"
              tabIndex={0}
              role="article"
              aria-label={`Activity: ${activity.userName} ${activity.action}d ${activity.resource}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fetchActivityDetails(activity._id);
                }
              }}
            >
              <CardContent className="p-6 relative">
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl ${getActionColor(activity.action)} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {getActionIcon(activity.action, activity.resourceType)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        activity.status === 'success' ? 'bg-primary' : 
                        activity.status === 'error' ? 'bg-destructive' : 'bg-muted-foreground'
                      }`}></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-base leading-relaxed">
                          <span className="font-bold text-primary">{activity.userName}</span>
                          {' '}
                          <span className="text-muted-foreground capitalize">{activity.action}d</span>
                          {' '}
                          <span className="font-semibold text-foreground">{activity.resource}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{activity.details}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize font-medium">
                            {activity.resourceType}
                          </Badge>
                          {(activity.projectId || activity.projectName) && (
                            <Badge variant="secondary" className="text-xs">
                              📁 {activity.projectId?.name || activity.projectName}
                            </Badge>
                          )}
                          {activity.metadata?.category && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              {getCategoryIcon(activity.metadata.category)}
                              {activity.metadata.category}
                            </Badge>
                          )}
                          {activity.metadata?.severity && activity.metadata.severity !== 'low' && (
                            <Badge className={`text-xs ${getSeverityColor(activity.metadata.severity)}`}>
                              {activity.metadata.severity}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap block">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground/70 whitespace-nowrap block mt-1">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchActivityDetails(activity._id)}
                          className="text-xs h-8 px-3 hover:bg-primary/10 hover:text-primary"
                          aria-label="View activity details"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="disabled:opacity-50"
              >
                Previous
              </Button>
              <div className="px-4 py-2 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">
                  Page <span className="text-primary font-bold">{page}</span> of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Detail Modal */}
      {showDetailModal && selectedActivity && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-modal-title"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${getActionColor(selectedActivity.action)} flex items-center justify-center text-white shadow-lg`}>
                    {getActionIcon(selectedActivity.action, selectedActivity.resourceType)}
                  </div>
                  <div>
                    <h2 id="activity-modal-title" className="text-xl font-bold">Activity Details</h2>
                    <p className="text-sm text-muted-foreground">Complete information about this activity</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-base leading-relaxed">
                  <span className="font-bold text-primary">{selectedActivity.userName}</span>
                  {' '}
                  <span className="text-muted-foreground capitalize">{selectedActivity.action}d</span>
                  {' '}
                  <span className="font-semibold">{selectedActivity.resource}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">{selectedActivity.details}</p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timestamp</label>
                  <p className="text-sm font-medium mt-1">{new Date(selectedActivity.timestamp).toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                  <div className="mt-2">
                    <Badge 
                      variant={selectedActivity.status === 'error' ? 'destructive' : selectedActivity.status === 'warning' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {selectedActivity.status}
                    </Badge>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resource Type</label>
                  <p className="text-sm font-medium mt-1 capitalize">{selectedActivity.resourceType}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</label>
                  <p className="text-sm font-medium mt-1 capitalize">{selectedActivity.action}</p>
                </div>
              </div>

              {/* Project Information */}
              {(selectedActivity.projectId || selectedActivity.projectName) && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <label className="text-xs font-semibold text-primary uppercase tracking-wide">Project</label>
                  <p className="text-sm font-medium mt-1">{selectedActivity.projectId?.name || selectedActivity.projectName}</p>
                </div>
              )}

              {/* Performance & Technical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedActivity.duration !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</label>
                    <p className="text-sm font-mono mt-1">{selectedActivity.duration}ms</p>
                  </div>
                )}
                {selectedActivity.requestId && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Request ID</label>
                    <p className="text-sm font-mono mt-1">{selectedActivity.requestId}</p>
                  </div>
                )}
                {selectedActivity.httpMethod && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">HTTP Method</label>
                    <p className="text-sm font-mono mt-1">{selectedActivity.httpMethod}</p>
                  </div>
                )}
                {selectedActivity.endpoint && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endpoint</label>
                    <p className="text-sm font-mono mt-1 break-all">{selectedActivity.endpoint}</p>
                  </div>
                )}
              </div>

              {/* User Information */}
              {selectedActivity.user && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">User Details</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm"><span className="font-medium">Name:</span> {selectedActivity.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm"><span className="font-medium">Email:</span> {selectedActivity.user.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedActivity.ipAddress && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">IP Address</label>
                    <p className="text-sm font-mono mt-1">{selectedActivity.ipAddress}</p>
                  </div>
                )}
                {selectedActivity.visibility && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visibility</label>
                    <p className="text-sm mt-1 capitalize">{selectedActivity.visibility}</p>
                  </div>
                )}
                {selectedActivity.userAgent && (
                  <div className="bg-muted/30 rounded-lg p-4 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User Agent</label>
                    <p className="text-sm font-mono mt-1 break-all">{selectedActivity.userAgent}</p>
                  </div>
                )}
                {selectedActivity.sessionId && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session ID</label>
                    <p className="text-sm font-mono mt-1">{selectedActivity.sessionId}</p>
                  </div>
                )}
              </div>

              {/* Error Stack */}
              {selectedActivity.errorStack && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <label className="text-xs font-semibold text-destructive uppercase tracking-wide mb-3 block">Error Stack Trace</label>
                  <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto">{selectedActivity.errorStack}</pre>
                </div>
              )}

              {/* Changes */}
              {selectedActivity.changes && (selectedActivity.changes.before || selectedActivity.changes.after) && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Changes</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedActivity.changes.before && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Before:</p>
                        <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto">{JSON.stringify(selectedActivity.changes.before, null, 2)}</pre>
                      </div>
                    )}
                    {selectedActivity.changes.after && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">After:</p>
                        <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto">{JSON.stringify(selectedActivity.changes.after, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Additional Information</label>
                  <div className="space-y-3">
                    {selectedActivity.metadata.category && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Category:</span>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          {getCategoryIcon(selectedActivity.metadata.category)}
                          {selectedActivity.metadata.category}
                        </Badge>
                      </div>
                    )}
                    {selectedActivity.metadata.severity && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Severity:</span>
                        <Badge className={`text-xs ${getSeverityColor(selectedActivity.metadata.severity)}`}>
                          {selectedActivity.metadata.severity}
                        </Badge>
                      </div>
                    )}
                    {Object.entries(selectedActivity.metadata)
                      .filter(([key]) => !['category', 'severity', 'timestamp'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="text-sm text-muted-foreground">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-6">
              <div className="flex justify-end">
                <Button onClick={() => setShowDetailModal(false)} className="bg-primary hover:bg-primary/90">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <ProtectedRoute requiredPermissions={['view_activity', 'view_audit_logs']}>
      <ActivityPageContent />
    </ProtectedRoute>
  );
}
