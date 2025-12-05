'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { budgetVarianceAPI } from '@/lib/api/budgetVarianceAPI';

interface GenerateVarianceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetId: string;
  budgetName: string;
}

export default function GenerateVarianceDialog({ open, onClose, onSuccess, budgetId, budgetName }: GenerateVarianceDialogProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Both dates are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      await budgetVarianceAPI.generateVariance(budgetId, { startDate, endDate });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate variance report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Variance Report for {budgetName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            The report will compare actual spending vs budgeted amounts for the selected period
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
