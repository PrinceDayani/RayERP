'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { budgetApprovalAPI, type BudgetApprovalWorkflow } from '@/lib/api/budgetApprovalAPI';
import { useToast } from '@/hooks/use-toast';

interface ApprovalWorkflowCardProps {
  workflow: BudgetApprovalWorkflow;
  onUpdate?: () => void;
  canApprove?: boolean;
}

export function ApprovalWorkflowCard({ workflow, onUpdate, canApprove = false }: ApprovalWorkflowCardProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      setLoading(true);
      await budgetApprovalAPI.approveLevel(workflow.budgetId, selectedLevel, comments);
      toast({
        title: 'Success',
        description: 'Level approved successfully',
      });
      setShowApproveDialog(false);
      setComments('');
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast({
        title: 'Error',
        description: 'Comments are required for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await budgetApprovalAPI.rejectLevel(workflow.budgetId, selectedLevel, comments);
      toast({
        title: 'Success',
        description: 'Level rejected',
      });
      setShowRejectDialog(false);
      setComments('');
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      rejected: 'destructive',
      pending: 'secondary',
      'in-progress': 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.toUpperCase()}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                {workflow.totalLevels} level approval process
              </CardDescription>
            </div>
            {getStatusBadge(workflow.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.levels.map((level) => (
              <div
                key={level.level}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  {getStatusIcon(level.status)}
                  <div>
                    <h4 className="font-medium">{level.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Required Role: {level.requiredRole}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Threshold: ${level.amountThreshold.toLocaleString()}
                    </p>
                    {level.approvedBy && (
                      <p className="text-sm text-muted-foreground mt-1">
                        By: {level.approvedBy.name} on{' '}
                        {new Date(level.approvedAt!).toLocaleDateString()}
                      </p>
                    )}
                    {level.comments && (
                      <p className="text-sm mt-1 italic">"{level.comments}"</p>
                    )}
                  </div>
                </div>

                {canApprove && level.status === 'pending' && workflow.currentLevel === level.level && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedLevel(level.level);
                        setShowApproveDialog(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedLevel(level.level);
                        setShowRejectDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Level {selectedLevel}</DialogTitle>
            <DialogDescription>
              Add optional comments for this approval
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Level {selectedLevel}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !comments.trim()}>
              {loading ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
