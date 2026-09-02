//path: frontend/src/app/dashboard/projects/[id]/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TaskManagement from "@/components/projects/TaskManagement";
import ProjectTimeline from "@/components/projects/ProjectTimeline";
import ProjectFiles from "@/components/projects/ProjectFiles";
import ProjectActivity from "@/components/projects/ProjectActivity";
import ProjectAnalytics from "@/components/ProjectAnalytics";
import { ProjectPhases } from "@/components/projects/ProjectPhases";
import { ProjectRisks } from "@/components/projects/ProjectRisks";
import ProjectProfitLoss from "@/components/projects/finance/ProjectProfitLoss";
import ProjectTrialBalance from "@/components/projects/finance/ProjectTrialBalance";
import ProjectBalanceSheet from "@/components/projects/finance/ProjectBalanceSheet";
import ProjectCashFlow from "@/components/projects/finance/ProjectCashFlow";
import ProjectLedger from "@/components/projects/finance/ProjectLedger";
import ProjectPermissionsManager from "@/components/projects/ProjectPermissionsManager";
import ProjectWorkflowPanel from "@/components/projects/ProjectWorkflowPanel";
import ProjectReportingTab from "@/components/projects/ProjectReportingTab";
import ProjectCurrencySwitcher from "@/components/projects/ProjectCurrencySwitcher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader, StatRow, StatTile, StatusPill, SectionNav, Panel,
  DataTable, Th, Td, Tr, EmptyState, LoadingRows, toneForStatus, type NavGroup
} from "@/components/projects/ui/primitives";
import { getCurrency } from "@/utils/currency";
import {
  ArrowLeft, Calendar, Users, Coins, BarChart3, Edit, Settings, Layers,
  CheckSquare, FileText, ShieldCheck, Activity, GanttChartSquare, Receipt,
  ClipboardList, AlertTriangle, Wallet, TrendingUp, MapPin, Timer
} from "lucide-react";
import { getProjectById, recalculateProjectManHours, type Project } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import { GanttChart } from "@/components/GanttChart";
import tasksAPI, { type Task } from "@/lib/api/tasksAPI";
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

const DAY_MS = 24 * 60 * 60 * 1000;

// Legacy ?tab= values kept working after the tabs were regrouped into sections
const LEGACY_TAB_MAP: Record<string, string> = {
  finance: 'accounting',
  tasks: 'tasks',
  analytics: 'analytics',
  budget: 'budget',
  boq: 'boq',
  billing: 'billing',
  timeline: 'timeline',
  files: 'files',
  accounting: 'accounting',
  permissions: 'permissions',
  activity: 'activity',
  reporting: 'reporting',
  phases: 'phases'
};

const ProjectDetailPage = () => {
  const { isAuthenticated } = useAuth();
  const { formatAmount } = useGlobalCurrency();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [budget, setBudget] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [section, setSection] = useState('overview');

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setProject(await getProjectById(projectId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchBudget = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBudget(data?.data ?? data);
      }
    } catch {
      // Budget is optional; the section renders its own empty state
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      setTasks(await tasksAPI.getTasksByProject(projectId));
    } catch {
      // Non-fatal; the timeline section degrades to the activity feed
    }
  }, [projectId]);

  const handleUpdateRisks = async (risks: any[]) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/risks`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ risks })
      });
      if (response.ok) {
        setProject(await response.json());
        toast({ title: "Risks updated successfully" });
      }
    } catch {
      toast({ title: "Failed to update risks", variant: "destructive" });
    }
  };

  // Deep links: ?tab=<legacy id> still selects the right section
  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam && LEGACY_TAB_MAP[tabParam]) {
      setSection(LEGACY_TAB_MAP[tabParam]);
    }
  }, []);

  useEffect(() => {
    if (project?.projectType === 'reporting' && section === 'overview') {
      if (!new URLSearchParams(window.location.search).get('tab')) {
        setSection('reporting');
      }
    }
  }, [project?.projectType]);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
      fetchBudget();
      fetchTasks();
    }
  }, [isAuthenticated, projectId, fetchProject, fetchBudget, fetchTasks]);

  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) return;

    socket.on('project:updated', (updatedProject: Project) => {
      if (updatedProject._id === projectId) setProject(updatedProject);
    });
    socket.on('budget:updated', (data: any) => {
      if (data.projectId === projectId) fetchBudget();
    });

    return () => {
      socket.off('project:updated');
      socket.off('budget:updated');
    };
  }, [projectId, fetchBudget]);

  const spent = useMemo(
    () => (budget?.categories || []).reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0),
    [budget]
  );

  const schedule = useMemo(() => {
    if (!project) return null;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const now = Date.now();
    const total = Math.max(Math.ceil((end - start) / DAY_MS), 1);
    const elapsed = Math.ceil((now - start) / DAY_MS);
    const remaining = Math.ceil((end - now) / DAY_MS);
    return {
      total,
      elapsed: Math.max(elapsed, 0),
      remaining,
      percent: Math.min(Math.max((elapsed / total) * 100, 0), 100),
      overdue: remaining < 0 && project.status !== 'completed'
    };
  }, [project]);

  const openRisks = (project?.risks || []).filter((r: any) => r.status !== 'resolved').length;

  const groups: NavGroup[] = useMemo(() => {
    const delivery = [
      { id: 'phases', label: 'Phases', icon: <Layers className="h-3.5 w-3.5" /> },
      { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-3.5 w-3.5" /> },
      { id: 'timeline', label: 'Timeline', icon: <GanttChartSquare className="h-3.5 w-3.5" /> }
    ];
    if (project?.projectType === 'reporting') {
      delivery.unshift({ id: 'reporting', label: 'Reporting', icon: <FileText className="h-3.5 w-3.5" /> });
    }

    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: <BarChart3 className="h-4 w-4" />,
        sections: [
          { id: 'overview', label: 'Summary' },
          { id: 'analytics', label: 'Analytics' }
        ]
      },
      { id: 'delivery', label: 'Delivery', icon: <Layers className="h-4 w-4" />, sections: delivery },
      {
        id: 'commercial',
        label: 'Commercial',
        icon: <Wallet className="h-4 w-4" />,
        sections: [
          { id: 'budget', label: 'Budget', icon: <Coins className="h-3.5 w-3.5" /> },
          { id: 'boq', label: 'BOQ', icon: <ClipboardList className="h-3.5 w-3.5" /> },
          { id: 'billing', label: 'Billing', icon: <Receipt className="h-3.5 w-3.5" /> },
          { id: 'accounting', label: 'Accounting', icon: <TrendingUp className="h-3.5 w-3.5" /> }
        ]
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: <FileText className="h-4 w-4" />,
        sections: [{ id: 'files', label: 'Files' }]
      },
      {
        id: 'governance',
        label: 'Governance',
        icon: <ShieldCheck className="h-4 w-4" />,
        sections: [
          { id: 'risks', label: 'Risks', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
          { id: 'permissions', label: 'Permissions', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
          { id: 'activity', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" /> }
        ]
      }
    ];
  }, [project?.projectType]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="mb-2 text-xl font-semibold">Access Required</h2>
            <p className="mb-4 text-muted-foreground">Please log in to access Project Details</p>
            <Button onClick={() => router.push("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1">
        <div className="border-b bg-card px-6 py-5">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <LoadingRows rows={8} className="p-6" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={<Layers className="h-12 w-12" />}
        title="Project not found"
        description="The requested project could not be found, or you no longer have access to it."
        action={
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Projects
          </Button>
        }
      />
    );
  }

  const currency = getCurrency(project);
  const budgetCurrency = budget ? getCurrency(budget) : currency;

  // The linked contact is authoritative for the client; the free-text name is
  // the fallback for projects that predate the link.
  const linkedClient = typeof project.clientContact === 'object' ? project.clientContact : null;
  const clientName = linkedClient
    ? (linkedClient.company ? `${linkedClient.name} (${linkedClient.company})` : linkedClient.name)
    : project.client;
  const clientAddress = linkedClient?.address;
  const siteLocationText = [
    project.siteLocation?.address,
    project.siteLocation?.city,
    project.siteLocation?.state,
    project.siteLocation?.pincode,
    project.siteLocation?.country
  ].filter(Boolean).join(', ');

  const asDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

  // Slippage is measured against the baseline finish, falling back to the
  // current planned finish when a project was never baselined.
  const baselineFinish = project.baseline?.endDate || project.endDate;
  const actualFinish = project.actualEndDate;
  const comparison = {
    baselineStart: asDate(project.baseline?.startDate || project.startDate),
    baselineEnd: asDate(baselineFinish),
    actualStart: asDate(project.actualStartDate),
    actualEnd: asDate(actualFinish),
    baselineValue: formatAmount(project.baseline?.contractValue ?? project.budget ?? 0, currency),
    plannedManHours: project.baseline?.manHours
      ? `${project.baseline.manHours.toLocaleString()} h (tender)`
      : project.manHours?.planned
        ? `${project.manHours.planned.toLocaleString()} h`
        : '—',
    actualManHours: project.manHours?.actual
      ? `${project.manHours.actual.toLocaleString()} h`
      : '—',
    slipDays:
      baselineFinish && actualFinish
        ? Math.round(
            (new Date(actualFinish).getTime() - new Date(baselineFinish).getTime()) / DAY_MS
          )
        : null
  };

  const handleRecalculateManHours = async () => {
    try {
      setRecalculating(true);
      const result = await recalculateProjectManHours(projectId);
      setProject(prev => (prev ? { ...prev, manHours: result } : prev));
      toast({
        title: 'Man-hours updated',
        description: `${result.planned.toLocaleString()} h planned, ${result.actual.toLocaleString()} h actual`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to recalculate man-hours',
        variant: 'destructive'
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="flex-1">
      <PageHeader
        back={{ onClick: () => router.push("/dashboard/projects"), label: 'Projects' }}
        title={project.name}
        description={project.description}
        badges={
          <>
            <StatusPill status={project.status} />
            <StatusPill
              status={project.priority}
              tone={project.priority === 'critical' || project.priority === 'high' ? 'danger' : 'neutral'}
              label={`${project.priority} priority`}
            />
            {project.projectType === 'reporting' && <StatusPill tone="info" label="Reporting-based" />}
          </>
        }
        meta={[
          project.jobNumber && <span className="font-medium">{project.jobNumber}</span>,
          clientName && <><Users className="h-3 w-3" />{clientName}</>,
          siteLocationText && <><MapPin className="h-3 w-3" />{siteLocationText}</>,
          <><Calendar className="h-3 w-3" />
            {new Date(project.startDate).toLocaleDateString()} → {new Date(project.endDate).toLocaleDateString()}
          </>,
          schedule?.overdue
            ? <span className="font-medium text-rose-600">{Math.abs(schedule.remaining)}d overdue</span>
            : schedule && <>{schedule.remaining}d remaining</>,
          project.tags?.length ? <>{project.tags.slice(0, 3).join(', ')}</> : null
        ]}
        actions={
          <>
            <ProjectCurrencySwitcher className="hidden sm:flex" />
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}/analytics`)}>
              <BarChart3 className="mr-2 h-4 w-4" />Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />Settings
            </Button>
          </>
        }
        stats={
          <StatRow>
            <StatTile
              label="Progress"
              value={`${project.progress}%`}
              progress={project.progress}
              tone={project.progress >= 100 ? 'success' : 'progress'}
              hint={project.progressMode === 'financial' ? 'financial' : project.progressMode === 'phase-based' ? 'phase-based' : 'task-based'}
            />
            <StatTile
              label="Schedule"
              value={schedule?.overdue ? `${Math.abs(schedule.remaining)}d over` : `${schedule?.remaining ?? 0}d left`}
              progress={schedule?.percent}
              tone={schedule?.overdue ? 'danger' : 'info'}
              hint={`${schedule?.elapsed ?? 0} of ${schedule?.total ?? 0} days`}
            />
            <StatTile
              label="Budget"
              value={formatAmount(project.budget || 0, currency)}
              icon={<Coins className="h-3.5 w-3.5" />}
              hint={`${formatAmount(project.spentBudget || 0, currency)} spent`}
            />
            <StatTile
              label="Utilisation"
              value={budget?.totalBudget ? `${((spent / budget.totalBudget) * 100).toFixed(0)}%` : '—'}
              progress={budget?.totalBudget ? (spent / budget.totalBudget) * 100 : undefined}
              tone={budget?.totalBudget && spent / budget.totalBudget > 0.9 ? 'danger' : 'success'}
              hint={budget?.totalBudget ? `of ${formatAmount(budget.totalBudget, budgetCurrency)}` : 'no budget'}
              onClick={() => setSection('budget')}
            />
            <StatTile
              label="Team"
              value={project.team?.length || 0}
              icon={<Users className="h-3.5 w-3.5" />}
              hint={`${project.managers?.length || 0} manager(s)`}
            />
            <StatTile
              label="Open risks"
              value={openRisks}
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              tone={openRisks > 0 ? 'warning' : 'success'}
              hint={openRisks === 0 ? 'none open' : 'need attention'}
              onClick={() => setSection('risks')}
            />
          </StatRow>
        }
      />

      <SectionNav groups={groups} value={section} onChange={setSection} />

      <div className="space-y-4 p-6">
        {section === 'overview' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Key facts" className="lg:col-span-2">
              <DataTable>
                <tbody>
                  <Tr><Td className="w-40 text-muted-foreground">Job number</Td><Td className="font-medium">{project.jobNumber || '—'}</Td></Tr>
                  <Tr><Td className="text-muted-foreground">Status</Td><Td><StatusPill status={project.status} /></Td></Tr>
                  <Tr><Td className="text-muted-foreground">Type</Td><Td className="capitalize">{project.projectCategory || '—'}</Td></Tr>
                  <Tr><Td className="text-muted-foreground">Tracking mode</Td><Td className="capitalize">{project.projectType || 'instruction'}</Td></Tr>
                  <Tr><Td className="text-muted-foreground">Client</Td><Td>{clientName || '—'}</Td></Tr>
                  <Tr>
                    <Td className="text-muted-foreground">Client address</Td>
                    <Td>{clientAddress || '—'}</Td>
                  </Tr>
                  <Tr><Td className="text-muted-foreground">Location</Td><Td>{siteLocationText || '—'}</Td></Tr>
                  <Tr><Td className="text-muted-foreground">Currency</Td><Td>{currency}</Td></Tr>
                  <Tr><Td className="text-muted-foreground">Start</Td><Td>{new Date(project.startDate).toLocaleDateString()}</Td></Tr>
                  <Tr><Td className="text-muted-foreground">End</Td><Td>{new Date(project.endDate).toLocaleDateString()}</Td></Tr>
                  <Tr>
                    <Td className="text-muted-foreground">Actual start</Td>
                    <Td>{project.actualStartDate ? new Date(project.actualStartDate).toLocaleDateString() : '—'}</Td>
                  </Tr>
                  <Tr>
                    <Td className="text-muted-foreground">Actual end</Td>
                    <Td>{project.actualEndDate ? new Date(project.actualEndDate).toLocaleDateString() : '—'}</Td>
                  </Tr>
                  <Tr>
                    <Td className="text-muted-foreground">Tags</Td>
                    <Td>
                      {project.tags?.length
                        ? <div className="flex flex-wrap gap-1">{project.tags.map(t => <StatusPill key={t} tone="neutral" label={t} />)}</div>
                        : '—'}
                    </Td>
                  </Tr>
                </tbody>
              </DataTable>
            </Panel>

            <div className="space-y-4">
              <Panel
                title="Plan vs actual"
                description={
                  project.baseline?.source === 'tender'
                    ? 'Baseline taken from the awarded tender'
                    : 'Baseline taken from the original plan'
                }
              >
                <DataTable>
                  <tbody>
                    <Tr>
                      <Td className="w-32 text-muted-foreground">Start</Td>
                      <Td>{comparison.baselineStart}</Td>
                      <Td>{comparison.actualStart}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-muted-foreground">Finish</Td>
                      <Td>{comparison.baselineEnd}</Td>
                      <Td>
                        {comparison.actualEnd}
                        {comparison.slipDays !== null && comparison.slipDays !== 0 && (
                          <span className={comparison.slipDays > 0 ? 'ml-2 text-rose-600' : 'ml-2 text-emerald-600'}>
                            {comparison.slipDays > 0
                              ? `${comparison.slipDays}d late`
                              : `${Math.abs(comparison.slipDays)}d early`}
                          </span>
                        )}
                      </Td>
                    </Tr>
                    <Tr>
                      <Td className="text-muted-foreground">Value</Td>
                      <Td>{comparison.baselineValue}</Td>
                      <Td>{formatAmount(project.budget || 0, currency)}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-muted-foreground">Man-hours</Td>
                      <Td>{comparison.plannedManHours}</Td>
                      <Td>{comparison.actualManHours}</Td>
                    </Tr>
                  </tbody>
                </DataTable>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={recalculating}
                  onClick={handleRecalculateManHours}
                >
                  <Timer className="mr-2 h-4 w-4" />
                  {recalculating ? 'Recalculating…' : 'Recalculate man-hours'}
                </Button>
              </Panel>

              <ProjectWorkflowPanel projectId={projectId} projectName={project.name} />
              <Panel title="Team" description={`${project.team?.length || 0} member(s)`}>
                {!project.team?.length ? (
                  <p className="py-2 text-sm text-muted-foreground">No team members assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {(project.team as any[]).slice(0, 8).map((member: any, index: number) => {
                      const name = typeof member === 'object' ? (member.name || member.email) : 'Member';
                      const initials = (name || '').split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
                      return (
                        <div key={member?._id || index} className="flex items-center gap-2 text-sm">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {initials || '?'}
                          </span>
                          <span className="truncate">{name}</span>
                        </div>
                      );
                    })}
                    {project.team.length > 8 && (
                      <p className="pt-1 text-xs text-muted-foreground">+{project.team.length - 8} more</p>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}

        {section === 'analytics' && <ProjectAnalytics projectId={projectId} />}
        {section === 'reporting' && <ProjectReportingTab projectId={projectId} />}
        {section === 'phases' && <ProjectPhases projectId={projectId} currency={currency} />}
        {section === 'tasks' && <TaskManagement projectId={projectId} showProjectTasks={true} />}

        {section === 'timeline' && (
          <div className="space-y-4">
            {tasks.length > 0 && (
              <GanttChart
                tasks={tasks.map(task => ({
                  id: task._id,
                  name: task.title,
                  startDate: new Date(task.createdAt),
                  endDate: task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * DAY_MS),
                  progress: task.status === 'completed' ? 100 : task.status === 'in-progress' ? 50 : 0,
                  status: task.status,
                  priority: task.priority
                }))}
                title={`${project.name} Timeline`}
              />
            )}
            <ProjectTimeline projectId={projectId} />
          </div>
        )}

        {section === 'budget' && (
          <Panel
            title="Budget"
            description={budget ? 'Allocation and spend by category' : undefined}
            actions={
              <Button size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}/budget`)}>
                <Coins className="mr-2 h-4 w-4" />{budget ? 'Manage budget' : 'Create budget'}
              </Button>
            }
            bodyClassName={budget ? 'p-0' : undefined}
          >
            {!budget ? (
              <EmptyState
                icon={<Coins className="h-10 w-10" />}
                title="No budget created"
                description="This project has no budget yet. Create one to start tracking allocation and spend."
                action={
                  <Button onClick={() => router.push(`/dashboard/projects/${projectId}/budget`)}>Create budget</Button>
                }
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <thead>
                  <tr>
                    <Th>Category</Th>
                    <Th>Type</Th>
                    <Th align="right">Allocated</Th>
                    <Th align="right">Spent</Th>
                    <Th align="right">Remaining</Th>
                    <Th align="right">Used</Th>
                  </tr>
                </thead>
                <tbody>
                  {(budget.categories || []).map((category: any, index: number) => {
                    const allocated = category.allocatedAmount || 0;
                    const used = category.spentAmount || 0;
                    const pct = allocated ? (used / allocated) * 100 : 0;
                    return (
                      <Tr key={index}>
                        <Td className="font-medium capitalize">{category.name}</Td>
                        <Td className="capitalize text-muted-foreground">{category.type}</Td>
                        <Td align="right">{formatAmount(allocated, budgetCurrency)}</Td>
                        <Td align="right">{formatAmount(used, budgetCurrency)}</Td>
                        <Td align="right">{formatAmount(allocated - used, budgetCurrency)}</Td>
                        <Td align="right">
                          <StatusPill
                            tone={pct > 100 ? 'danger' : pct > 90 ? 'warning' : 'success'}
                            label={`${pct.toFixed(0)}%`}
                          />
                        </Td>
                      </Tr>
                    );
                  })}
                  <Tr className="bg-muted/40 font-semibold">
                    <Td colSpan={2}>Total</Td>
                    <Td align="right">{formatAmount(budget.totalBudget || 0, budgetCurrency)}</Td>
                    <Td align="right">{formatAmount(spent, budgetCurrency)}</Td>
                    <Td align="right">{formatAmount((budget.totalBudget || 0) - spent, budgetCurrency)}</Td>
                    <Td align="right">
                      {budget.totalBudget ? `${((spent / budget.totalBudget) * 100).toFixed(0)}%` : '—'}
                    </Td>
                  </Tr>
                </tbody>
              </DataTable>
            )}
          </Panel>
        )}

        {section === 'boq' && (
          <Panel
            title="Bill of Quantities"
            description="Item rates, quantities, progress and variance"
            actions={
              <Button size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}/boq`)}>
                Open BOQ management
              </Button>
            }
          >
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" />}
              title="BOQ lives in its own workspace"
              description="Item-level editing, progress capture and variance analysis are handled on the dedicated BOQ page."
              action={
                <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${projectId}/boq`)}>
                  Go to BOQ
                </Button>
              }
            />
          </Panel>
        )}

        {section === 'billing' && (
          <Panel
            title="Milestone Billing"
            description="Invoices raised against phase milestones"
            actions={
              <Button size="sm" onClick={() => router.push(`/dashboard/projects/${projectId}/billing`)}>
                Open billing
              </Button>
            }
          >
            <EmptyState
              icon={<Receipt className="h-10 w-10" />}
              title="Billing lives in its own workspace"
              description="Raise invoices against milestones, track approvals and reconcile payments there."
              action={
                <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${projectId}/billing`)}>
                  Go to billing
                </Button>
              }
            />
          </Panel>
        )}

        {section === 'accounting' && (
          <Tabs defaultValue="profit-loss" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profit-loss">Profit &amp; Loss</TabsTrigger>
              <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
              <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="ledger">Ledger &amp; Journal</TabsTrigger>
            </TabsList>
            <TabsContent value="profit-loss"><ProjectProfitLoss projectId={projectId} /></TabsContent>
            <TabsContent value="trial-balance"><ProjectTrialBalance projectId={projectId} /></TabsContent>
            <TabsContent value="balance-sheet"><ProjectBalanceSheet projectId={projectId} /></TabsContent>
            <TabsContent value="cash-flow"><ProjectCashFlow projectId={projectId} /></TabsContent>
            <TabsContent value="ledger"><ProjectLedger projectId={projectId} /></TabsContent>
          </Tabs>
        )}

        {section === 'files' && <ProjectFiles projectId={projectId} />}

        {section === 'risks' && (
          <ProjectRisks projectId={projectId} risks={project.risks || []} onUpdate={handleUpdateRisks} />
        )}

        {section === 'permissions' && (
          <ProjectPermissionsManager
            projectId={projectId}
            selectedTeam={(project.team as any[])?.map((member: any) =>
              typeof member === 'object' ? member._id : member
            ) || []}
          />
        )}

        {section === 'activity' && <ProjectActivity projectId={projectId} />}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
