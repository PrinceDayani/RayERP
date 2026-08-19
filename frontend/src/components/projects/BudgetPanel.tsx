"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { SectionLoader } from "@/components/PageLoader";
import { toast } from "@/components/ui/use-toast";
import { Plus, Coins, Clock, CheckCircle2, TrendingUp, Trash2 } from "lucide-react";
import api from "@/lib/api/api";
import { getProjectsMinimal, type Project } from "@/lib/api/projectsAPI";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import CurrencyConverter from "@/components/budget/CurrencyConverter";
import ProjectCurrencySwitcher from "@/components/projects/ProjectCurrencySwitcher";
import { labelFor } from "./projectMeta";

const BUDGET_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300',
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300',
  active: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300'
};

const EMPTY_FORM = {
  projectName: '',
  project: '',
  totalBudget: '',
  currency: 'INR',
  description: ''
};

interface BudgetSummary {
  totalBudgets: number;
  pendingApprovals: number;
  approvedBudgets: number;
  utilizationRate: number;
}

const BudgetPanel: React.FC = () => {
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [projects, setProjects] = useState<Pick<Project, '_id' | 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);

  const load = async () => {
    // Both calls go through the shared client so a stale access token is
    // refreshed and retried instead of surfacing as an empty list.
    const [budgetList, analytics] = await Promise.all([
      api.get('/budgets/all').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
      api.get('/budgets/analytics').then(r => r.data?.data ?? r.data ?? null).catch(() => null)
    ]);
    setBudgets(Array.isArray(budgetList) ? budgetList : []);
    setSummary(analytics?.summary ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // The picker needs every project the user can reach, not one page of them.
    getProjectsMinimal().then(setProjects).catch(() => setProjects([]));
  }, []);

  const createBudget = async () => {
    const amount = parseFloat(form.totalBudget);
    if (!form.projectName.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'A project name and a positive budget amount are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/budgets', { ...form, projectName: form.projectName.trim(), totalBudget: amount });
      toast({ title: 'Budget created' });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (error: any) {
      toast({
        title: 'Failed to create budget',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const budget = pendingDelete;
    setPendingDelete(null);
    try {
      await api.delete(`/budgets/${budget._id}`);
      toast({ title: 'Budget deleted' });
      load();
    } catch (error: any) {
      toast({
        title: 'Failed to delete budget',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      });
    }
  };

  const tiles = summary
    ? [
        { label: 'Total budgets', value: summary.totalBudgets, icon: Coins, tone: 'text-blue-600 dark:text-blue-400' },
        { label: 'Pending', value: summary.pendingApprovals, icon: Clock, tone: 'text-amber-600 dark:text-amber-400' },
        { label: 'Approved', value: summary.approvedBudgets, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Utilization', value: `${summary.utilizationRate}%`, icon: TrendingUp, tone: 'text-violet-600 dark:text-violet-400' }
      ]
    : [];

  if (loading) {
    return <Card><CardContent className="p-10"><SectionLoader text="Loading budget data..." /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map(tile => {
            const Icon = tile.icon;
            return (
              <Card key={tile.label} className="border-border/60 shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tile.label}</p>
                    <p className={`text-3xl font-bold mt-1.5 tabular-nums ${tile.tone}`}>{tile.value}</p>
                  </div>
                  <Icon className={`h-6 w-6 shrink-0 ${tile.tone}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CurrencyConverter />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-5 w-5 text-[#970E2C]" />
            Project Budgets
            <span className="text-sm font-normal text-muted-foreground tabular-nums">({budgets.length})</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <ProjectCurrencySwitcher />
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-[#970E2C] to-[#800020] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Button>
            <Button onClick={() => router.push('/dashboard/finance/budgets')} size="sm" variant="outline">
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No budgets yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a budget to track planned versus actual spend on a project.
              </p>
            </div>
          ) : (
            <div className="divide-y -mx-6">
              {budgets.slice(0, 10).map(budget => {
                const utilization = budget.utilizationPercentage || 0;
                return (
                  <div
                    key={budget._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/finance/budgets/${budget._id}`)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/dashboard/finance/budgets/${budget._id}`);
                      }
                    }}
                    className="flex flex-col lg:flex-row lg:items-center gap-3 px-6 py-3.5 cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#970E2C]/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{budget.projectName}</span>
                        <Badge
                          variant="secondary"
                          className={BUDGET_STATUS_COLORS[budget.status] || BUDGET_STATUS_COLORS.draft}
                        >
                          {labelFor(budget.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        <span>Budget {formatAmount(budget.totalBudget, budget.currency || 'INR')}</span>
                        <span>Spent {formatAmount(budget.actualSpent || 0, budget.currency || 'INR')}</span>
                        <span>
                          Remaining{' '}
                          {formatAmount(budget.remainingBudget ?? budget.totalBudget, budget.currency || 'INR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Used</span>
                          <span className={`font-medium tabular-nums ${utilization > 100 ? 'text-red-600' : ''}`}>
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(utilization, 100)} className="h-1.5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete budget for ${budget.projectName}`}
                        onClick={e => {
                          e.stopPropagation();
                          setPendingDelete(budget);
                        }}
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
          {budgets.length > 10 && (
            <p className="text-xs text-muted-foreground text-center pt-4">
              Showing the 10 most recent of {budgets.length}. Use &ldquo;View all&rdquo; for the rest.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select
                value={form.project}
                onValueChange={value => {
                  const selected = projects.find(p => p._id === value);
                  setForm(prev => ({
                    ...prev,
                    project: value,
                    projectName: prev.projectName || selected?.name || ''
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Link to an existing project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project._id} value={project._id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-name">Budget name *</Label>
              <Input
                id="budget-name"
                value={form.projectName}
                onChange={e => setForm({ ...form, projectName: e.target.value })}
                placeholder="Name shown in the budget list"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="budget-amount">Total budget *</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  min="0"
                  value={form.totalBudget}
                  onChange={e => setForm({ ...form, totalBudget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={value => setForm({ ...form, currency: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-description">Description</Label>
              <Input
                id="budget-description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={createBudget} disabled={submitting} className="flex-1">
                {submitting ? 'Creating...' : 'Create budget'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the budget for &ldquo;{pendingDelete?.projectName}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Allocations and recorded spend under this budget are removed with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetPanel;
