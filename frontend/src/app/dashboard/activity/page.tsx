'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, MessageSquare, Share2, UserPlus, CheckCircle, Clock, Filter, Upload, Trash2, Edit, Eye, Activity as ActivityIcon, Calendar, RefreshCw } from 'lucide-react';

interface Activity {
  _id: string;
  timestamp: Date;
  userName: string;
  action: string;
  resource: string;
  resourceType: 'project' | 'task' | 'file' | 'comment' | 'employee' | 'budget' | 'other';
  details: string;
  status: 'success' | 'error' | 'warning';
  projectId?: { _id: string; name: string };
  metadata?: any;
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

export default function ActivityPage() {
  const { token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchActivities = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const filterParam = filter !== 'all' ? `&resourceType=${filter}` : '';
      const dateParams = `${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/activity?page=${page}&limit=20${filterParam}${dateParams}`,
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
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, filter, startDate, endDate]);

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
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="file">Files</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
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
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
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
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground whitespace-nowrap block">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                        <span className="text-xs text-muted-foreground/70 whitespace-nowrap block mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
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
    </div>
  );
}
