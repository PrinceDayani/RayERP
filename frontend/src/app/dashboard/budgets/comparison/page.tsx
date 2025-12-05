'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, GitCompare, TrendingUp, TrendingDown, Minus, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export default function BudgetComparisonPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [budget1, setBudget1] = useState('');
  const [budget2, setBudget2] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBudgets, setLoadingBudgets] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoadingBudgets(true);
    try {
      const response = await api.get('/budgets/all');
      const budgetData = response.data?.data || response.data || [];
      console.log('Fetched budgets:', budgetData.length);
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast({ title: 'Error', description: 'Failed to load budgets', variant: 'destructive' });
    } finally {
      setLoadingBudgets(false);
    }
  };

  const handleCompare = async () => {
    if (!budget1 || !budget2) {
      toast({ title: 'Error', description: 'Select 2 budgets to compare', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/budgets/compare', { budgetIds: [budget1, budget2] });
      console.log('Compare response:', response.data);
      const data = response.data?.data || response.data;
      
      if (!data || !data.budgets || data.budgets.length < 2) {
        throw new Error('Invalid comparison data received');
      }
      
      setComparison({ 
        budget1: data.budgets[0], 
        budget2: data.budgets[1],
        comparison: data.comparison,
        categoryComparison: data.categoryComparison,
        insights: data.insights,
        baseCurrency: data.baseCurrency
      });
      toast({ title: 'Success', description: 'Budgets compared successfully' });
    } catch (error: any) {
      console.error('Comparison error:', error);
      toast({ title: 'Error', description: error.message || error.response?.data?.message || 'Failed to compare budgets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getDifference = (val1: number, val2: number) => {
    const diff = val1 - val2;
    const percent = val2 !== 0 ? ((diff / val2) * 100) : 0;
    return { diff, percent };
  };

  const exportComparison = () => {
    if (!comparison) return;
    const data = JSON.stringify(comparison, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-comparison-${Date.now()}.json`;
    a.click();
    toast({ title: 'Success', description: 'Comparison exported' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Budget Comparison</h1>
          <p className="text-muted-foreground">Compare multiple budgets side-by-side</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Budgets to Compare</CardTitle>
          <CardDescription>Choose two budgets for side-by-side comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingBudgets ? (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">No budgets available for comparison</p>
              <Button variant="link" onClick={fetchBudgets} className="mt-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Budget 1</label>
                <Select value={budget1} onValueChange={setBudget1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map(b => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.projectName || b.departmentName} - {b.fiscalYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Budget 2</label>
                <Select value={budget2} onValueChange={setBudget2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.filter(b => b._id !== budget1).map(b => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.projectName || b.departmentName} - {b.fiscalYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCompare} disabled={loading || !budget1 || !budget2} className="flex-1">
              <GitCompare className="w-4 h-4 mr-2" />
              {loading ? 'Comparing...' : 'Compare Budgets'}
            </Button>
            {comparison && (
              <Button variant="outline" onClick={exportComparison}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {comparison && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{comparison.budget1.name}</span>
                  <Badge variant="outline">{comparison.budget1.status}</Badge>
                </CardTitle>
                <CardDescription>FY {comparison.budget1.fiscalYear} - {comparison.budget1.fiscalPeriod} • {comparison.budget1.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold">{comparison.budget1.currency} {comparison.budget1.totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold">{comparison.budget1.currency} {comparison.budget1.actualSpent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold">{comparison.budget1.currency} {comparison.budget1.remainingBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <Progress value={comparison.budget1.utilizationPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{comparison.budget1.utilizationPercentage.toFixed(1)}% utilized</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Categories: {Array.isArray(comparison.budget1.categories) ? comparison.budget1.categories.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Created: {new Date(comparison.budget1.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{comparison.budget2.name}</span>
                  <Badge variant="outline">{comparison.budget2.status}</Badge>
                </CardTitle>
                <CardDescription>FY {comparison.budget2.fiscalYear} - {comparison.budget2.fiscalPeriod} • {comparison.budget2.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold">{comparison.budget2.currency} {comparison.budget2.totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold">{comparison.budget2.currency} {comparison.budget2.actualSpent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold">{comparison.budget2.currency} {comparison.budget2.remainingBudget.toLocaleString('en-IN')}</span>
                  </div>
                  <Progress value={comparison.budget2.utilizationPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{comparison.budget2.utilizationPercentage.toFixed(1)}% utilized</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Categories: {Array.isArray(comparison.budget2.categories) ? comparison.budget2.categories.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Created: {new Date(comparison.budget2.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparison Analysis</CardTitle>
              <CardDescription>Key differences between the two budgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const budgetDiff = getDifference(comparison.budget1.totalBudget, comparison.budget2.totalBudget);
                  const spentDiff = getDifference(comparison.budget1.actualSpent, comparison.budget2.actualSpent);
                  const utilDiff = getDifference(comparison.budget1.utilizationPercentage, comparison.budget2.utilizationPercentage);
                  return (
                    <>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Budget Difference</p>
                          {budgetDiff.diff > 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : budgetDiff.diff < 0 ? <TrendingDown className="w-4 h-4 text-red-600" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <p className="text-2xl font-bold">{Math.abs(budgetDiff.diff).toLocaleString('en-IN')}</p>
                        <p className={`text-sm ${budgetDiff.percent > 0 ? 'text-green-600' : budgetDiff.percent < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {budgetDiff.percent > 0 ? '+' : ''}{budgetDiff.percent.toFixed(1)}% difference
                        </p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Spending Difference</p>
                          {spentDiff.diff > 0 ? <TrendingUp className="w-4 h-4 text-orange-600" /> : spentDiff.diff < 0 ? <TrendingDown className="w-4 h-4 text-green-600" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <p className="text-2xl font-bold">{Math.abs(spentDiff.diff).toLocaleString('en-IN')}</p>
                        <p className={`text-sm ${spentDiff.percent > 0 ? 'text-orange-600' : spentDiff.percent < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {spentDiff.percent > 0 ? '+' : ''}{spentDiff.percent.toFixed(1)}% difference
                        </p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Utilization Difference</p>
                          {utilDiff.diff > 0 ? <TrendingUp className="w-4 h-4 text-blue-600" /> : utilDiff.diff < 0 ? <TrendingDown className="w-4 h-4 text-blue-600" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <p className="text-2xl font-bold">{Math.abs(utilDiff.diff).toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">
                          {utilDiff.diff > 0 ? 'Higher' : utilDiff.diff < 0 ? 'Lower' : 'Same'} utilization
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {comparison.insights && comparison.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Insights & Recommendations</CardTitle>
                <CardDescription>AI-powered analysis of your budget comparison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {comparison.insights.map((insight: any, idx: number) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    insight.type === 'critical' ? 'bg-red-50 border-red-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    {insight.type === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /> :
                     insight.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" /> :
                     <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />}
                    <p className="text-sm flex-1">{insight.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {comparison.categoryComparison && Object.keys(comparison.categoryComparison).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Category-Level Analysis</CardTitle>
                <CardDescription>Detailed breakdown by budget category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(comparison.categoryComparison).map(([type, data]: [string, any]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold capitalize">{type}</h4>
                        <Badge variant="outline">{data.avgUtilization.toFixed(1)}% avg utilization</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Allocated</p>
                          <p className="text-lg font-semibold">{comparison.baseCurrency} {data.totalAllocated.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                          <p className="text-lg font-semibold">{comparison.baseCurrency} {data.totalSpent.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {data.budgets.map((b: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{b.budgetName}</span>
                            <div className="flex items-center gap-2">
                              <span>{comparison.baseCurrency} {b.allocated.toLocaleString('en-IN')}</span>
                              <Badge variant={b.utilization > 100 ? 'destructive' : b.utilization > 90 ? 'default' : 'secondary'} className="text-xs">
                                {b.utilization.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Breakdown</CardTitle>
              <CardDescription>Individual category comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">{comparison.budget1.name}</h4>
                  <div className="space-y-2">
                    {Array.isArray(comparison.budget1.categories) && comparison.budget1.categories.map((cat: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{cat.type || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{cat.name || 'Unnamed'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{comparison.budget1.currency} {(cat.allocated || cat.allocatedAmount || 0).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">{(cat.utilization || 0).toFixed(1)}% used</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">{comparison.budget2.name}</h4>
                  <div className="space-y-2">
                    {Array.isArray(comparison.budget2.categories) && comparison.budget2.categories.map((cat: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{cat.type || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{cat.name || 'Unnamed'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{comparison.budget2.currency} {(cat.allocated || cat.allocatedAmount || 0).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">{(cat.utilization || 0).toFixed(1)}% used</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {!comparison && budgets.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <GitCompare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Select two budgets above to start comparing</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
