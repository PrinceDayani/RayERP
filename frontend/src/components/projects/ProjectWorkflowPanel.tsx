"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitBranch, Play, RefreshCw, Eye, CheckCircle2, XCircle,
  Clock, AlertTriangle, PauseCircle, ArrowRight, Zap
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { workflowsAPI, WorkflowInstance, WorkflowTemplate } from "@/lib/api/workflowsAPI";
import { toast } from "sonner";

interface ProjectWorkflowPanelProps {
  projectId: string;
  projectName: string;
}

export default function ProjectWorkflowPanel({ projectId, projectName }: ProjectWorkflowPanelProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null);
  const [history, setHistory] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [starting, setStarting] = useState(false);

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      const [activeRes, historyRes] = await Promise.all([
        workflowsAPI.getProjectWorkflow(projectId),
        workflowsAPI.getProjectWorkflowHistory(projectId)
      ]);
      setWorkflow(activeRes.data || null);
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error("Failed to fetch project workflow:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const handleStartWorkflow = async () => {
    setStarting(true);
    try {
      await workflowsAPI.startProjectWorkflow(projectId, {
        workflowTemplateId: selectedTemplate || undefined
      });
      toast.success("Workflow started successfully");
      setShowStartDialog(false);
      fetchWorkflow();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to start workflow");
    } finally {
      setStarting(false);
    }
  };

  const handleRestartWorkflow = async () => {
    try {
      await workflowsAPI.restartProjectWorkflow(projectId);
      toast.success("Workflow restarted successfully");
      fetchWorkflow();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to restart workflow");
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await workflowsAPI.getTemplates({ entityType: "project", isActive: true });
      setTemplates(res.data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const openStartDialog = () => {
    fetchTemplates();
    setShowStartDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4 text-blue-500" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-gray-500" />;
      case "on-hold": return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "cancelled": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      case "on-hold": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Workflow
            </CardTitle>
            {!workflow && (
              <Button size="sm" variant="outline" onClick={openStartDialog}>
                <Play className="h-3 w-3 mr-1" /> Start Workflow
              </Button>
            )}
            {workflow?.status === "rejected" && (
              <Button size="sm" variant="outline" onClick={handleRestartWorkflow}>
                <RefreshCw className="h-3 w-3 mr-1" /> Restart
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {workflow ? (
            <div className="space-y-3">
              {/* Active Workflow */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(workflow.status)}
                  <span className="font-medium text-sm">{workflow.templateName}</span>
                </div>
                <Badge className={getStatusColor(workflow.status)} variant="secondary">
                  {workflow.status}
                </Badge>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{workflow.progress}%</span>
                </div>
                <Progress value={workflow.progress} className="h-2" />
              </div>

              {/* Current Step */}
              <div className="bg-muted/50 rounded-md p-2.5">
                <p className="text-xs text-muted-foreground">Current Step</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  {workflow.currentStepName}
                </p>
                {workflow.currentAssignees?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Assigned to: {workflow.currentAssignees.map(a => a.name).join(", ")}
                  </p>
                )}
              </div>

              {/* SLA Warning */}
              {workflow.slaBreached && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                  <AlertTriangle className="h-3 w-3" />
                  SLA breached — action required
                </div>
              )}

              {/* View Details */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => router.push(`/dashboard/workflows/${workflow._id}`)}
              >
                <Eye className="h-3 w-3 mr-1" /> View Full Workflow
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active workflow</p>
              <p className="text-xs mt-1">Start a workflow to track approvals and progress</p>
            </div>
          )}

          {/* History (collapsed) */}
          {history.length > 1 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Previous Workflows ({history.length - 1})</p>
              <div className="space-y-1">
                {history.filter(h => h._id !== workflow?._id).slice(0, 3).map(h => (
                  <div key={h._id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{h.templateName}</span>
                    <Badge className={getStatusColor(h.status)} variant="secondary">
                      {h.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Workflow Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Workflow for Project</DialogTitle>
            <DialogDescription>
              Select a workflow template to start for &quot;{projectName}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Use default template (or select one)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default Project Workflow</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name} {t.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use the default project workflow template
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancel</Button>
            <Button onClick={handleStartWorkflow} disabled={starting}>
              {starting ? "Starting..." : "Start Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
