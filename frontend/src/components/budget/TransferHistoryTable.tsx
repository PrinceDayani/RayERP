'use client';

import { useState } from 'react';
import { BudgetTransfer, budgetTransferAPI } from '@/lib/api/budgetTransferAPI';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface TransferHistoryTableProps {
  transfers: BudgetTransfer[];
  onRefresh: () => void;
  showActions?: boolean;
}

export default function TransferHistoryTable({ transfers, onRefresh, showActions = false }: TransferHistoryTableProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleApprove = async (transferId: string) => {
    setLoading(true);
    try {
      await budgetTransferAPI.approveTransfer(transferId);
      onRefresh();
    } catch (err) {
      console.error('Failed to approve transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (transferId: string) => {
    setSelectedTransfer(transferId);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedTransfer || !rejectionReason.trim()) return;

    setLoading(true);
    try {
      await budgetTransferAPI.rejectTransfer(selectedTransfer, rejectionReason);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedTransfer(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to reject transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transfer history found
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 text-sm font-medium">From Budget</th>
              <th className="text-left p-3 text-sm font-medium">To Budget</th>
              <th className="text-right p-3 text-sm font-medium">Amount</th>
              <th className="text-left p-3 text-sm font-medium">Reason</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Requested By</th>
              <th className="text-left p-3 text-sm font-medium">Date</th>
              {showActions && <th className="text-center p-3 text-sm font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => (
              <tr key={transfer._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="text-sm font-medium">{transfer.fromBudget.budgetName}</div>
                  <div className="text-xs text-gray-500">{transfer.fromBudget.departmentId?.name}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm font-medium">{transfer.toBudget.budgetName}</div>
                  <div className="text-xs text-gray-500">{transfer.toBudget.departmentId?.name}</div>
                </td>
                <td className="p-3 text-right font-medium">
                  ${transfer.amount.toLocaleString()}
                </td>
                <td className="p-3 text-sm max-w-xs truncate" title={transfer.reason}>
                  {transfer.reason}
                </td>
                <td className="p-3">
                  {getStatusBadge(transfer.status)}
                  {transfer.status === 'rejected' && transfer.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">{transfer.rejectionReason}</div>
                  )}
                </td>
                <td className="p-3 text-sm">{transfer.requestedBy.name}</td>
                <td className="p-3 text-sm text-gray-600">
                  {new Date(transfer.requestedAt).toLocaleDateString()}
                </td>
                {showActions && transfer.status === 'pending' && (
                  <td className="p-3">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(transfer._id)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(transfer._id)}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this transfer is being rejected..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={loading || !rejectionReason.trim()}
              >
                {loading ? 'Rejecting...' : 'Reject Transfer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
