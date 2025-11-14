'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FileText, Eye, CheckCircle, XCircle, Search, Filter, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('payment');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    narration: '',
    partyName: '',
    paymentMode: 'cash',
    chequeNumber: '',
    chequeDate: '',
    invoiceNumber: '',
    invoiceDate: ''
  });
  const [lines, setLines] = useState([{ accountId: '', debit: 0, credit: 0, description: '' }]);
  const { toast } = useToast();

  useEffect(() => {
    fetchVouchers();
    fetchAccounts();
    fetchStats();
  }, [filterType, filterStatus, searchTerm]);

  const fetchVouchers = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('voucherType', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`${API_URL}/api/vouchers?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setVouchers(data.data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/vouchers/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setStats(data.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({ title: 'Error', description: 'Debits must equal credits', variant: 'destructive' });
      return;
    }

    try {
      const payload: any = {
        voucherType: selectedType,
        date: formData.date,
        reference: formData.reference,
        narration: formData.narration,
        lines: lines.filter(l => l.accountId)
      };

      if (['payment', 'receipt'].includes(selectedType)) {
        payload.partyName = formData.partyName;
        payload.paymentMode = formData.paymentMode;
        if (formData.paymentMode === 'cheque') {
          payload.chequeNumber = formData.chequeNumber;
          payload.chequeDate = formData.chequeDate;
        }
      }

      if (['sales', 'purchase', 'debit_note', 'credit_note'].includes(selectedType)) {
        payload.invoiceNumber = formData.invoiceNumber;
        payload.invoiceDate = formData.invoiceDate;
      }

      const res = await fetch(`${API_URL}/api/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Success', description: 'Voucher created successfully' });
        setShowCreateDialog(false);
        resetForm();
        fetchVouchers();
        fetchStats();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to create voucher', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create voucher', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      narration: '',
      partyName: '',
      paymentMode: 'cash',
      chequeNumber: '',
      chequeDate: '',
      invoiceNumber: '',
      invoiceDate: ''
    });
    setLines([{ accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handlePostVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to post this voucher? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_URL}/api/vouchers/${id}/post`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Voucher posted successfully' });
        fetchVouchers();
        fetchStats();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post voucher', variant: 'destructive' });
    }
  };

  const handleCancelVoucher = async (id: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      const res = await fetch(`${API_URL}/api/vouchers/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Voucher cancelled successfully' });
        fetchVouchers();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel voucher', variant: 'destructive' });
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      const res = await fetch(`${API_URL}/api/vouchers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Voucher deleted successfully' });
        fetchVouchers();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete voucher', variant: 'destructive' });
    }
  };

  const viewVoucher = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/vouchers/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSelectedVoucher(data.data);
      setShowViewDialog(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch voucher details', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      draft: 'secondary',
      posted: 'default',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const voucherTypes = [
    { value: 'payment', label: 'Payment', color: 'bg-red-500' },
    { value: 'receipt', label: 'Receipt', color: 'bg-green-500' },
    { value: 'contra', label: 'Contra', color: 'bg-blue-500' },
    { value: 'sales', label: 'Sales', color: 'bg-purple-500' },
    { value: 'purchase', label: 'Purchase', color: 'bg-orange-500' },
    { value: 'journal', label: 'Journal', color: 'bg-gray-500' },
    { value: 'debit_note', label: 'Debit Note', color: 'bg-pink-500' },
    { value: 'credit_note', label: 'Credit Note', color: 'bg-cyan-500' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voucher Management</h1>
          <p className="text-gray-600 mt-1">Complete voucher system for all transaction types</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {voucherTypes.map(type => {
          const stat = stats[type.value] || { count: 0, totalAmount: 0, posted: 0 };
          return (
            <Card key={type.value} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterType(type.value)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  <Badge variant="outline">{stat.count}</Badge>
                </div>
                <h3 className="font-semibold text-sm">{type.label}</h3>
                <p className="text-2xl font-bold mt-1">₹{(stat.totalAmount || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.posted} posted</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Vouchers</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {voucherTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No vouchers found
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map(v => (
                  <TableRow key={v._id}>
                    <TableCell className="font-medium">{v.voucherNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{v.voucherType.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{new Date(v.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{v.partyName || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{v.narration}</TableCell>
                    <TableCell className="text-right font-semibold">₹{v.totalAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{getStatusBadge(v.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => viewVoucher(v._id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {v.status === 'draft' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handlePostVoucher(v._id)}>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteVoucher(v._id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {v.status === 'posted' && (
                          <Button size="sm" variant="ghost" onClick={() => handleCancelVoucher(v._id)}>
                            <XCircle className="w-4 h-4 text-orange-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>



      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Voucher</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVoucher} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Voucher Type *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voucherTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required 
                />
              </div>
              <div>
                <Label>Reference</Label>
                <Input 
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  placeholder="Ref number"
                />
              </div>
            </div>

            {['payment', 'receipt'].includes(selectedType) && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Party Name</Label>
                  <Input 
                    value={formData.partyName}
                    onChange={(e) => setFormData({...formData, partyName: e.target.value})}
                    placeholder="Vendor/Customer name"
                  />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={formData.paymentMode} onValueChange={(v) => setFormData({...formData, paymentMode: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.paymentMode === 'cheque' && (
                  <>
                    <div>
                      <Label>Cheque Number</Label>
                      <Input 
                        value={formData.chequeNumber}
                        onChange={(e) => setFormData({...formData, chequeNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Cheque Date</Label>
                      <Input 
                        type="date"
                        value={formData.chequeDate}
                        onChange={(e) => setFormData({...formData, chequeDate: e.target.value})}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {['sales', 'purchase', 'debit_note', 'credit_note'].includes(selectedType) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Invoice Number</Label>
                  <Input 
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input 
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Narration *</Label>
              <Textarea 
                value={formData.narration}
                onChange={(e) => setFormData({...formData, narration: e.target.value})}
                placeholder="Enter transaction description"
                required
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Transaction Lines *</Label>
                <Button type="button" size="sm" onClick={addLine}>
                  <Plus className="w-4 h-4 mr-1" /> Add Line
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 bg-gray-100 p-2 text-sm font-semibold">
                  <div className="col-span-5">Account</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-1"></div>
                </div>
                
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-2 border-t items-center hover:bg-gray-50">
                    <div className="col-span-5">
                      <Select value={line.accountId} onValueChange={(v) => updateLine(idx, 'accountId', v)}>
                        <SelectTrigger className="h-9">
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
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                        className="h-9 text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                        className="h-9 text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Note"
                        value={line.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {lines.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(idx)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="grid grid-cols-12 gap-2 bg-gray-50 p-2 border-t font-semibold">
                  <div className="col-span-5 text-right">Total:</div>
                  <div className="col-span-2 text-right">
                    ₹{lines.reduce((sum, l) => sum + (l.debit || 0), 0).toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right">
                    ₹{lines.reduce((sum, l) => sum + (l.credit || 0), 0).toFixed(2)}
                  </div>
                  <div className="col-span-3"></div>
                </div>
              </div>
              
              {Math.abs(lines.reduce((sum, l) => sum + (l.debit || 0), 0) - lines.reduce((sum, l) => sum + (l.credit || 0), 0)) > 0.01 && (
                <p className="text-sm text-red-600">⚠ Debits and credits must be equal</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" size="lg">Create Voucher</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Voucher Details</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Voucher Number</p>
                  <p className="font-semibold">{selectedVoucher.voucherNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold capitalize">{selectedVoucher.voucherType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(selectedVoucher.date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedVoucher.status)}
                </div>
                {selectedVoucher.partyName && (
                  <div>
                    <p className="text-sm text-gray-600">Party</p>
                    <p className="font-semibold">{selectedVoucher.partyName}</p>
                  </div>
                )}
                {selectedVoucher.reference && (
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-semibold">{selectedVoucher.reference}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Narration</p>
                <p className="p-3 bg-gray-50 rounded">{selectedVoucher.narration}</p>
              </div>

              <div>
                <p className="font-semibold mb-2">Transaction Lines</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedVoucher.lines.map((line: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {line.accountId?.code} - {line.accountId?.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-gray-50">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        ₹{selectedVoucher.lines.reduce((sum: number, l: any) => sum + l.debit, 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{selectedVoucher.lines.reduce((sum: number, l: any) => sum + l.credit, 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Created by {selectedVoucher.createdBy?.name} on {new Date(selectedVoucher.createdAt).toLocaleString('en-IN')}
                </div>
                <div className="flex gap-2">
                  {selectedVoucher.status === 'draft' && (
                    <Button onClick={() => { handlePostVoucher(selectedVoucher._id); setShowViewDialog(false); }}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Post Voucher
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
