"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { SectionLoader } from "@/components/PageLoader";
import { toast } from "@/components/ui/use-toast";
import { Plus, Calendar, Briefcase, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import tasksAPI, { type Task, type CreateTaskData } from "@/lib/api/tasksAPI";
import { getProjectsMinimal, getProjectById, type Project } from "@/lib/api/projectsAPI";
import { TASK_STATUSES, PROJECT_PRIORITIES, taskStatusColor, priorityColor, labelFor, formatDate } from "./projectMeta";

const PAGE_SIZE = 25;

interface Assignee {
  _id: string;
  name?: string;
  email?: string;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  project: '',
  assignedTo: '',
  priority: 'medium',
  dueDate: ''
};

const projectIdOf = (task: Task): string =>
  typeof task.project === 'object' && task.project ? (task.project as any)._id : (task.project as any);

const isTaskOverdue = (task: Task): boolean =>
  !!task.dueDate && task.status !== 'completed' && new Date(task.dueDate).getTime() < Date.now();

const MyTasksPanel: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState({ total: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Pick<Project, '_id' | 'name'>[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const load = useCallback(async () => {
    if (!user?._id) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      // The counts describe every task assigned to the user, not just this page,
      // so they come from the server's totals rather than the visible rows.
      const [listed, inProgress, completed, overdue] = await Promise.all([
        tasksAPI.getPaged({ assignedTo: user._id, page, limit: PAGE_SIZE, sort: 'dueDate' }),
        tasksAPI.getPaged({ assignedTo: user._id, status: 'in-progress', page: 1, limit: 1 }),
        tasksAPI.getPaged({ assignedTo: user._id, status: 'completed', page: 1, limit: 1 }),
        tasksAPI.getPaged({ assignedTo: user._id, overdue: true, page: 1, limit: 1 })
      ]);
      setTasks(listed.data);
      setPageCount(Math.max(1, listed.pagination.pages));
      setTotal(listed.pagination.total);
      setCounts({
        total: listed.pagination.total,
        inProgress: inProgress.pagination.total,
        completed: completed.pagination.total,
        overdue: overdue.pagination.total
      });
    } catch (error: any) {
      toast({
        title: "Couldn't load your tasks",
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?._id, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!createOpen || projects.length) return;
    getProjectsMinimal()
      .then(setProjects)
      .catch((error: any) => toast({
        title: "Couldn't load projects",
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      }));
  }, [createOpen]);

  // Assignees come from the chosen project's own people. Task.assignedTo refs
  // User, and project membership is the access boundary that already applies.
  const selectProject = async (projectId: string) => {
    setForm(prev => ({ ...prev, project: projectId, assignedTo: '' }));
    setAssignees([]);
    setLoadingAssignees(true);
    try {
      const project = await getProjectById(projectId);
      const people = [project.owner, ...(project.managers || []), ...(project.team || [])]
        .filter((person: any): person is Assignee => !!person && typeof person === 'object' && !!person._id);
      const unique = new Map<string, Assignee>();
      people.forEach(person => unique.set(person._id, person));
      setAssignees([...unique.values()]);
    } catch (error: any) {
      toast({
        title: "Couldn't load the project team",
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setLoadingAssignees(false);
    }
  };

  const createTask = async () => {
    if (!form.title.trim() || !form.project || !form.assignedTo || !form.dueDate) {
      toast({ title: 'Title, project, assignee and due date are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateTaskData = {
        title: form.title.trim(),
        description: form.description.trim(),
        project: form.project,
        assignedTo: form.assignedTo,
        assignedBy: user?._id || '',
        priority: form.priority as CreateTaskData['priority'],
        dueDate: form.dueDate
      };
      await tasksAPI.create(payload);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setAssignees([]);
      toast({ title: 'Task created' });
      load();
    } catch (error: any) {
      toast({
        title: 'Failed to create task',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (task: Task, status: string) => {
    const previous = task.status;
    setTasks(prev => prev.map(t => (t._id === task._id ? { ...t, status: status as Task['status'] } : t)));
    try {
      await tasksAPI.update(task._id, { status: status as Task['status'] });
      load();
    } catch (error: any) {
      setTasks(prev => prev.map(t => (t._id === task._id ? { ...t, status: previous } : t)));
      toast({
        title: 'Failed to update task',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const task = pendingDelete;
    setPendingDelete(null);
    try {
      await tasksAPI.delete(task._id);
      toast({ title: `Deleted "${task.title}"` });
      load();
    } catch (error: any) {
      toast({
        title: 'Failed to delete task',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    }
  };

  const tiles = [
    { label: 'Assigned to me', value: counts.total, tone: 'text-[#970E2C] dark:text-[#e5809a]' },
    { label: 'In progress', value: counts.inProgress, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'Completed', value: counts.completed, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Overdue', value: counts.overdue, tone: 'text-red-600 dark:text-red-400' }
  ];

  if (loading) {
    return <Card><CardContent className="p-10"><SectionLoader text="Loading your tasks..." /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map(tile => (
          <Card key={tile.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tile.label}</p>
              <p className={`text-3xl font-bold mt-1.5 tabular-nums ${tile.tone}`}>{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-[#970E2C]" />
            My Tasks
          </CardTitle>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-[#970E2C] to-[#800020] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Nothing assigned to you</p>
              <p className="text-sm text-muted-foreground mt-1">Tasks assigned to you will show up here.</p>
            </div>
          ) : (
            <div className="divide-y -mx-6">
              {tasks.map(task => {
                const overdue = isTaskOverdue(task);
                return (
                  <div
                    key={task._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/projects/${projectIdOf(task)}/tasks/${task._id}`)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/dashboard/projects/${projectIdOf(task)}/tasks/${task._id}`);
                      }
                    }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-3.5 cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#970E2C]/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{task.title}</span>
                        <Badge variant="outline" className={priorityColor(task.priority)}>
                          {labelFor(task.priority)}
                        </Badge>
                        {overdue && (
                          <Badge variant="outline" className="gap-1 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </span>
                        {task.project && typeof task.project === 'object' && (
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            {(task.project as any).name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <Select value={task.status} onValueChange={value => updateStatus(task, value)}>
                        <SelectTrigger className={`w-36 h-9 ${taskStatusColor(task.status)}`} aria-label={`Status of ${task.title}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => setPendingDelete(task)}
                        className="h-9 w-9 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">Page {page} of {pageCount}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="What needs doing?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional detail"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={form.project} onValueChange={selectProject}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project._id} value={project._id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign to *</Label>
              <Select
                value={form.assignedTo}
                onValueChange={value => setForm({ ...form, assignedTo: value })}
                disabled={!form.project || loadingAssignees}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !form.project ? 'Pick a project first'
                        : loadingAssignees ? 'Loading team...'
                        : assignees.length ? 'Select a team member'
                        : 'This project has no team members'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map(person => (
                    <SelectItem key={person._id} value={person._id}>
                      {person.name || person.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={value => setForm({ ...form, priority: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Due date *</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={createTask} disabled={submitting} className="flex-1">
                {submitting ? 'Creating...' : 'Create task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{pendingDelete?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              The task and its comments, checklist and time entries are removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTasksPanel;
