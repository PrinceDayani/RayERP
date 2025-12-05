'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { budgetReportAPI } from '@/lib/api/budgetReportAPI';

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateReportDialog({ open, onClose, onSuccess }: GenerateReportDialogProps) {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'variance' | 'forecast' | 'comparison' | 'custom'>('summary');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');
  const [fiscalYear, setFiscalYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'detailed', label: 'Detailed Report' },
    { value: 'variance', label: 'Variance Report' },
    { value: 'forecast', label: 'Forecast Report' },
    { value: 'comparison', label: 'Comparison Report' },
    { value: 'custom', label: 'Custom Report' },
  ];

  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await budgetReportAPI.generateReport({
        reportType,
        format,
        filters: fiscalYear ? { fiscalYear } : undefined,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReportType('summary');
    setFormat('pdf');
    setFiscalYear('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Budget Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Report Type</Label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full border rounded-md p-2 mt-1"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Export Format</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {formats.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => setFormat(fmt.value as any)}
                  className={`border rounded p-2 text-sm ${
                    format === fmt.value ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Fiscal Year (optional)</Label>
            <Input
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g., 2024"
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
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
