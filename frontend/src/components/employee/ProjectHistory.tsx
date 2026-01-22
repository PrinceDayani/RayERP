"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Calendar,
  Users,
  Target,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Filter
} from "lucide-react";
import { useState } from "react";

import { ResourceAllocation } from "@/types/employee-profile";

interface ProjectData {
  _id: string;
  name: string;
  description: string;
  role: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled' | 'planned';
  technologies: string[];
  teamSize?: number;
  completionPercentage?: number;
  clientName?: string;
  projectValue?: number;
}

interface ProjectHistoryProps {
  employeeId: string;
  projects: ResourceAllocation[];
  onProjectsUpdate?: (projects: ResourceAllocation[]) => void;
}

const projectStatuses = [
  { value: 'all', label: 'All Projects', color: 'bg-gray-500', icon: Briefcase },
  { value: 'active', label: 'Active', color: 'bg-blue-500', icon: Clock },
  { value: 'completed', label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-500', icon: AlertCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle },
  { value: 'planned', label: 'Planned', color: 'bg-indigo-500', icon: Calendar }
];

export default function ProjectHistory({ employeeId, projects, onProjectsUpdate }: ProjectHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Map ResourceAllocation to display format
  const displayProjects: ProjectData[] = projects.map((alloc) => {
    // Handle populated project project
    const project: any = alloc.project || {};
    // Fallback if project is just an ID string (should be populated though)
    const projectName = typeof project === 'string' ? 'Unknown Project' : project.name;

    return {
      _id: project._id || alloc._id,
      name: projectName || 'Unknown Project',
      description: project.description || 'No description available',
      role: alloc.role || 'Member',
      startDate: alloc.startDate,
      endDate: alloc.endDate,
      status: (alloc.status === 'active' || alloc.status === 'completed' || alloc.status === 'planned') ? alloc.status : 'active',
      technologies: project.tags || [],
      teamSize: project.team?.length || 0,
      completionPercentage: project.progress || 0,
      clientName: project.client,
      projectValue: project.budget
    };
  });

  // Filter projects based on status
  const filteredProjects = statusFilter === 'all'
    ? displayProjects
    : displayProjects.filter(p => p.status === statusFilter);

  const getStatusInfo = (status: string) => {
    return projectStatuses.find(s => s.value === status) || projectStatuses[1];
  };

  const getProjectDuration = (startDate: string, endDate?: string) => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const getProjectStats = () => {
    const completed = displayProjects.filter(p => p.status === 'completed').length;
    const active = displayProjects.filter(p => p.status === 'active').length;
    const onHold = displayProjects.filter(p => p.status === 'on-hold').length;
    const planned = displayProjects.filter(p => p.status === 'planned').length;
    const totalValue = displayProjects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
    const avgCompletion = displayProjects.length > 0
      ? displayProjects.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / displayProjects.length
      : 0;

    return { completed, active, onHold, planned, totalValue, avgCompletion };
  };

  const stats = getProjectStats();

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Briefcase className="w-6 h-6 text-primary" />
                Project History
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete project portfolio and contributions
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {projectStatuses.map((status) => (
                <Button
                  key={status.value}
                  variant={statusFilter === status.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status.value)}
                  className="text-xs"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600">{stats.onHold}</div>
              <div className="text-sm text-muted-foreground">On Hold</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-orange-600">{Math.round(stats.avgCompletion)}%</div>
              <div className="text-sm text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'all' ? 'No Projects Yet' : `No ${projectStatuses.find(s => s.value === statusFilter)?.label} Projects`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'all'
                  ? 'No project history found for this employee.'
                  : 'Try selecting a different status filter to see projects.'}
              </p>
              {statusFilter !== 'all' && (
                <Button variant="outline" onClick={() => setStatusFilter('all')}>
                  Show All Projects
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project, index) => {
            const statusInfo = getStatusInfo(project.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{project.name}</h3>
                        <Badge className={`${statusInfo.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{project.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Role:</span>
                          <span>{project.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Duration:</span>
                          <span>{getProjectDuration(project.startDate, project.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Team Size:</span>
                          <span>{project.teamSize} members</span>
                        </div>
                      </div>

                      {project.clientName && (
                        <div className="mb-3">
                          <span className="text-sm font-medium">Client: </span>
                          <span className="text-sm">{project.clientName}</span>
                        </div>
                      )}

                      {project.completionPercentage > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">{project.completionPercentage}%</span>
                          </div>
                          <Progress value={project.completionPercentage} className="h-2" />
                        </div>
                      )}

                      {project.technologies.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Technologies Used</h4>
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech, techIndex) => (
                              <Badge key={techIndex} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}