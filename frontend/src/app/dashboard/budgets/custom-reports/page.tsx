'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export default function CustomReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [config, setConfig] = useState({
    fiscalYear: new Date().getFullYear(),
    budgetType: '',
    status: '',
    groupBy: 'budgetType',
    metrics: [] as string[]
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/budgets/custom-report', config);
      setReport(response.data.data);
      toast({ title: 'Success', description: 'Report generated successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (metric: string) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground">Create custom budget reports</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fiscal Year</Label>
              <Input
                type="number"
                value={config.fiscalYear}
                onChange={(e) => setConfig({ ...config, fiscalYear: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Budget Type</Label>
              <Select value={config.budgetType} onValueChange={(v) => setConfig({ ...config, budgetType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={config.status} onValueChange={(v) => setConfig({ ...config, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Group By</Label>
              <Select value={config.groupBy} onValueChange={(v) => setConfig({ ...config, groupBy: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budgetType">Budget Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Metrics</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={config.metrics.includes('variance')}
                    onCheckedChange={() => toggleMetric('variance')}
                  />
                  <span className="text-sm">Variance Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={config.metrics.includes('topSpenders')}
                    onCheckedChange={() => toggleMetric('topSpenders')}
                  />
                  <span className="text-sm">Top Spenders</span>
                </div>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!report ? (
              <p className="text-muted-foreground text-center py-8">
                Configure and generate a report to see results
              </p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budgets</p>
                    <p className="text-2xl font-bold">{report.summary.totalBudgets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Allocated</p>
                    <p className="text-2xl font-bold">{report.summary.totalAllocated.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">{report.summary.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Utilization</p>
                    <p className="text-2xl font-bold">{report.summary.avgUtilization.toFixed(1)}%</p>
                  </div>
                </div>

                {report.groups && (
                  <div>
                    <h3 className="font-semibold mb-3">Grouped Data</h3>
                    <div className="space-y-2">
                      {Object.entries(report.groups).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between p-3 border rounded">
                          <span className="capitalize">{key}</span>
                          <div className="text-right">
                            <p className="font-semibold">{value.count} budgets</p>
                            <p className="text-sm text-muted-foreground">
                              {value.allocated.toLocaleString()} allocated
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.topSpenders && (
                  <div>
                    <h3 className="font-semibold mb-3">Top Spenders</h3>
                    <div className="space-y-2">
                      {report.topSpenders.map((spender: any, idx: number) => (
                        <div key={idx} className="flex justify-between p-2 border rounded">
                          <span>{spender.name}</span>
                          <span className="font-semibold">{spender.spent.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
