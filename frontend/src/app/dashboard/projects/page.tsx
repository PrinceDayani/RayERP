"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, GanttChartSquare, Briefcase, TrendingUp, Coins, Calendar } from "lucide-react";
import { TieredAccessWrapper } from "@/components/common/TieredAccessWrapper";
import ProjectCurrencySwitcher from "@/components/projects/ProjectCurrencySwitcher";
import ProjectStatsCards, { type ProjectStats, type StatFilter } from "@/components/projects/ProjectStatsCards";
import ProjectBrowser, {
  DEFAULT_FILTERS, filtersForTile, statTileFor, type ProjectFilters
} from "@/components/projects/ProjectBrowser";
import MyTasksPanel from "@/components/projects/MyTasksPanel";
import AllTasksPanel from "@/components/projects/AllTasksPanel";
import BudgetPanel from "@/components/projects/BudgetPanel";
import { getProjectStats } from "@/lib/api/projectsAPI";
import { useSocket } from "@/hooks/useSocket";

const EMPTY_STATS: ProjectStats = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  overdueTasks: 0,
  totalTasks: 0,
  completedTasks: 0,
  atRiskProjects: 0,
  overdueProjects: 0
};

const REPORTS = [
  {
    icon: TrendingUp,
    title: 'Performance Report',
    description: 'Completion rates and delivery trends across projects',
    route: '/dashboard/projects/reports/performance'
  },
  {
    icon: Coins,
    title: 'Budget Analysis',
    description: 'Planned versus actual spend and utilization',
    route: '/dashboard/projects/reports/budget'
  },
  {
    icon: Calendar,
    title: 'Timeline Report',
    description: 'Schedules, milestones and slippage',
    route: '/dashboard/projects/reports/timeline'
  }
];

const TABS = [
  { value: 'projects', label: 'Projects' },
  { value: 'budgets', label: 'Budgets' },
  { value: 'my-tasks', label: 'My Tasks' },
  { value: 'all-tasks', label: 'All Tasks' },
  { value: 'reports', label: 'Reports' }
];

const ProjectManagementDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const socket = useSocket();
  const [stats, setStats] = useState<ProjectStats>(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [accessCounts, setAccessCounts] = useState({ full: 0, basic: 0 });

  const loadStats = useCallback(async () => {
    try {
      setStats(await getProjectStats());
    } catch {
      // The stats strip is supplementary; the project list reports its own errors.
      setStats(EMPTY_STATS);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadStats();
  }, [isAuthenticated, loadStats]);

  // Counts change whenever a project is created, updated or removed anywhere.
  useEffect(() => {
    if (!socket) return;
    socket.on('project:created', loadStats);
    socket.on('project:updated', loadStats);
    socket.on('project:deleted', loadStats);
    return () => {
      socket.off('project:created', loadStats);
      socket.off('project:updated', loadStats);
      socket.off('project:deleted', loadStats);
    };
  }, [socket, loadStats]);

  const handleStatSelect = (tile: StatFilter) => {
    setFilters(current => (statTileFor(current) === tile ? { ...DEFAULT_FILTERS, q: current.q, sort: current.sort } : filtersForTile(tile, current)));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#970E2C]/20 to-[#970E2C]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-[#970E2C]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-6">Please log in to access Project Management</p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-[#970E2C] to-[#800020] text-white"
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TieredAccessWrapper
      title="Project Management"
      description="Projects, budgets, tasks and reporting in one place"
      hasBasicViewItems={accessCounts.basic > 0}
      showLegend={accessCounts.basic > 0}
      fullAccessCount={accessCounts.full}
      basicViewCount={accessCounts.basic}
      actions={
        <>
          <ProjectCurrencySwitcher className="hidden sm:flex" />
          <Button variant="outline" onClick={() => router.push('/dashboard/projects/timeline-overview')}>
            <GanttChartSquare className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/projects/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={() => router.push('/dashboard/projects/create')}
            className="bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <ProjectStatsCards
          stats={stats}
          loading={statsLoading}
          activeFilter={statTileFor(filters)}
          onSelect={handleStatSelect}
        />

        <Tabs defaultValue="projects" className="space-y-5">
          <TabsList className="h-11 w-full sm:w-auto justify-start overflow-x-auto p-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-md px-4 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="projects">
            <ProjectBrowser
              filters={filters}
              onFiltersChange={setFilters}
              onAccessCountsChange={setAccessCounts}
            />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetPanel />
          </TabsContent>

          <TabsContent value="my-tasks">
            <MyTasksPanel />
          </TabsContent>

          <TabsContent value="all-tasks">
            <AllTasksPanel />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {REPORTS.map(report => (
                    <Card
                      key={report.route}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(report.route)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(report.route);
                        }
                      }}
                      className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#970E2C]/40"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/25 flex items-center justify-center transition-transform group-hover:scale-105">
                          <report.icon className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1.5">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TieredAccessWrapper>
  );
};

export default ProjectManagementDashboard;
