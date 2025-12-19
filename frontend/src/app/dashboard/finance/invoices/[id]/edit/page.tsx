'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { silentApiClient } from '@/lib/silentApi';
import { formatCurrency } from '@/lib/currency';
import { toast } from '@/lib/toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  account: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId?: string;
  partyName: string;
  partyEmail: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  lineItems: LineItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  notes: string;
  status: string;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerId: '',
    partyName: '',
    partyEmail: '',
    invoiceDate: '',
    dueDate: '',
    paymentTerms: 'NET_30',
    notes: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0, account: '' }
  ]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      
      const response = await silentApiClient.get(`/api/invoices/${invoiceId}`);
      if (response?.data) {
        const invoiceData = response.data;
        setInvoice(invoiceData);
        
        setFormData({
          customerId: invoiceData.customerId || '',
          partyName: invoiceData.partyName || '',
          partyEmail: invoiceData.partyEmail || '',
          invoiceDate: invoiceData.invoiceDate?.split('T')[0] || '',
          dueDate: invoiceData.dueDate?.split('T')[0] || '',
          paymentTerms: invoiceData.paymentTerms || 'NET_30',
          notes: invoiceData.notes || ''
        });

        if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
          setLineItems(invoiceData.lineItems);
        }
      }
      setFetchLoading(false);
    };

    fetchInvoice();
  }, [invoiceId]);

  useEffect(() => {
    const fetchData = async () => {
      const [customersRes, accountsRes] = await Promise.all([
        silentApiClient.get('/api/contacts?type=customer'),
        silentApiClient.get('/api/chart-of-accounts')
      ]);
      
      setCustomers(customersRes?.data || []);
      setAccounts(accountsRes?.data || []);
    };

    fetchData();
  }, []);

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = updatedItems[index];
      const subtotal = item.quantity * item.unitPrice;
      const taxAmount = subtotal * (item.taxRate / 100);
      item.amount = subtotal + taxAmount;
    }
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0, account: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
  const totalAmount = subtotal + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partyName || !formData.invoiceDate || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (lineItems.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      toast.error('Please complete all line items');
      return;
    }

    setLoading(true);

    const invoiceData = {
      ...formData,
      lineItems,
      subtotal,
      totalTax,
      totalAmount,
      paidAmount: 0
    };

    const response = await silentApiClient.put(`/api/invoices/${invoiceId}`, invoiceData);
    
    if (response?.success) {
      toast.success('Invoice updated successfully');
      router.push('/dashboard/finance/invoices');
    } else {
      toast.error('Failed to update invoice');
    }
    
    setLoading(false);
  };

  if (fetchLoading) {
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

  if (invoice.status === 'PAID') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Cannot Edit Paid Invoice</h2>
          <p className="text-gray-600 mb-4">This invoice has been paid and cannot be modified.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Customer</Label>
              <Select value={formData.customerId} onValueChange={(value) => {
                const customer = customers.find(c => c._id === value);
                setFormData({ 
                  ...formData, 
                  customerId: value,
                  partyName: customer?.name || '',
                  partyEmail: customer?.email || ''
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partyName">Customer Name *</Label>
              <Input
                id="partyName"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="partyEmail">Email</Label>
              <Input
                id="partyEmail"
                type="email"
                value={formData.partyEmail}
                onChange={(e) => setFormData({ ...formData, partyEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NET_15">Net 15 Days</SelectItem>
                  <SelectItem value="NET_30">Net 30 Days</SelectItem>
                  <SelectItem value="NET_60">Net 60 Days</SelectItem>
                  <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Line Items
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Tax %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.taxRate}
                      onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Account</Label>
                    <Select value={item.account} onValueChange={(value) => updateLineItem(index, 'account', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter(acc => acc.accountType === 'REVENUE').map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Label>Amount</Label>
                    <div className="text-sm font-medium py-2">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}