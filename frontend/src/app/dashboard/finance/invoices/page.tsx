'use client';

import React, { useState, useEffect } from 'react';import { SectionLoader } from '@/components/PageLoader';import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, CreditCard, Receipt, RefreshCw, BarChart3, Search, Download, Filter, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Import new components
import AdvancedFilters from './components/AdvancedFilters';
import FinanceAnalyticsDashboard from './components/FinanceAnalyticsDashboard';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import FinanceRecordActions from './components/FinanceRecordActions';
import EmptyState from './components/EmptyState';
import InvoiceForm from './components/InvoiceForm';
import PaymentForm from './components/PaymentForm';

interface FinanceRecord {
  _id: string;
  type: 'payment' | 'invoice';
  partyName: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentNumber?: string;
  invoiceNumber?: string;
  paymentDate?: string;
  invoiceDate?: string;
  createdAt: string;
}

export default function EnhancedFinancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'invoices' | 'payments' | 'receipts'>('all');
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<any>({});
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchAnalytics();
  }, [activeTab, page, filters, searchTerm, statusFilter, sortBy]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/finance/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set empty analytics if fetch fails
      setAnalyticsData({
        revenueData: [],
        statusBreakdown: [],
        paymentMethods: [],
        metrics: {
          totalRevenue: 0,
          totalInvoices: 0,
          totalPayments: 0,
          overdueAmount: 0,
          overdueCount: 0,
          avgPaymentTime: 0,
        },
      });
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'invoices' ? 'invoice' : activeTab === 'payments' ? 'payment' : '';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(type && { type }),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(filters.dateRange?.from && { startDate: filters.dateRange.from.toISOString() }),
        ...(filters.dateRange?.to && { endDate: filters.dateRange.to.toISOString() }),
        ...(filters.amountRange?.min > 0 && { minAmount: filters.amountRange.min.toString() }),
        ...(filters.amountRange?.max < 1000000 && { maxAmount: filters.amountRange.max.toString() }),
        ...(filters.statuses?.length > 0 && { statuses: filters.statuses.join(',') }),
      });

      const response = await fetch(`/api/finance?${params}`);
      const data = await response.json();

      if (data.success) {
        let sortedRecords = data.data || [];
        if (sortBy === 'amount') {
          sortedRecords = sortedRecords.sort((a: any, b: any) => b.totalAmount - a.totalAmount);
        } else if (sortBy === 'party') {
          sortedRecords = sortedRecords.sort((a: any, b: any) => a.partyName.localeCompare(b.partyName));
        }
        setRecords(sortedRecords);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map(r => r._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedRecords.size} records?`)) {
      // API call to bulk delete
      console.log('Bulk delete:', Array.from(selectedRecords));
      setSelectedRecords(new Set());
      fetchRecords();
    }
  };

  const handleBulkApprove = async () => {
    // API call to bulk approve
    console.log('Bulk approve:', Array.from(selectedRecords));
    setSelectedRecords(new Set());
    fetchRecords();
  };

  const handleBulkSend = async () => {
    // API call to bulk send emails
    console.log('Bulk send:', Array.from(selectedRecords));
    setSelectedRecords(new Set());
  };

  const handleRecordPayment = (invoiceId: string) => {
    setSelectedInvoiceForPayment(invoiceId);
    setShowPaymentForm(true);
  };

  const handleViewLedger = async (recordId: string, recordType: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint = recordType === 'invoice' ? 'invoices' : 'payments';
      const response = await fetch(`${API_URL}/api/finance/${endpoint}/${recordId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const accountId = data.data?.accountId || data.data?.account?._id;
        if (accountId) {
          router.push(`/dashboard/finance/account-ledger/${accountId}?highlight=${recordId}`);
        } else {
          router.push(`/dashboard/finance/account-ledger`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch record:', error);
      router.push(`/dashboard/finance/account-ledger`);
    }
  };

  const handleApprove = async (recordId: string, recordType: string) => {
    if (!confirm('Approve this record?')) return;
    try {
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint = recordType === 'invoice' ? 'invoices' : 'payments';
      const response = await fetch(`${API_URL}/api/finance/${endpoint}/${recordId}/approve`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        alert('Record approved successfully');
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve record');
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    if (!confirm('Mark this invoice as paid?')) return;
    try {
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/finance/invoices/${invoiceId}/mark-paid`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        alert('Invoice marked as paid');
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to mark as paid');
      }
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      alert('Failed to mark invoice as paid');
    }
  };

  const handleSendEmail = async (recordId: string, recordType: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint = recordType === 'invoice' ? 'invoices' : 'payments';
      const response = await fetch(`${API_URL}/api/finance/${endpoint}/${recordId}/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        alert('Email sent successfully');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email');
    }
  };

  const handleDelete = async (recordId: string, recordType: string) => {
    if (!confirm('Delete this record? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint = recordType === 'invoice' ? 'invoices' : 'payments';
      const response = await fetch(`${API_URL}/api/finance/${endpoint}/${recordId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        alert('Record deleted successfully');
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete record');
    }
  };

  const handleInvoiceSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/finance/invoices`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowInvoiceForm(false);
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth-token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/finance/payments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowPaymentForm(false);
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-500',
      PENDING_APPROVAL: 'bg-yellow-500',
      APPROVED: 'bg-green-500',
      SENT: 'bg-blue-500',
      PAID: 'bg-green-600',
      PARTIALLY_PAID: 'bg-orange-500',
      OVERDUE: 'bg-red-500',
      CANCELLED: 'bg-gray-600',
      COMPLETED: 'bg-green-700',
    };
    return colors[status] || 'bg-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment and Invoice</h1>
          <p className="text-muted-foreground">Unified invoices, payments, and receipts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/finance/invoices/analytics')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button variant="outline" onClick={() => fetchRecords()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowInvoiceForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
          <Button onClick={() => setShowPaymentForm(true)} variant="default">
            <CreditCard className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(analyticsData?.metrics?.totalRevenue || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invoices</CardDescription>
            <CardTitle className="text-2xl">{analyticsData?.metrics?.totalInvoices || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{formatCurrency(analyticsData?.metrics?.overdueAmount || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Payment Time</CardDescription>
            <CardTitle className="text-2xl">{analyticsData?.metrics?.avgPaymentTime || 0} days</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by party name, invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="party">Party Name</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSortBy('date'); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilters onFilterChange={setFilters} customers={[]} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Finance Records</CardTitle>
          <CardDescription>View and manage all financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="invoices">
                <FileText className="mr-2 h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="receipts">
                <Receipt className="mr-2 h-4 w-4" />
                Receipts
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <SectionLoader text="Loading invoices..." />
              ) : records.length === 0 ? (
                <EmptyState type={activeTab} onCreateNew={() => setShowInvoiceForm(true)} />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRecords.size === records.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRecords.has(record._id)}
                              onCheckedChange={() => toggleSelectRecord(record._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.type === 'invoice' ? <FileText className="mr-1 h-3 w-3" /> : <CreditCard className="mr-1 h-3 w-3" />}
                              {record.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.invoiceNumber || record.paymentNumber}
                          </TableCell>
                          <TableCell>{record.partyName}</TableCell>
                          <TableCell>
                            {formatDate(record.invoiceDate || record.paymentDate || record.createdAt)}
                          </TableCell>
                          <TableCell>{formatCurrency(record.totalAmount, record.currency)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <FinanceRecordActions
                              recordId={record._id}
                              recordType={record.type}
                              status={record.status}
                              onView={() => router.push(`/dashboard/finance/invoices/${record._id}`)}
                              onDownloadPDF={() => window.open(`/api/finance/${record.type === 'invoice' ? 'invoices' : 'payments'}/${record._id}/pdf`, '_blank')}
                              onSendEmail={() => handleSendEmail(record._id, record.type)}
                              onDuplicate={() => console.log('Duplicate', record._id)}
                              onMarkPaid={record.type === 'invoice' ? () => handleMarkPaid(record._id) : undefined}
                              onRecordPayment={record.type === 'invoice' ? () => handleRecordPayment(record._id) : undefined}
                              onViewLedger={() => handleViewLedger(record._id, record.type)}
                              onApprove={() => handleApprove(record._id, record.type)}
                              onEdit={() => router.push(`/dashboard/finance/invoices/${record._id}/edit`)}
                              onDelete={() => handleDelete(record._id, record.type)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {records.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, total)} of {total} records
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-3 text-sm">Page {page}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page * 20 >= total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedRecords.size}
        onBulkDelete={handleBulkDelete}
        onBulkApprove={handleBulkApprove}
        onBulkSend={handleBulkSend}
        onClearSelection={() => setSelectedRecords(new Set())}
      />

      {/* Invoice Form Dialog */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSubmit={handleInvoiceSubmit}
            onCancel={() => setShowInvoiceForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm
            onSubmit={handlePaymentSubmit}
            onCancel={() => setShowPaymentForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}