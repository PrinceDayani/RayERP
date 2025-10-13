//path: frontend/src/components/projects/ProjectTimeline.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, CheckCircle, AlertCircle, PlayCircle } from "lucide-react";
import { projectTimelineAPI, TimelineEvent } from "@/lib/api/projectTimelineAPI";
import { toast } from "@/components/ui/use-toast";



interface ProjectTimelineProps {
  projectId?: string;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ projectId }) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchTimeline();
    }
  }, [projectId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const data = await projectTimelineAPI.getByProject(projectId!);
      setTimelineEvents(data);
    } catch (error: any) {
      console.error("Error fetching timeline:", error);
      if (error.response?.status === 404) {
        setTimelineEvents([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to load project timeline",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "milestone":
        return "bg-purple-100 text-purple-800";
      case "task":
        return "bg-blue-100 text-blue-800";
      case "meeting":
        return "bg-orange-100 text-orange-800";
      case "deadline":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">Loading timeline...</div>
        ) : (
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
            <div key={event._id || event.id} className="relative">
              {/* Timeline line */}
              {index < timelineEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  {getStatusIcon(event.status)}
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge variant="outline" className={getTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-2">{event.description}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
        
        {!loading && timelineEvents.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No timeline events</p>
            <p className="text-muted-foreground">Timeline events will appear here as the project progresses</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTimeline;