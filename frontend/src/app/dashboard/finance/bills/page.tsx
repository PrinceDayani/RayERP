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
import { FileText, Plus, Download, Search, Printer, Bell, Clock, TrendingUp, BarChart3, Calendar, AlertTriangle } from 'lucide-react';
import { getBillDetails, createBillDetail, updateBillPayment, getBillStatement, getAccounts } from '@/lib/api/generalLedgerAPI';
import { billsApi } from '@/lib/api/billsApi';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

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

  const statusData = [
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Bill Management</h1>
            <p className="text-gray-600">Track, manage, and pay bills with aging analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />New Bill</Button>
          <Button variant="outline" onClick={() => handleExport('csv')}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="w-4 h-4 mr-2" />PDF</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>
      </div>

      {reminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-800">{reminders.length} bills due within 7 days</p>
                <p className="text-sm text-orange-700">Total amount: ₹{reminders.reduce((sum, b) => sum + b.balanceAmount, 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Bills</p>
            <p className="text-2xl font-bold">{summary?.totalBills || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold">₹{summary?.totalAmount?.toFixed(2) || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">₹{summary?.totalPaid?.toFixed(2) || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">₹{summary?.totalBalance?.toFixed(2) || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Bills List</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Bills</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input id="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-48" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
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
                    <Button onClick={handleBulkPayment}>Pay Selected ({selectedBills.size})</Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                  {filteredBills.map(bill => (
                    <TableRow key={bill._id}>
                      <TableCell>
                        <Checkbox checked={selectedBills.has(bill._id)} onCheckedChange={() => toggleBill(bill._id)} />
                      </TableCell>
                      <TableCell className="font-medium">{bill.billReference}</TableCell>
                      <TableCell>{new Date(bill.billDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>
                        {new Date(bill.dueDate).toLocaleDateString('en-IN')}
                        {new Date(bill.dueDate) < new Date() && bill.status !== 'paid' && (
                          <AlertTriangle className="inline h-4 w-4 ml-2 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">₹{bill.billAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{bill.paidAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{bill.balanceAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={bill.status === 'paid' ? 'default' : bill.status === 'partial' ? 'secondary' : 'destructive'}>
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
                          }}>Pay</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aging Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aging Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agingData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-lg font-bold">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <TableRow key={bill._id}>
                      <TableCell>{new Date(bill.billDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{bill.billReference}</TableCell>
                      <TableCell className="text-right">₹{bill.paidAmount.toFixed(2)}</TableCell>
                      <TableCell>Bank Transfer</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
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
              <div>
                <Label>Bill Reference</Label>
                <Input value={formData.billReference} onChange={(e) => setFormData({...formData, billReference: e.target.value})} required />
              </div>
              <div>
                <Label>Bill Date</Label>
                <Input type="date" value={formData.billDate} onChange={(e) => setFormData({...formData, billDate: e.target.value})} required />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} required />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={formData.billAmount} onChange={(e) => setFormData({...formData, billAmount: Number(e.target.value)})} required />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={formData.recurring} onCheckedChange={(checked) => setFormData({...formData, recurring: checked as boolean})} />
                <Label>Recurring Bill</Label>
              </div>
            </div>
            <Button type="submit">Create Bill</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-gray-500">
        <p>Shortcuts: Ctrl+N (New), Ctrl+P (Print), Ctrl+F (Search), Ctrl+E (Export)</p>
      </div>
    </div>
  );
}
