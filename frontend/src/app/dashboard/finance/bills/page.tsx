'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Download, Search, Printer, Bell, Clock, TrendingUp, BarChart3, Calendar, AlertTriangle, CreditCard, Filter, RefreshCw } from 'lucide-react';
import { getBillDetails, createBillDetail, updateBillPayment, getBillStatement, getAccounts } from '@/lib/api/generalLedgerAPI';
import { billsApi } from '@/lib/api/billsApi';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function BillsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [bills, setBills] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [agingData, setAgingData] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    billReference: '',
    billDate: '',
    billAmount: 0,
    dueDate: '',
    recurring: false,
    frequency: 'monthly'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
    setupKeyboardShortcuts();
    checkReminders();
  }, []);

  const setupKeyboardShortcuts = () => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') { e.preventDefault(); setShowForm(true); }
        if (e.key === 'p') { e.preventDefault(); window.print(); }
        if (e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
        if (e.key === 'e') { e.preventDefault(); handleExport('csv'); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  };

  const checkReminders = () => {
    const today = new Date();
    const upcoming = bills.filter(b => {
      const due = new Date(b.dueDate);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 7 && diff >= 0 && b.status !== 'paid';
    });
    setReminders(upcoming);
  };

  const loadAccounts = async () => {
    try {
      const res = await getAccounts({ enableBillTracking: true });
      setAccounts(res.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadBills = async (accountId: string) => {
    try {
      const data = await getBillStatement(accountId);
      setBills(data.bills || []);
      setSummary(data.summary);
      calculateAging(data.bills || []);
      checkReminders();
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  const calculateAging = (billsList: any[]) => {
    const today = new Date();
    const aging = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '60+': 0
    };

    billsList.forEach(bill => {
      if (bill.status !== 'paid') {
        const due = new Date(bill.dueDate);
        const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        
        if (days <= 0) aging.current += bill.balanceAmount;
        else if (days <= 30) aging['1-30'] += bill.balanceAmount;
        else if (days <= 60) aging['31-60'] += bill.balanceAmount;
        else aging['60+'] += bill.balanceAmount;
      }
    });

    setAgingData([
      { name: 'Current', value: aging.current },
      { name: '1-30 Days', value: aging['1-30'] },
      { name: '31-60 Days', value: aging['31-60'] },
      { name: '60+ Days', value: aging['60+'] }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBillDetail(formData);
      toast({ title: 'Bill created successfully' });
      setShowForm(false);
      if (selectedAccount) loadBills(selectedAccount);
      setFormData({ accountId: '', billReference: '', billDate: '', billAmount: 0, dueDate: '', recurring: false, frequency: 'monthly' });
    } catch (error) {
      toast({ title: 'Error creating bill', variant: 'destructive' });
    }
  };

  const handleBulkPayment = async () => {
    if (selectedBills.size === 0) return;
    try {
      for (const billId of selectedBills) {
        const bill = bills.find(b => b._id === billId);
        if (bill) await updateBillPayment(billId, { paymentAmount: bill.balanceAmount });
      }
      toast({ title: `${selectedBills.size} bills paid successfully` });
      setSelectedBills(new Set());
      if (selectedAccount) loadBills(selectedAccount);
    } catch (error) {
      toast({ title: 'Error processing payments', variant: 'destructive' });
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    const data = filteredBills.map(b => ({
      Reference: b.billReference,
      Date: new Date(b.billDate).toLocaleDateString(),
      Amount: b.billAmount,
      Paid: b.paidAmount,
      Balance: b.balanceAmount,
      Status: b.status
    }));
    
    if (format === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bills-${Date.now()}.csv`;
      a.click();
    } else if (format === 'pdf') {
      try {
        const blob = await billsApi.exportPDF(selectedAccount);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bills-${Date.now()}.pdf`;
        a.click();
        toast({ title: 'PDF exported successfully' });
      } catch (error) {
        toast({ title: 'Error exporting PDF', variant: 'destructive' });
      }
    }
  };

  const toggleBill = (billId: string) => {
    const newSet = new Set(selectedBills);
    if (newSet.has(billId)) newSet.delete(billId);
    else newSet.add(billId);
    setSelectedBills(newSet);
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.billReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statINRata = [
    { name: 'Paid', value: bills.filter(b => b.status === 'paid').length },
    { name: 'Partial', value: bills.filter(b => b.status === 'partial').length },
    { name: 'Unpaid', value: bills.filter(b => b.status === 'unpaid').length }
  ];

  const monthlyData = bills.reduce((acc: any[], bill) => {
    const month = new Date(bill.billDate).toLocaleDateString('en-IN', { month: 'short' });
    const existing = acc.find(d => d.month === month);
    if (existing) existing.amount += bill.billAmount;
    else acc.push({ month, amount: bill.billAmount });
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Bill Management</h1>
          <p className="text-gray-500 mt-2">Track and manage your bills efficiently</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />New Bill
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />Export PDF
          </Button>
        </div>
      </div>

      {reminders.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">{reminders.length} bills due within 7 days</p>
                  <p className="text-sm text-orange-700">Total: ₹{reminders.reduce((sum, b) => sum + b.balanceAmount, 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900">{summary?.totalBills || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">₹{(summary?.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Paid</p>
                <p className="text-3xl font-bold text-green-600">₹{(summary?.totalPaid || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Outstanding</p>
                <p className="text-3xl font-bold text-red-600">₹{(summary?.totalBalance || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="list">Bills List</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle className="text-xl font-semibold">All Bills</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input id="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-48" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedAccount} onValueChange={(val) => { setSelectedAccount(val); loadBills(val); }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedBills.size > 0 && (
                    <Button onClick={handleBulkPayment} className="bg-green-600 hover:bg-green-700">
                      Pay Selected ({selectedBills.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill, idx) => (
                    <TableRow key={bill._id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox checked={selectedBills.has(bill._id)} onCheckedChange={() => toggleBill(bill._id)} />
                      </TableCell>
                      <TableCell className="font-medium">{bill.billReference}</TableCell>
                      <TableCell>{new Date(bill.billDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={new Date(bill.dueDate) < new Date() && bill.status !== 'paid' ? 'text-red-600' : ''}>
                            {new Date(bill.dueDate).toLocaleDateString('en-IN')}
                          </span>
                          {new Date(bill.dueDate) < new Date() && bill.status !== 'paid' && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">₹{bill.billAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-right text-green-600">₹{bill.paidAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">₹{bill.balanceAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={bill.status === 'paid' ? 'default' : bill.status === 'partial' ? 'secondary' : 'destructive'}
                          className={bill.status === 'paid' ? 'bg-green-100 text-green-700' : bill.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
                        >
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {bill.status !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={async () => {
                            const amt = prompt('Enter payment amount:', bill.balanceAmount.toString());
                            if (amt) {
                              await updateBillPayment(bill._id, { paymentAmount: Number(amt) });
                              loadBills(selectedAccount);
                            }
                          }}>
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-semibold">Aging Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-semibold">Aging Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {agingData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-lg font-semibold text-gray-900">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-semibold">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie 
                      data={statINRata} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={110} 
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statINRata.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-semibold">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-semibold">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.filter(b => b.paidAmount > 0).map(bill => (
                    <TableRow key={bill._id} className="hover:bg-gray-50">
                      <TableCell>{new Date(bill.billDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="font-medium">{bill.billReference}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">₹{bill.paidAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Bank Transfer</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select value={formData.accountId} onValueChange={(val) => setFormData({...formData, accountId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bill Reference</Label>
                <Input value={formData.billReference} onChange={(e) => setFormData({...formData, billReference: e.target.value})} required placeholder="e.g., INV-2024-001" />
              </div>
              <div className="space-y-2">
                <Label>Bill Date</Label>
                <Input type="date" value={formData.billDate} onChange={(e) => setFormData({...formData, billDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" step="0.01" value={formData.billAmount} onChange={(e) => setFormData({...formData, billAmount: Number(e.target.value)})} required placeholder="0.00" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox checked={formData.recurring} onCheckedChange={(checked) => setFormData({...formData, recurring: checked as boolean})} />
                <Label>Recurring Bill</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">Create Bill</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  );
}
