"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Play, Search, Zap, Layers, Clock, GitBranch, ChevronRight
} from "lucide-react";
import { workflowsAPI, WorkflowTemplate } from "@/lib/api/workflowsAPI";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

export default function StartWorkflowPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDialog, setStartDialog] = useState<{ open: boolean; template: WorkflowTemplate | null }>({ open: false, template: null });
  const [formData, setFormData] = useState({
    entityId: '',
    entityTitle: '',
    projectId: '',
    priority: 'medium'
  });
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await workflowsAPI.getTemplates({ isActive: true });
        setTemplates(res.data);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleStart = async () => {
    if (!startDialog.template || !formData.entityId || !formData.entityTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStarting(true);
    try {
      const res = await workflowsAPI.startWorkflow({
        templateId: startDialog.template._id,
        entityType: startDialog.template.entityType,
        entityId: formData.entityId,
        entityTitle: formData.entityTitle,
        projectId: formData.projectId || undefined,
        priority: formData.priority as any
      });
      toast.success('Workflow started successfully');
      router.push(`/dashboard/workflows/${res.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start workflow');
    } finally {
      setStarting(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'procurement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'finance': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'project': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'hr': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'operations': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push('/dashboard/workflows')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workflows
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Play className="h-6 w-6 text-primary" />
          Start a Workflow
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose a template to start a new workflow process
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Cards */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No active templates available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <Card
              key={template._id}
              className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/30"
              onClick={() => {
                setStartDialog({ open: true, template });
                setFormData({ entityId: '', entityTitle: '', projectId: '', priority: template.priority });
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge className={getCategoryColor(template.category)} variant="secondary">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{template.entityType}</Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {template.steps?.length} steps
                  </span>
                  {template.estimatedDurationHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{template.estimatedDurationHours < 24
                        ? `${template.estimatedDurationHours}h`
                        : `${Math.round(template.estimatedDurationHours / 24)} days`
                      }
                    </span>
                  )}
                </div>

                {/* Mini step flow */}
                <div className="flex items-center gap-1 mt-3 overflow-hidden">
                  {template.steps?.slice(0, 3).map((step, i) => (
                    <React.Fragment key={step.stepId}>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[100px]">
                        {step.name}
                      </span>
                      {i < Math.min(template.steps.length - 1, 2) && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </React.Fragment>
                  ))}
                  {template.steps?.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{template.steps.length - 3} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Start Workflow Dialog */}
      <Dialog open={startDialog.open} onOpenChange={(open) => setStartDialog({ ...startDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Start: {startDialog.template?.name}
            </DialogTitle>
            <DialogDescription>
              Provide details about the entity this workflow applies to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Entity Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder={`e.g., PO-2024-001, Work Order for Site A...`}
                value={formData.entityTitle}
                onChange={(e) => setFormData({ ...formData, entityTitle: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">A descriptive name for this workflow instance</p>
            </div>

            <div className="space-y-2">
              <Label>Entity ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="MongoDB ObjectId of the entity"
                value={formData.entityId}
                onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">The ID of the {startDialog.template?.entityType} this workflow is for</p>
            </div>

            <div className="space-y-2">
              <Label>Project ID (optional)</Label>
              <Input
                placeholder="Link to a project (optional)"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={starting || !formData.entityId || !formData.entityTitle}>
              {starting ? 'Starting...' : 'Start Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
