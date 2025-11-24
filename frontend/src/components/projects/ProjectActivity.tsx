//path: frontend/src/components/projects/ProjectActivity.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  User, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  Upload,
  Edit,
  Trash2,
  Clock,
  Calendar
} from "lucide-react";
import { projectActivityAPI, ActivityItem } from "@/lib/api/projectActivityAPI";
import { toast } from "@/components/ui/use-toast";



interface ProjectActivityProps {
  projectId?: string;
}

const ProjectActivity: React.FC<ProjectActivityProps> = ({ projectId }) => {
  const [filter, setFilter] = useState<string>("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchActivities();
    }
  }, [projectId, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const filterType = filter === "all" ? undefined : filter;
      const data = await projectActivityAPI.getByProject(projectId!, filterType);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      setActivities([]);
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load project activity",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };




  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "task_updated":
        return <Edit className="h-4 w-4 text-orange-600" />;
      case "task_completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "file_uploaded":
        return <Upload className="h-4 w-4 text-purple-600" />;
      case "comment_added":
        return <MessageSquare className="h-4 w-4 text-indigo-600" />;
      case "project_updated":
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_created":
        return "bg-blue-100 text-blue-800";
      case "task_updated":
        return "bg-orange-100 text-orange-800";
      case "task_completed":
        return "bg-green-100 text-green-800";
      case "file_uploaded":
        return "bg-purple-100 text-purple-800";
      case "comment_added":
        return "bg-indigo-100 text-indigo-800";
      case "project_updated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="task_created">Tasks Created</SelectItem>
              <SelectItem value="task_updated">Tasks Updated</SelectItem>
              <SelectItem value="task_completed">Tasks Completed</SelectItem>
              <SelectItem value="file_uploaded">Files Uploaded</SelectItem>
              <SelectItem value="comment_added">Comments Added</SelectItem>
              <SelectItem value="project_updated">Project Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">Loading activity...</div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(activities) && activities.map((activity, index) => (
            <div key={activity._id} className="relative">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex gap-4">
                {/* Activity icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{activity.title}</h3>
                    <Badge variant="outline" className={getActivityColor(activity.type)}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-2">{activity.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {activity.user.firstName} {activity.user.lastName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTimeAgo(activity.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Additional metadata */}
                  {activity.metadata && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      {activity.metadata.taskName && (
                        <p className="text-sm">
                          <span className="font-medium">Task:</span> {activity.metadata.taskName}
                        </p>
                      )}
                      {activity.metadata.fileName && (
                        <p className="text-sm">
                          <span className="font-medium">File:</span> {activity.metadata.fileName}
                        </p>
                      )}
                      {activity.metadata.oldStatus && activity.metadata.newStatus && (
                        <p className="text-sm">
                          <span className="font-medium">Status change:</span> {activity.metadata.oldStatus} → {activity.metadata.newStatus}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No activity found</p>
            <p className="text-muted-foreground">
              {filter === "all" ? "No recent activity in this project" : "No activities match the selected filter"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectActivity;
