'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PageLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, TrendingUp, BarChart2, Bell, Wallet, CheckCircle } from 'lucide-react';
import { AlertsPanel } from '@/components/budget/AlertsPanel';
import GenerateForecastDialog from '@/components/budget/GenerateForecastDialog';
import GenerateVarianceDialog from '@/components/budget/GenerateVarianceDialog';
import ForecastChart from '@/components/budget/ForecastChart';
import VarianceChart from '@/components/budget/VarianceChart';
import { budgetForecastAPI, type BudgetForecast } from '@/lib/api/budgetForecastAPI';
import { budgetVarianceAPI, type BudgetVariance } from '@/lib/api/budgetVarianceAPI';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
});

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approved: 'default',
  draft: 'secondary',
  rejected: 'destructive',
};

const utilizationColor = (pct: number) =>
  pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-orange-500' : 'text-green-600';

export default function DepartmentBudgetsPage() {
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Forecast state
  const [forecastBudgetId, setForecastBudgetId] = useState('');
  const [showForecastDialog, setShowForecastDialog] = useState(false);
  const [forecast, setForecast] = useState<BudgetForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Variance state
  const [varianceBudgetId, setVarianceBudgetId] = useState('');
  const [showVarianceDialog, setShowVarianceDialog] = useState(false);
  const [variance, setVariance] = useState<BudgetVariance | null>(null);
  const [varianceLoading, setVarianceLoading] = useState(false);

  const [formData, setFormData] = useState({
    departmentId: '',
    fiscalYear: new Date().getFullYear().toString(),
    totalBudget: '',
    categories: [{ name: '', allocated: '' }],
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [budgetsRes, deptsRes] = await Promise.all([
        axios.get(`${API_URL}/api/department-budgets`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/api/departments`, { headers: getAuthHeader() }),
      ]);
      setBudgets(budgetsRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/department-budgets`, {
        ...formData,
        totalBudget: Number(formData.totalBudget),
        categories: formData.categories.map(c => ({ ...c, allocated: Number(c.allocated) })),
      }, { headers: getAuthHeader() });
      toast({ title: 'Success', description: 'Budget created and sent for approval' });
      setShowCreate(false);
      setFormData({ departmentId: '', fiscalYear: new Date().getFullYear().toString(), totalBudget: '', categories: [{ name: '', allocated: '' }], notes: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create budget', variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.put(`${API_URL}/api/department-budgets/${id}/approve`, {}, { headers: getAuthHeader() });
      toast({ title: 'Success', description: 'Budget approved' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to approve budget', variant: 'destructive' });
    }
  };

  const loadLatestForecast = async (budgetId: string) => {
    if (!budgetId) return;
    setForecastLoading(true);
    setForecast(null);
    try {
      const res = await budgetForecastAPI.getForecasts(budgetId);
      const list: BudgetForecast[] = res.data || res.forecasts || [];
      if (list.length > 0) setForecast(list[0]);
    } catch {
      // no forecast yet — user can generate one
    } finally {
      setForecastLoading(false);
    }
  };

  const loadLatestVariance = async (budgetId: string) => {
    if (!budgetId) return;
    setVarianceLoading(true);
    setVariance(null);
    try {
      const res = await budgetVarianceAPI.getVariances(budgetId);
      const list: BudgetVariance[] = res.data || res.variances || [];
      if (list.length > 0) setVariance(list[0]);
    } catch {
      // no variance yet
    } finally {
      setVarianceLoading(false);
    }
  };

  const selectedForecastBudget = budgets.find(b => b._id === forecastBudgetId);
  const selectedVarianceBudget = budgets.find(b => b._id === varianceBudgetId);

  if (loading) return <PageLoader text="Loading department budgets..." />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Department Budgets</h1>
          <p className="text-sm text-muted-foreground">Manage budgets, forecasts, variances and alerts</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> New Budget
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total Budgets</p>
            <p className="text-2xl font-bold">{budgets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">{budgets.filter(b => b.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total Allocated</p>
            <p className="text-2xl font-bold">₹{budgets.reduce((s, b) => s + (b.totalBudget || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-orange-500">₹{budgets.reduce((s, b) => s + (b.spentBudget || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><Wallet className="h-4 w-4 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="forecasting"><TrendingUp className="h-4 w-4 mr-1" />Forecasting</TabsTrigger>
          <TabsTrigger value="variance"><BarChart2 className="h-4 w-4 mr-1" />Variance</TabsTrigger>
          <TabsTrigger value="alerts"><Bell className="h-4 w-4 mr-1" />Alerts</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {budgets.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No budgets found. Create one to get started.</CardContent></Card>
          ) : budgets.map(budget => {
            const utilization = budget.totalBudget > 0 ? (budget.spentBudget / budget.totalBudget) * 100 : 0;
            return (
              <Card key={budget._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.departmentId?.name ?? '—'}</CardTitle>
                      <p className="text-sm text-muted-foreground">FY {budget.fiscalYear}</p>
                    </div>
                    <Badge variant={statusVariant[budget.status] ?? 'outline'}>{budget.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Total</p><p className="font-semibold">₹{budget.totalBudget?.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Allocated</p><p className="font-semibold">₹{budget.allocatedBudget?.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Spent</p><p className={`font-semibold ${utilizationColor(utilization)}`}>₹{budget.spentBudget?.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Remaining</p><p className="font-semibold text-green-600">₹{budget.remainingBudget?.toLocaleString()}</p></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Utilization</span>
                      <span className={utilizationColor(utilization)}>{utilization.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(utilization, 100)} className="h-2" />
                  </div>
                  {budget.categories?.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {budget.categories.map((cat: any, i: number) => (
                        <div key={i} className="border rounded p-2 text-xs">
                          <p className="font-medium truncate">{cat.name}</p>
                          <p className="text-muted-foreground">₹{cat.allocated?.toLocaleString()} / ₹{cat.spent?.toLocaleString()} spent</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {budget.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => handleApprove(budget._id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve Budget
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── FORECASTING ── */}
        <TabsContent value="forecasting" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Label>Select Budget</Label>
                  <Select value={forecastBudgetId} onValueChange={id => { setForecastBudgetId(id); loadLatestForecast(id); }}>
                    <SelectTrigger><SelectValue placeholder="Choose a department budget" /></SelectTrigger>
                    <SelectContent>
                      {budgets.map(b => (
                        <SelectItem key={b._id} value={b._id}>{b.departmentId?.name} — FY {b.fiscalYear}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={!forecastBudgetId} onClick={() => setShowForecastDialog(true)}>
                  <TrendingUp className="h-4 w-4 mr-2" /> Generate Forecast
                </Button>
              </div>
              {forecastLoading && <p className="text-sm text-muted-foreground">Loading forecast…</p>}
              {!forecastLoading && forecastBudgetId && !forecast && (
                <p className="text-sm text-muted-foreground">No forecast generated yet. Click "Generate Forecast" to create one.</p>
              )}
              {forecast && <ForecastChart forecast={forecast} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── VARIANCE ── */}
        <TabsContent value="variance" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Label>Select Budget</Label>
                  <Select value={varianceBudgetId} onValueChange={id => { setVarianceBudgetId(id); loadLatestVariance(id); }}>
                    <SelectTrigger><SelectValue placeholder="Choose a department budget" /></SelectTrigger>
                    <SelectContent>
                      {budgets.map(b => (
                        <SelectItem key={b._id} value={b._id}>{b.departmentId?.name} — FY {b.fiscalYear}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={!varianceBudgetId} onClick={() => setShowVarianceDialog(true)}>
                  <BarChart2 className="h-4 w-4 mr-2" /> Generate Variance Report
                </Button>
              </div>
              {varianceLoading && <p className="text-sm text-muted-foreground">Loading variance…</p>}
              {!varianceLoading && varianceBudgetId && !variance && (
                <p className="text-sm text-muted-foreground">No variance report yet. Click "Generate Variance Report" to create one.</p>
              )}
              {variance && <VarianceChart variance={variance} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ALERTS ── */}
        <TabsContent value="alerts" className="mt-4">
          <AlertsPanel />
        </TabsContent>
      </Tabs>

      {/* ── CREATE BUDGET DIALOG ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Department Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Department</Label>
              <Select value={formData.departmentId} onValueChange={v => setFormData(f => ({ ...f, departmentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fiscal Year</Label>
                <Input value={formData.fiscalYear} onChange={e => setFormData(f => ({ ...f, fiscalYear: e.target.value }))} required />
              </div>
              <div>
                <Label>Total Budget (₹)</Label>
                <Input type="number" min={0} value={formData.totalBudget} onChange={e => setFormData(f => ({ ...f, totalBudget: e.target.value }))} required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Categories</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(f => ({ ...f, categories: [...f.categories, { name: '', allocated: '' }] }))}>
                  + Add
                </Button>
              </div>
              {formData.categories.map((cat, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Name" value={cat.name} onChange={e => { const c = [...formData.categories]; c[i] = { ...c[i], name: e.target.value }; setFormData(f => ({ ...f, categories: c })); }} required />
                  <Input type="number" placeholder="Amount" min={0} value={cat.allocated} onChange={e => { const c = [...formData.categories]; c[i] = { ...c[i], allocated: e.target.value }; setFormData(f => ({ ...f, categories: c })); }} required className="w-32" />
                  {formData.categories.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(f => ({ ...f, categories: f.categories.filter((_, j) => j !== i) }))}>✕</Button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Create Budget</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── FORECAST DIALOG ── */}
      {showForecastDialog && selectedForecastBudget && (
        <GenerateForecastDialog
          open={showForecastDialog}
          onClose={() => setShowForecastDialog(false)}
          onSuccess={() => loadLatestForecast(forecastBudgetId)}
          budgetId={forecastBudgetId}
          budgetName={`${selectedForecastBudget.departmentId?.name} FY ${selectedForecastBudget.fiscalYear}`}
        />
      )}

      {/* ── VARIANCE DIALOG ── */}
      {showVarianceDialog && selectedVarianceBudget && (
        <GenerateVarianceDialog
          open={showVarianceDialog}
          onClose={() => setShowVarianceDialog(false)}
          onSuccess={() => loadLatestVariance(varianceBudgetId)}
          budgetId={varianceBudgetId}
          budgetName={`${selectedVarianceBudget.departmentId?.name} FY ${selectedVarianceBudget.fiscalYear}`}
        />
      )}
    </div>
  );
}
