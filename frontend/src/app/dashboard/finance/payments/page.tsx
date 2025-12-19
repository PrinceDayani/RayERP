'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Coins, TrendingUp, AlertCircle, FileText, Download, RefreshCw, XCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AccountSelector } from '@/components/finance/AccountSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paymentsAPI, accountsAPI } from '@/lib/api/financeAPI';
import { validatePayment } from '@/utils/validation';
import { exportPayments } from '@/utils/exportUtils';

interface Payment {
  _id: string;
  paymentNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  approvalStatus: string;
  allocations: Array<{ invoiceId: string; amount: number }>;
  schedules?: Array<{ dueDate: string; amount: number; status: string }>;
  reconciliation?: { status: string };
  receiptGenerated: boolean;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [filter, setFilter] = useState({ status: 'all', reconciled: 'all' });

  useEffect(() => {
    fetchPayments();
    fetchAnalytics();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentsAPI.getAll();
      console.log('Payments API response:', data);
      console.log('Payments array:', data.data || data);
      const paymentsArray = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      console.log('Setting payments:', paymentsArray);
      setPayments(paymentsArray);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await paymentsAPI.getAnalytics();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const approvePayment = async (id: string) => {
    try {
      await paymentsAPI.approve(id);
      fetchPayments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const reconcilePayment = async (id: string) => {
    try {
      await paymentsAPI.reconcile(id);
      fetchPayments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      const data = await paymentsAPI.delete(id);
      if (data.success) {
        alert('Payment deleted successfully');
        fetchPayments();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete payment');
    }
  };

  const createJournalEntry = async (id: string) => {
    try {
      await paymentsAPI.createJournalEntry(id);
      alert('Journal entry created');
      fetchPayments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">Track payments, approvals, and reconciliation</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" />Record Payment</Button>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.analytics?.reduce((s: number, a: any) => s + a.count, 0) || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">?{analytics.analytics?.reduce((s: number, a: any) => s + a.totalAmount, 0).toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{Array.isArray(payments) ? payments.filter(p => p.approvalStatus === 'PENDING').length : 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unreconciled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{Array.isArray(payments) ? payments.filter(p => p.reconciliation?.status === 'UNRECONCILED').length : 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <select className="border rounded px-3 py-2" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="min-w-full divide-y">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Payment #</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    No payments found. Click "Record Payment" to create one.
                  </td>
                </tr>
              )}
              {Array.isArray(payments) && payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="px-6 py-4 text-sm font-medium">{payment.paymentNumber}</td>
                  <td className="px-6 py-4 text-sm">{payment.customerName}</td>
                  <td className="px-6 py-4 text-sm font-semibold">?{payment.baseAmount?.toLocaleString() || payment.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{payment.currency || 'INR'}</td>
                  <td className="px-6 py-4 text-sm">{payment.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Badge variant={payment.status === 'COMPLETED' ? 'default' : payment.status === 'PENDING_APPROVAL' ? 'secondary' : 'outline'}>
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); /* Edit logic */ }}>
                      <Plus className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); deletePayment(payment._id); }} className="text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />Delete
                    </Button>
                    {payment.approvalStatus === 'PENDING' && (
                      <Button size="sm" variant="outline" onClick={() => approvePayment(payment._id)}>
                        <Check className="h-3 w-3 mr-1" />Approve
                      </Button>
                    )}
                    {payment.reconciliation?.status === 'UNRECONCILED' && (
                      <Button size="sm" variant="outline" onClick={() => reconcilePayment(payment._id)}>
                        <RefreshCw className="h-3 w-3 mr-1" />Reconcile
                      </Button>
                    )}
                    {payment.status === 'APPROVED' && (
                      <Button size="sm" variant="outline" onClick={() => createJournalEntry(payment._id)}>
                        <FileText className="h-3 w-3 mr-1" />JE
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm && <PaymentForm onClose={() => setShowForm(false)} onSuccess={fetchPayments} />}
    </div>
  );
}

function PaymentForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    accountId: '',
    totalAmount: '',
    currency: 'INR',
    exchangeRate: '1',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    allocations: [{ invoiceId: '', amount: '' }]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountsAPI.getAll();
      setAccounts(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        paymentNumber: 'PAY-' + Date.now(),
        totalAmount: parseFloat(formData.totalAmount),
        exchangeRate: parseFloat(formData.exchangeRate),
        baseAmount: parseFloat(formData.totalAmount) * parseFloat(formData.exchangeRate),
        allocations: formData.allocations.filter(a => a.invoiceId && a.amount).map(a => ({ ...a, amount: parseFloat(a.amount) }))
      };

      // Validation
      const validation = validatePayment(payload);
      if (!validation.isValid) {
        toast({ title: 'Validation Error', description: validation.errors.join(', '), variant: 'destructive' });
        return;
      }

      console.log('Creating payment with payload:', payload);
      const data = await paymentsAPI.create(payload);
      console.log('Payment creation response:', data);
      if (!data.success) {
        toast({ title: 'Error', description: data.message || 'Failed to create payment', variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Payment created successfully!' });
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Record Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Customer Name" className="border rounded px-3 py-2" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
            <div>
              <AccountSelector
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                accounts={accounts}
                onAccountCreated={fetchAccounts}
                placeholder="Select account"
              />
            </div>
            <input type="number" step="0.01" placeholder="Amount" className="border rounded px-3 py-2" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required />
            <select className="border rounded px-3 py-2" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
              <option value="INR">INR</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input type="number" step="0.01" placeholder="Exchange Rate" className="border rounded px-3 py-2" value={formData.exchangeRate} onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })} disabled />
            <input type="date" className="border rounded px-3 py-2" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} required />
            <select className="border rounded px-3 py-2" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
            </select>
          </div>
          <input type="text" placeholder="Reference" className="w-full border rounded px-3 py-2" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">Record Payment</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
