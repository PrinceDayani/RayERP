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
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function GLBudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    fiscalYear: new Date().getFullYear().toString(),
    budgetAmount: '',
    period: 'yearly'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBudgets();
    fetchAccounts();
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
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create budget', variant: 'destructive' });
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetAmount || 0), 0);
  const totalActual = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount || 0), 0);
  const utilizationPct = totalBudget ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">GL Budgets</h1>
          <p className="text-gray-600 mt-1">Budget tracking and variance analysis</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />Create Budget
        </Button>
      </div>

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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create GL Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Account</Label>
              <Select value={formData.accountId} onValueChange={(v) => setFormData({...formData, accountId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
