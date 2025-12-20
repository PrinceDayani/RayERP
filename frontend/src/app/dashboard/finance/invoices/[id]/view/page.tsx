'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { silentApiClient } from '@/lib/silentApi';
import { formatCurrency } from '@/lib/currency';
import { ArrowLeft, Edit, DollarSign, FileText, BookOpen, FileBarChart, Trash2 } from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  partyName: string;
  partyEmail: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
  }>;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  notes: string;
  createdAt: string;
  journalEntryId?: string;
}

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      
      const response = await silentApiClient.get(`/api/invoices/${invoiceId}`);
      if (response?.data) {
        setInvoice(response.data);
      }
      setLoading(false);
    };

    fetchInvoice();
  }, [invoiceId]);

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

  const deleteInvoice = async () => {
    if (!invoice) return;
    
    if (['SENT', 'PAID', 'PARTIALLY_PAID'].includes(invoice.status)) {
      alert('Cannot delete invoice that has been sent or paid');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await silentApiClient.delete(`/api/invoices/${invoice._id}`);
      if (response?.success) {
        router.push('/dashboard/finance/invoices');
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete invoice error:', error);
      alert('Error deleting invoice');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Invoice not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-gray-600">Created on {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.replace('_', ' ')}
          </Badge>
          {invoice.status !== 'PAID' && (
            <Button 
              size="sm" 
              onClick={() => router.push(`/dashboard/finance/invoices/${invoice._id}/edit`)}
              disabled={invoice.status === 'PAID'}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {invoice.status === 'DRAFT' && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={deleteInvoice}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{invoice.partyName}</p>
                  {invoice.partyEmail && <p className="text-sm text-gray-600">{invoice.partyEmail}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Terms</p>
                  <p className="font-medium">{invoice.paymentTerms.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Tax %</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.description}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-2">{item.taxRate}%</td>
                        <td className="text-right py-2">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Amount Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total:</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid:</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-medium">
                <span>Balance:</span>
                <span>{formatCurrency(invoice.balanceAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.print()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Invoice
              </Button>
              {invoice.status !== 'PAID' && invoice.balanceAmount > 0 && (
                <Button 
                  className="w-full"
                  onClick={() => {
                    const amount = prompt('Enter payment amount:');
                    if (amount && !isNaN(parseFloat(amount))) {
                      router.push(`/dashboard/finance/invoices/${invoice._id}/payment?amount=${amount}`);
                    }
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
              {invoice.journalEntryId && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/finance/journal-entry?source=invoice&sourceId=${invoice._id}`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Journal Entry
                </Button>
              )}
              {invoice.journalEntryId && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/finance/ledger?invoice=${invoice._id}`)}
                >
                  <FileBarChart className="h-4 w-4 mr-2" />
                  View Ledger
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}