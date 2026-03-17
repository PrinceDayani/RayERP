"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  CheckCircle, 
  Edit, 
  MessageSquare, 
  Paperclip, 
  Tag, 
  Users, 
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Filter
} from "lucide-react";
import { format } from "date-fns";

interface ActivityEvent {
  _id: string;
  type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'attachment_added' | 'tag_added' | 'completed' | 'deleted';
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  description: string;
  metadata?: any;
  timestamp: Date;
}

interface TaskActivityTimelineProps {
  taskId: string;
  activities?: ActivityEvent[];
  onRefresh?: () => void;
}

export function TaskActivityTimeline({ taskId, activities = [], onRefresh }: TaskActivityTimelineProps) {
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>(activities);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<string>("all");

  useEffect(() => {
    applyFilters();
  }, [activities, filterType, searchQuery, timeRange]);

  const applyFilters = () => {
    let filtered = [...activities];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${activity.user.firstName} ${activity.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date();
      const ranges: Record<string, number> = {
        "today": 1,
        "week": 7,
        "month": 30,
      };
      const days = ranges[timeRange];
      if (days) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoff);
      }
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      created: Plus,
      updated: Edit,
      status_changed: RefreshCw,
      assigned: Users,
      commented: MessageSquare,
      attachment_added: Paperclip,
      tag_added: Tag,
      completed: CheckCircle,
      deleted: Trash2,
    };
    const Icon = icons[type] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      created: "bg-blue-500",
      updated: "bg-yellow-500",
      status_changed: "bg-purple-500",
      assigned: "bg-indigo-500",
      commented: "bg-green-500",
      attachment_added: "bg-orange-500",
      tag_added: "bg-pink-500",
      completed: "bg-green-600",
      deleted: "bg-red-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      created: "Created",
      updated: "Updated",
      status_changed: "Status Changed",
      assigned: "Assigned",
      commented: "Commented",
      attachment_added: "Attachment Added",
      tag_added: "Tag Added",
      completed: "Completed",
      deleted: "Deleted",
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="status_changed">Status Changed</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="commented">Commented</SelectItem>
              <SelectItem value="attachment_added">Attachments</SelectItem>
              <SelectItem value="tag_added">Tags</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          {(filterType !== "all" || searchQuery || timeRange !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType("all");
                setSearchQuery("");
                setTimeRange("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Activity Items */}
          <div className="space-y-6">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                <div key={activity._id || index} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${getActivityColor(activity.type)} text-white flex-shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {activity.user.firstName[0]}
                            {activity.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getActivityLabel(activity.type)}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    
                    {/* Metadata */}
                    {activity.metadata && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        {activity.metadata.oldValue && activity.metadata.newValue && (
                          <div className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">
                              {activity.metadata.oldValue}
                            </span>
                            <span>→</span>
                            <span className="font-medium">{activity.metadata.newValue}</span>
                          </div>
                        )}
                        {activity.metadata.comment && (
                          <p className="italic">&quot;{activity.metadata.comment}&quot;</p>
                        )}
                        {activity.metadata.fileName && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{activity.metadata.fileName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No activities found</p>
                {(filterType !== "all" || searchQuery || timeRange !== "all") && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setFilterType("all");
                      setSearchQuery("");
                      setTimeRange("all");
                    }}
                    className="mt-2"
                  >
                    Clear filters to see all activities
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {filteredActivities.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Showing {filteredActivities.length} of {activities.length} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
