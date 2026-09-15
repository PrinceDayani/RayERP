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
  Search, Plus, Filter, X, Grid3X3, Columns3, Briefcase, Calendar, Users, Table2, Layers, Download, MapPin,
  MoreHorizontal, Edit, Copy, Archive, ArchiveRestore, Trash2, AlertTriangle, ChevronDown, ChevronRight, Coins,
  UserPlus, ArrowDown, Loader2
} from "lucide-react";
import {
  getProjectsPaged, getProjectFacets, cloneProject, deleteProject, setProjectStatus,
  type Project, type ProjectFacets, type ProjectListParams
} from "@/lib/api/projectsAPI";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import { useSocket } from "@/hooks/useSocket";
import { exportToCSV } from "@/utils/exportUtils";
import {
  PROJECT_STATUSES, PROJECT_PRIORITIES, statusColor, priorityColor, priorityAccent,
  labelFor, isOverdue, daysRemaining, formatDate, isBasicView
} from "./projectMeta";

const PAGE_SIZES = [25, 50, 100] as const;
// The API caps a page at 100; exports walk the pages at that size.
const EXPORT_PAGE_SIZE = 100;

export interface ProjectFilters {
  q: string;
  statuses: string[];
  priorities: string[];
  projectType: 'all' | 'instruction' | 'reporting';
  overdue: boolean;
  client: string;
  city: string;
  sort: 'recent' | 'name' | 'progress' | 'endDate' | 'client' | 'value' | 'jobNumber';
}

export const DEFAULT_FILTERS: ProjectFilters = {
  q: '',
  statuses: [],
  priorities: [],
  projectType: 'all',
  overdue: false,
  client: '',
  city: '',
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
  client: current.client,
  city: current.city,
  sort: current.sort,
  statuses: tile === 'active' ? ['active'] : tile === 'completed' ? ['completed'] : [],
  overdue: tile === 'overdue'
});

type ViewMode = 'table' | 'grid' | 'board';

const SORT_LABELS: Record<ProjectFilters['sort'], string> = {
  recent: 'Recently updated',
  name: 'Name (A–Z)',
  client: 'Client (A–Z)',
  jobNumber: 'Job number',
  progress: 'Progress',
  value: 'Value (high–low)',
  endDate: 'Due date'
};

const teamOf = (project: Project): { _id?: string; name?: string }[] =>
  (Array.isArray(project.team) ? project.team : []).map(member =>
    typeof member === 'object' && member !== null ? member : { _id: member }
  );

const clientLine = (project: Project) =>
  [project.client, project.siteLocation?.city].filter(Boolean).join(' · ');

/** Query params for the list and facet endpoints from the browser filters. */
const toListParams = (filters: ProjectFilters): ProjectListParams => ({
  sort: filters.sort,
  ...(filters.q ? { q: filters.q } : {}),
  ...(filters.statuses.length ? { status: filters.statuses.join(',') } : {}),
  ...(filters.priorities.length ? { priority: filters.priorities.join(',') } : {}),
  ...(filters.projectType !== 'all' ? { projectType: filters.projectType } : {}),
  ...(filters.overdue ? { overdue: true } : {}),
  ...(filters.client ? { client: filters.client } : {}),
  ...(filters.city ? { city: filters.city } : {})
});

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

interface SearchableSelectProps {
  label: string;
  options: { name: string; count: number }[];
  value: string;
  onChange: (value: string) => void;
}

/** Single choice from a long option list, with a type-to-narrow box. */
const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const visible = term
    ? options.filter(option => option.name.toLowerCase().includes(term.toLowerCase()))
    : options;

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 justify-between gap-2 min-w-[9rem] max-w-[14rem]">
          <span className="truncate">
            {value ? <span className="text-[#970E2C] dark:text-[#e5809a] font-medium">{value}</span> : label}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <Input
          autoFocus
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder={`Search ${label.toLowerCase()}...`}
          value={term}
          onChange={e => setTerm(e.target.value)}
          className="h-9 mb-2"
        />
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {visible.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-3 text-center">No matches</p>
          ) : (
            visible.map(option => (
              <button
                key={option.name}
                type="button"
                onClick={() => pick(option.name)}
                className={`w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-muted ${
                  option.name === value ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="truncate">{option.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{option.count}</span>
              </button>
            ))
          )}
        </div>
        {value && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-8" onClick={() => pick('')}>
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
  facets: ProjectFacets;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
  onExport: () => void;
  exporting: boolean;
}

const VIEW_BUTTONS: { mode: ViewMode; icon: typeof Grid3X3; label: string }[] = [
  { mode: 'table', icon: Table2, label: 'Table view' },
  { mode: 'grid', icon: Grid3X3, label: 'Grid view' },
  { mode: 'board', icon: Columns3, label: 'Board view' }
];

const FilterBar: React.FC<FilterBarProps> = ({
  filters, onChange, view, onViewChange, searchDraft, onSearchDraft,
  facets, grouped, onGroupedChange, onExport, exporting
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
  if (filters.client) {
    chips.push({ key: 'client', label: `Client: ${filters.client}`, clear: () => onChange({ ...filters, client: '' }) });
  }
  if (filters.city) {
    chips.push({ key: 'city', label: `City: ${filters.city}`, clear: () => onChange({ ...filters, city: '' }) });
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
            placeholder="Search by name, client, job number, city or tag..."
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
          <SearchableSelect
            label="Client"
            options={facets.clients}
            value={filters.client}
            onChange={client => onChange({ ...filters, client })}
          />
          <SearchableSelect
            label="City"
            options={facets.cities}
            value={filters.city}
            onChange={city => onChange({ ...filters, city })}
          />
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
            value={grouped ? 'client' : filters.sort}
            disabled={grouped}
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

          {view === 'table' && (
            <Button
              variant="outline"
              aria-pressed={grouped}
              onClick={() => onGroupedChange(!grouped)}
              className={`h-10 gap-2 ${grouped ? 'border-[#970E2C] text-[#970E2C] dark:border-[#e5809a] dark:text-[#e5809a]' : ''}`}
            >
              <Layers className="h-4 w-4" />
              Group by client
            </Button>
          )}

          <Button variant="outline" className="h-10 gap-2" onClick={onExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>

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
  const team = teamOf(project);

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
            <h3
              title={project.name}
              className="font-semibold text-base leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-[#970E2C] dark:group-hover:text-[#e5809a] transition-colors"
            >
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5 flex items-center gap-1">
              {project.jobNumber && <span className="font-mono text-xs">{project.jobNumber} ·</span>}
              {clientLine(project) || 'No client'}
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

const TABLE_COLUMNS: { key: string; label: string; sort?: ProjectFilters['sort']; className: string }[] = [
  { key: 'job', label: 'Job No.', sort: 'jobNumber', className: 'w-[8.5rem] hidden xl:table-cell' },
  { key: 'name', label: 'Project', sort: 'name', className: 'min-w-[16rem]' },
  { key: 'client', label: 'Client', sort: 'client', className: 'w-[13rem] hidden md:table-cell' },
  { key: 'city', label: 'City', className: 'w-[8rem] hidden lg:table-cell' },
  { key: 'status', label: 'Status', className: 'w-[7.5rem]' },
  { key: 'progress', label: 'Progress', sort: 'progress', className: 'w-[9rem] hidden sm:table-cell' },
  { key: 'value', label: 'Value', sort: 'value', className: 'w-[8rem] text-right hidden lg:table-cell' },
  { key: 'team', label: 'Team', className: 'w-[4.5rem] text-right hidden xl:table-cell' },
  { key: 'due', label: 'Due', sort: 'endDate', className: 'w-[7.5rem] hidden md:table-cell' },
  { key: 'actions', label: '', className: 'w-10' }
];

const ProjectTableRow: React.FC<{ project: Project; actions: ProjectActions }> = ({ project, actions }) => {
  const { formatAmount } = useGlobalCurrency();
  const basic = isBasicView(project);
  const overdue = isOverdue(project);
  const team = teamOf(project);
  const open = () => actions.onOpen(project);
  const hidden = <span className="text-muted-foreground/60">—</span>;

  return (
    <tr
      tabIndex={0}
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/60 ${
        basic ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
      } ${project.status === 'archived' ? 'opacity-70' : ''}`}
    >
      <td className="px-3 py-2.5 hidden xl:table-cell font-mono text-xs text-muted-foreground whitespace-nowrap">
        {project.jobNumber || '—'}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityAccent(project.priority)}`} title={`${labelFor(project.priority)} priority`} />
          <div className="min-w-0">
            <p className="font-medium leading-snug line-clamp-2" title={project.name}>{project.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 md:hidden text-xs text-muted-foreground">
              {!basic && clientLine(project)}
            </div>
            {(basic || overdue) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {basic && <AccessLevelIndicator isBasicView className="shrink-0" />}
                {overdue && <OverdueBadge project={project} />}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 hidden md:table-cell text-sm">
        {basic ? hidden : <span className="line-clamp-2" title={project.client}>{project.client || '—'}</span>}
      </td>
      <td className="px-3 py-2.5 hidden lg:table-cell text-sm text-muted-foreground">
        {basic ? hidden : project.siteLocation?.city || '—'}
      </td>
      <td className="px-3 py-2.5">
        <Badge variant="secondary" className={`${statusColor(project.status)} whitespace-nowrap`}>{labelFor(project.status)}</Badge>
      </td>
      <td className="px-3 py-2.5 hidden sm:table-cell">
        {basic ? hidden : (
          <div className="flex items-center gap-2">
            <Progress value={project.progress ?? 0} className="h-1.5 flex-1" />
            <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{Math.round(project.progress ?? 0)}%</span>
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 hidden lg:table-cell text-sm text-right tabular-nums whitespace-nowrap">
        {basic ? hidden : project.budget ? formatAmount(project.budget, project.currency || 'INR') : '—'}
      </td>
      <td className="px-3 py-2.5 hidden xl:table-cell text-sm text-right tabular-nums text-muted-foreground">
        {basic ? hidden : (
          <span className="inline-flex items-center gap-1" title={team.map(m => m.name).filter(Boolean).join(', ')}>
            <Users className="h-3.5 w-3.5" />{team.length}
          </span>
        )}
      </td>
      <td className={`px-3 py-2.5 hidden md:table-cell text-sm whitespace-nowrap ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
        {formatDate(project.endDate)}
      </td>
      <td className="px-1 py-2.5">
        {!basic && <ProjectMenu project={project} actions={actions} />}
      </td>
    </tr>
  );
};

interface ProjectTableProps {
  projects: Project[];
  actions: ProjectActions;
  sort: ProjectFilters['sort'];
  onSort: (sort: ProjectFilters['sort']) => void;
  /** Present when grouping by client: totals keyed by client name ('' for none). */
  groups: Map<string, ProjectFacets['groups'][number]> | null;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, actions, sort, onSort, groups }) => {
  const { formatAmount } = useGlobalCurrency();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Department-view rows carry no client; they group together at the end.
  const RESTRICTED = '__restricted__';
  const sections = useMemo(() => {
    if (!groups) return [{ key: '', rows: projects }];
    const ordered = new Map<string, Project[]>();
    for (const project of projects) {
      const key = isBasicView(project) ? RESTRICTED : project.client || '';
      ordered.set(key, [...(ordered.get(key) || []), project]);
    }
    return [...ordered.entries()].map(([key, rows]) => ({ key, rows }));
  }, [projects, groups]);

  const toggle = (key: string) =>
    setCollapsed(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/60 sticky top-0 z-10">
            <tr className="border-b">
              {TABLE_COLUMNS.map(column => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.sort && sort === column.sort ? 'descending' : undefined}
                  className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${column.className}`}
                >
                  {column.sort && !groups ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sort!)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-foreground ${sort === column.sort ? 'text-foreground' : ''}`}
                    >
                      {column.label}
                      <ArrowDown className={`h-3 w-3 ${sort === column.sort ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  ) : column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map(section => {
              const group = section.key === RESTRICTED ? undefined : groups?.get(section.key);
              const isCollapsed = collapsed.has(section.key);
              return (
                <React.Fragment key={section.key || 'none'}>
                  {groups && (
                    <tr className="bg-muted/30 border-b">
                      <td colSpan={TABLE_COLUMNS.length} className="px-3 py-2">
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          onClick={() => toggle(section.key)}
                          className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 text-left"
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-sm">
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {section.key === RESTRICTED ? 'Department view (client hidden)' : section.key || 'No client'}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {group
                              ? <>{group.count} project{group.count === 1 ? '' : 's'} · {formatAmount(group.value, 'INR')} · avg {group.progress}%</>
                              : <>{section.rows.length} on this page</>}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )}
                  {!isCollapsed && section.rows.map(project => (
                    <ProjectTableRow key={project._id} project={project} actions={actions} />
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
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
                    <p className="font-medium text-sm leading-snug line-clamp-2" title={project.name}>{project.name}</p>
                    {!isBasicView(project) && clientLine(project) && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />{clientLine(project)}
                      </p>
                    )}
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
  const [view, setView] = useState<ViewMode>('table');
  const [pageSize, setPageSize] = useState<number>(50);
  const [grouped, setGrouped] = useState(false);
  const [facets, setFacets] = useState<ProjectFacets>({ clients: [], cities: [], groups: [] });
  const [exporting, setExporting] = useState(false);
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

  // Grouping needs rows ordered by client so each group is contiguous.
  const effectiveFilters = useMemo<ProjectFilters>(
    () => (grouped && view === 'table' ? { ...filters, sort: 'client' } : filters),
    [filters, grouped, view]
  );
  const filterKey = JSON.stringify(effectiveFilters) + `|${pageSize}`;

  const load = useCallback(async (targetPage: number) => {
    setFetching(true);
    try {
      const result = await getProjectsPaged({ page: targetPage, limit: pageSize, ...toListParams(effectiveFilters) });
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

  // Facets follow the filters but not the page; a failure only empties the dropdowns.
  const facetKey = JSON.stringify({ ...filters, sort: undefined });
  const loadFacets = useCallback(async () => {
    try {
      setFacets(await getProjectFacets(toListParams(filters)));
    } catch {
      setFacets({ clients: [], cities: [], groups: [] });
    }
  }, [facetKey]);

  useEffect(() => {
    loadFacets();
  }, [loadFacets]);

  // Socket updates must reload with whatever the user is currently looking at,
  // so the handler reads the live loader instead of closing over the first one.
  const reload = useRef<() => void>(() => load(page));
  useEffect(() => {
    reload.current = () => {
      load(page);
      loadFacets();
    };
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

  // Exports every project matching the current filters, not just this page.
  const handleExport = async () => {
    setExporting(true);
    try {
      const rows: Project[] = [];
      for (let p = 1; ; p++) {
        const result = await getProjectsPaged({ page: p, limit: EXPORT_PAGE_SIZE, ...toListParams(effectiveFilters) });
        rows.push(...result.data);
        if (p >= result.pagination.pages || result.data.length === 0) break;
      }
      // Department-view rows arrive without client, budget or team; they stay blank.
      exportToCSV({
        filename: 'projects',
        data: rows,
        columns: [
          { header: 'Job No.', accessor: 'jobNumber' },
          { header: 'Project', accessor: 'name' },
          { header: 'Client', accessor: 'client' },
          { header: 'City', accessor: (p: Project) => p.siteLocation?.city },
          { header: 'Status', accessor: (p: Project) => labelFor(p.status) },
          { header: 'Priority', accessor: (p: Project) => labelFor(p.priority) },
          { header: 'Progress %', accessor: (p: Project) => (isBasicView(p) ? '' : Math.round(p.progress ?? 0)) },
          { header: 'Value', accessor: (p: Project) => (isBasicView(p) ? '' : p.budget ?? 0) },
          { header: 'Currency', accessor: (p: Project) => (isBasicView(p) ? '' : p.currency || 'INR') },
          { header: 'Start', accessor: (p: Project) => p.startDate?.slice(0, 10) },
          { header: 'Due', accessor: (p: Project) => p.endDate?.slice(0, 10) },
          { header: 'Team', accessor: (p: Project) => teamOf(p).map(m => m.name).filter(Boolean).join('; ') },
          { header: 'Access', accessor: (p: Project) => (isBasicView(p) ? 'Department view' : 'Full') }
        ]
      });
      toast({ title: `Exported ${rows.length} project${rows.length === 1 ? '' : 's'}` });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.response?.data?.message || error?.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const groupTotals = useMemo(
    () => (grouped && view === 'table' ? new Map(facets.groups.map(g => [g.client, g])) : null),
    [grouped, view, facets.groups]
  );

  const hasFilters =
    !!filters.q ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.projectType !== 'all' ||
    filters.overdue ||
    !!filters.client ||
    !!filters.city;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

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
            facets={facets}
            grouped={grouped}
            onGroupedChange={setGrouped}
            onExport={handleExport}
            exporting={exporting}
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
          {view === 'table' && (
            <ProjectTable
              projects={projects}
              actions={actions}
              sort={effectiveFilters.sort}
              onSort={sort => onFiltersChange({ ...filters, sort })}
              groups={groupTotals}
            />
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
          <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Per page</span>
            <Select value={String(pageSize)} onValueChange={value => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[4.75rem]" aria-label="Projects per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
