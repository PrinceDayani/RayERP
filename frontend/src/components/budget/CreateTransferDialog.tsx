'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { budgetTransferAPI } from '@/lib/api/budgetTransferAPI';
import api from '@/lib/api/axios';

interface Budget {
  _id: string;
  budgetName: string;
  totalAmount: number;
  allocatedAmount: number;
  departmentId?: { name: string };
}

interface CreateTransferDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTransferDialog({ open, onClose, onSuccess }: CreateTransferDialogProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fromBudgetId, setFromBudgetId] = useState('');
  const [toBudgetId, setToBudgetId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromBudget = budgets.find(b => b._id === fromBudgetId);
  const availableAmount = fromBudget ? fromBudget.totalAmount - fromBudget.allocatedAmount : 0;

  useEffect(() => {
    if (open) {
      fetchBudgets();
      setFiscalYear(new Date().getFullYear().toString());
    }
  }, [open]);

  const fetchBudgets = async () => {
    try {
      const response = await api.get('/budgets');
      setBudgets(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromBudgetId || !toBudgetId || !amount || !reason) {
      setError('All fields are required');
      return;
    }

    if (fromBudgetId === toBudgetId) {
      setError('Cannot transfer to the same budget');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (transferAmount > availableAmount) {
      setError(`Insufficient funds. Available: $${availableAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      await budgetTransferAPI.createTransfer({
        fromBudgetId,
        toBudgetId,
        amount: transferAmount,
        reason,
        fiscalYear,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFromBudgetId('');
    setToBudgetId('');
    setAmount('');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Budget Transfer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>From Budget</Label>
            <select
              value={fromBudgetId}
              onChange={(e) => setFromBudgetId(e.target.value)}
              className="w-full border rounded-md p-2"
              required
            >
              <option value="">Select source budget</option>
              {budgets.map((budget) => (
                <option key={budget._id} value={budget._id}>
                  {budget.budgetName} - {budget.departmentId?.name || 'N/A'} 
                  (Available: ${(budget.totalAmount - budget.allocatedAmount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>To Budget</Label>
            <select
              value={toBudgetId}
              onChange={(e) => setToBudgetId(e.target.value)}
              className="w-full border rounded-md p-2"
              required
            >
              <option value="">Select destination budget</option>
              {budgets.filter(b => b._id !== fromBudgetId).map((budget) => (
                <option key={budget._id} value={budget._id}>
                  {budget.budgetName} - {budget.departmentId?.name || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Transfer Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
            {fromBudget && (
              <p className="text-sm text-gray-500 mt-1">
                Available: ${availableAmount.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <Label>Fiscal Year</Label>
            <Input
              type="text"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g., 2024"
              required
            />
          </div>

          <div>
            <Label>Reason for Transfer</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this transfer is needed..."
              rows={3}
              required
            />
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
              {loading ? 'Creating...' : 'Create Transfer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
