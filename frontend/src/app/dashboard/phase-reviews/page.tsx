"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ClipboardCheck, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ExternalLink, Layers
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import projectPhasesAPI, { PendingPhaseReview } from "@/lib/api/projectPhasesAPI";

type Decision = 'approve' | 'reject' | 'request-changes';

export default function PhaseReviewsPage() {
  const [reviews, setReviews] = useState<PendingPhaseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<{ review: PendingPhaseReview; decision: Decision } | null>(null);
  const [comments, setComments] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await projectPhasesAPI.getPendingReviews({ limit: 50 });
      setReviews(response.data || []);
    } catch (error: any) {
      toast({
        title: "Could not load your review queue",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitDecision = async () => {
    if (!target) return;
    if (target.decision !== 'approve' && !comments.trim()) {
      toast({ title: "Comments are required", variant: "destructive" });
      return;
    }
    const phaseId = target.review.phase?._id;
    if (!phaseId) return;

    setBusy(true);
    try {
      await projectPhasesAPI.review(phaseId, target.decision, comments.trim() || undefined, target.review.stepId);
      toast({ title: "Decision recorded" });
      setTarget(null);
      setComments('');
      await load();
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

  const projectOf = (review: PendingPhaseReview) => {
    const project = review.phase?.project;
    return typeof project === 'object' && project !== null ? project : null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold">Phase Reviews</h1>
          <p className="text-muted-foreground">
            Project phases waiting on your department&apos;s sign-off
          </p>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nothing waiting on you right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => {
            const phase = review.phase;
            const project = projectOf(review);
            return (
              <Card key={review.instanceId}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{phase?.name || 'Phase'}</span>
                        {review.slaBreached && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />Overdue
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {project ? project.name : 'Project'} · {review.stepName}
                        {phase?.reviewRound ? ` · round ${phase.reviewRound}` : ''}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Submitted {new Date(review.submittedAt).toLocaleDateString()}</span>
                        {review.dueDate && <span>Due {new Date(review.dueDate).toLocaleDateString()}</span>}
                        <Badge variant="outline" className="text-xs">{review.priority}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {project && (
                        <Link href={`/dashboard/projects/${project._id}`}>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4 mr-2" />Open project
                          </Button>
                        </Link>
                      )}
                      <Button size="sm" onClick={() => setTarget({ review, decision: 'approve' })} disabled={busy}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTarget({ review, decision: 'request-changes' })}
                        disabled={busy}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setTarget({ review, decision: 'reject' })}
                        disabled={busy}
                      >
                        <XCircle className="h-4 w-4 mr-2" />Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {phase && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {phase.description && <span className="line-clamp-1">{phase.description}</span>}
                      <span>{phase.milestones?.length || 0} milestone(s)</span>
                      {phase.startDate && phase.endDate && (
                        <span>
                          {new Date(phase.startDate).toLocaleDateString()} → {new Date(phase.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => { if (!open) { setTarget(null); setComments(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.decision === 'approve' && 'Approve phase'}
              {target?.decision === 'reject' && 'Reject phase'}
              {target?.decision === 'request-changes' && 'Request changes'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {target?.review.phase?.name} — {projectOf(target?.review as PendingPhaseReview)?.name}
            </p>
            <div>
              <Label>
                Comments {target?.decision !== 'approve' && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={target?.decision === 'approve' ? 'Optional' : 'Explain what needs to change'}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTarget(null)} disabled={busy}>Cancel</Button>
              <Button
                onClick={submitDecision}
                disabled={busy}
                variant={target?.decision === 'reject' ? 'destructive' : 'default'}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
