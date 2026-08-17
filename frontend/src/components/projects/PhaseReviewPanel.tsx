"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2, XCircle, Clock, RotateCcw, MinusCircle, Send, Undo2, AlertTriangle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import projectPhasesAPI, { ProjectPhase, PhaseReviewStatus } from "@/lib/api/projectPhasesAPI";

interface PhaseReviewPanelProps {
  phase: ProjectPhase;
  /** Show approve / reject controls — the server still enforces assignment. */
  canReview?: boolean;
  /** Show submit / withdraw controls. */
  canManage?: boolean;
  onChanged: () => void;
}

const REVIEW_STATUS_META: Record<PhaseReviewStatus, { label: string; icon: React.ReactNode; className: string }> = {
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: 'text-green-700 bg-green-50 border-green-200'
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="h-4 w-4" />,
    className: 'text-red-700 bg-red-50 border-red-200'
  },
  'changes-requested': {
    label: 'Changes requested',
    icon: <RotateCcw className="h-4 w-4" />,
    className: 'text-amber-700 bg-amber-50 border-amber-200'
  },
  skipped: {
    label: 'Skipped',
    icon: <MinusCircle className="h-4 w-4" />,
    className: 'text-gray-600 bg-gray-50 border-gray-200'
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="h-4 w-4" />,
    className: 'text-blue-700 bg-blue-50 border-blue-200'
  }
};

const displayName = (value: any): string =>
  typeof value === 'object' && value !== null ? (value.name || value.email || '—') : '—';

export const PhaseReviewPanel: React.FC<PhaseReviewPanelProps> = ({
  phase,
  canReview = false,
  canManage = false,
  onChanged
}) => {
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject' | 'request-changes' | null>(null);
  const [comments, setComments] = useState('');

  const departments = (phase.reviewDepartments || []) as Array<{ _id: string; name: string }>;
  const hasDepartments = departments.length > 0;
  const isUnderReview = phase.status === 'in-review';
  const canSubmit = canManage && ['draft', 'changes-requested', 'rejected'].includes(phase.status);

  const handleSubmitForReview = async () => {
    if (!hasDepartments) {
      toast({
        title: "No review departments",
        description: "Add at least one review department to this phase first.",
        variant: "destructive"
      });
      return;
    }
    setBusy(true);
    try {
      await projectPhasesAPI.submitForReview(phase._id);
      toast({ title: "Sent for review", description: `Routed to ${departments.length} department(s).` });
      onChanged();
    } catch (error: any) {
      toast({
        title: "Could not submit for review",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    try {
      await projectPhasesAPI.withdrawReview(phase._id);
      toast({ title: "Review withdrawn", description: "The phase is back in draft." });
      onChanged();
    } catch (error: any) {
      toast({
        title: "Could not withdraw",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async () => {
    if (!decision) return;
    if (decision !== 'approve' && !comments.trim()) {
      toast({ title: "Comments are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await projectPhasesAPI.review(phase._id, decision, comments.trim() || undefined);
      toast({ title: `Phase ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent back'}` });
      setDecision(null);
      setComments('');
      onChanged();
    } catch (error: any) {
      toast({
        title: "Could not record your decision",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Departmental Review</CardTitle>
          {phase.reviewRound > 0 && (
            <Badge variant="outline">Round {phase.reviewRound}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasDepartments ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>No review departments configured. Edit the phase to choose which departments must sign off.</span>
          </div>
        ) : phase.reviewSummary.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Will be routed to:</p>
            <div className="flex flex-wrap gap-2">
              {departments.map(dept => (
                <Badge key={dept._id} variant="secondary">{dept.name}</Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {phase.reviewSummary.map((entry, index) => {
              const meta = REVIEW_STATUS_META[entry.status] || REVIEW_STATUS_META.pending;
              return (
                <div
                  key={`${entry.departmentName}-${index}`}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${meta.className}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {meta.icon}
                      <span className="truncate">{entry.departmentName}</span>
                    </div>
                    {entry.comments && (
                      <p className="mt-1 text-sm opacity-90 break-words">{entry.comments}</p>
                    )}
                    {entry.decidedAt && (
                      <p className="mt-1 text-xs opacity-75">
                        {displayName(entry.decidedBy)} · {new Date(entry.decidedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium">{meta.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {canSubmit && (
            <Button size="sm" onClick={handleSubmitForReview} disabled={busy || !hasDepartments}>
              <Send className="h-4 w-4 mr-2" />
              {phase.reviewRound > 0 ? 'Resubmit for review' : 'Send for review'}
            </Button>
          )}

          {canManage && isUnderReview && (
            <Button size="sm" variant="outline" onClick={handleWithdraw} disabled={busy}>
              <Undo2 className="h-4 w-4 mr-2" />Withdraw
            </Button>
          )}

          {canReview && isUnderReview && (
            <>
              <Button size="sm" variant="default" onClick={() => setDecision('approve')} disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-2" />Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDecision('request-changes')} disabled={busy}>
                <RotateCcw className="h-4 w-4 mr-2" />Request changes
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDecision('reject')} disabled={busy}>
                <XCircle className="h-4 w-4 mr-2" />Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={decision !== null} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === 'approve' && 'Approve this phase'}
              {decision === 'reject' && 'Reject this phase'}
              {decision === 'request-changes' && 'Request changes'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {decision === 'approve' && 'The phase moves to the next department, or is approved if this is the last one.'}
              {decision === 'reject' && 'This ends the review. The phase is marked rejected.'}
              {decision === 'request-changes' && 'The review ends and the phase returns for revision so it can be resubmitted.'}
            </p>
            <div>
              <Label>
                Comments {decision !== 'approve' && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={decision === 'approve' ? 'Optional' : 'Explain what needs to change'}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDecision(null)} disabled={busy}>Cancel</Button>
              <Button
                onClick={handleDecision}
                disabled={busy}
                variant={decision === 'reject' ? 'destructive' : 'default'}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PhaseReviewPanel;
