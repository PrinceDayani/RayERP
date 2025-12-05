'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GitBranch } from 'lucide-react';
import { budgetRevisionAPI } from '@/lib/api/budgetRevisionAPI';
import { useToast } from '@/hooks/use-toast';

interface CreateRevisionDialogProps {
  budgetId: string;
  currentBudget: {
    budgetName: string;
    totalAmount: number;
    allocatedAmount: number;
  };
  onRevisionCreated?: () => void;
}

export function CreateRevisionDialog({ budgetId, currentBudget, onRevisionCreated }: CreateRevisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [totalAmount, setTotalAmount] = useState(currentBudget.totalAmount);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Reason is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const changes = {
        totalAmount: {
          old: currentBudget.totalAmount,
          new: totalAmount
        }
      };

      await budgetRevisionAPI.createRevision(budgetId, reason, changes);
      
      toast({
        title: 'Success',
        description: 'New budget revision created successfully',
      });
      
      setOpen(false);
      setReason('');
      setTotalAmount(currentBudget.totalAmount);
      onRevisionCreated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create revision',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <GitBranch className="h-4 w-4 mr-2" />
          Create Revision
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Budget Revision</DialogTitle>
          <DialogDescription>
            Create a new version of this budget with updated values
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Current Budget</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{currentBudget.budgetName}</p>
              <p className="text-sm text-muted-foreground">
                Total: ${currentBudget.totalAmount.toLocaleString()} | 
                Allocated: ${currentBudget.allocatedAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="totalAmount">New Total Amount</Label>
            <Input
              id="totalAmount"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              min={0}
            />
            {totalAmount !== currentBudget.totalAmount && (
              <p className="text-xs text-muted-foreground mt-1">
                Change: {totalAmount > currentBudget.totalAmount ? '+' : ''}
                ${(totalAmount - currentBudget.totalAmount).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Reason for Revision *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this revision is needed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !reason.trim()}>
            {loading ? 'Creating...' : 'Create Revision'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
