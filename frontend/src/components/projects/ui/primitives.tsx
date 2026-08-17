"use client";

/**
 * Shared building blocks for the project surface.
 *
 * Two rules this module exists to enforce:
 *
 * 1. Brand crimson (--primary) is reserved for primary actions and the active
 *    navigation state. It never encodes status.
 * 2. Status is encoded by the semantic scale below. The global tokens map
 *    --success / --warning / --info all onto burgundy hue 348, so they cannot
 *    distinguish states; these explicit tones can.
 */

import React from "react";
import { cn } from "@/lib/utils";

// --- Semantic status scale -------------------------------------------------

export type Tone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900',
  progress: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
};

const TONE_BARS: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-sky-500',
  progress: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500'
};

/** Map any status string used across the project surface onto a tone. */
export const toneForStatus = (status?: string): Tone => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'accepted':
    case 'met':
    case 'won':
    case 'released':
    case 'paid':
      return 'success';

    case 'active':
    case 'in-progress':
    case 'in progress':
    case 'submitted':
    case 'published':
      return 'progress';

    case 'in-review':
    case 'under-review':
    case 'pending':
    case 'planning':
    case 'draft':
    case 'identified':
    case 'awaited':
      return 'info';

    case 'on-hold':
    case 'changes-requested':
    case 'delayed':
    case 'partial':
    case 'negotiation':
    case 'go-no-go':
      return 'warning';

    case 'cancelled':
    case 'rejected':
    case 'lost':
    case 'not-met':
    case 'forfeited':
    case 'dropped':
    case 'overdue':
      return 'danger';

    default:
      return 'neutral';
  }
};

// --- StatusPill ------------------------------------------------------------

export const StatusPill: React.FC<{
  status?: string;
  tone?: Tone;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ status, tone, label, icon, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
      TONE_CLASSES[tone ?? toneForStatus(status)],
      className
    )}
  >
    {icon}
    {label ?? ((status || '').replace(/-/g, ' ') || '—')}
  </span>
);

// --- StatTile --------------------------------------------------------------

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Renders a progress bar under the value when set (0-100). */
  progress?: number;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label, value, hint, icon, progress, tone = 'neutral', onClick, className
}) => {
  const interactive = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!(); } } : undefined}
      className={cn(
        "rounded-lg border bg-card px-3 py-2.5",
        interactive && "cursor-pointer transition-colors hover:border-primary/40 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      </div>
      <p className="mt-0.5 text-xl font-semibold leading-tight tabular-nums">{value}</p>
      {typeof progress === 'number' && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", TONE_BARS[tone])}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

// --- PageHeader ------------------------------------------------------------

export interface PageHeaderProps {
  title: React.ReactNode;
  /** Short facts rendered as a single dot-separated line under the title. */
  meta?: React.ReactNode[];
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href?: string; onClick?: () => void; label?: string };
  stats?: React.ReactNode;
  description?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title, meta, badges, actions, back, stats, description
}) => (
  <div className="border-b bg-card">
    <div className="space-y-3 px-6 pt-5 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {back && (
            <button
              onClick={back.onClick}
              className="mb-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ← {back.label || 'Back'}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
            {badges}
          </div>
          {description && (
            <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          )}
          {meta && meta.filter(Boolean).length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {meta.filter(Boolean).map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span aria-hidden className="text-muted-foreground/40">·</span>}
                  <span className="inline-flex items-center gap-1">{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {stats}
    </div>
  </div>
);

/** Responsive row for StatTiles inside a PageHeader. */
export const StatRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6", className)}>
    {children}
  </div>
);

// --- SectionNav ------------------------------------------------------------

export interface NavSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface NavGroup {
  id: string;
  label: string;
  icon?: React.ReactNode;
  sections: NavSection[];
}

/**
 * Two-level navigation: groups on the primary row, and the active group's
 * sections on a secondary row (hidden when a group holds a single section).
 */
export const SectionNav: React.FC<{
  groups: NavGroup[];
  value: string;
  onChange: (sectionId: string) => void;
}> = ({ groups, value, onChange }) => {
  const activeGroup = groups.find(g => g.sections.some(s => s.id === value)) || groups[0];

  return (
    <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-1 overflow-x-auto px-6">
        {groups.map(group => {
          const isActive = group.id === activeGroup?.id;
          return (
            <button
              key={group.id}
              onClick={() => onChange(group.sections[0].id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {group.icon}
              {group.label}
            </button>
          );
        })}
      </div>

      {activeGroup && activeGroup.sections.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-t bg-muted/30 px-6 py-1.5">
          {activeGroup.sections.map(section => (
            <button
              key={section.id}
              onClick={() => onChange(section.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                section.id === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Dense table -----------------------------------------------------------

export const DataTable: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("overflow-x-auto rounded-lg border", className)}>
    <table className="w-full border-collapse text-sm">{children}</table>
  </div>
);

export const Th: React.FC<{
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}> = ({ children, align = 'left', className }) => (
  <th
    className={cn(
      "whitespace-nowrap border-b bg-muted/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      align === 'left' && 'text-left',
      className
    )}
  >
    {children}
  </th>
);

export const Td: React.FC<{
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  colSpan?: number;
}> = ({ children, align = 'left', className, colSpan }) => (
  <td
    colSpan={colSpan}
    className={cn(
      "border-b px-3 py-2 align-middle",
      align === 'right' && 'text-right tabular-nums',
      align === 'center' && 'text-center',
      className
    )}
  >
    {children}
  </td>
);

export const Tr: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => (
  <tr
    onClick={onClick}
    className={cn(
      "transition-colors last:[&>td]:border-b-0",
      onClick && "cursor-pointer hover:bg-accent/50",
      className
    )}
  >
    {children}
  </tr>
);

// --- States ----------------------------------------------------------------

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-14 text-center", className)}>
    {icon && <div className="text-muted-foreground/40">{icon}</div>}
    <p className="font-medium">{title}</p>
    {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const LoadingRows: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className }) => (
  <div className={cn("space-y-2 p-4", className)}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-9 animate-pulse rounded bg-muted" />
    ))}
  </div>
);

/** Section wrapper used inside a content area. */
export const Panel: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}> = ({ title, description, actions, children, className, bodyClassName }) => (
  <section className={cn("rounded-lg border bg-card", className)}>
    {(title || actions) && (
      <header className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={cn("p-4", bodyClassName)}>{children}</div>
  </section>
);
