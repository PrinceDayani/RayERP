"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionLoader } from "@/components/PageLoader";
import { toast } from "@/components/ui/use-toast";
import { Search, X, Calendar, Briefcase, CheckCircle2, AlertTriangle, User } from "lucide-react";
import tasksAPI, { type Task } from "@/lib/api/tasksAPI";
import { TASK_STATUSES, PROJECT_PRIORITIES, taskStatusColor, priorityColor, labelFor, formatDate } from "./projectMeta";

const PAGE_SIZE = 24;

const projectIdOf = (task: Task): string =>
  typeof task.project === 'object' && task.project ? (task.project as any)._id : (task.project as any);

const isTaskOverdue = (task: Task): boolean =>
  !!task.dueDate && task.status !== 'completed' && new Date(task.dueDate).getTime() < Date.now();

const AllTasksPanel: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (searchDraft === search) return;
    const timer = setTimeout(() => setSearch(searchDraft), 300);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    setPage(1);
  }, [status, priority, search]);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const result = await tasksAPI.getPaged({
        page,
        limit: PAGE_SIZE,
        sort: 'dueDate',
        ...(status !== 'all' ? { status } : {}),
        ...(priority !== 'all' ? { priority } : {}),
        ...(search ? { q: search } : {})
      });
      setTasks(result.data);
      setPageCount(Math.max(1, result.pagination.pages));
      setTotal(result.pagination.total);
    } catch (error: any) {
      toast({
        title: "Couldn't load tasks",
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setFetching(false);
      setInitialLoad(false);
    }
  }, [page, status, priority, search]);

  useEffect(() => { load(); }, [load]);

  // Column counts describe the whole visible task set, not the current page.
  useEffect(() => {
    Promise.all(
      TASK_STATUSES.map(s =>
        tasksAPI.getPaged({ status: s.value, page: 1, limit: 1 })
          .then(r => [s.value, r.pagination.total] as const)
          .catch(() => [s.value, 0] as const)
      )
    ).then(entries => setStatusCounts(Object.fromEntries(entries)));
  }, []);

  const hasFilters = status !== 'all' || priority !== 'all' || !!search;

  const clearFilters = () => {
    setStatus('all');
    setPriority('all');
    setSearchDraft('');
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {TASK_STATUSES.map(s => (
          <Card
            key={s.value}
            role="button"
            tabIndex={0}
            aria-pressed={status === s.value}
            onClick={() => setStatus(status === s.value ? 'all' : s.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStatus(status === s.value ? 'all' : s.value);
              }
            }}
            className={`cursor-pointer border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#970E2C]/40 ${
              status === s.value ? 'border-[#970E2C] ring-1 ring-[#970E2C]/30' : 'border-border/60'
            }`}
          >
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1.5 tabular-nums">{statusCounts[s.value] ?? '—'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-[#970E2C]" />
              All Tasks
              {!initialLoad && (
                <span className="text-sm font-normal text-muted-foreground tabular-nums">({total})</span>
              )}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[12rem]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  aria-label="Search tasks"
                  placeholder="Search tasks..."
                  value={searchDraft}
                  onChange={e => setSearchDraft(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 w-36" aria-label="Filter by status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {TASK_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 w-36" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {PROJECT_PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {initialLoad ? (
            <div className="py-10"><SectionLoader text="Loading tasks..." /></div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{hasFilters ? 'No tasks match these filters' : 'No tasks yet'}</p>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">Clear filters</Button>
              )}
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ${
                fetching ? 'opacity-60 pointer-events-none' : ''
              } transition-opacity`}
            >
              {tasks.map(task => {
                const overdue = isTaskOverdue(task);
                const assignee = typeof task.assignedTo === 'object' ? (task.assignedTo as any) : null;
                return (
                  <Card
                    key={task._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/projects/${projectIdOf(task)}?tab=tasks`)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/dashboard/projects/${projectIdOf(task)}?tab=tasks`);
                      }
                    }}
                    className={`cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#970E2C]/40 ${
                      overdue ? 'border-red-200 dark:border-red-900' : ''
                    }`}
                  >
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className={taskStatusColor(task.status)}>
                          {labelFor(task.status)}
                        </Badge>
                        <Badge variant="outline" className={priorityColor(task.priority)}>
                          {labelFor(task.priority)}
                        </Badge>
                        {overdue && (
                          <Badge variant="outline" className="gap-1 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium leading-snug line-clamp-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t flex-wrap">
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </span>
                        {task.project && typeof task.project === 'object' && (
                          <span className="flex items-center gap-1 min-w-0">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            <span className="truncate">{(task.project as any).name}</span>
                          </span>
                        )}
                        {assignee?.name && (
                          <span className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{assignee.name}</span>
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!initialLoad && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">Page {page} of {pageCount}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || fetching} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount || fetching} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTasksPanel;
