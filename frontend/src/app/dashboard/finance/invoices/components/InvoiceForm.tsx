'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, X, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { Combobox } from './Combobox';

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount: number;
    amount: number;
}

interface InvoiceFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}

const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const PAYMENT_TERMS = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt', days: 0 },
    { value: 'NET_15', label: 'Net 15', days: 15 },
    { value: 'NET_30', label: 'Net 30', days: 30 },
    { value: 'NET_60', label: 'Net 60', days: 60 },
    { value: 'NET_90', label: 'Net 90', days: 90 },
];

const RECURRING_FREQUENCIES = [
    { value: 'ONE_TIME', label: 'One-time' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'SEMI_ANNUALLY', label: 'Semi-annually' },
    { value: 'ANNUALLY', label: 'Annually' },
];

export default function InvoiceForm({ onSubmit, onCancel, initialData }: InvoiceFormProps) {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentTerms, setPaymentTerms] = useState('NET_30');
    const [dueDate, setDueDate] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0, amount: 0 }
    ]);
    const [invoiceDiscount, setInvoiceDiscount] = useState(0);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState('ONE_TIME');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [notes, setNotes] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    useEffect(() => {
        if (!initialData) {
            const now = new Date();
            const timestamp = format(now, 'yyyyMMddHHmmss');
            const serial = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            setInvoiceNumber(`INV-${timestamp}-${serial}`);
        }
        fetchAccounts();
        fetchCustomers();
    }, [initialData]);

    useEffect(() => {
        const selectedTerm = PAYMENT_TERMS.find(t => t.value === paymentTerms);
        if (selectedTerm && invoiceDate) {
            const date = new Date(invoiceDate);
            date.setDate(date.getDate() + selectedTerm.days);
            setDueDate(format(date, 'yyyy-MM-dd'));
        }
    }, [paymentTerms, invoiceDate]);

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
            setCustomerName(account.name);
            if (account.contactInfo?.email) setCustomerEmail(account.contactInfo.email);
            if (account.contactInfo?.phone) setCustomerPhone(account.contactInfo.phone);
            
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
            setCustomerName(customer.name);
            setCustomerEmail(customer.email || '');
            setCustomerPhone(customer.phone || '');
            if (customer.ledgerAccountId) setSelectedAccount(customer.ledgerAccountId);
        }
    };

    const addLineItem = () => {
        const newId = (lineItems.length + 1).toString();
        setLineItems([...lineItems, {
            id: newId,
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: 18,
            discount: 0,
            amount: 0
        }]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                const baseAmount = updated.quantity * updated.unitPrice;
                const discountAmount = baseAmount * (updated.discount / 100);
                const afterDiscount = baseAmount - discountAmount;
                const taxAmount = afterDiscount * (updated.taxRate / 100);
                updated.amount = afterDiscount + taxAmount;
                return updated;
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        const subtotal = lineItems.reduce((sum, item) => {
            const baseAmount = item.quantity * item.unitPrice;
            const discountAmount = baseAmount * (item.discount / 100);
            return sum + (baseAmount - discountAmount);
        }, 0);

        const totalTax = lineItems.reduce((sum, item) => {
            const baseAmount = item.quantity * item.unitPrice;
            const discountAmount = baseAmount * (item.discount / 100);
            const afterDiscount = baseAmount - discountAmount;
            return sum + (afterDiscount * (item.taxRate / 100));
        }, 0);

        const totalBeforeInvoiceDiscount = subtotal + totalTax;
        const invoiceDiscountAmount = totalBeforeInvoiceDiscount * (invoiceDiscount / 100);
        const total = totalBeforeInvoiceDiscount - invoiceDiscountAmount;

        return { subtotal, totalTax, invoiceDiscountAmount, total };
    };

    const totals = calculateTotals();
    const selectedCurrency = CURRENCIES.find(c => c.code === currency);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            invoiceNumber,
            currency,
            invoiceDate,
            dueDate,
            paymentTerms,
            customerName,
            customerEmail,
            customerPhone,
            accountId: selectedAccount,
            customerId: selectedCustomer,
            lineItems,
            invoiceDiscount,
            isRecurring,
            recurringFrequency,
            notes,
            ...totals,
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Invoice Number</Label>
                            <Input value={invoiceNumber} readOnly className="bg-muted" />
                        </div>
                        <div>
                            <Label>Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map(curr => (
                                        <SelectItem key={curr.code} value={curr.code}>
                                            {curr.symbol} {curr.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Invoice Date</Label>
                            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
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
                            <Label>Customer Name *</Label>
                            <Input placeholder="Auto-filled or manual" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input type="email" placeholder="Auto-filled or manual" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input placeholder="Auto-filled or manual" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Payment Terms</Label>
                            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_TERMS.map(term => (
                                        <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Due Date</Label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                        <div>
                            <Label>Recurring</Label>
                            <Select value={recurringFrequency} onValueChange={(val) => {
                                setRecurringFrequency(val);
                                setIsRecurring(val !== 'ONE_TIME');
                            }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RECURRING_FREQUENCIES.map(freq => (
                                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Line Items</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {lineItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-4 border rounded-lg">
                                <div className="col-span-3">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="Item description"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Unit Price</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label>Tax %</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.taxRate}
                                        onChange={(e) => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label>Disc %</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.discount}
                                        onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Amount</Label>
                                    <Input
                                        value={`${selectedCurrency?.symbol}${item.amount.toFixed(2)}`}
                                        readOnly
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="col-span-1 flex items-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLineItem(item.id)}
                                        disabled={lineItems.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 space-y-2 border-t pt-4">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{selectedCurrency?.symbol}{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total Tax:</span>
                            <span>{selectedCurrency?.symbol}{totals.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Invoice Discount (%):</span>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                className="w-24"
                                value={invoiceDiscount}
                                onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-sm">-{selectedCurrency?.symbol}{totals.invoiceDiscountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total:</span>
                            <span>{selectedCurrency?.symbol}{totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Attachments</Label>
                        <div className="mt-2">
                            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:bg-muted">
                                <Upload className="h-5 w-5" />
                                <span>Click to upload files</span>
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                            </label>
                            {attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {attachments.map((file, idx) => (
                                        <Badge key={idx} variant="secondary" className="mr-2">
                                            {file.name}
                                            <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label>Notes</Label>
                        <Textarea
                            placeholder="Additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    <Calculator className="mr-2 h-4 w-4" />
                    Create Invoice
                </Button>
            </div>
        </form>
    );
}
