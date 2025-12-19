'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { silentApiClient } from '@/lib/silentApi';
import { formatCurrency } from '@/lib/currency';
import { toast } from '@/lib/toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  account?: string;
}

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [formData, setFormData] = useState({
    partyName: '',
    partyEmail: '',
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 'NET_30',
    notes: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 18, amount: 0, account: '' }
  ]);

  useEffect(() => {
    fetchAccounts();
    fetchCustomers();
  }, []);

  const fetchAccounts = async () => {
    const response = await silentApiClient.get('/api/chart-of-accounts');
    setAccounts(response?.data || []);
  };

  const fetchCustomers = async () => {
    const response = await silentApiClient.get('/api/contacts');
    setCustomers(response?.data?.filter((c: any) => c.isCustomer === true) || []);
  };

  const createCustomer = async () => {
    if (!newCustomer.name) {
      toast.error('Customer name is required');
      return;
    }
    if (!newCustomer.phone) {
      toast.error('Phone number is required');
      return;
    }

    const customerData = {
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      isCustomer: true,
      visibilityLevel: 'personal'
    };

    const response = await silentApiClient.post('/api/contacts', customerData);
    if (response?.success) {
      const createdCustomer = response.data;
      setCustomers([...customers, createdCustomer]);
      setFormData({
        ...formData,
        customerId: createdCustomer._id,
        partyName: createdCustomer.name,
        partyEmail: createdCustomer.email
      });
      setNewCustomer({ name: '', email: '', phone: '' });
      setShowCustomerDialog(false);
      toast.success('Customer created successfully!');
    } else {
      toast.error('Failed to create customer');
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    const item = updatedItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.taxRate) / 100;
    updatedItems[index].amount = subtotal + taxAmount;
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 18, amount: 0, account: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = lineItems.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * item.taxRate) / 100), 0);
    const totalAmount = subtotal + totalTax;
    
    return { subtotal, totalTax, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { subtotal, totalTax, totalAmount } = calculateTotals();
      
      const invoiceData = {
        ...formData,
        invoiceType: 'SALES',
        lineItems: lineItems.map(item => ({
          ...item,
          taxAmount: (item.quantity * item.unitPrice * item.taxRate) / 100,
          discount: 0
        })),
        subtotal,
        totalTax,
        totalDiscount: 0,
        totalAmount,
        amountInBaseCurrency: totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        currency: 'INR',
        exchangeRate: 1,
        baseCurrency: 'INR'
      };

      const response = await silentApiClient.post('/api/invoices', invoiceData);
      
      if (response?.success) {
        toast.success('Invoice created successfully!');
        router.push('/dashboard/finance/invoices');
      } else {
        toast.error('Failed to create invoice');
      }
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, totalTax, totalAmount } = calculateTotals();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerId" className="flex items-center justify-between">
                Customer *
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/dashboard/contacts')}
                    className="text-xs h-6 px-2"
                  >
                    Manage Contacts
                  </Button>
                  <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-xs h-6 px-2"
                      >
                        + Add
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Customer Name *</Label>
                        <Input
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <Input
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCustomerDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={createCustomer}>
                          Add Customer
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </Label>
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
                  {customers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No customers found. Go to Contacts and mark contacts as customers, or click "+ Add" to create a new customer.
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partyName">Customer Name</Label>
              <Input
                id="partyName"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                placeholder="Or enter manually"
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
                    <Label className="flex items-center justify-between">
                      Account
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/dashboard/finance/chart-of-accounts')}
                        className="text-xs h-6 px-2"
                      >
                        + Add
                      </Button>
                    </Label>
                    <Select value={item.account} onValueChange={(value) => updateLineItem(index, 'account', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter(acc => acc.type === 'revenue').map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.code} - {account.name}
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
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}