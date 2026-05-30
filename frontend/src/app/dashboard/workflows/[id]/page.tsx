"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, GitBranch, Users,
  Calendar, MessageSquare, AlertTriangle, PauseCircle, Play,
  Send, SkipForward, UserPlus, History
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { workflowsAPI, WorkflowInstance, StepExecution } from "@/lib/api/workflowsAPI";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; stepId: string }>({ open: false, type: '', stepId: '' });
  const [comments, setComments] = useState("");
  const [newComment, setNewComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchInstance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workflowsAPI.getInstanceById(id as string);
      setInstance(res.data);
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
      toast.error('Failed to load workflow details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  const handleStepAction = async (action: 'approve' | 'reject' | 'complete' | 'skip') => {
    if (!instance) return;
    setProcessing(true);
    try {
      await workflowsAPI.processStepAction(instance._id, actionDialog.stepId, {
        action,
        comments
      });
      toast.success(`Step ${action}d successfully`);
      setActionDialog({ open: false, type: '', stepId: '' });
      setComments("");
      fetchInstance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} step`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddComment = async () => {
    if (!instance || !newComment.trim()) return;
    try {
      await workflowsAPI.addComment(instance._id, { comment: newComment });
      setNewComment("");
      fetchInstance();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleCancel = async () => {
    if (!instance || !cancelReason.trim()) return;
    setProcessing(true);
    try {
      await workflowsAPI.cancelWorkflow(instance._id, cancelReason);
      toast.success('Workflow cancelled');
      setCancelDialog(false);
      fetchInstance();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel workflow');
    } finally {
      setProcessing(false);
    }
  };

  const handleHold = async () => {
    if (!instance) return;
    try {
      await workflowsAPI.holdWorkflow(instance._id);
      toast.success('Workflow put on hold');
      fetchInstance();
    } catch (error) {
      toast.error('Failed to hold workflow');
    }
  };

  const handleResume = async () => {
    if (!instance) return;
    try {
      await workflowsAPI.resumeWorkflow(instance._id);
      toast.success('Workflow resumed');
      fetchInstance();
    } catch (error) {
      toast.error('Failed to resume workflow');
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500 animate-pulse';
      case 'rejected': return 'bg-red-500';
      case 'skipped': return 'bg-gray-400';
      case 'escalated': return 'bg-orange-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'escalated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'skipped': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500';
    }
  };

  const isAssignedToMe = (step: StepExecution) => {
    if (!user) return false;
    return step.assignedTo?.some(a => a._id === user._id);
  };

  const canActOnStep = (step: StepExecution) => {
    return (step.status === 'active' || step.status === 'escalated') && isAssignedToMe(step);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Workflow not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push('/dashboard/workflows')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workflows
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            {instance.entityTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {instance.templateName} (v{instance.templateVersion})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {instance.status === 'active' && (
            <>
              <Button variant="outline" size="sm" onClick={handleHold}>
                <PauseCircle className="h-4 w-4 mr-1" /> Hold
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setCancelDialog(true)}>
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </>
          )}
          {instance.status === 'on-hold' && (
            <Button size="sm" onClick={handleResume}>
              <Play className="h-4 w-4 mr-1" /> Resume
            </Button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Badge className={`${
              instance.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
              instance.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              instance.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              instance.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-gray-100 text-gray-800'
            }`} variant="secondary">
              {instance.status.toUpperCase()}
            </Badge>
            <Badge variant="outline">{instance.entityType}</Badge>
            <Badge className={`${
              instance.priority === 'critical' ? 'bg-red-500 text-white' :
              instance.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              instance.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`} variant="secondary">
              {instance.priority}
            </Badge>
            {instance.slaBreached && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" /> SLA Breached
              </Badge>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <Progress value={instance.progress} className="w-32 h-2" />
              <span className="text-sm font-medium">{instance.progress}%</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Initiated by {instance.initiatedBy?.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Started {new Date(instance.startedAt).toLocaleDateString('en-IN')}
            </span>
            {instance.completedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Completed {new Date(instance.completedAt).toLocaleDateString('en-IN')}
              </span>
            )}
            {instance.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Due {new Date(instance.dueDate).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps Timeline - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {instance.steps.map((step, index) => (
                  <div key={step.stepId} className="relative">
                    {/* Connector line */}
                    {index < instance.steps.length - 1 && (
                      <div className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)] ${
                        step.status === 'completed' || step.status === 'skipped' ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                    
                    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      step.status === 'active' ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' : ''
                    }`}>
                      {/* Status dot */}
                      <div className={`h-[30px] w-[30px] rounded-full flex items-center justify-center flex-shrink-0 ${getStepStatusColor(step.status)}`}>
                        {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-white" />}
                        {step.status === 'active' && <Play className="h-3 w-3 text-white" />}
                        {step.status === 'rejected' && <XCircle className="h-4 w-4 text-white" />}
                        {step.status === 'pending' && <span className="text-xs text-gray-500 font-medium">{index + 1}</span>}
                        {step.status === 'skipped' && <SkipForward className="h-3 w-3 text-white" />}
                        {step.status === 'escalated' && <AlertTriangle className="h-3 w-3 text-white" />}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{step.stepName}</p>
                            <Badge className={`${getStepStatusBadge(step.status)} text-xs`} variant="secondary">
                              {step.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{step.stepType}</Badge>
                          </div>
                          {canActOnStep(step) && (
                            <div className="flex gap-1">
                              {step.stepType === 'approval' && (
                                <>
                                  <Button size="sm" variant="default" className="h-7 text-xs"
                                    onClick={() => setActionDialog({ open: true, type: 'approve', stepId: step.stepId })}>
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" className="h-7 text-xs"
                                    onClick={() => setActionDialog({ open: true, type: 'reject', stepId: step.stepId })}>
                                    <XCircle className="h-3 w-3 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {step.stepType === 'task' && (
                                <Button size="sm" className="h-7 text-xs"
                                  onClick={() => setActionDialog({ open: true, type: 'complete', stepId: step.stepId })}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Step metadata */}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {step.startedAt && (
                            <span>Started: {new Date(step.startedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          )}
                          {step.completedAt && (
                            <span>Completed: {new Date(step.completedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          )}
                          {step.dueAt && step.status === 'active' && (
                            <span className={step.slaBreached ? 'text-red-500 font-medium' : ''}>
                              Due: {new Date(step.dueAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </div>

                        {/* Assignees */}
                        {step.assignedTo && step.assignedTo.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-xs text-muted-foreground">Assigned:</span>
                            <div className="flex -space-x-1">
                              {step.assignedTo.map(assignee => (
                                <Avatar key={assignee._id} className="h-5 w-5 border border-background">
                                  <AvatarFallback className="text-[8px]">{assignee.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Approvals */}
                        {step.approvals && step.approvals.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {step.approvals.map((approval, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {approval.action === 'approved' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                {approval.action === 'rejected' && <XCircle className="h-3 w-3 text-red-500" />}
                                {approval.action === 'delegated' && <UserPlus className="h-3 w-3 text-blue-500" />}
                                <span className="font-medium">{approval.userId?.name}</span>
                                <span className="text-muted-foreground">{approval.action}</span>
                                {approval.comments && <span className="text-muted-foreground">- "{approval.comments}"</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {instance.participants?.map(participant => (
                <div key={participant._id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{participant.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.name}</span>
                  {participant._id === instance.initiatedBy?._id && (
                    <Badge variant="outline" className="text-xs ml-auto">Initiator</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({instance.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {instance.comments?.slice(-5).map((comment, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-xs">{comment.userId?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{comment.comment}</p>
                </div>
              ))}
              <Separator />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <Button size="sm" className="w-full" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-3 w-3 mr-1" /> Send
              </Button>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {instance.auditTrail?.slice(-10).reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{entry.performedBy?.name}</span>{' '}
                      <span className="text-muted-foreground">{entry.action.replace(/_/g, ' ')}</span>
                      <p className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionDialog.type} Step</DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' && 'Approve this step to advance the workflow.'}
              {actionDialog.type === 'reject' && 'Rejecting will terminate the entire workflow.'}
              {actionDialog.type === 'complete' && 'Mark this task as completed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add comments (optional)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: '', stepId: '' })}>
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === 'reject' ? 'destructive' : 'default'}
              onClick={() => handleStepAction(actionDialog.type as any)}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Confirm ${actionDialog.type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workflow</DialogTitle>
            <DialogDescription>
              This will cancel the workflow and all pending steps. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation (required)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(false)}>Keep Active</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim() || processing}>
              {processing ? 'Cancelling...' : 'Cancel Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
