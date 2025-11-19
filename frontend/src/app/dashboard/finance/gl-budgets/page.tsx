'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, AlertTriangle, Copy, CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { AccountSelector } from '@/components/finance/AccountSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function GLBudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [formData, setFormData] = useState({
    accountId: '',
    fiscalYear: new Date().getFullYear().toString(),
    budgetAmount: '',
    period: 'yearly',
    periodBreakdown: [] as any[]
  });
  const [revisionData, setRevisionData] = useState({ newAmount: '', reason: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchBudgets();
    fetchAccounts();
    fetchAlerts();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gl-budgets`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBudgets(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gl-budgets/alerts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/gl-budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Budget created' });
        setShowDialog(false);
        fetchBudgets();
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.message || 'Failed to create budget', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create budget', variant: 'destructive' });
    }
  };

  const handleRevise = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gl-budgets/${selectedBudget._id}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(revisionData)
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Budget revised' });
        setShowRevisionDialog(false);
        fetchBudgets();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to revise budget', variant: 'destructive' });
    }
  };

  const handleApprove = async (budgetId: string, level: number) => {
    try {
      const res = await fetch(`${API_URL}/api/gl-budgets/${budgetId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ level, comments: 'Approved' })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Budget approved' });
        fetchBudgets();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleFreeze = async (budgetId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/gl-budgets/${budgetId}/freeze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Budget frozen' });
        fetchBudgets();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to freeze', variant: 'destructive' });
    }
  };

  const copyFromPreviousYear = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await fetch(`${API_URL}/api/gl-budgets/copy-previous-year`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fromYear: (currentYear - 1).toString(),
          toYear: currentYear.toString(),
          adjustmentPercent: 5
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Budgets copied from previous year' });
        fetchBudgets();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy budgets', variant: 'destructive' });
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetAmount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount || 0), 0);
  const utilizationPct = totalBudget ? (totalActual / totalBudget) * 100 : 0;

  const getStatusBadge = (status: string) => {
    const variants: any = {
      draft: 'secondary',
      pending_approval: 'default',
      approved: 'default',
      rejected: 'destructive',
      frozen: 'outline'
    };
    const icons: any = {
      draft: Clock,
      pending_approval: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      frozen: Lock
    };
    const Icon = icons[status] || Clock;
    return (
      <Badge variant={variants[status]}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">GL Budgets</h1>
          <p className="text-gray-600 mt-1">Budget tracking, revisions & approval workflow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyFromPreviousYear}>
            <Copy className="w-4 h-4 mr-2" />Copy Previous Year
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Create Budget
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-800">{alerts.length} budget alerts</p>
                <p className="text-sm text-orange-700">
                  {alerts.filter(a => a.alerts.overspending).length} overspending, 
                  {alerts.filter(a => a.alerts.threshold90).length} near limit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Actual Spent</p>
            <p className="text-2xl font-bold">₹{totalActual.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Remaining</p>
            <p className="text-2xl font-bold text-green-600">₹{(totalBudget - totalActual).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Utilization</p>
            <p className={`text-2xl font-bold ${utilizationPct > 100 ? 'text-red-600' : 'text-blue-600'}`}>
              {utilizationPct.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="comparison">YoY Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Fiscal Year</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map(budget => {
                    const variance = parseFloat(budget.budgetAmount || 0) - parseFloat(budget.actualAmount || 0);
                    const utilization = budget.budgetAmount ? (parseFloat(budget.actualAmount || 0) / parseFloat(budget.budgetAmount)) * 100 : 0;
                    return (
                      <TableRow key={budget._id}>
                        <TableCell className="font-medium">
                          {budget.accountId?.name || 'N/A'}
                          <br />
                          <span className="text-xs text-gray-500">{budget.accountId?.code}</span>
                        </TableCell>
                        <TableCell>{budget.fiscalYear}</TableCell>
                        <TableCell className="capitalize">{budget.period}</TableCell>
                        <TableCell className="text-right">₹{parseFloat(budget.budgetAmount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{parseFloat(budget.actualAmount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className={`text-right ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{Math.abs(variance).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={Math.min(utilization, 100)} className="h-2" />
                            <div className="flex items-center gap-1 text-xs">
                              {utilization > 90 && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                              <span className={utilization > 100 ? 'text-red-600 font-semibold' : ''}>
                                {utilization.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(budget.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {budget.status !== 'frozen' && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedBudget(budget); setShowRevisionDialog(true); }}>
                                Revise
                              </Button>
                            )}
                            {budget.status === 'approved' && (
                              <Button size="sm" variant="outline" onClick={() => handleFreeze(budget._id)}>
                                Freeze
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Budget Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map(budget => (
                  <div key={budget._id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{budget.accountId?.name}</p>
                        <p className="text-sm text-gray-600">FY {budget.fiscalYear}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{budget.utilizationPercent.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">₹{budget.actualAmount.toLocaleString('en-IN')} / ₹{budget.budgetAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {budget.alerts.overspending && <Badge variant="destructive">Overspending</Badge>}
                      {budget.alerts.threshold100 && <Badge variant="destructive">100% Used</Badge>}
                      {budget.alerts.threshold90 && <Badge className="bg-orange-500">90% Used</Badge>}
                      {budget.alerts.threshold80 && <Badge className="bg-yellow-500">80% Used</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Year-over-Year Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Select years to compare budget performance</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create GL Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Account</Label>
              <AccountSelector
                value={formData.accountId}
                onValueChange={(v) => setFormData({...formData, accountId: v})}
                accounts={accounts}
                onAccountCreated={fetchAccounts}
              />
            </div>
            <div>
              <Label>Fiscal Year</Label>
              <Input value={formData.fiscalYear} onChange={(e) => setFormData({...formData, fiscalYear: e.target.value})} placeholder="2024" required />
            </div>
            <div>
              <Label>Period</Label>
              <Select value={formData.period} onValueChange={(v) => setFormData({...formData, period: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Budget Amount</Label>
              <Input type="number" step="0.01" value={formData.budgetAmount} onChange={(e) => setFormData({...formData, budgetAmount: e.target.value})} placeholder="0.00" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revise Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Amount</Label>
              <Input value={selectedBudget?.budgetAmount || ''} disabled />
            </div>
            <div>
              <Label>New Amount</Label>
              <Input type="number" step="0.01" value={revisionData.newAmount} onChange={(e) => setRevisionData({...revisionData, newAmount: e.target.value})} placeholder="0.00" required />
            </div>
            <div>
              <Label>Reason for Revision</Label>
              <Input value={revisionData.reason} onChange={(e) => setRevisionData({...revisionData, reason: e.target.value})} placeholder="Explain why this revision is needed" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>Cancel</Button>
              <Button onClick={handleRevise}>Submit Revision</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
