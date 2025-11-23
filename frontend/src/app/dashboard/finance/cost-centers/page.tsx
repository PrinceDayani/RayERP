'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Download, Upload, GitBranch } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { costCenterAPI } from '@/lib/api/costCenterAPI';

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    description: '', 
    budget: '', 
    budgetPeriod: 'yearly',
    costType: 'direct'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const response = await costCenterAPI.getAll({ hierarchy: true });
      console.log('Fetch response:', response);
      const centers = response.success ? response.data : (response.data || response || []);
      setCostCenters(Array.isArray(centers) ? centers : []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({ title: 'Error', description: 'Failed to fetch cost centers', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const response = await costCenterAPI.update(editingId, formData);
        if (response.success || response.data) {
          toast({ title: 'Success', description: 'Cost center updated' });
        }
      } else {
        const response = await costCenterAPI.create(formData);
        if (response.success || response.data) {
          toast({ title: 'Success', description: 'Cost center created' });
        }
      }
      setShowDialog(false);
      setEditingId(null);
      setFormData({ name: '', code: '', description: '', budget: '', budgetPeriod: 'yearly', costType: 'direct' });
      await fetchCostCenters();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save cost center', 
        variant: 'destructive' 
      });
    }
  };

  const handleEdit = (cc: any) => {
    setEditingId(cc._id);
    setFormData({
      name: cc.name,
      code: cc.code,
      description: cc.description || '',
      budget: cc.budget?.toString() || '',
      budgetPeriod: cc.budgetPeriod || 'yearly',
      costType: cc.costType || 'direct'
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cost center?')) return;
    try {
      await costCenterAPI.delete(id);
      toast({ title: 'Success', description: 'Cost center deleted' });
      fetchCostCenters();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await costCenterAPI.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-centers-${Date.now()}.csv`;
      a.click();
      toast({ title: 'Success', description: 'Exported successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Export failed', variant: 'destructive' });
    }
  };

  const totalBudget = costCenters.reduce((sum, cc) => sum + parseFloat(cc.budget || 0), 0);
  const totalActual = costCenters.reduce((sum, cc) => sum + parseFloat(cc.actual || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cost Centers</h1>
          <p className="text-gray-600 mt-1">Department and project cost allocation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Create
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Centers</p>
            <p className="text-2xl font-bold">{costCenters.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Actual</p>
            <p className="text-2xl font-bold">₹{totalActual.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Variance</p>
            <p className={`text-2xl font-bold ${totalBudget - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(totalBudget - totalActual).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cost Centers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.map(cc => {
                const variance = parseFloat(cc.budget || 0) - parseFloat(cc.actual || 0);
                const utilizationPct = cc.budget ? (parseFloat(cc.actual || 0) / parseFloat(cc.budget)) * 100 : 0;
                return (
                  <TableRow key={cc._id}>
                    <TableCell className="font-mono">{cc.code}</TableCell>
                    <TableCell className="font-medium">{cc.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{cc.description}</TableCell>
                    <TableCell className="text-right">₹{parseFloat(cc.budget || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">₹{parseFloat(cc.actual || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className={`text-right ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                      ₹{Math.abs(variance).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={utilizationPct > 100 ? 'destructive' : utilizationPct > 80 ? 'default' : 'secondary'}>
                        {utilizationPct.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(cc)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(cc._id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
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
            <DialogTitle>{editingId ? 'Edit' : 'Create'} Cost Center</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="CC-001" required />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Marketing Department" required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Cost center description" />
            </div>
            <div>
              <Label>Budget</Label>
              <Input type="number" step="0.01" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="0.00" required />
            </div>
            <div>
              <Label>Budget Period</Label>
              <Select value={formData.budgetPeriod || 'yearly'} onValueChange={(val) => setFormData({...formData, budgetPeriod: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cost Type</Label>
              <Select value={formData.costType || 'direct'} onValueChange={(val) => setFormData({...formData, costType: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="indirect">Indirect</SelectItem>
                  <SelectItem value="overhead">Overhead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditingId(null); }}>Cancel</Button>
              <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
