'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { budgetTemplateAPI, BudgetTemplate } from '@/lib/api/budgetTemplateAPI';

interface CloneDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: BudgetTemplate | null;
}

export default function CloneDialog({ open, onClose, onSuccess, template }: CloneDialogProps) {
  const [budgetName, setBudgetName] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [adjustmentPercent, setAdjustmentPercent] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setError('');
    setLoading(true);

    try {
      await budgetTemplateAPI.cloneFromTemplate(
        template._id,
        budgetName,
        fiscalYear,
        parseFloat(adjustmentPercent)
      );
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clone template');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBudgetName('');
    setFiscalYear(new Date().getFullYear().toString());
    setAdjustmentPercent('0');
    setError('');
    onClose();
  };

  const adjustedAmount = template
    ? template.totalAmount * (1 + parseFloat(adjustmentPercent || '0') / 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Clone Template: {template?.templateName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Budget Name</Label>
            <Input
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="Enter new budget name"
              required
            />
          </div>

          <div>
            <Label>Fiscal Year</Label>
            <Input
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g., 2024"
              required
            />
          </div>

          <div>
            <Label>Adjustment Percentage (optional)</Label>
            <Input
              type="number"
              value={adjustmentPercent}
              onChange={(e) => setAdjustmentPercent(e.target.value)}
              placeholder="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Positive to increase, negative to decrease amounts
            </p>
          </div>

          {template && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span>Original Amount:</span>
                <span className="font-medium">${template.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>New Amount:</span>
                <span className="font-medium">${adjustedAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

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
              {loading ? 'Cloning...' : 'Clone Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
