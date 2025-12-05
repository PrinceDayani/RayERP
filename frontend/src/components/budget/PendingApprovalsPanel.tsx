'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, DollarSign, FileText } from 'lucide-react';
import { budgetApprovalAPI, type BudgetApprovalWorkflow } from '@/lib/api/budgetApprovalAPI';
import { ApprovalWorkflowCard } from './ApprovalWorkflowCard';
import { useToast } from '@/hooks/use-toast';

export function PendingApprovalsPanel() {
  const [workflows, setWorkflows] = useState<BudgetApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<BudgetApprovalWorkflow | null>(null);
  const { toast } = useToast();

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await budgetApprovalAPI.getPendingApprovals();
      setWorkflows(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch pending approvals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
          <p className="text-sm text-muted-foreground text-center">
            You don't have any budget approvals waiting for your action
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pending Approvals</h2>
        <p className="text-muted-foreground">
          {workflows.length} budget{workflows.length !== 1 ? 's' : ''} waiting for your approval
        </p>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow._id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Budget Approval Request
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Level {workflow.currentLevel} of {workflow.totalLevels} • Created{' '}
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Level Info */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {workflow.levels[workflow.currentLevel - 1]?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Required Role: {workflow.levels[workflow.currentLevel - 1]?.requiredRole}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center">
                      <DollarSign className="h-4 w-4" />
                      {workflow.levels[workflow.currentLevel - 1]?.amountThreshold.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Threshold</p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  Review & Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Workflow Dialog */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Approval Workflow Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWorkflow(null)}
                >
                  Close
                </Button>
              </div>
              <ApprovalWorkflowCard
                workflow={selectedWorkflow}
                canApprove={true}
                onUpdate={() => {
                  setSelectedWorkflow(null);
                  fetchPendingApprovals();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
