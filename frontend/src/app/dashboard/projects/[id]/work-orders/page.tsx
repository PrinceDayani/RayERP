'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { workOrderApi } from '@/lib/api/workOrderAPI';
import { filterContacts, Contact } from '@/lib/api/contactsAPI';
import { IWorkOrder, IWorkOrderAnalytics, WorkOrderStatus } from '@/types/workOrder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';
import {
  Plus, DollarSign, CheckCircle, AlertCircle, FileText,
  Send, ThumbsUp, ThumbsDown, CreditCard, Play, Check, X
} from 'lucide-react';

const statusColors: Record<WorkOrderStatus, string> = {
  'draft': 'bg-gray-100 text-gray-800',
  'pending-approval': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-blue-100 text-blue-800',
  'issued': 'bg-indigo-100 text-indigo-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  'completed': 'bg-green-100 text-green-800',
  'closed': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export default function ProjectWorkOrdersPage() {
  const routeParams = useParams();
  const projectId = routeParams.id as string;
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { formatAmount } = useGlobalCurrency();

  const [workOrders, setWorkOrders] = useState<IWorkOrder[]>([]);
  const [analytics, setAnalytics] = useState<IWorkOrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedWO, setSelectedWO] = useState<IWorkOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [vendors, setVendors] = useState<Contact[]>([]);
  const [createForm, setCreateForm] = useState({
    title: '', subcontractorId: '', totalAmount: '', retentionPercentage: '0',
    currency: 'INR', startDate: '', endDate: '', paymentTerms: '', notes: '', description: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '', paymentDate: '', paymentReference: '', paymentMethod: 'bank-transfer' as const, notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams: any = {};
      if (statusFilter !== 'all') filterParams.status = statusFilter;
      const [woRes, analyticsRes] = await Promise.all([
        workOrderApi.getByProject(projectId, filterParams),
        workOrderApi.getAnalytics(projectId)
      ]);
      setWorkOrders(woRes.workOrders);
      setAnalytics(analyticsRes.analytics);
    } catch {
      toastRef.current({ title: 'Error', description: 'Failed to load work orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!showCreateDialog) return;
    filterContacts({ contactType: 'vendor', status: 'active', limit: 100 })
      .then(res => setVendors(res.contacts))
      .catch(() => setVendors([]));
  }, [showCreateDialog]);

  const handleCreate = async () => {
    try {
      await workOrderApi.create({
        projectId,
        subcontractorId: createForm.subcontractorId,
        title: createForm.title,
        description: createForm.description || undefined,
        totalAmount: Number(createForm.totalAmount),
        retentionPercentage: Number(createForm.retentionPercentage),
        currency: createForm.currency,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
        paymentTerms: createForm.paymentTerms || undefined,
        notes: createForm.notes || undefined
      });
      toast({ title: 'Success', description: 'Work order created' });
      setShowCreateDialog(false);
      setCreateForm({ title: '', subcontractorId: '', totalAmount: '', retentionPercentage: '0', currency: 'INR', startDate: '', endDate: '', paymentTerms: '', notes: '', description: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create', variant: 'destructive' });
    }
  };

  const handleAction = async (id: string, action: 'submit' | 'approve' | 'issue' | 'in-progress' | 'completed' | 'closed') => {
    try {
      if (action === 'submit') await workOrderApi.submitForApproval(id);
      else if (action === 'approve') await workOrderApi.approve(id);
      else if (action === 'issue') await workOrderApi.issue(id);
      else await workOrderApi.updateStatus(id, action);
      toast({ title: 'Success', description: `Work order ${action} successful` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Action failed', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!selectedWO) return;
    try {
      await workOrderApi.reject(selectedWO._id, { rejectionReason: rejectionReason || 'Rejected' });
      toast({ title: 'Success', description: 'Work order rejected' });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedWO(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Reject failed', variant: 'destructive' });
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedWO) return;
    try {
      await workOrderApi.recordPayment(selectedWO._id, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate || undefined,
        paymentReference: paymentForm.paymentReference || undefined,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes || undefined
      });
      toast({ title: 'Success', description: 'Payment recorded' });
      closePaymentDialog();
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to record payment', variant: 'destructive' });
    }
  };

  const closePaymentDialog = () => {
    setShowPaymentDialog(false);
    setPaymentForm({ amount: '', paymentDate: '', paymentReference: '', paymentMethod: 'bank-transfer', notes: '' });
    setSelectedWO(null);
  };

  const renderActions = (wo: IWorkOrder) => {
    const actions = [];
    if (wo.status === 'draft') actions.push(
      <Button key="submit" size="sm" variant="outline" onClick={() => handleAction(wo._id, 'submit')}><Send className="h-3 w-3 mr-1" />Submit</Button>
    );
    if (wo.status === 'pending-approval') {
      actions.push(<Button key="approve" size="sm" variant="outline" className="text-green-600" onClick={() => handleAction(wo._id, 'approve')}><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button>);
      actions.push(<Button key="reject" size="sm" variant="outline" className="text-red-600" onClick={() => { setSelectedWO(wo); setShowRejectDialog(true); }}><ThumbsDown className="h-3 w-3 mr-1" />Reject</Button>);
    }
    if (wo.status === 'approved') actions.push(
      <Button key="issue" size="sm" variant="outline" onClick={() => handleAction(wo._id, 'issue')}><FileText className="h-3 w-3 mr-1" />Issue</Button>
    );
    if (wo.status === 'issued') actions.push(
      <Button key="start" size="sm" variant="outline" onClick={() => handleAction(wo._id, 'in-progress')}><Play className="h-3 w-3 mr-1" />Start</Button>
    );
    if (wo.status === 'in-progress') actions.push(
      <Button key="complete" size="sm" variant="outline" className="text-green-600" onClick={() => handleAction(wo._id, 'completed')}><Check className="h-3 w-3 mr-1" />Complete</Button>
    );
    if (wo.status === 'completed') actions.push(
      <Button key="close" size="sm" variant="outline" onClick={() => handleAction(wo._id, 'closed')}><X className="h-3 w-3 mr-1" />Close</Button>
    );
    if (['issued', 'in-progress', 'completed'].includes(wo.status)) {
      actions.push(
        <Button key="pay" size="sm" variant="default" onClick={() => { setSelectedWO(wo); setShowPaymentDialog(true); }}>
          <CreditCard className="h-3 w-3 mr-1" />Pay
        </Button>
      );
    }
    return <div className="flex gap-1 flex-wrap">{actions}</div>;
  };

  const renderTable = () => (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : workOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No work orders found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WO #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subcontractor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((wo) => (
                <TableRow key={wo._id}>
                  <TableCell className="font-mono text-sm">{wo.woNumber}</TableCell>
                  <TableCell className="font-medium">{wo.title}</TableCell>
                  <TableCell>{wo.subcontractorName}</TableCell>
                  <TableCell>{formatAmount(wo.totalAmount, wo.currency)}</TableCell>
                  <TableCell className="text-green-600">{formatAmount(wo.totalPaid, wo.currency)}</TableCell>
                  <TableCell className="text-red-600">{formatAmount(wo.totalOutstanding, wo.currency)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[wo.status]}>{wo.status}</Badge>
                  </TableCell>
                  <TableCell>{renderActions(wo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subcontractor Work Orders</h1>
          <p className="text-muted-foreground">Manage work orders and payments</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />New Work Order
        </Button>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(analytics.totalContractValue, 'INR')}</div>
              <p className="text-xs text-muted-foreground">{analytics.totalWorkOrders} work orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatAmount(analytics.totalPaid, 'INR')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatAmount(analytics.totalOutstanding, 'INR')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(analytics.totalRetention, 'INR')}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" onValueChange={setStatusFilter} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending-approval">Pending</TabsTrigger>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTable()}</TabsContent>
        <TabsContent value="draft">{renderTable()}</TabsContent>
        <TabsContent value="pending-approval">{renderTable()}</TabsContent>
        <TabsContent value="issued">{renderTable()}</TabsContent>
        <TabsContent value="in-progress">{renderTable()}</TabsContent>
        <TabsContent value="completed">{renderTable()}</TabsContent>
      </Tabs>

      {/* Create Work Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Subcontractor *</Label>
              <Select value={createForm.subcontractorId} onValueChange={(v) => setCreateForm(f => ({ ...f, subcontractorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subcontractor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v._id} value={v._id!}>{v.name}{v.company ? ` — ${v.company}` : ''}</SelectItem>
                  ))}
                  {vendors.length === 0 && (
                    <SelectItem value="_none" disabled>No vendor contacts found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Amount *</Label>
                <Input type="number" value={createForm.totalAmount} onChange={(e) => setCreateForm(f => ({ ...f, totalAmount: e.target.value }))} />
              </div>
              <div>
                <Label>Retention %</Label>
                <Input type="number" value={createForm.retentionPercentage} onChange={(e) => setCreateForm(f => ({ ...f, retentionPercentage: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={createForm.endDate} onChange={(e) => setCreateForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Input value={createForm.paymentTerms} onChange={(e) => setCreateForm(f => ({ ...f, paymentTerms: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={createForm.notes} onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!createForm.title || !createForm.subcontractorId || !createForm.totalAmount}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => { if (!open) closePaymentDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — {selectedWO?.woNumber}</DialogTitle>
          </DialogHeader>
          {selectedWO && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Outstanding: <span className="font-bold text-red-600">{formatAmount(selectedWO.totalOutstanding, selectedWO.currency)}</span>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(v: any) => setPaymentForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference</Label>
                <Input value={paymentForm.paymentReference} onChange={(e) => setPaymentForm(f => ({ ...f, paymentReference: e.target.value }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={!paymentForm.amount || Number(paymentForm.amount) <= 0}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) { setShowRejectDialog(false); setRejectionReason(''); setSelectedWO(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Work Order — {selectedWO?.woNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for rejection *</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason(''); setSelectedWO(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
