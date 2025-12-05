'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function BudgetRolloverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sourceFiscalYear: new Date().getFullYear(),
    targetFiscalYear: new Date().getFullYear() + 1,
    targetFiscalPeriod: 'Q1',
    adjustmentPercentage: 0,
    budgetType: 'all'
  });

  const handleBulkRollover = async () => {
    setLoading(true);
    try {
      const response = await api.post('/budgets/bulk-rollover', formData);
      toast({
        title: 'Success',
        description: `${response.data.count} budgets rolled over successfully`
      });
      router.push('/dashboard/budgets');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to rollover budgets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Budget Rollover</h1>
          <p className="text-muted-foreground">Roll over budgets to next fiscal year</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Rollover Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source Fiscal Year</Label>
              <Input
                type="number"
                value={formData.sourceFiscalYear}
                onChange={(e) => setFormData({ ...formData, sourceFiscalYear: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Target Fiscal Year</Label>
              <Input
                type="number"
                value={formData.targetFiscalYear}
                onChange={(e) => setFormData({ ...formData, targetFiscalYear: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Target Fiscal Period</Label>
            <Select value={formData.targetFiscalPeriod} onValueChange={(v) => setFormData({ ...formData, targetFiscalPeriod: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1">Q1</SelectItem>
                <SelectItem value="Q2">Q2</SelectItem>
                <SelectItem value="Q3">Q3</SelectItem>
                <SelectItem value="Q4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Budget Type (Optional)</Label>
            <Select value={formData.budgetType} onValueChange={(v) => setFormData({ ...formData, budgetType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="special">Special</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Adjustment Percentage (%)</Label>
            <Input
              type="number"
              value={formData.adjustmentPercentage}
              onChange={(e) => setFormData({ ...formData, adjustmentPercentage: Number(e.target.value) })}
              placeholder="0 for no adjustment, 10 for 10% increase"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Positive for increase, negative for decrease
            </p>
          </div>

          <Button onClick={handleBulkRollover} disabled={loading} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            {loading ? 'Rolling over...' : 'Rollover Budgets'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
