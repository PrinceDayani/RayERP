'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { budgetForecastAPI } from '@/lib/api/budgetForecastAPI';

interface GenerateForecastDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetId: string;
  budgetName: string;
}

export default function GenerateForecastDialog({ open, onClose, onSuccess, budgetId, budgetName }: GenerateForecastDialogProps) {
  const [algorithm, setAlgorithm] = useState<'linear' | 'seasonal' | 'exponential' | 'ml'>('ml');
  const [forecastPeriod, setForecastPeriod] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const algorithms = [
    { value: 'ml', label: 'ML Auto-Select', description: 'AI chooses best algorithm' },
    { value: 'linear', label: 'Linear Regression', description: 'Simple trend-based' },
    { value: 'seasonal', label: 'Seasonal', description: 'Accounts for patterns' },
    { value: 'exponential', label: 'Exponential Smoothing', description: 'Weighted recent data' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await budgetForecastAPI.generateForecast(budgetId, { algorithm, forecastPeriod });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAlgorithm('ml');
    setForecastPeriod(12);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Forecast for {budgetName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Forecasting Algorithm</Label>
            <div className="space-y-2 mt-2">
              {algorithms.map((algo) => (
                <label key={algo.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="algorithm"
                    value={algo.value}
                    checked={algorithm === algo.value}
                    onChange={(e) => setAlgorithm(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{algo.label}</div>
                    <div className="text-sm text-gray-600">{algo.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Forecast Period (Months)</Label>
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(Number(e.target.value))}
              className="w-full border rounded-md p-2 mt-1"
            >
              {[3, 6, 12, 18, 24].map((months) => (
                <option key={months} value={months}>
                  {months} months
                </option>
              ))}
            </select>
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
              {loading ? 'Generating...' : 'Generate Forecast'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
