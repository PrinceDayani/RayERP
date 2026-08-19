"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Activity, Target, AlertTriangle } from "lucide-react";

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  totalTasks: number;
  completedTasks: number;
  atRiskProjects?: number;
  overdueProjects?: number;
}

export type StatFilter = 'all' | 'active' | 'completed' | 'overdue';

interface ProjectStatsCardsProps {
  stats: ProjectStats;
  loading?: boolean;
  /** Which tile is currently reflected by the browser's filters. */
  activeFilter?: StatFilter;
  onSelect?: (filter: StatFilter) => void;
}

const TILES = [
  {
    key: 'all' as const,
    label: 'Total Projects',
    icon: Briefcase,
    ring: 'focus-visible:ring-[#970E2C]/40',
    active: 'border-[#970E2C] ring-1 ring-[#970E2C]/30',
    icons: 'bg-gradient-to-br from-[#970E2C] to-[#800020] text-white shadow-[#970E2C]/25',
    value: 'text-[#970E2C] dark:text-[#e5809a]'
  },
  {
    key: 'active' as const,
    label: 'Active',
    icon: Activity,
    ring: 'focus-visible:ring-emerald-500/40',
    active: 'border-emerald-500 ring-1 ring-emerald-500/30',
    icons: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25',
    value: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    key: 'completed' as const,
    label: 'Completed',
    icon: Target,
    ring: 'focus-visible:ring-blue-500/40',
    active: 'border-blue-500 ring-1 ring-blue-500/30',
    icons: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
    value: 'text-blue-600 dark:text-blue-400'
  },
  {
    key: 'overdue' as const,
    label: 'Overdue',
    icon: AlertTriangle,
    ring: 'focus-visible:ring-amber-500/40',
    active: 'border-amber-500 ring-1 ring-amber-500/30',
    icons: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
    value: 'text-amber-600 dark:text-amber-400'
  }
];

const ProjectStatsCards: React.FC<ProjectStatsCardsProps> = ({
  stats,
  loading = false,
  activeFilter = 'all',
  onSelect
}) => {
  const share = (count: number) =>
    stats.totalProjects > 0 ? `${Math.round((count / stats.totalProjects) * 100)}% of all projects` : 'No projects yet';

  const values: Record<StatFilter, { value: number; caption: string }> = {
    all: { value: stats.totalProjects, caption: 'Everything you can see' },
    active: { value: stats.activeProjects, caption: share(stats.activeProjects) },
    completed: { value: stats.completedProjects, caption: share(stats.completedProjects) },
    overdue: {
      value: stats.overdueProjects ?? 0,
      caption: `${stats.overdueTasks} overdue task${stats.overdueTasks === 1 ? '' : 's'}`
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {TILES.map(tile => {
        const Icon = tile.icon;
        const { value, caption } = values[tile.key];
        const selected = activeFilter === tile.key;

        return (
          <Card
            key={tile.key}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-pressed={onSelect ? selected : undefined}
            onClick={onSelect ? () => onSelect(tile.key) : undefined}
            onKeyDown={
              onSelect
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(tile.key);
                    }
                  }
                : undefined
            }
            className={`border shadow-sm transition-all ${tile.ring} focus-visible:outline-none focus-visible:ring-2 ${
              onSelect ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
            } ${selected ? tile.active : 'border-border/60'}`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tile.label}</p>
                  {loading ? (
                    <Skeleton className="h-9 w-14 mt-2" />
                  ) : (
                    <p className={`text-3xl sm:text-4xl font-bold mt-1.5 tabular-nums ${tile.value}`}>{value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5 truncate">{loading ? ' ' : caption}</p>
                </div>
                <div className={`p-3 rounded-xl shadow-lg shrink-0 ${tile.icons}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectStatsCards;
