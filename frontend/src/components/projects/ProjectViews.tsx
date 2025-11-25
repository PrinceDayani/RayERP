"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Grid3X3, List, Calendar, BarChart3, Clock, AlertTriangle, 
  CheckCircle, TrendingUp, Users, DollarSign, Target, Activity,
  Filter, SortAsc, Eye, Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  spentBudget: number;
  manager: any;
  team: any[];
  departments: any[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectViewsProps {
  projects: Project[];
  onProjectsUpdate: (projects: Project[]) => void;
}

const ProjectViews: React.FC<ProjectViewsProps> = ({ projects, onProjectsUpdate }) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban' | 'timeline'>('grid');
  const [activeView, setActiveView] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const viewOptions = [
    { id: 'all', label: 'All Projects', icon: Briefcase },
    { id: 'active', label: 'Active Projects', icon: Activity },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { id: 'high-priority', label: 'High Priority', icon: TrendingUp }
  ];

  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjectsByView(activeView);
  }, [activeView, projects]);

  const fetchProjectsByView = async (view: string) => {
    try {
      if (view === 'all') {
        setFilteredProjects(projects);
        return;
      }

      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/by-view?view=${view}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error fetching projects by view:', error);
      // Fallback to client-side filtering
      let filtered = [...projects];
      
      switch (view) {
        case 'active':
          filtered = projects.filter(p => p.status === 'active');
          break;
        case 'completed':
          filtered = projects.filter(p => p.status === 'completed');
          break;
        case 'overdue':
          filtered = projects.filter(p => 
            new Date(p.endDate) < new Date() && p.status !== 'completed'
          );
          break;
        case 'high-priority':
          filtered = projects.filter(p => 
            p.priority === 'high' || p.priority === 'critical'
          );
          break;
        default:
          filtered = projects;
      }
      
      setFilteredProjects(filtered);
    }
  };

  const applyFiltersAndSort = (projectList: Project[]) => {
    let result = [...projectList];

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      result = result.filter(p => p.priority === filterPriority);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'dueDate':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'priority':
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  };

  const displayProjects = applyFiltersAndSort(filteredProjects);

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'completed': 'bg-blue-100 text-blue-700 border-blue-200',
      'on-hold': 'bg-amber-100 text-amber-700 border-amber-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200',
      'planning': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'critical': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayProjects.map((project) => (
        <Card 
          key={project._id} 
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => router.push(`/dashboard/projects/${project._id}`)}
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getPriorityColor(project.priority)}`}>
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge variant="outline">{project.priority}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Progress</span>
                <span className="font-bold text-primary">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2.5" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium text-xs">
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-medium text-xs">{project.team?.length || 0} members</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {displayProjects.map((project) => (
        <Card 
          key={project._id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/dashboard/projects/${project._id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPriorityColor(project.priority)}`}>
                <Briefcase className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <Badge variant="secondary" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge variant="outline">{project.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {project.description}
                </p>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="font-medium">{project.progress}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-medium">{project.team?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderKanbanView = () => {
    const statusColumns = [
      { id: 'planning', title: 'Planning', color: 'bg-purple-100' },
      { id: 'active', title: 'Active', color: 'bg-blue-100' },
      { id: 'on-hold', title: 'On Hold', color: 'bg-yellow-100' },
      { id: 'completed', title: 'Completed', color: 'bg-green-100' }
    ];

    const projectsByStatus = statusColumns.reduce((acc, column) => {
      acc[column.id] = displayProjects.filter(p => p.status === column.id);
      return acc;
    }, {} as Record<string, Project[]>);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <Card key={column.id} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                {column.title}
                <Badge variant="secondary" className="text-xs">
                  {projectsByStatus[column.id]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {projectsByStatus[column.id]?.map((project) => (
                <Card 
                  key={project._id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/projects/${project._id}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <h4 className="font-medium text-sm line-clamp-2">{project.name}</h4>
                    <div className="flex items-center justify-between">
                      <Badge className={getPriorityColor(project.priority)} size="sm">
                        {project.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Selection */}
      <div className="flex flex-wrap gap-2">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.id}
              variant={activeView === option.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveView(option.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Display */}
      {displayProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-6">
              No projects match the current view and filters.
            </p>
            <Button onClick={() => {
              setActiveView('all');
              setFilterStatus('all');
              setFilterPriority('all');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'kanban' && renderKanbanView()}
        </>
      )}
    </div>
  );
};

export default ProjectViews;