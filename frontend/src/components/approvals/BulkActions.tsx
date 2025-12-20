'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { ApprovalRequest } from '@/lib/api/approvalsAPI';

interface Props {
  approvals: ApprovalRequest[];
  onBulkApprove: (ids: string[]) => Promise<void>;
  onBulkReject: (ids: string[]) => Promise<void>;
}

export default function BulkActions({ approvals, onBulkApprove, onBulkReject }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === approvals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(approvals.map(a => a._id)));
    }
  };

  const handleBulkApprove = async () => {
    setLoading(true);
    await onBulkApprove(Array.from(selected));
    setSelected(new Set());
    setLoading(false);
  };

  const handleBulkReject = async () => {
    setLoading(true);
    await onBulkReject(Array.from(selected));
    setSelected(new Set());
    setLoading(false);
  };

  if (approvals.length === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
      <Checkbox
        checked={selected.size === approvals.length && approvals.length > 0}
        onCheckedChange={toggleSelectAll}
      />
      <span className="text-sm">{selected.size} selected</span>
      
      {selected.size > 0 && (
        <>
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
            <span className="ml-2">Approve ({selected.size})</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkReject}
            disabled={loading}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="ml-2">Reject ({selected.size})</span>
          </Button>
        </>
      )}
    </div>
  );
}

export { BulkActions };
