"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  ArrowLeft, CalendarIcon, GitBranch, Layers, Clock, Play, FolderPlus
} from "lucide-react";
import { workflowsAPI, WorkflowTemplate } from "@/lib/api/workflowsAPI";
import { toast } from "sonner";

export default function CreateProjectFromWorkflowPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const [form, setForm] = useState({
    projectName: "",
    projectDescription: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    budget: 0,
    currency: "INR",
    priority: "medium",
    client: "",
    tags: "",
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await workflowsAPI.getTemplates({ entityType: "project", isActive: true });
        setTemplates(res.data || []);
        // Auto-select default template
        const defaultTemplate = res.data?.find((t: WorkflowTemplate) => t.isDefault);
        if (defaultTemplate) setSelectedTemplate(defaultTemplate);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSubmit = async () => {
    if (!form.projectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a workflow template");
      return;
    }

    setSubmitting(true);
    try {
      const res = await workflowsAPI.startWorkflowWithProject({
        templateId: selectedTemplate._id,
        entityType: "project",
        projectName: form.projectName,
        projectDescription: form.projectDescription || undefined,
        startDate: form.startDate?.toISOString(),
        endDate: form.endDate?.toISOString(),
        budget: form.budget || undefined,
        currency: form.currency,
        priority: form.priority,
        client: form.client || undefined,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      });

      toast.success("Project and workflow created successfully");

      // Navigate to the created project
      if (res.data?.project?._id) {
        router.push(`/dashboard/projects/${res.data.project._id}`);
      } else if (res.data?.workflowInstance?._id) {
        router.push(`/dashboard/workflows/${res.data.workflowInstance._id}`);
      } else {
        router.push("/dashboard/workflows");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create project from workflow");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push("/dashboard/workflows")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workflows
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderPlus className="h-6 w-6 text-primary" />
          Create Project from Workflow
        </h1>
        <p className="text-muted-foreground mt-1">
          Start a workflow and automatically create the associated project
        </p>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Workflow Template</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No project workflow templates available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map(template => (
                <div
                  key={template._id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTemplate?._id === template._id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    {template.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {template.steps?.length} steps
                    </span>
                    {template.estimatedDurationHours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{template.estimatedDurationHours < 24
                          ? `${template.estimatedDurationHours}h`
                          : `${Math.round(template.estimatedDurationHours / 24)} days`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Project Name *</Label>
            <Input
              placeholder="e.g., Highway Construction Phase 2"
              value={form.projectName}
              onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the project scope and objectives..."
              value={form.projectDescription}
              onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.startDate ? format(form.startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.startDate}
                  onSelect={d => setForm(f => ({ ...f, startDate: d }))}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.endDate ? format(form.endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.endDate}
                  onSelect={d => setForm(f => ({ ...f, endDate: d }))}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Budget</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.budget || ""}
              onChange={e => setForm(f => ({ ...f, budget: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
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
            <Label>Client</Label>
            <Input
              placeholder="e.g., NHAI, PWD, Municipal Corp"
              value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              placeholder="e.g., government, highway, phase-2"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Workflow Steps Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {selectedTemplate.steps?.map((step, i) => (
                <React.Fragment key={step.stepId}>
                  <div className="flex items-center gap-1.5 bg-muted rounded-md px-2.5 py-1.5">
                    <Badge variant="outline" className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {i + 1}
                    </Badge>
                    <span className="text-xs font-medium">{step.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{step.type}</Badge>
                  </div>
                  {i < selectedTemplate.steps.length - 1 && (
                    <span className="text-muted-foreground text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting || !form.projectName || !selectedTemplate}>
          <Play className="h-4 w-4 mr-2" />
          {submitting ? "Creating..." : "Create Project & Start Workflow"}
        </Button>
      </div>
    </div>
  );
}
