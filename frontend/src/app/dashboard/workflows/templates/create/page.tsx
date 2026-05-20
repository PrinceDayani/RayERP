"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Plus, Trash2, Save, GripVertical, ChevronDown, ChevronUp,
  GitBranch, CheckCircle2, Bell, Zap, Clock, Users
} from "lucide-react";
import { workflowsAPI, WorkflowStep, StepType, EntityType } from "@/lib/api/workflowsAPI";
import { toast } from "sonner";

const STEP_TYPES: { value: StepType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'approval', label: 'Approval', icon: <CheckCircle2 className="h-4 w-4" />, description: 'Requires approval from designated users' },
  { value: 'task', label: 'Task', icon: <Users className="h-4 w-4" />, description: 'Creates and assigns a task' },
  { value: 'notification', label: 'Notification', icon: <Bell className="h-4 w-4" />, description: 'Sends notification to users' },
  { value: 'condition', label: 'Condition', icon: <GitBranch className="h-4 w-4" />, description: 'Conditional branching (if/else)' },
  { value: 'auto-action', label: 'Auto Action', icon: <Zap className="h-4 w-4" />, description: 'Automated status change or field update' },
  { value: 'timer', label: 'Timer', icon: <Clock className="h-4 w-4" />, description: 'Wait for a duration' },
];

const CATEGORIES = [
  { value: 'procurement', label: 'Procurement' },
  { value: 'finance', label: 'Finance' },
  { value: 'project', label: 'Project' },
  { value: 'hr', label: 'HR' },
  { value: 'operations', label: 'Operations' },
  { value: 'custom', label: 'Custom' },
];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
  { value: 'work-order', label: 'Work Order' },
  { value: 'purchase-order', label: 'Purchase Order' },
  { value: 'boq', label: 'BOQ' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'payment', label: 'Payment' },
  { value: 'expense', label: 'Expense' },
  { value: 'budget', label: 'Budget' },
  { value: 'bill', label: 'Bill' },
];

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual Start' },
  { value: 'entity-created', label: 'When Entity Created' },
  { value: 'status-changed', label: 'When Status Changes' },
  { value: 'amount-threshold', label: 'When Amount Exceeds Threshold' },
];

interface StepFormData {
  stepId: string;
  name: string;
  description: string;
  type: StepType;
  order: number;
  approverType: string;
  approverRoles: string;
  approvalMode: 'any' | 'all' | 'majority';
  taskTitle: string;
  taskDescription: string;
  taskAssigneeType: string;
  taskAssigneeRoles: string;
  taskDueInDays: number;
  taskPriority: string;
  slaExpectedHours: number;
  slaWarningHours: number;
  escalationEnabled: boolean;
  escalationAfterHours: number;
  escalationTo: string;
  isTerminal: boolean;
  expanded: boolean;
}

const createEmptyStep = (order: number): StepFormData => ({
  stepId: `step-${Date.now()}-${order}`,
  name: '',
  description: '',
  type: 'approval',
  order,
  approverType: 'role',
  approverRoles: '',
  approvalMode: 'any',
  taskTitle: '',
  taskDescription: '',
  taskAssigneeType: 'role',
  taskAssigneeRoles: '',
  taskDueInDays: 3,
  taskPriority: 'medium',
  slaExpectedHours: 24,
  slaWarningHours: 16,
  escalationEnabled: false,
  escalationAfterHours: 48,
  escalationTo: 'department-head',
  isTerminal: false,
  expanded: true,
});

export default function CreateTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'project' as string,
    entityType: 'project' as EntityType,
    priority: 'medium' as string,
    estimatedDurationHours: 168,
    triggerType: 'entity-created' as string,
    triggerStatusFrom: '',
    triggerStatusTo: '',
    triggerAmountThreshold: 0,
    isDefault: false,
    tags: '',
  });

  const [steps, setSteps] = useState<StepFormData[]>([createEmptyStep(1)]);

  const addStep = () => {
    setSteps(prev => [...prev, createEmptyStep(prev.length + 1)]);
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const toggleExpand = (index: number) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, expanded: !s.expanded } : s));
  };

  const buildStepsPayload = (): WorkflowStep[] => {
    return steps.map((s, index) => {
      const step: any = {
        stepId: s.stepId,
        name: s.name,
        description: s.description || undefined,
        type: s.type,
        order: s.order,
        isTerminal: index === steps.length - 1 || s.isTerminal,
        nextSteps: index < steps.length - 1 && !s.isTerminal ? [steps[index + 1].stepId] : [],
      };

      if (s.type === 'approval') {
        step.approverType = s.approverType;
        step.approverRoles = s.approverRoles.split(',').map((r: string) => r.trim()).filter(Boolean);
        step.approvalMode = s.approvalMode;
      }

      if (s.type === 'task') {
        step.taskConfig = {
          title: s.taskTitle,
          description: s.taskDescription || undefined,
          assigneeType: s.taskAssigneeType,
          assigneeRoles: s.taskAssigneeRoles.split(',').map((r: string) => r.trim()).filter(Boolean),
          dueInDays: s.taskDueInDays,
          priority: s.taskPriority,
        };
      }

      if (s.type === 'auto-action') {
        step.actions = [{ type: 'change-status', config: { newStatus: 'active' } }];
      }

      if (s.slaExpectedHours > 0) {
        step.sla = { expectedHours: s.slaExpectedHours, warningHours: s.slaWarningHours };
      }

      if (s.escalationEnabled) {
        step.escalation = {
          enabled: true,
          afterHours: s.escalationAfterHours,
          escalateTo: s.escalationTo,
          maxEscalations: 2,
        };
      }

      return step;
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (steps.length === 0 || !steps[0].name.trim()) {
      toast.error('At least one step with a name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        entityType: form.entityType,
        priority: form.priority,
        estimatedDurationHours: form.estimatedDurationHours,
        isDefault: form.isDefault,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        trigger: {
          type: form.triggerType,
          entityType: form.entityType,
          ...(form.triggerType === 'status-changed' && { statusFrom: form.triggerStatusFrom, statusTo: form.triggerStatusTo }),
          ...(form.triggerType === 'amount-threshold' && { amountThreshold: form.triggerAmountThreshold }),
        },
        steps: buildStepsPayload(),
      };

      await workflowsAPI.createTemplate(payload as any);
      toast.success('Workflow template created successfully');
      router.push('/dashboard/workflows/templates');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Workflow Template</h1>
            <p className="text-muted-foreground text-sm">Design a reusable workflow with steps, approvals, and automation</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Template Name *</Label>
            <Input placeholder="e.g., Project Initiation Workflow" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe what this workflow does..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Entity Type</Label>
            <Select value={form.entityType} onValueChange={v => setForm(f => ({ ...f, entityType: v as EntityType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estimated Duration (hours)</Label>
            <Input type="number" value={form.estimatedDurationHours} onChange={e => setForm(f => ({ ...f, estimatedDurationHours: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input placeholder="e.g., project, initiation, setup" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isDefault} onCheckedChange={v => setForm(f => ({ ...f, isDefault: v }))} />
            <Label>Set as default for this entity type</Label>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Configuration */}
      <Card>
        <CardHeader><CardTitle>Trigger Configuration</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Trigger Type</Label>
            <Select value={form.triggerType} onValueChange={v => setForm(f => ({ ...f, triggerType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.triggerType === 'status-changed' && (
            <>
              <div>
                <Label>From Status</Label>
                <Input placeholder="e.g., draft" value={form.triggerStatusFrom} onChange={e => setForm(f => ({ ...f, triggerStatusFrom: e.target.value }))} />
              </div>
              <div>
                <Label>To Status</Label>
                <Input placeholder="e.g., pending-approval" value={form.triggerStatusTo} onChange={e => setForm(f => ({ ...f, triggerStatusTo: e.target.value }))} />
              </div>
            </>
          )}
          {form.triggerType === 'amount-threshold' && (
            <div>
              <Label>Amount Threshold</Label>
              <Input type="number" value={form.triggerAmountThreshold} onChange={e => setForm(f => ({ ...f, triggerAmountThreshold: parseFloat(e.target.value) || 0 }))} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workflow Steps ({steps.length})</CardTitle>
            <Button onClick={addStep} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Step</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.stepId} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Step {step.order}</Badge>
                  <span className="font-medium text-sm">{step.name || 'Untitled Step'}</span>
                  <Badge variant="secondary" className="text-xs">{step.type}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'up')} disabled={index === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(index)}>
                    {step.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeStep(index)} disabled={steps.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Step Details (Expandable) */}
              {step.expanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <Label className="text-xs">Step Name *</Label>
                    <Input placeholder="e.g., Manager Approval" value={step.name} onChange={e => updateStep(index, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Step Type</Label>
                    <Select value={step.type} onValueChange={v => updateStep(index, 'type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STEP_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div className="flex items-center gap-2">{t.icon} {t.label}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Input placeholder="What happens in this step..." value={step.description} onChange={e => updateStep(index, 'description', e.target.value)} />
                  </div>

                  {/* Approval Config */}
                  {step.type === 'approval' && (
                    <>
                      <div>
                        <Label className="text-xs">Approver Type</Label>
                        <Select value={step.approverType} onValueChange={v => updateStep(index, 'approverType', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="role">By Role</SelectItem>
                            <SelectItem value="department-head">Department Head</SelectItem>
                            <SelectItem value="project-manager">Project Manager</SelectItem>
                            <SelectItem value="user">Specific User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Approver Roles (comma-separated)</Label>
                        <Input placeholder="e.g., finance-manager, cfo" value={step.approverRoles} onChange={e => updateStep(index, 'approverRoles', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Approval Mode</Label>
                        <Select value={step.approvalMode} onValueChange={v => updateStep(index, 'approvalMode', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any One</SelectItem>
                            <SelectItem value="all">All Must Approve</SelectItem>
                            <SelectItem value="majority">Majority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Task Config */}
                  {step.type === 'task' && (
                    <>
                      <div>
                        <Label className="text-xs">Task Title</Label>
                        <Input placeholder="e.g., Complete Feasibility Assessment" value={step.taskTitle} onChange={e => updateStep(index, 'taskTitle', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Assignee Type</Label>
                        <Select value={step.taskAssigneeType} onValueChange={v => updateStep(index, 'taskAssigneeType', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="role">By Role</SelectItem>
                            <SelectItem value="user">Specific User</SelectItem>
                            <SelectItem value="dynamic">Dynamic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Assignee Roles (comma-separated)</Label>
                        <Input placeholder="e.g., technical-lead" value={step.taskAssigneeRoles} onChange={e => updateStep(index, 'taskAssigneeRoles', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Due In (days)</Label>
                        <Input type="number" value={step.taskDueInDays} onChange={e => updateStep(index, 'taskDueInDays', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">Task Priority</Label>
                        <Select value={step.taskPriority} onValueChange={v => updateStep(index, 'taskPriority', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Task Description</Label>
                        <Input placeholder="Describe what needs to be done..." value={step.taskDescription} onChange={e => updateStep(index, 'taskDescription', e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* SLA */}
                  <div>
                    <Label className="text-xs">SLA Expected (hours)</Label>
                    <Input type="number" value={step.slaExpectedHours} onChange={e => updateStep(index, 'slaExpectedHours', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label className="text-xs">SLA Warning (hours)</Label>
                    <Input type="number" value={step.slaWarningHours} onChange={e => updateStep(index, 'slaWarningHours', parseInt(e.target.value) || 0)} />
                  </div>

                  {/* Escalation */}
                  <div className="md:col-span-2 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={step.escalationEnabled} onCheckedChange={v => updateStep(index, 'escalationEnabled', v)} />
                      <Label className="text-xs">Enable Escalation</Label>
                    </div>
                    {step.escalationEnabled && (
                      <>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs whitespace-nowrap">After (hrs):</Label>
                          <Input type="number" className="w-20 h-8" value={step.escalationAfterHours} onChange={e => updateStep(index, 'escalationAfterHours', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                          <Select value={step.escalationTo} onValueChange={v => updateStep(index, 'escalationTo', v)}>
                            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="department-head">Dept Head</SelectItem>
                              <SelectItem value="next-level">Next Level</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Terminal */}
                  <div className="flex items-center gap-2">
                    <Switch checked={step.isTerminal} onCheckedChange={v => updateStep(index, 'isTerminal', v)} />
                    <Label className="text-xs">Terminal Step (workflow ends here)</Label>
                  </div>
                </div>
              )}
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No steps added yet. Click &quot;Add Step&quot; to start building your workflow.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
