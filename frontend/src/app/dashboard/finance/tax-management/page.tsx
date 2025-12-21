'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator, FileText, TrendingUp, AlertCircle, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';

interface TaxRecord {
  id: string;
  type: 'GST' | 'VAT' | 'TDS' | 'Income Tax' | 'Sales Tax';
  amount: number;
  rate: number;
  status: 'Pending' | 'Filed' | 'Paid' | 'Overdue';
  dueDate: string;
  period: string;
  description: string;
}

interface TaxFormData {
  type: 'GST' | 'VAT' | 'TDS' | 'Income Tax' | 'Sales Tax';
  amount: string;
  rate: string;
  period: string;
  description: string;
  dueDate: string;
}

export default function TaxManagementPage() {
  const { toast } = useToast();
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTax: 0,
    pendingReturns: 0,
    overduePayments: 0,
    complianceScore: 95
  });

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaxFormData>({
    type: 'GST',
    amount: '',
    rate: '',
    period: '',
    description: '',
    dueDate: ''
  });

  // Calculator state
  const [tdsAmount, setTdsAmount] = useState('');
  const [tdsRate, setTdsRate] = useState('');
  const [tdsResult, setTdsResult] = useState<any>(null);
  const [incomeTaxIncome, setIncomeTaxIncome] = useState('');
  const [incomeTaxDeductions, setIncomeTaxDeductions] = useState('');
  const [incomeTaxResult, setIncomeTaxResult] = useState<any>(null);

  useEffect(() => {
    fetchTaxData();
  }, []);

  const fetchTaxData = async () => {
    setError(null);
    try {
      const { taxAPI } = await import('@/lib/api/taxAPI');
      const [liabilitiesResponse] = await Promise.all([
        taxAPI.getTaxLiabilities()
      ]);

      if ((liabilitiesResponse as any).success) {
        setTaxRecords((liabilitiesResponse as any).data?.records || []);
        const data = (liabilitiesResponse as any).data;
        if (data?.summary) {
          setStats({
            totalTax: data.summary.totalTax || 0,
            pendingReturns: data.summary.pendingReturns || 0,
            overduePayments: data.summary.overduePayments || 0,
            complianceScore: data.summary.complianceScore || 0
          });
        }
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching tax data:', error);
      setError(error?.message || 'Failed to load tax data. Please try again.');
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      const { taxAPI } = await import('@/lib/api/taxAPI');

      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        rate: parseFloat(formData.rate),
        period: formData.period,
        description: formData.description,
        dueDate: formData.dueDate
      };

      if (editingRecord) {
        await taxAPI.updateTaxRecord(editingRecord.id, payload);
        toast({
          title: 'Success',
          description: 'Tax record updated successfully',
        });
      } else {
        await taxAPI.createTaxRecord(payload);
        toast({
          title: 'Success',
          description: 'Tax record created successfully',
        });
      }

      setIsFormOpen(false);
      resetForm();
      fetchTaxData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save tax record',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { taxAPI } = await import('@/lib/api/taxAPI');
      await taxAPI.deleteTaxRecord(recordToDelete);

      toast({
        title: 'Success',
        description: 'Tax record deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
      fetchTaxData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete tax record',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (record: TaxRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      amount: record.amount.toString(),
      rate: record.rate.toString(),
      period: record.period,
      description: record.description,
      dueDate: record.dueDate
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'GST',
      amount: '',
      rate: '',
      period: '',
      description: '',
      dueDate: ''
    });
  };

  const calculateTDS = async () => {
    try {
      const { taxAPI } = await import('@/lib/api/taxAPI');
      const response = await taxAPI.calculateTDS(
        parseFloat(tdsAmount),
        parseFloat(tdsRate)
      );

      if ((response as any).success) {
        setTdsResult((response as any).data);
        toast({
          title: 'TDS Calculated',
          description: `TDS Amount: ₹${(response as any).data.tdsAmount.toLocaleString()}`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to calculate TDS',
        variant: 'destructive',
      });
    }
  };

  const calculateIncomeTax = async () => {
    try {
      const { taxAPI } = await import('@/lib/api/taxAPI');
      const response = await taxAPI.calculateIncomeTax(
        parseFloat(incomeTaxIncome),
        incomeTaxDeductions ? parseFloat(incomeTaxDeductions) : undefined
      );

      if ((response as any).success) {
        setIncomeTaxResult((response as any).data);
        toast({
          title: 'Income Tax Calculated',
          description: `Tax Amount: ₹${(response as any).data.calculatedTax.toLocaleString()}`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to calculate income tax',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filed': return 'bg-green-100 text-green-700';
      case 'Paid': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<TaxRecord>[] = [
    {
      key: 'type',
      header: 'Tax Type',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'period',
      header: 'Period'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (value) => `${value}%`
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge className={getStatusColor(value)} variant="secondary">
          {value}
        </Badge>
      )
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value, record) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditDialog(record)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openDeleteDialog(value)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Management"
        description="Manage GST, VAT, TDS, and other tax obligations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Tax Management' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Tax Entry
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tax Liability</p>
                <p className="text-2xl font-bold">₹{stats.totalTax.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Returns</p>
                <p className="text-2xl font-bold">{stats.pendingReturns}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                <p className="text-2xl font-bold">{stats.overduePayments}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{stats.complianceScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="tds">TDS</TabsTrigger>
          <TabsTrigger value="income-tax">Income Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? (
            <LoadingSpinner size="lg" text="Loading tax data..." />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={fetchTaxData}
            />
          ) : taxRecords.length === 0 ? (
            <EmptyState
              title="No tax records found"
              message="No tax records are available at this time. Tax liabilities will appear here once they are recorded in the system."
            />
          ) : (
            <DataTable
              data={taxRecords}
              columns={columns}
              title="Tax Records"
              searchable
              exportable
              onExport={() => console.log('Export tax records')}
            />
          )}
        </TabsContent>

        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle>GST Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">GSTR-1</h3>
                    <p className="text-sm text-muted-foreground mb-2">Outward supplies</p>
                    <Badge className="bg-green-100 text-green-700">Filed</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">GSTR-3B</h3>
                    <p className="text-sm text-muted-foreground mb-2">Monthly return</p>
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">GSTR-9</h3>
                    <p className="text-sm text-muted-foreground mb-2">Annual return</p>
                    <Badge className="bg-blue-100 text-blue-700">Due Soon</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tds">
          <Card>
            <CardHeader>
              <CardTitle>TDS Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={tdsAmount}
                      onChange={(e) => setTdsAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>TDS Rate (%)</Label>
                    <Select value={tdsRate} onValueChange={setTdsRate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select TDS rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10% - Salary</SelectItem>
                        <SelectItem value="2">2% - Contractor</SelectItem>
                        <SelectItem value="1">1% - Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={calculateTDS} disabled={!tdsAmount || !tdsRate}>
                  Calculate TDS
                </Button>

                {tdsResult && (
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Calculation Result</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Gross Amount:</span>
                          <span className="font-medium">₹{tdsResult.grossAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TDS Rate:</span>
                          <span className="font-medium">{tdsResult.tdsRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TDS Amount:</span>
                          <span className="font-medium text-red-600">₹{tdsResult.tdsAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-semibold">Net Amount:</span>
                          <span className="font-semibold">₹{tdsResult.netAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-tax">
          <Card>
            <CardHeader>
              <CardTitle>Income Tax Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Tax Slabs (FY 2023-24)</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>₹0 - ₹2.5L</span>
                      <span>0%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>₹2.5L - ₹5L</span>
                      <span>5%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>₹5L - ₹10L</span>
                      <span>20%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Above ₹10L</span>
                      <span>30%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Calculate Your Tax</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Annual Income</Label>
                      <Input
                        type="number"
                        placeholder="Annual Income"
                        value={incomeTaxIncome}
                        onChange={(e) => setIncomeTaxIncome(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Deductions (80C, 80D, etc.)</Label>
                      <Input
                        type="number"
                        placeholder="Deductions"
                        value={incomeTaxDeductions}
                        onChange={(e) => setIncomeTaxDeductions(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={calculateIncomeTax}
                      disabled={!incomeTaxIncome}
                    >
                      Calculate Tax
                    </Button>

                    {incomeTaxResult && (
                      <Card className="bg-muted">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2">Tax Calculation</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Gross Income:</span>
                              <span className="font-medium">₹{incomeTaxResult.grossIncome.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deductions:</span>
                              <span className="font-medium">₹{incomeTaxResult.deductions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxable Income:</span>
                              <span className="font-medium">₹{incomeTaxResult.taxableIncome.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1">
                              <span className="font-semibold">Tax Amount:</span>
                              <span className="font-semibold text-red-600">₹{incomeTaxResult.calculatedTax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold">Net Income:</span>
                              <span className="font-semibold">₹{incomeTaxResult.netIncome.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax Entry Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Tax Entry' : 'New Tax Entry'}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update the tax entry details below' : 'Create a new tax entry'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tax Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="VAT">VAT</SelectItem>
                  <SelectItem value="TDS">TDS</SelectItem>
                  <SelectItem value="Income Tax">Income Tax</SelectItem>
                  <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label>Rate (%)</Label>
              <Input
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="Enter tax rate"
              />
            </div>

            <div>
              <Label>Period</Label>
              <Input
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., Q1 2024, Jan 2024"
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingRecord ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tax Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tax entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
