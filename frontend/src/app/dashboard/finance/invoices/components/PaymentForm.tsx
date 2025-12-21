'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Combobox } from './Combobox';

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  'CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'NEFT', 'RTGS', 'WALLET'
];

const PAYMENT_TYPES = [
  { value: 'invoice-based', label: 'Invoice Payment' },
  { value: 'advance', label: 'Advance Payment' },
  { value: 'independent', label: 'Independent Payment' },
];

export default function PaymentForm({ onSubmit, onCancel }: PaymentFormProps) {
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentType, setPaymentType] = useState('invoice-based');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyEmail, setPartyEmail] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [reference, setReference] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    const serial = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setPaymentNumber(`PAY-${timestamp}-${serial}`);
    fetchAccounts();
    fetchCustomers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/chart-of-accounts?limit=1000');
      const data = await res.json();
      
      let accountsList = [];
      if (Array.isArray(data)) {
        accountsList = data;
      } else if (data.success && data.data) {
        accountsList = data.data;
      } else if (data.accounts) {
        accountsList = data.accounts;
      }
      
      setAccounts(accountsList.filter(a => a.isActive !== false));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/contacts?limit=1000');
      const data = await res.json();
      
      let customersList = [];
      if (Array.isArray(data)) {
        customersList = data;
      } else if (data.success && data.data) {
        customersList = data.data;
      } else if (data.contacts) {
        customersList = data.contacts;
      }
      
      setCustomers(customersList.filter(c => c.isCustomer && c.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    const account = accounts.find(a => a._id === accountId);
    if (account) {
      setPartyName(account.name);
      if (account.contactInfo?.email) setPartyEmail(account.contactInfo.email);
      if (account.contactInfo?.phone) setPartyPhone(account.contactInfo.phone);
      
      // Find customer linked to this account
      const linkedCustomer = customers.find(c => c.ledgerAccountId === accountId);
      if (linkedCustomer) {
        setSelectedCustomer(linkedCustomer._id);
      }
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      setPartyName(customer.name);
      setPartyEmail(customer.email || '');
      setPartyPhone(customer.phone || '');
      if (customer.ledgerAccountId) setSelectedAccount(customer.ledgerAccountId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'payment',
      paymentNumber,
      paymentType,
      paymentDate,
      paymentMethod,
      partyName,
      partyEmail,
      partyPhone,
      totalAmount: amount,
      baseAmount: amount,
      currency,
      exchangeRate: 1,
      reference,
      bankAccount,
      notes,
      accountId: selectedAccount,
      customerId: selectedCustomer,
      customerName: partyName,
      status: 'DRAFT',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Payment Number</Label>
              <Input value={paymentNumber} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Account</Label>
              <Combobox
                value={selectedAccount}
                onValueChange={handleAccountChange}
                options={accounts.map(a => ({ value: a._id, label: `${a.code} - ${a.name}` }))}
                placeholder="Select account"
                searchPlaceholder="Search accounts..."
              />
            </div>
            <div>
              <Label>Customer</Label>
              <Combobox
                value={selectedCustomer}
                onValueChange={handleCustomerChange}
                options={customers.map(c => ({ value: c._id, label: c.name }))}
                placeholder="Select customer"
                searchPlaceholder="Search customers..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Party Name *</Label>
              <Input 
                placeholder="Auto-filled or manual" 
                value={partyName} 
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="Auto-filled or manual" 
                value={partyEmail} 
                onChange={(e) => setPartyEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                placeholder="Auto-filled or manual" 
                value={partyPhone} 
                onChange={(e) => setPartyPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>{method.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bank Account</Label>
              <Input 
                placeholder="Bank account details" 
                value={bankAccount} 
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Amount *</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                value={amount} 
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ INR</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference</Label>
              <Input 
                placeholder="Transaction ref/cheque no" 
                value={reference} 
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <CreditCard className="mr-2 h-4 w-4" />
          Create Payment
        </Button>
      </div>
    </form>
  );
}
