'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionLoader } from '@/components/PageLoader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, MessageSquare, Share2, UserPlus, CheckCircle, Clock, Filter, Upload, Trash2, Edit, Eye, Activity as ActivityIcon, Calendar, RefreshCw, Search, X, Info, AlertTriangle, AlertCircle, Shield, Database, User, Settings } from 'lucide-react';

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
  metadata?: any;
  ipAddress?: string;
  visibility?: string;
  user?: { _id: string; name: string; email: string };
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
    case 'share': return 'bg-blue-500';
    case 'comment': return 'bg-purple-500';
    case 'create': return 'bg-green-500';
    case 'update': return 'bg-yellow-500';
    case 'delete': return 'bg-red-500';
    case 'complete': return 'bg-emerald-500';
    default: return 'bg-gray-500';
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
  const [stats, setStats] = useState<ActivityStats | null>(null);

  const fetchActivities = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const filterParam = filter !== 'all' ? `&resourceType=${filter}` : '';
      const dateParams = `${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
      const actionParam = actionFilter && actionFilter !== 'all' ? `&action=${actionFilter}` : '';
      const statusParam = statusFilter && statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const categoryParam = categoryFilter && categoryFilter !== 'all' ? `&category=${categoryFilter}` : '';
      const userParam = userNameFilter ? `&userName=${userNameFilter}` : '';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/activity?page=${page}&limit=20${filterParam}${dateParams}${actionParam}${statusParam}${categoryParam}${userParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        setError(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5001');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    if (!token) return;
    
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

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    }
  };

  const fetchActivityDetails = async (activityId: string) => {
    if (!token) return;
    
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

      if (response.ok) {
        const data = await response.json();
        setSelectedActivity(data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
    }
  };

  const clearAllFilters = () => {
    setFilter('all');
    setActionFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setUserNameFilter('');
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
  }, [page, filter, startDate, endDate, actionFilter, statusFilter, categoryFilter, userNameFilter]);

  useEffect(() => {
    fetchActivityStats();
  }, [token]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ActivityIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Activity Feed</CardTitle>
                <p className="text-sm text-muted-foreground">Latest activities in your organization</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchActivities}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalActivities}</div>
                <div className="text-sm text-blue-600">Total Activities</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.todayActivities}</div>
                <div className="text-sm text-green-600">Today</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.weekActivities}</div>
                <div className="text-sm text-purple-600">This Week</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.monthActivities}</div>
                <div className="text-sm text-orange-600">This Month</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
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
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
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
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name..."
                  value={userNameFilter}
                  onChange={(e) => setUserNameFilter(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              {(filter !== 'all' || (actionFilter && actionFilter !== 'all') || (statusFilter && statusFilter !== 'all') || (categoryFilter && categoryFilter !== 'all') || userNameFilter || startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-destructive mb-4 text-center">
              <p className="text-lg font-semibold mb-2">⚠️ Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={fetchActivities} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <SectionLoader text="Loading activities..." />
          </CardContent>
        </Card>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No activities found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-lg transition-all hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getActionColor(activity.action)} flex items-center justify-center text-white shadow-md`}>
                    {getActionIcon(activity.action, activity.resourceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">
                          <span className="font-bold text-primary">{activity.userName}</span>
                          {' '}
                          <span className="text-muted-foreground capitalize">{activity.action}d</span>
                          {' '}
                          <span className="font-semibold">{activity.resource}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{activity.details}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.resourceType}
                          </Badge>
                          {activity.projectId && (
                            <Badge variant="secondary" className="text-xs">
                              📁 {activity.projectId.name}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.action}
                          </Badge>
                          {activity.status !== 'success' && (
                            <Badge 
                              variant={activity.status === 'error' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {activity.status}
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
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap block">
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
                          className="text-xs h-7 px-2"
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
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Activity Detail Modal */}
      {showDetailModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Activity Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Header */}
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full ${getActionColor(selectedActivity.action)} flex items-center justify-center text-white shadow-md`}>
                    {getActionIcon(selectedActivity.action, selectedActivity.resourceType)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">
                      <span className="font-bold text-primary">{selectedActivity.userName}</span>
                      {' '}
                      <span className="text-muted-foreground capitalize">{selectedActivity.action}d</span>
                      {' '}
                      <span className="font-semibold">{selectedActivity.resource}</span>
                    </h3>
                    <p className="text-muted-foreground mt-1">{selectedActivity.details}</p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                    <p className="text-sm">{new Date(selectedActivity.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={selectedActivity.status === 'error' ? 'destructive' : selectedActivity.status === 'warning' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {selectedActivity.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resource Type</label>
                    <p className="text-sm capitalize">{selectedActivity.resourceType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Action</label>
                    <p className="text-sm capitalize">{selectedActivity.action}</p>
                  </div>
                </div>

                {/* Project Information */}
                {selectedActivity.projectId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project</label>
                    <p className="text-sm">{selectedActivity.projectId.name}</p>
                  </div>
                )}

                {/* User Information */}
                {selectedActivity.user && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User Details</label>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Name:</span> {selectedActivity.user.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedActivity.user.email}</p>
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedActivity.ipAddress && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                      <p className="text-sm font-mono">{selectedActivity.ipAddress}</p>
                    </div>
                  )}
                  {selectedActivity.visibility && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                      <p className="text-sm capitalize">{selectedActivity.visibility}</p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Additional Information</label>
                    <div className="mt-2 space-y-2">
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
                            <span className="text-sm">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowDetailModal(false)}>
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
