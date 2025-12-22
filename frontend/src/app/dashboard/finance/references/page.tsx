'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, FileText, DollarSign, TrendingUp, RefreshCw, Plus, Edit, Trash2, Eye, Download, Filter, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import PaymentAgainstReference from '@/components/finance/PaymentAgainstReference';
import CreateReference from '@/components/finance/CreateReference';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Reference {
  _id: string;
  entryNumber: string;
  reference: string;
  date: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'OUTSTANDING' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  accountId: { _id: string; code: string; name: string };
  journalEntryId: { _id: string; entryNumber: string; reference: string };
  payments: Array<{
    paymentNumber: string;
    amount: number;
    date: string;
  }>;
}

export default function ReferenceManagement() {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [editForm, setEditForm] = useState({ totalAmount: 0, description: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/outstanding-references`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch references');
      const data = await response.json();
      setReferences(data.references || []);
    } catch (error) {
      console.error('Error fetching references:', error);
      toast({
        title: 'Error',
        description: 'Failed to load references',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ref: Reference) => {
    setSelectedRef(ref);
    setEditForm({ totalAmount: ref.totalAmount, description: ref.description });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedRef) return;
    try {
      setProcessing(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/reference/${selectedRef._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(editForm)
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast({ title: 'Success', description: data.message || 'Reference updated successfully' });
      setShowEditDialog(false);
      fetchReferences();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRef) return;
    
    try {
      setProcessing(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/reference/${selectedRef._id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast({ title: 'Success', description: data.message || 'Reference deleted successfully' });
      setShowDeleteDialog(false);
      setSelectedRef(null);
      fetchReferences();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleView = (ref: Reference) => {
    setSelectedRef(ref);
    setShowViewDialog(true);
  };

  const handleExport = () => {
    const csv = [
      ['Entry #', 'Reference', 'Date', 'Account', 'Description', 'Total', 'Paid', 'Outstanding', 'Status'],
      ...filteredReferences.map(ref => [
        ref.entryNumber,
        ref.reference,
        format(new Date(ref.date), 'dd/MM/yyyy'),
        `${ref.accountId.code} - ${ref.accountId.name}`,
        ref.description,
        ref.totalAmount,
        ref.paidAmount,
        ref.outstandingAmount,
        ref.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `references-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredReferences = references.filter((ref) => {
    const matchesSearch =
      ref.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.accountId.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: references.reduce((sum, ref) => sum + ref.totalAmount, 0),
    outstanding: references.reduce((sum, ref) => sum + ref.outstandingAmount, 0),
    paid: references.reduce((sum, ref) => sum + ref.paidAmount, 0),
    count: references.length,
    outstandingCount: references.filter(r => r.status === 'OUTSTANDING').length,
    partialCount: references.filter(r => r.status === 'PARTIALLY_PAID').length,
    paidCount: references.filter(r => r.status === 'FULLY_PAID').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OUTSTANDING': return 'destructive';
      case 'PARTIALLY_PAID': return 'default';
      case 'FULLY_PAID': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OUTSTANDING': return <AlertCircle className="w-4 h-4" />;
      case 'PARTIALLY_PAID': return <Clock className="w-4 h-4" />;
      case 'FULLY_PAID': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reference Management
          </h1>
          <p className="text-gray-600 mt-2">Track and manage outstanding journal entry references (Tally-style)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2">
            <Plus className="w-4 h-4" />
            Create Reference
          </Button>
          <Button onClick={fetchReferences} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-blue-600">{stats.count}</div>
              <div className="text-xs text-gray-500">
                <div>Outstanding: {stats.outstandingCount}</div>
                <div>Partial: {stats.partialCount}</div>
                <div>Paid: {stats.paidCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatAmount(stats.total)}</div>
            <div className="text-xs text-gray-500 mt-1">Across all references</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{formatAmount(stats.outstanding)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.outstanding > 0 ? `${((stats.outstanding / stats.total) * 100).toFixed(1)}% unpaid` : 'All settled'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{formatAmount(stats.paid)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.paid > 0 ? `${((stats.paid / stats.total) * 100).toFixed(1)}% collected` : 'No payments yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by reference, entry number, description, or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OUTSTANDING">Outstanding</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {filteredReferences.length} of {references.length} references</span>
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="h-6 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* References Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Outstanding References</span>
            <Badge variant="outline">{filteredReferences.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner className="w-12 h-12 mb-4" />
              <p className="text-gray-500">Loading references...</p>
            </div>
          ) : filteredReferences.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold text-gray-600 mb-2">No references found</p>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first reference to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Reference
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Entry #</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Account</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                    <TableHead className="text-right font-semibold">Paid</TableHead>
                    <TableHead className="text-right font-semibold">Outstanding</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferences.map((ref) => (
                    <TableRow key={ref._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium">{ref.entryNumber}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-blue-600">{ref.reference}</div>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(ref.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-mono font-semibold">{ref.accountId.code}</div>
                          <div className="text-gray-600 text-xs">{ref.accountId.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={ref.description}>
                          {ref.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatAmount(ref.totalAmount)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatAmount(ref.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatAmount(ref.outstandingAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ref.status)} className="gap-1">
                          {getStatusIcon(ref.status)}
                          {ref.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="ghost" onClick={() => handleView(ref)} title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {ref.status !== 'FULLY_PAID' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(ref)} title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setSelectedAccountId(ref.accountId._id);
                                  setSelectedRef(ref);
                                  setShowPaymentDialog(true);
                                }}
                                title="Pay"
                              >
                                Pay
                              </Button>
                            </>
                          )}
                          {ref.paidAmount === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRef(ref);
                                setShowDeleteDialog(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PaymentAgainstReference
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setSelectedRef(null);
        }}
        accountId={selectedAccountId}
        onSuccess={fetchReferences}
      />

      <CreateReference
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={fetchReferences}
      />

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reference</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Total Amount *</Label>
              <Input
                type="number"
                value={editForm.totalAmount}
                onChange={(e) => setEditForm({ ...editForm, totalAmount: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min={selectedRef?.paidAmount || 0}
              />
              {selectedRef && editForm.totalAmount < selectedRef.paidAmount && (
                <p className="text-xs text-red-600 mt-1">
                  Amount cannot be less than paid amount ({formatAmount(selectedRef.paidAmount)})
                </p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={processing || (selectedRef && editForm.totalAmount < selectedRef.paidAmount)}
            >
              {processing ? <><Spinner className="w-4 h-4 mr-2" />Updating...</> : 'Update Reference'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reference</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this reference?</p>
            {selectedRef && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-semibold">{selectedRef.reference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entry Number:</span>
                  <span className="font-mono">{selectedRef.entryNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatAmount(selectedRef.totalAmount)}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? <><Spinner className="w-4 h-4 mr-2" />Deleting...</> : 'Delete Reference'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reference Details</DialogTitle>
          </DialogHeader>
          {selectedRef && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-600 text-xs">Entry Number</Label>
                  <p className="font-mono font-semibold text-lg">{selectedRef.entryNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-600 text-xs">Reference</Label>
                  <p className="font-semibold text-lg text-blue-600">{selectedRef.reference}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-600 text-xs">Date</Label>
                  <p className="font-medium">{format(new Date(selectedRef.date), 'dd MMMM yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-600 text-xs">Status</Label>
                  <Badge variant={getStatusColor(selectedRef.status)} className="gap-1">
                    {getStatusIcon(selectedRef.status)}
                    {selectedRef.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-600 text-xs">Account</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-mono font-semibold">{selectedRef.accountId.code}</p>
                  <p className="text-sm text-gray-600">{selectedRef.accountId.name}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-600 text-xs">Description</Label>
                <p className="p-3 bg-gray-50 rounded-lg">{selectedRef.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-blue-600 text-xs">Total Amount</Label>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatAmount(selectedRef.totalAmount)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <Label className="text-green-600 text-xs">Paid Amount</Label>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatAmount(selectedRef.paidAmount)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <Label className="text-red-600 text-xs">Outstanding</Label>
                  <p className="text-2xl font-bold text-red-600 mt-1">{formatAmount(selectedRef.outstandingAmount)}</p>
                </div>
              </div>

              {selectedRef.payments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-600 text-xs">Payment History ({selectedRef.payments.length})</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Payment #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRef.payments.map((payment, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono font-semibold">{payment.paymentNumber}</TableCell>
                            <TableCell>{format(new Date(payment.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {formatAmount(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
