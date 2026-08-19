"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { AccessLevelIndicator } from "@/components/ui/access-level-indicator";
import { AccessRequestDialog } from "@/components/ui/access-request-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Search, Plus, Filter, X, Grid3X3, List, Columns3, Briefcase, Calendar, Users,
  MoreHorizontal, Edit, Copy, Archive, ArchiveRestore, Trash2, AlertTriangle, ChevronDown, Coins, UserPlus
} from "lucide-react";
import {
  getProjectsPaged, cloneProject, deleteProject, setProjectStatus, type Project
} from "@/lib/api/projectsAPI";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import { useSocket } from "@/hooks/useSocket";
import {
  PROJECT_STATUSES, PROJECT_PRIORITIES, statusColor, priorityColor, priorityAccent,
  labelFor, isOverdue, daysRemaining, formatDate, isBasicView
} from "./projectMeta";

const PAGE_SIZE = 24;

export interface ProjectFilters {
  q: string;
  statuses: string[];
  priorities: string[];
  projectType: 'all' | 'instruction' | 'reporting';
  overdue: boolean;
  sort: 'recent' | 'name' | 'progress' | 'endDate';
}

export const DEFAULT_FILTERS: ProjectFilters = {
  q: '',
  statuses: [],
  priorities: [],
  projectType: 'all',
  overdue: false,
  sort: 'recent'
};

/** Which stats tile the current filters correspond to, for the pressed state. */
export const statTileFor = (f: ProjectFilters): 'all' | 'active' | 'completed' | 'overdue' => {
  if (f.overdue) return 'overdue';
  if (f.statuses.length === 1 && f.statuses[0] === 'active') return 'active';
  if (f.statuses.length === 1 && f.statuses[0] === 'completed') return 'completed';
  return 'all';
};

/** Filters a stats tile applies when clicked, preserving the search term. */
export const filtersForTile = (
  tile: 'all' | 'active' | 'completed' | 'overdue',
  current: ProjectFilters
): ProjectFilters => ({
  ...DEFAULT_FILTERS,
  q: current.q,
  sort: current.sort,
  statuses: tile === 'active' ? ['active'] : tile === 'completed' ? ['completed'] : [],
  overdue: tile === 'overdue'
});

type ViewMode = 'grid' | 'list' | 'board';

const SORT_LABELS: Record<ProjectFilters['sort'], string> = {
  recent: 'Recently updated',
  name: 'Name (A–Z)',
  progress: 'Progress',
  endDate: 'Due date'
};

// ---------------------------------------------------------------------------
// Filter controls
// ---------------------------------------------------------------------------

interface MultiSelectProps {
  label: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 justify-between gap-2 min-w-[9rem]">
          <span className="truncate">
            {label}
            {selected.length > 0 && (
              <span className="ml-1.5 text-xs font-semibold text-[#970E2C] dark:text-[#e5809a]">{selected.length}</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-2">
        <div className="space-y-1">
          {options.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
            >
              <Checkbox checked={selected.includes(option.value)} onCheckedChange={() => toggle(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-8" onClick={() => onChange([])}>
            Clear {label.toLowerCase()}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

interface FilterBarProps {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  searchDraft: string;
  onSearchDraft: (value: string) => void;
}

const VIEW_BUTTONS: { mode: ViewMode; icon: typeof Grid3X3; label: string }[] = [
  { mode: 'grid', icon: Grid3X3, label: 'Grid view' },
  { mode: 'list', icon: List, label: 'List view' },
  { mode: 'board', icon: Columns3, label: 'Board view' }
];

const FilterBar: React.FC<FilterBarProps> = ({
  filters, onChange, view, onViewChange, searchDraft, onSearchDraft
}) => {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  filters.statuses.forEach(status =>
    chips.push({
      key: `status-${status}`,
      label: `Status: ${labelFor(status)}`,
      clear: () => onChange({ ...filters, statuses: filters.statuses.filter(s => s !== status) })
    })
  );
  filters.priorities.forEach(priority =>
    chips.push({
      key: `priority-${priority}`,
      label: `Priority: ${labelFor(priority)}`,
      clear: () => onChange({ ...filters, priorities: filters.priorities.filter(p => p !== priority) })
    })
  );
  if (filters.projectType !== 'all') {
    chips.push({
      key: 'type',
      label: `Type: ${labelFor(filters.projectType)}`,
      clear: () => onChange({ ...filters, projectType: 'all' })
    });
  }
  if (filters.overdue) {
    chips.push({ key: 'overdue', label: 'Overdue only', clear: () => onChange({ ...filters, overdue: false }) });
  }
  if (filters.q) {
    chips.push({
      key: 'q',
      label: `Search: "${filters.q}"`,
      clear: () => {
        onSearchDraft('');
        onChange({ ...filters, q: '' });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            aria-label="Search projects"
            placeholder="Search projects by name or client..."
            value={searchDraft}
            onChange={e => onSearchDraft(e.target.value)}
            className="pl-9 pr-9 h-10"
          />
          {searchDraft && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                onSearchDraft('');
                onChange({ ...filters, q: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MultiSelect
            label="Status"
            options={PROJECT_STATUSES}
            selected={filters.statuses}
            onChange={statuses => onChange({ ...filters, statuses })}
          />
          <MultiSelect
            label="Priority"
            options={PROJECT_PRIORITIES}
            selected={filters.priorities}
            onChange={priorities => onChange({ ...filters, priorities })}
          />
          <Select
            value={filters.projectType}
            onValueChange={value => onChange({ ...filters, projectType: value as ProjectFilters['projectType'] })}
          >
            <SelectTrigger className="h-10 w-[8.5rem]" aria-label="Project type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="instruction">Instruction</SelectItem>
              <SelectItem value="reporting">Reporting</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sort}
            onValueChange={value => onChange({ ...filters, sort: value as ProjectFilters['sort'] })}
          >
            <SelectTrigger className="h-10 w-[11rem]" aria-label="Sort projects">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as ProjectFilters['sort'][]).map(key => (
                <SelectItem key={key} value={key}>{SORT_LABELS[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-lg border p-0.5">
            {VIEW_BUTTONS.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                aria-label={label}
                aria-pressed={view === mode}
                onClick={() => onViewChange(mode)}
                className={`h-9 w-9 rounded-md flex items-center justify-center transition-colors ${
                  view === mode ? 'bg-[#970E2C] text-white' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {chips.map(chip => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pl-2.5 pr-1 py-1 font-normal">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter ${chip.label}`}
                onClick={chip.clear}
                className="rounded-full p-0.5 hover:bg-background/80"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onSearchDraft('');
              onChange({ ...DEFAULT_FILTERS, sort: filters.sort });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Project rendering
// ---------------------------------------------------------------------------

interface ProjectActions {
  onOpen: (project: Project) => void;
  onEdit: (project: Project) => void;
  onClone: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const ProjectMenu: React.FC<{ project: Project; actions: ProjectActions }> = ({ project, actions }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label={`Actions for ${project.name}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
      <DropdownMenuItem onSelect={() => actions.onEdit(project)}>
        <Edit className="h-4 w-4 mr-2" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => actions.onClone(project)}>
        <Copy className="h-4 w-4 mr-2" /> Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => actions.onArchive(project)}>
        {project.status === 'archived' ? (
          <><ArchiveRestore className="h-4 w-4 mr-2" /> Restore to active</>
        ) : (
          <><Archive className="h-4 w-4 mr-2" /> Archive</>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => actions.onDelete(project)}
        className="text-red-600 focus:text-red-600"
      >
        <Trash2 className="h-4 w-4 mr-2" /> Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const OverdueBadge: React.FC<{ project: Project }> = ({ project }) => {
  const days = daysRemaining(project.endDate);
  if (days === null) return null;
  return (
    <Badge variant="outline" className="gap-1 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400">
      <AlertTriangle className="h-3 w-3" />
      {Math.abs(days)}d overdue
    </Badge>
  );
};

/** Department-level visibility: the API withholds everything but the header fields. */
const BasicViewCard: React.FC<{ project: Project; onOpen: () => void }> = ({ project, onOpen }) => {
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        className="border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base line-clamp-2">{project.name}</h3>
            <AccessLevelIndicator isBasicView className="shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={statusColor(project.status)}>{labelFor(project.status)}</Badge>
            <Badge variant="outline" className={priorityColor(project.priority)}>{labelFor(project.priority)}</Badge>
            {isOverdue(project) && <OverdueBadge project={project} />}
          </div>
          <div className="pt-2 border-t border-amber-200/70 dark:border-amber-900 space-y-2.5">
            <p className="text-xs text-muted-foreground">
              Visible through your department. Progress, budget and team are hidden until you are assigned.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950"
              onClick={e => {
                e.stopPropagation();
                setRequestOpen(true);
              }}
              onKeyDown={e => e.stopPropagation()}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Request access
            </Button>
          </div>
        </CardContent>
      </Card>

      <AccessRequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        itemType="project"
        itemName={project.name}
        itemId={project._id}
      />
    </>
  );
};

const ProjectGridCard: React.FC<{ project: Project; actions: ProjectActions }> = ({ project, actions }) => {
  const { formatAmount } = useGlobalCurrency();
  const open = () => actions.onOpen(project);

  if (isBasicView(project)) return <BasicViewCard project={project} onOpen={open} />;

  const overdue = isOverdue(project);
  const team = Array.isArray(project.team) ? project.team : [];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={`group relative flex flex-col cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#970E2C]/40 ${
        overdue ? 'border-red-200 dark:border-red-900' : ''
      } ${project.status === 'archived' ? 'opacity-70' : ''}`}
    >
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${priorityAccent(project.priority)}`}>
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover:text-[#970E2C] dark:group-hover:text-[#e5809a] transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 min-h-[2.5rem]">
              {project.description || 'No description'}
            </p>
          </div>
          <ProjectMenu project={project} actions={actions} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className={statusColor(project.status)}>{labelFor(project.status)}</Badge>
          <Badge variant="outline" className={priorityColor(project.priority)}>{labelFor(project.priority)}</Badge>
          {project.projectType === 'reporting' && (
            <Badge variant="outline" className="border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-400">
              Reporting
            </Badge>
          )}
          {overdue && <OverdueBadge project={project} />}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums">{project.progress ?? 0}%</span>
          </div>
          <Progress value={project.progress ?? 0} className="h-2" />
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className={`h-4 w-4 shrink-0 ${overdue ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className={`truncate ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
              {formatDate(project.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <Users className="h-4 w-4" />
            <span className="tabular-nums">{team.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 min-w-0">
            <Coins className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatAmount(project.budget || 0, project.currency || 'INR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectListRow: React.FC<{ project: Project; actions: ProjectActions }> = ({ project, actions }) => {
  const { formatAmount } = useGlobalCurrency();
  const basic = isBasicView(project);
  const overdue = isOverdue(project);
  const team = Array.isArray(project.team) ? project.team : [];
  const open = () => actions.onOpen(project);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#970E2C]/40 ${
        basic ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${priorityAccent(project.priority)}`}>
        <Briefcase className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{project.name}</span>
          {basic && <AccessLevelIndicator isBasicView className="shrink-0" />}
          {overdue && <OverdueBadge project={project} />}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {basic ? 'Department view — details hidden' : project.description || 'No description'}
        </p>
      </div>

      <Badge variant="secondary" className={`${statusColor(project.status)} hidden sm:inline-flex shrink-0`}>
        {labelFor(project.status)}
      </Badge>
      <Badge variant="outline" className={`${priorityColor(project.priority)} hidden md:inline-flex shrink-0`}>
        {labelFor(project.priority)}
      </Badge>

      {!basic && (
        <div className="hidden lg:flex items-center gap-2 w-32 shrink-0">
          <Progress value={project.progress ?? 0} className="h-1.5 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{project.progress ?? 0}%</span>
        </div>
      )}

      <div className={`hidden xl:block text-sm w-28 shrink-0 text-right ${overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
        {formatDate(project.endDate)}
      </div>

      {!basic && (
        <>
          <div className="hidden xl:flex items-center gap-1.5 text-sm text-muted-foreground w-14 shrink-0 justify-end">
            <Users className="h-3.5 w-3.5" />
            <span className="tabular-nums">{team.length}</span>
          </div>
          <div className="hidden 2xl:block text-sm text-muted-foreground w-28 shrink-0 text-right truncate">
            {formatAmount(project.budget || 0, project.currency || 'INR')}
          </div>
          <ProjectMenu project={project} actions={actions} />
        </>
      )}
    </div>
  );
};

const BOARD_COLUMNS = [
  { status: 'planning', dot: 'bg-violet-500' },
  { status: 'active', dot: 'bg-emerald-500' },
  { status: 'on-hold', dot: 'bg-amber-500' },
  { status: 'completed', dot: 'bg-blue-500' }
];

const ProjectBoard: React.FC<{ projects: Project[]; actions: ProjectActions }> = ({ projects, actions }) => {
  const columns = BOARD_COLUMNS.map(column => ({
    ...column,
    items: projects.filter(p => p.status === column.status)
  }));
  const other = projects.filter(p => !BOARD_COLUMNS.some(c => c.status === p.status));
  if (other.length) columns.push({ status: 'archived', dot: 'bg-slate-400', items: other });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map(column => (
        <Card key={column.status} className="bg-muted/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${column.dot}`} />
              {labelFor(column.status)}
              <Badge variant="secondary" className="ml-auto text-xs tabular-nums">{column.items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {column.items.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nothing here</p>
            ) : (
              column.items.map(project => (
                <Card
                  key={project._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => actions.onOpen(project)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      actions.onOpen(project);
                    }
                  }}
                  className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#970E2C]/40"
                >
                  <CardContent className="p-3 space-y-2">
                    <p className="font-medium text-sm leading-snug line-clamp-2">{project.name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={`${priorityColor(project.priority)} text-[11px]`}>
                        {labelFor(project.priority)}
                      </Badge>
                      {isOverdue(project) && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                    {!isBasicView(project) && (
                      <>
                        <Progress value={project.progress ?? 0} className="h-1.5" />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{formatDate(project.endDate)}</span>
                          <span className="tabular-nums">{project.progress ?? 0}%</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

interface ProjectBrowserProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  /** Lets the page report how many of the listed projects are department-view only. */
  onAccessCountsChange?: (counts: { full: number; basic: number }) => void;
}

const ProjectBrowser: React.FC<ProjectBrowserProps> = ({ filters, onFiltersChange, onAccessCountsChange }) => {
  const router = useRouter();
  const socket = useSocket();
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  // The pending search timer must apply to whatever the filters are when it
  // fires, not to the ones captured when the user last pressed a key.
  const latest = useRef({ filters, onFiltersChange });
  useEffect(() => {
    latest.current = { filters, onFiltersChange };
  });

  // Debounce only the search box; every other control applies immediately.
  useEffect(() => {
    if (searchDraft === filters.q) return;
    const timer = setTimeout(() => {
      const { filters: current, onFiltersChange: apply } = latest.current;
      apply({ ...current, q: searchDraft });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  // Keep the input in step when a stats tile or a chip rewrites the filters.
  useEffect(() => {
    setSearchDraft(current => (current === filters.q ? current : filters.q));
  }, [filters.q]);

  const filterKey = JSON.stringify(filters);

  const load = useCallback(async (targetPage: number) => {
    setFetching(true);
    try {
      const result = await getProjectsPaged({
        page: targetPage,
        limit: PAGE_SIZE,
        sort: filters.sort,
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.statuses.length ? { status: filters.statuses.join(',') } : {}),
        ...(filters.priorities.length ? { priority: filters.priorities.join(',') } : {}),
        ...(filters.projectType !== 'all' ? { projectType: filters.projectType } : {}),
        ...(filters.overdue ? { overdue: true } : {})
      });
      setProjects(result.data);
      setPageCount(Math.max(1, result.pagination.pages));
      setTotal(result.pagination.total);
    } catch (error: any) {
      toast({
        title: "Couldn't load projects",
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setFetching(false);
      setInitialLoad(false);
    }
  }, [filterKey]);

  // A filter change always returns to the first page. Resetting here rather
  // than in a separate effect avoids fetching the old page under new filters.
  const lastFilterKey = useRef(filterKey);
  useEffect(() => {
    if (lastFilterKey.current !== filterKey) {
      lastFilterKey.current = filterKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    load(page);
  }, [load, page]);

  // Socket updates must reload with whatever the user is currently looking at,
  // so the handler reads the live loader instead of closing over the first one.
  const reload = useRef(() => load(page));
  useEffect(() => {
    reload.current = () => load(page);
  });

  useEffect(() => {
    if (!socket) return;
    const refresh = () => reload.current();
    socket.on('project:created', refresh);
    socket.on('project:updated', refresh);
    socket.on('project:deleted', refresh);
    return () => {
      socket.off('project:created', refresh);
      socket.off('project:updated', refresh);
      socket.off('project:deleted', refresh);
    };
  }, [socket]);

  useEffect(() => {
    if (!onAccessCountsChange) return;
    const basic = projects.filter(isBasicView).length;
    onAccessCountsChange({ full: projects.length - basic, basic });
  }, [projects, onAccessCountsChange]);

  const actions: ProjectActions = useMemo(() => ({
    onOpen: project => router.push(`/dashboard/projects/${project._id}`),
    onEdit: project => router.push(`/dashboard/projects/${project._id}/edit`),
    onClone: async project => {
      try {
        await cloneProject(project._id);
        toast({ title: `Duplicated "${project.name}"` });
        reload.current();
      } catch (error: any) {
        toast({
          title: 'Failed to duplicate project',
          description: error?.response?.data?.message || error?.message,
          variant: 'destructive'
        });
      }
    },
    onArchive: async project => {
      const target = project.status === 'archived' ? 'active' : 'archived';
      try {
        await setProjectStatus(project._id, target);
        toast({ title: target === 'archived' ? `Archived "${project.name}"` : `Restored "${project.name}"` });
        reload.current();
      } catch (error: any) {
        toast({
          title: `Failed to ${target === 'archived' ? 'archive' : 'restore'} project`,
          description: error?.response?.data?.message || error?.message,
          variant: 'destructive'
        });
      }
    },
    onDelete: project => setPendingDelete(project)
  }), [router]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const project = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteProject(project._id);
      toast({ title: `Deleted "${project.name}"` });
      reload.current();
    } catch (error: any) {
      toast({
        title: 'Failed to delete project',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    }
  };

  const hasFilters =
    !!filters.q ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.projectType !== 'all' ||
    filters.overdue;

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <FilterBar
            filters={filters}
            onChange={onFiltersChange}
            view={view}
            onViewChange={setView}
            searchDraft={searchDraft}
            onSearchDraft={setSearchDraft}
          />
        </CardContent>
      </Card>

      {initialLoad ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
              {hasFilters ? <Search className="w-7 h-7 text-muted-foreground" /> : <Briefcase className="w-7 h-7 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {hasFilters ? 'No projects match these filters' : 'No projects yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              {hasFilters
                ? 'Try widening the status or priority selection, or clear the filters to see everything you have access to.'
                : 'Create your first project to start tracking work, budgets and team assignments.'}
            </p>
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchDraft('');
                  onFiltersChange({ ...DEFAULT_FILTERS, sort: filters.sort });
                }}
              >
                Clear all filters
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/dashboard/projects/create')}
                className="bg-gradient-to-r from-[#970E2C] to-[#800020] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={fetching ? 'opacity-60 transition-opacity pointer-events-none' : 'transition-opacity'}>
          {view === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map(project => (
                <ProjectGridCard key={project._id} project={project} actions={actions} />
              ))}
            </div>
          )}
          {view === 'list' && (
            <Card className="overflow-hidden">
              <div className="divide-y">
                {projects.map(project => (
                  <ProjectListRow key={project._id} project={project} actions={actions} />
                ))}
              </div>
            </Card>
          )}
          {view === 'board' && <ProjectBoard projects={projects} actions={actions} />}
        </div>
      )}

      {!initialLoad && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing <span className="font-medium text-foreground tabular-nums">{rangeStart}–{rangeEnd}</span> of{' '}
            <span className="font-medium text-foreground tabular-nums">{total}</span> project{total === 1 ? '' : 's'}
          </p>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || fetching} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums px-1">
                {page} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount || fetching}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{pendingDelete?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project along with its tasks, reports and financial entries from your listings.
              Archive it instead if you only want it out of the way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectBrowser;
