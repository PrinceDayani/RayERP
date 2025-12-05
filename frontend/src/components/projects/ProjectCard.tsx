"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AccessLevelIndicator } from "@/components/ui/access-level-indicator";
import { AccessRequestDialog } from "@/components/ui/access-request-dialog";
import { Calendar, Users, Edit, Eye, UserPlus, Lock } from "lucide-react";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  progress?: number;
  teamMembers?: any[];
  priority?: string;
  departments?: any[];
  isBasicView?: boolean;
}

interface ProjectCardProps {
  project: Project;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'planning': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function ProjectCard({ project, onView, onEdit }: ProjectCardProps) {
  const isBasicView = project.isBasicView;
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  
  return (
    <>
      <Card className={`group hover:shadow-lg transition-all duration-300 ${isBasicView ? 'border-dashed border-amber-200 bg-gradient-to-br from-amber-50/30 to-white' : 'hover:border-primary/20 hover:shadow-xl'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-semibold ${isBasicView ? 'text-amber-900' : ''}`}>{project.name}</h3>
              <AccessLevelIndicator 
                isBasicView={isBasicView} 
                showRequestAccess={isBasicView}
                onRequestAccess={() => setShowAccessRequest(true)}
              />
            </div>
            {!isBasicView && project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            {project.priority && (
              <Badge variant="outline" className="text-xs">
                {project.priority}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {!isBasicView && project.progress !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            {!isBasicView && project.teamMembers && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{project.teamMembers.length} members</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {onView && (
            <Button 
              variant={isBasicView ? "outline" : "default"}
              size="sm" 
              className={`flex-1 ${isBasicView ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : ''}`}
              onClick={() => onView(project._id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isBasicView ? 'View Basic Info' : 'View Details'}
            </Button>
          )}
          {isBasicView ? (
            <Button 
              variant="outline" 
              size="sm"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => setShowAccessRequest(true)}
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          ) : (
            onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(project._id)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
    
    <AccessRequestDialog
      open={showAccessRequest}
      onOpenChange={setShowAccessRequest}
      itemType="project"
      itemName={project.name}
      itemId={project._id}
    />
  </>
  );
}
