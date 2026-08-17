"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, ChevronUp, ChevronDown, Pencil, Trash2, Layers, IndianRupee, CalendarDays
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import projectPhasesAPI, { ProjectPhase, PhaseStatus } from "@/lib/api/projectPhasesAPI";
import { usePermissions } from "@/hooks/usePermissions";
import projectsAPI, { Milestone } from "@/lib/api/projectsAPI";
import { ProjectMilestones } from "./ProjectMilestones";
import PhaseReviewPanel from "./PhaseReviewPanel";

interface DepartmentOption {
  _id: string;
  name: string;
}

interface ProjectPhasesProps {
  projectId: string;
  currency?: string;
  /** Override the permission-derived defaults when a caller knows better. */
  canManage?: boolean;
  canReview?: boolean;
}

const STATUS_STYLES: Record<PhaseStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  'in-review': 'bg-blue-100 text-blue-700',
  'changes-requested': 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  'in-progress': 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  'on-hold': 'bg-orange-100 text-orange-700',
  cancelled: 'bg-gray-200 text-gray-600'
};

const emptyForm = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: '',
  reviewDepartments: [] as string[]
};

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

export const ProjectPhases: React.FC<ProjectPhasesProps> = ({
  projectId,
  currency = 'INR',
  canManage,
  canReview
}) => {
  const { hasPermission, isRoot } = usePermissions();
  const mayManage = canManage ?? (isRoot || hasPermission('projects.manage_phases'));
  const mayReview = canReview ?? (isRoot || hasPermission('projects.review_phases'));

  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const data = await projectPhasesAPI.list(projectId);
      setPhases(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Could not load phases",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    projectsAPI.getDepartmentsMinimal()
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }, []);

  const totals = useMemo(() => ({
    budget: phases.reduce((sum, p) => sum + (p.budget || 0), 0),
    approved: phases.filter(p => p.status === 'approved' || p.status === 'completed').length,
    inReview: phases.filter(p => p.status === 'in-review').length
  }), [phases]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (phase: ProjectPhase) => {
    setEditingId(phase._id);
    setForm({
      name: phase.name,
      description: phase.description || '',
      startDate: toDateInput(phase.startDate),
      endDate: toDateInput(phase.endDate),
      budget: String(phase.budget ?? ''),
      reviewDepartments: (phase.reviewDepartments as any[]).map(d =>
        typeof d === 'string' ? d : d._id
      )
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Phase name is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: parseFloat(form.budget) || 0,
        reviewDepartments: form.reviewDepartments
      } as any;

      if (editingId) {
        await projectPhasesAPI.update(editingId, payload);
        toast({ title: "Phase updated" });
      } else {
        await projectPhasesAPI.create(projectId, payload);
        toast({ title: "Phase created" });
      }
      setDialogOpen(false);
      await load();
    } catch (error: any) {
      toast({
        title: editingId ? "Could not update phase" : "Could not create phase",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (phase: ProjectPhase) => {
    setBusy(true);
    try {
      await projectPhasesAPI.remove(phase._id);
      toast({ title: "Phase deleted" });
      await load();
    } catch (error: any) {
      toast({
        title: "Could not delete phase",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= phases.length) return;

    const reordered = [...phases];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPhases(reordered);

    try {
      await projectPhasesAPI.reorder(projectId, reordered.map(p => p._id));
    } catch (error: any) {
      toast({
        title: "Could not reorder phases",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
      await load();
    }
  };

  const handleMilestones = async (phaseId: string, milestones: Milestone[]) => {
    try {
      await projectPhasesAPI.updateMilestones(phaseId, milestones);
      await load();
    } catch (error: any) {
      toast({
        title: "Could not update milestones",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    }
  };

  const toggleDepartment = (id: string) => {
    setForm(prev => ({
      ...prev,
      reviewDepartments: prev.reviewDepartments.includes(id)
        ? prev.reviewDepartments.filter(d => d !== id)
        : [...prev.reviewDepartments, id]
    }));
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading phases…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Project Phases</CardTitle>
              <Badge variant="secondary">{phases.length}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{totals.approved} approved</span>
              <span>{totals.inReview} in review</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" />{formatMoney(totals.budget)}
              </span>
              {mayManage && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />Add Phase
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {phases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Layers className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              This project has no phases yet. Break the work into phases so each one can be reviewed by the right departments.
            </p>
            {mayManage && (
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create the first phase</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const isExpanded = expandedId === phase._id;
            const departmentNames = (phase.reviewDepartments as any[]).map(d =>
              typeof d === 'string' ? d : d.name
            );

            return (
              <Card key={phase._id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1"
                          disabled={!mayManage || index === 0 || busy}
                          onClick={() => handleMove(index, -1)}
                          aria-label={`Move ${phase.name} up`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1"
                          disabled={!mayManage || index === phases.length - 1 || busy}
                          onClick={() => handleMove(index, 1)}
                          aria-label={`Move ${phase.name} down`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <CardTitle className="text-base truncate">{phase.name}</CardTitle>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[phase.status]}`}>
                            {phase.status}
                          </span>
                        </div>
                        {phase.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{phase.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {(phase.startDate || phase.endDate) && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {phase.startDate ? new Date(phase.startDate).toLocaleDateString() : '—'}
                              {' → '}
                              {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : '—'}
                            </span>
                          )}
                          <span>{formatMoney(phase.budget)}</span>
                          <span>{phase.milestones.length} milestone(s)</span>
                          {departmentNames.length > 0 && (
                            <span>Review: {departmentNames.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-28">
                        <Progress value={phase.progress} />
                        <p className="mt-1 text-right text-xs text-muted-foreground">{phase.progress}%</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedId(isExpanded ? null : phase._id)}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </Button>
                      {mayManage && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(phase)}
                            disabled={phase.status === 'in-review'}
                            aria-label={`Edit ${phase.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(phase)}
                            disabled={busy || phase.status === 'in-review'}
                            aria-label={`Delete ${phase.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-0">
                    <ProjectMilestones
                      milestones={phase.milestones}
                      onUpdate={(milestones) => handleMilestones(phase._id, milestones)}
                      readOnly={!mayManage || phase.status === 'in-review'}
                    />
                    <PhaseReviewPanel
                      phase={phase}
                      canManage={mayManage}
                      canReview={mayReview}
                      onChanged={load}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Phase' : 'New Phase'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Budget</Label>
              <Input
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <div>
              <Label>Review departments</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Each selected department signs off in the order listed here.
              </p>
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active departments available.</p>
              ) : (
                <div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
                  {departments.map(dept => (
                    <label key={dept._id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.reviewDepartments.includes(dept._id)}
                        onCheckedChange={() => toggleDepartment(dept._id)}
                      />
                      <span>{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={handleSave} disabled={busy}>{editingId ? 'Save changes' : 'Create phase'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectPhases;
