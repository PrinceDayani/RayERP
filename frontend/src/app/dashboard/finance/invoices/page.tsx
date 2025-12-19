'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { silentApiClient } from '@/lib/silentApi';
import { formatCurrency } from '@/lib/currency';
import { toast } from '@/lib/toast';
import { Plus, Search, Eye, Edit, DollarSign, BookOpen, CreditCard, FileBarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  partyName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
  journalEntryId?: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInvoices = async () => {
    setLoading(true);
    const response = await silentApiClient.get('/api/invoices');
    const data = response?.data;
    setInvoices(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const markAsPaid = async (invoiceId: string) => {
    const response = await silentApiClient.post(`/api/invoices/${invoiceId}/payment`, {
      amount: invoices.find(inv => inv._id === invoiceId)?.balanceAmount || 0,
      paymentMethod: 'CASH'
    });
    if (response?.success) {
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } else {
      toast.error('Payment feature coming soon');
    }
  };

  const recordPayment = async (invoiceId: string) => {
    const amount = prompt('Enter payment amount:');
    if (!amount || isNaN(parseFloat(amount))) return;
    
    const response = await silentApiClient.post(`/api/invoices/${invoiceId}/payment`, { 
      amount: parseFloat(amount),
      paymentMethod: 'CASH'
    });
    if (response?.success) {
      toast.success('Payment recorded');
      fetchInvoices();
    } else {
      toast.error('Payment feature coming soon');
    }
  };



  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(invoice => {
    const matchesSearch = invoice.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading invoices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage your sales invoices and track payments</p>
        </div>
        <Button onClick={() => router.push('/dashboard/finance/invoices/create')} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card className="mb-6 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by invoice number or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Invoice List ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <div className="bg-blue-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                  <DollarSign className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Create your first invoice to start tracking sales and revenue</p>
              </div>
              <Button 
                onClick={() => router.push('/dashboard/finance/invoices/create')}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg px-6 py-3"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Invoice #</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Paid</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Balance</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-blue-600">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{invoice.partyName}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="py-4 px-4 text-right text-green-600 font-medium">{formatCurrency(invoice.paidAmount)}</td>
                      <td className="py-4 px-4 text-right font-medium">
                        <span className={invoice.balanceAmount > 0 ? 'text-red-600' : 'text-gray-500'}>
                          {formatCurrency(invoice.balanceAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={`${getStatusColor(invoice.status)} font-medium`}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="View Details"
                            onClick={() => router.push(`/dashboard/finance/invoices/${invoice._id}/view`)}
                            className="hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Invoice"
                            onClick={() => router.push(`/dashboard/finance/invoices/${invoice._id}/edit`)}
                            disabled={invoice.status === 'PAID'}
                            className="hover:bg-green-100 hover:text-green-600 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.journalEntryId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View Journal Entry"
                              onClick={() => router.push(`/dashboard/finance/journal-entry?source=invoice&sourceId=${invoice._id}`)}
                              className="hover:bg-purple-100 hover:text-purple-600"
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.journalEntryId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="View Ledger"
                              onClick={() => router.push(`/dashboard/finance/ledger?invoice=${invoice._id}`)}
                              className="hover:bg-orange-100 hover:text-orange-600"
                            >
                              <FileBarChart className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status !== 'PAID' && invoice.balanceAmount > 0 && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Record Payment"
                                onClick={() => recordPayment(invoice._id)}
                                className="hover:bg-yellow-100 hover:text-yellow-600"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Mark as Paid"
                                onClick={() => markAsPaid(invoice._id)}
                                className="hover:bg-green-100 hover:text-green-600"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}