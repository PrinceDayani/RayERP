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
import { Plus, Trash2, FileText, Eye, CheckCircle, XCircle, Search, Filter, Download, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { AccountSelector } from '@/components/finance/AccountSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('payment');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
  }, [filterType, filterStatus, searchTerm, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchStats();
  }, [vouchers]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('page', page.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      const entries = data.journalEntries || data.data || [];
      
      // Map journal entries to voucher format
      let mappedVouchers = entries.map((entry: any) => ({
        _id: entry._id,
        voucherNumber: entry.entryNumber,
        voucherType: 'journal',
        date: entry.entryDate || entry.date,
        partyName: entry.reference || '',
        narration: entry.description,
        totalAmount: entry.totalDebit || 0,
        status: entry.isPosted ? 'posted' : 'draft',
        createdAt: entry.createdAt,
        lines: entry.lines
      }));
      
      // Client-side filtering
      if (filterType !== 'all') {
        mappedVouchers = mappedVouchers.filter((v: any) => v.voucherType === filterType);
      }
      if (filterStatus !== 'all') {
        mappedVouchers = mappedVouchers.filter((v: any) => v.status === filterStatus);
      }
      
      setVouchers(mappedVouchers);
      setTotalPages(data.pagination?.pages || Math.ceil(mappedVouchers.length / 20));
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({ title: 'Error', description: 'Failed to load vouchers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from vouchers data
      const statsData: any = {};
      voucherTypes.forEach(type => {
        const filtered = vouchers.filter(v => v.voucherType === type.value);
        statsData[type.value] = {
          count: filtered.length,
          totalAmount: filtered.reduce((sum, v) => sum + (v.totalAmount || 0), 0),
          posted: filtered.filter(v => v.status === 'posted').length
        };
      });
      setStats(statsData);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handleCreateVoucher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;
    
    // Validate date
    if (!formData.date) {
      toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
      return;
    }

    // Validate lines
    const validLines = lines.filter(l => l.accountId && (parseFloat(String(l.debit)) > 0 || parseFloat(String(l.credit)) > 0));
    console.log('Valid lines:', validLines);
    
    if (validLines.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one valid transaction line', variant: 'destructive' });
      return;
    }

    const totalDebit = validLines.reduce((sum, l) => sum + (parseFloat(String(l.debit)) || 0), 0);
    const totalCredit = validLines.reduce((sum, l) => sum + (parseFloat(String(l.credit)) || 0), 0);
    console.log('Totals:', { totalDebit, totalCredit });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({ title: 'Error', description: `Debits (₹${totalDebit.toFixed(2)}) must equal credits (₹${totalCredit.toFixed(2)})`, variant: 'destructive' });
      return;
    }

    if (!formData.narration.trim()) {
      toast({ title: 'Error', description: 'Please enter narration', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        voucherType: selectedType,
        date: formData.date,
        reference: formData.reference,
        narration: formData.narration,
        lines: validLines.map(l => ({
          accountId: l.accountId,
          debit: parseFloat(String(l.debit)) || 0,
          credit: parseFloat(String(l.credit)) || 0,
          description: l.description || ''
        }))
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

      // Convert to journal entry format
      const journalPayload = {
        date: payload.date,
        reference: payload.reference || `${selectedType.toUpperCase()}-${Date.now()}`,
        description: payload.narration,
        lines: payload.lines
      };

      console.log('Sending journal entry payload:', journalPayload);
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(journalPayload)
      });

      const data = await res.json();
      console.log('Response:', { status: res.status, data });
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (res.ok) {
        toast({ title: 'Success', description: 'Voucher created successfully' });
        setShowCreateDialog(false);
        resetForm();
        fetchVouchers();
        fetchStats();
      } else {
        console.error('Server error response:', data);
        const errorMsg = data.message || data.error || JSON.stringify(data) || 'Failed to create voucher';
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
    if (field === 'debit' || field === 'credit') {
      const numValue = parseFloat(value) || 0;
      updated[index] = { ...updated[index], [field]: numValue };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLines(updated);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handlePostVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to post this voucher? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries/${id}/post`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
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
    if (!confirm('Cancel this voucher? This will reverse the entry.')) return;

    try {
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Voucher cancelled successfully' });
        fetchVouchers();
        fetchStats();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel voucher', variant: 'destructive' });
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
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

  const handleBulkPost = async () => {
    if (selectedVouchers.length === 0) return;
    if (!confirm(`Post ${selectedVouchers.length} vouchers? This cannot be undone.`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedVouchers.map(id => 
        fetch(`${API_URL}/api/general-ledger/journal-entries/${id}/post`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
        })
      ));
      toast({ title: 'Success', description: `${selectedVouchers.length} vouchers posted` });
      setSelectedVouchers([]);
      fetchVouchers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post vouchers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVouchers.length === 0) return;
    if (!confirm(`Delete ${selectedVouchers.length} vouchers? This cannot be undone.`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedVouchers.map(id => 
        fetch(`${API_URL}/api/general-ledger/journal-entries/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
        })
      ));
      toast({ title: 'Success', description: `${selectedVouchers.length} vouchers deleted` });
      setSelectedVouchers([]);
      fetchVouchers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete vouchers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const csv = [
      ['Voucher No', 'Type', 'Date', 'Party', 'Narration', 'Amount', 'Status'],
      ...vouchers.map(v => [
        v.voucherNumber,
        v.voucherType,
        new Date(v.date).toLocaleDateString('en-IN'),
        v.partyName || '-',
        v.narration,
        v.totalAmount,
        v.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      const vouchersToExport = vouchers;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: 'Error', description: 'Please allow popups', variant: 'destructive' });
        return;
      }

      const totalDebit = vouchersToExport.reduce((sum, v) => sum + v.totalAmount, 0);
      const postedCount = vouchersToExport.filter(v => v.status === 'posted').length;
      const draftCount = vouchersToExport.filter(v => v.status === 'draft').length;

      const html = `<!DOCTYPE html>
<html><head><title>Vouchers Report - RayERP</title><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 30px; background: white; color: #000; }
.header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
.company { font-size: 24px; font-weight: bold; }
.title { font-size: 18px; margin-top: 5px; }
.meta { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: #f5f5f5; }
.meta-item { font-size: 12px; }
.meta-label { font-weight: bold; }
.summary { display: flex; gap: 15px; margin: 20px 0; }
.summary-card { flex: 1; padding: 12px; border: 1px solid #ddd; text-align: center; }
.summary-label { font-size: 10px; color: #666; text-transform: uppercase; }
.summary-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #333; color: white; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
.amount { text-align: right; font-family: monospace; }
.status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; }
.status-posted { background: #d4edda; color: #155724; }
.status-draft { background: #fff3cd; color: #856404; }
.footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
.signatures { display: flex; justify-content: space-around; margin-top: 50px; }
.sig-box { text-align: center; padding-top: 30px; border-top: 1px solid #000; width: 150px; }
.sig-label { font-size: 11px; margin-top: 5px; }
@media print { body { padding: 15px; } @page { margin: 15mm; size: A4; } }
</style></head><body>
<div class="header">
  <div class="company">RayERP</div>
  <div class="title">Vouchers Report</div>
</div>
<div class="meta">
  <div><span class="meta-label">Date:</span> ${new Date().toLocaleDateString('en-IN')}</div>
  <div><span class="meta-label">Time:</span> ${new Date().toLocaleTimeString('en-IN')}</div>
  ${dateFrom || dateTo ? `<div><span class="meta-label">Period:</span> ${dateFrom || 'Start'} to ${dateTo || 'End'}</div>` : ''}
</div>
<div class="summary">
  <div class="summary-card"><div class="summary-label">Total</div><div class="summary-value">${vouchersToExport.length}</div></div>
  <div class="summary-card"><div class="summary-label">Posted</div><div class="summary-value">${postedCount}</div></div>
  <div class="summary-card"><div class="summary-label">Draft</div><div class="summary-value">${draftCount}</div></div>
  <div class="summary-card"><div class="summary-label">Amount</div><div class="summary-value">₹${totalDebit.toLocaleString('en-IN')}</div></div>
</div>
<table>
  <thead><tr>
    <th>Voucher No.</th><th>Date</th><th>Reference</th><th>Narration</th><th class="amount">Amount (₹)</th><th>Status</th>
  </tr></thead>
  <tbody>
    ${vouchersToExport.map(v => `<tr>
      <td>${v.voucherNumber}</td>
      <td>${new Date(v.date).toLocaleDateString('en-IN')}</td>
      <td>${v.partyName || '-'}</td>
      <td>${v.narration}</td>
      <td class="amount">${v.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td><span class="status status-${v.status}">${v.status.toUpperCase()}</span></td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="signatures">
  <div class="sig-box"><div class="sig-label">Prepared By</div></div>
  <div class="sig-box"><div class="sig-label">Reviewed By</div></div>
  <div class="sig-box"><div class="sig-label">Approved By</div></div>
</div>
<div class="footer">
  <p><strong>RayERP</strong> - Enterprise Resource Planning System</p>
  <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedVouchers.length === vouchers.length) {
      setSelectedVouchers([]);
    } else {
      setSelectedVouchers(vouchers.map(v => v._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedVouchers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const viewVoucher = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      const voucher = {
        _id: data._id,
        voucherNumber: data.entryNumber,
        voucherType: 'journal',
        date: data.entryDate || data.date,
        reference: data.reference,
        narration: data.description,
        status: data.isPosted ? 'posted' : 'draft',
        lines: data.lines,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt
      };
      setSelectedVoucher(voucher);
      setShowViewDialog(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch voucher details', variant: 'destructive' });
    }
  };

  const viewAuditTrail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/general-ledger/journal-entries/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      
      // Build audit log from journal entry data
      const logs = [];
      
      // Created event
      logs.push({
        action: 'Created',
        user: data.createdBy?.firstName || data.createdBy?.name || 'System',
        timestamp: data.createdAt,
        details: `Voucher ${data.entryNumber} created`
      });
      
      // Updated event
      if (data.updatedAt && data.updatedAt !== data.createdAt) {
        logs.push({
          action: 'Updated',
          user: data.updatedBy?.firstName || data.updatedBy?.name || 'System',
          timestamp: data.updatedAt,
          details: 'Voucher details modified'
        });
      }
      
      // Posted event
      if (data.isPosted) {
        logs.push({
          action: 'Posted',
          user: data.postedBy?.firstName || data.postedBy?.name || 'System',
          timestamp: data.postingDate || data.updatedAt,
          details: 'Voucher posted to ledger'
        });
      }
      
      // Change history from model
      if (data.changeHistory && data.changeHistory.length > 0) {
        data.changeHistory.forEach((change: any) => {
          logs.push({
            action: 'Modified',
            user: change.changedBy?.firstName || change.changedBy?.name || 'System',
            timestamp: change.changedAt,
            details: `${change.field}: ${change.oldValue} → ${change.newValue}`
          });
        });
      }
      
      setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setShowAuditDialog(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch audit trail', variant: 'destructive' });
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground mt-1">Complete voucher system for all transaction types</p>
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
                <p className="text-xs text-muted-foreground mt-1">{stat.posted} posted</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Vouchers</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vouchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="w-36"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="w-36"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {voucherTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
              {selectedVouchers.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleBulkPost}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Post ({selectedVouchers.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete ({selectedVouchers.length})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedVouchers.length === vouchers.length && vouchers.length > 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading vouchers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No vouchers found
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map(v => (
                  <TableRow key={v._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedVouchers.includes(v._id)}
                        onChange={() => toggleSelect(v._id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
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
                        <Button size="sm" variant="ghost" onClick={() => viewVoucher(v._id)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => viewAuditTrail(v._id)} title="Audit Trail">
                          <History className="w-4 h-4" />
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
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
                <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2 text-sm font-semibold">
                  <div className="col-span-5">Account</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                  <div className="col-span-2">Description</div>
                  <div className="col-span-1"></div>
                </div>
                
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-2 border-t border-border items-center hover:bg-muted/20">
                    <div className="col-span-5">
                      <AccountSelector
                        value={line.accountId}
                        onValueChange={(v) => updateLine(idx, 'accountId', v)}
                        accounts={accounts}
                        onAccountCreated={fetchAccounts}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(idx, 'debit', e.target.value)}
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
                        onChange={(e) => updateLine(idx, 'credit', e.target.value)}
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
                
                <div className="grid grid-cols-12 gap-2 bg-muted/30 p-2 border-t border-border font-semibold">
                  <div className="col-span-5 text-right">Total:</div>
                  <div className="col-span-2 text-right">
                    ₹{lines.reduce((sum, l) => sum + (parseFloat(String(l.debit)) || 0), 0).toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right">
                    ₹{lines.reduce((sum, l) => sum + (parseFloat(String(l.credit)) || 0), 0).toFixed(2)}
                  </div>
                  <div className="col-span-3"></div>
                </div>
              </div>
              
              {Math.abs(lines.reduce((sum, l) => sum + (parseFloat(String(l.debit)) || 0), 0) - lines.reduce((sum, l) => sum + (parseFloat(String(l.credit)) || 0), 0)) > 0.01 && (
                <p className="text-sm text-destructive">⚠ Debits and credits must be equal</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                size="lg" 
                onClick={() => handleCreateVoucher()}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Voucher'
                )}
              </Button>
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
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Voucher Number</p>
                  <p className="font-semibold">{selectedVoucher.voucherNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{selectedVoucher.voucherType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(selectedVoucher.date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedVoucher.status)}
                </div>
                {selectedVoucher.partyName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Party</p>
                    <p className="font-semibold">{selectedVoucher.partyName}</p>
                  </div>
                )}
                {selectedVoucher.reference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-semibold">{selectedVoucher.reference}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Narration</p>
                <p className="p-3 bg-muted/30 rounded">{selectedVoucher.narration}</p>
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
                    <TableRow className="font-semibold bg-muted/30">
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
                <div className="text-sm text-muted-foreground">
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

      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Trail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit logs available</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <History className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{log.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">By: {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAuditDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
