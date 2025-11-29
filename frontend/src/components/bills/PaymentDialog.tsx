'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface PaymentDialogProps {
  bill: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentDialog({ bill, onClose, onSuccess }: PaymentDialogProps) {
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: bill.balanceAmount,
    paymentMethod: 'cash',
    reference: '',
    notes: '',
    paymentAccountId: ''
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data?.data || res.data?.accounts || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount required';
    if (formData.amount > bill.balanceAmount) newErrors.amount = 'Amount exceeds balance';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please check all fields', variant: 'destructive' });
      return;
    }
    
    setLoading(true);

    try {
      await api.post(`/bills/${bill._id}/payments`, { billId: bill._id, ...formData });
      toast({ title: 'Success', description: `Payment of ₹${formData.amount.toLocaleString()} recorded successfully` });
      onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to process payment', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate how payment will be allocated
  const calculateAllocation = () => {
    let remaining = Number(formData.amount);
    return bill.items.map((item: any, index: number) => {
      const allocated = Math.min(remaining, item.balanceAmount);
      remaining -= allocated;
      return { index, item, allocated };
    }).filter((a: any) => a.allocated > 0);
  };

  const allocation = calculateAllocation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Make Payment - {bill.billNumber}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">₹{bill.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Paid Amount</p>
                <p className="text-lg font-bold text-green-600">₹{bill.paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance Due</p>
                <p className="text-lg font-bold text-red-600">₹{bill.balanceAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Bill Items</h3>
            <div className="space-y-2">
              {bill.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: ₹{item.amount.toLocaleString()} | 
                      Paid: ₹{item.paidAmount.toLocaleString()} | 
                      Balance: ₹{item.balanceAmount.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={item.balanceAmount === 0 ? 'default' : 'secondary'}>
                    {item.balanceAmount === 0 ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => {
                    setFormData({ ...formData, paymentDate: e.target.value });
                    setErrors({ ...errors, paymentDate: undefined });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.paymentDate ? 'border-red-500' : ''}
                  required
                />
                {errors.paymentDate && <p className="text-xs text-red-500 mt-1">{errors.paymentDate}</p>}
              </div>
              <div>
                <Label>Payment Method <span className="text-red-500">*</span></Label>
                <select
                  className={`w-full border rounded px-3 py-2 ${errors.paymentMethod ? 'border-red-500' : ''}`}
                  value={formData.paymentMethod}
                  onChange={(e) => {
                    setFormData({ ...formData, paymentMethod: e.target.value });
                    setErrors({ ...errors, paymentMethod: undefined });
                  }}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
                {errors.paymentMethod && <p className="text-xs text-red-500 mt-1">{errors.paymentMethod}</p>}
              </div>
            </div>

            <div>
              <Label>Payment Account</Label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.paymentAccountId}
                onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
              >
                <option value="">Same as Bill Account (Default)</option>
                {accounts.map((acc: any) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({acc.code}) - ₹{acc.balance?.toLocaleString() || 0}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to deduct from bill account
              </p>
            </div>

            <div>
              <Label>Payment Amount <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={bill.balanceAmount}
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: Number(e.target.value) });
                  setErrors({ ...errors, amount: undefined });
                }}
                className={errors.amount ? 'border-red-500' : ''}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: ₹{bill.balanceAmount.toLocaleString()}
              </p>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>

            {allocation.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Payment Allocation Preview</h4>
                <div className="space-y-1 text-sm">
                  {allocation.map((a: any) => (
                    <div key={a.index} className="flex justify-between">
                      <span>{a.item.description}</span>
                      <span className="font-mono text-green-600">₹{a.allocated.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Reference</Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Transaction ID, Cheque No, etc."
              />
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                {loading ? 'Processing...' : 'Make Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
