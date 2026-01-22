"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  BarChart3,
  Settings,
  UserCheck,
  Briefcase,
  Activity,
  ArrowRight
} from 'lucide-react';
import { employeesAPI } from '@/lib/api/employeesAPI';
import { getAllProjects } from '@/lib/api/projectsAPI';
import { resourceApi } from '@/lib/api/resources';
import EnhancedSkillMatrix from '@/components/resources/EnhancedSkillMatrix';
import ResourceAllocationCalendar from '@/components/resources/ResourceAllocationCalendar';
import CapacityPlanningView from '@/components/resources/CapacityPlanningView';
import { toast } from '@/hooks/use-toast';

interface ResourceStats {
  totalEmployees: number;
  availableEmployees: number;
  assignedEmployees: number;
  overallocatedEmployees: number;
  activeProjects: number;
  avgUtilization: number;
  skillGaps: number;
  upcomingDeadlines: number;
}

interface SkillMatrix {
  employee: {
    _id: string;
    name: string;
    position: string;
    department: string;
  };
  skills: Array<{
    skill: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null;
    lastUpdated: string;
  }>;
}

export default function ResourceDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ResourceStats>({
    totalEmployees: 0,
    availableEmployees: 0,
    assignedEmployees: 0,
    overallocatedEmployees: 0,
    activeProjects: 0,
    avgUtilization: 0,
    skillGaps: 0,
    upcomingDeadlines: 0
  });
  const [skillMatrix, setSkillMatrix] = useState<SkillMatrix[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [recentAllocations, setRecentAllocations] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees and projects
      const [employeesData, projectsData] = await Promise.all([
        employeesAPI.getAll(),
        getAllProjects()
      ]);

      const employees = Array.isArray(employeesData) ? employeesData : employeesData?.data || [];
      const projects = projectsData || [];

      // Calculate basic stats
      const activeProjects = projects.filter(p => p.status === 'active');
      const totalEmployees = employees.length;
      
      // Calculate real stats from actual data
      setStats({
        totalEmployees,
        availableEmployees: employees.filter(emp => emp.status === 'active').length,
        assignedEmployees: 0, // Will be calculated from actual allocations
        overallocatedEmployees: 0, // Will be calculated from actual allocations
        activeProjects: activeProjects.length,
        avgUtilization: 0, // Will be calculated from actual data
        skillGaps: 0, // Will be calculated from skill analysis
        upcomingDeadlines: 0 // Will be calculated from project deadlines
      });

      // Try to fetch skill matrix
      try {
        const skillResponse = await resourceApi.getSkillMatrix();
        if (skillResponse?.data) {
          setSkillMatrix(skillResponse.data.matrix || []);
          setAllSkills(skillResponse.data.allSkills || []);
        }
      } catch (error) {
        console.log('Skill matrix API not available');
        setSkillMatrix([]);
        setAllSkills([]);
      }

      // Try to fetch actual allocations
      try {
        const allocationsResponse = await resourceApi.getResourceAllocations();
        setRecentAllocations(allocationsResponse.data || []);
      } catch (error) {
        console.log('Resource allocations API not available');
        setRecentAllocations([]);
      }

      // Calculate upcoming deadlines from projects
      const now = new Date();
      const upcomingProjectDeadlines = projects
        .filter(project => {
          if (!project.endDate) return false;
          const endDate = new Date(project.endDate);
          const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDeadline > 0 && daysUntilDeadline <= 30; // Next 30 days
        })
        .map(project => {
          const endDate = new Date(project.endDate);
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: project._id,
            projectId: project._id,
            project: project.name,
            deadline: project.endDate,
            daysLeft,
            priority: daysLeft <= 7 ? 'high' : daysLeft <= 14 ? 'medium' : 'low'
          };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5); // Show top 5
      
      setUpcomingDeadlines(upcomingProjectDeadlines);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load resource dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading resource dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Resource Management Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive view of team resources, skills, and capacity planning
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/resources/resource-allocation')}>
            <Calendar className="w-4 h-4 mr-2" />
            Allocation Calendar
          </Button>
          <Button onClick={() => fetchDashboardData()}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableEmployees}</p>
                <p className="text-xs text-muted-foreground">Ready for assignment</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgUtilization}%</p>
                <p className="text-xs text-muted-foreground">Average capacity</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Skill Gaps</p>
                <p className="text-2xl font-bold text-red-600">{stats.skillGaps}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard/resources/resource-allocation')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Resource Allocation</h3>
                <p className="text-sm text-muted-foreground">View and manage employee assignments</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard/employees')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Skill Matrix</h3>
                <p className="text-sm text-muted-foreground">Manage team skills and competencies</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard/projects')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Capacity Planning</h3>
                <p className="text-sm text-muted-foreground">Plan future resource needs</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skill Matrix</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Allocations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Recent Allocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAllocations.length > 0 ? (
                <div className="space-y-3">
                  {recentAllocations.slice(0, 5).map((allocation) => (
                    <div key={allocation._id || allocation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p 
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => router.push(`/dashboard/employees/${allocation.employee?._id || allocation.employeeId}`)}
                          >
                            {allocation.employee?.firstName ? `${allocation.employee.firstName} ${allocation.employee.lastName}` : allocation.employee}
                          </p>
                          <p 
                            className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => router.push(`/dashboard/projects/${allocation.project?._id || allocation.projectId}`)}
                          >
                            {allocation.project?.name || allocation.project}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={(allocation.utilizationRate || allocation.allocation || 0) > 80 ? "destructive" : "secondary"}>
                          {allocation.utilizationRate || allocation.allocation || 0}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {allocation.startDate ? new Date(allocation.startDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No recent allocations found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p 
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => router.push(`/dashboard/projects/${deadline.projectId}`)}
                          >
                            {deadline.project}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(deadline.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={deadline.priority === 'high' ? "destructive" : deadline.priority === 'medium' ? "default" : "secondary"}>
                          {deadline.daysLeft} days
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{deadline.priority} priority</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No upcoming deadlines in the next 30 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading skill matrix...</div>}>
            <EnhancedSkillMatrix matrix={skillMatrix} allSkills={allSkills} />
          </Suspense>
        </TabsContent>

        <TabsContent value="allocation">
          <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading allocation view...</div>}>
            <ResourceAllocationCalendar />
          </Suspense>
        </TabsContent>

        <TabsContent value="capacity">
          <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading capacity planning...</div>}>
            <CapacityPlanningView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}