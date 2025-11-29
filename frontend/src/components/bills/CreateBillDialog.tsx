'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface CreateBillDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBillDialog({ onClose, onSuccess }: CreateBillDialogProps) {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    accountId: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    vendor: '',
    vendorGSTIN: '',
    placeOfSupply: '',
    invoiceNumber: '',
    notes: ''
  });
  const [items, setItems] = useState([{ description: '', hsnSac: '', amount: 0, gstRate: 18, cgst: 0, sgst: 0, igst: 0 }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      console.log('Full API response:', res);
      console.log('Response data:', res.data);
      console.log('Accounts array:', res.data.data);
      console.log('Accounts length:', res.data.data?.length);
      
      const accountsData = res.data.data || res.data.accounts || res.data || [];
      console.log('Setting accounts:', accountsData);
      setAccounts(accountsData);
      
      if (!accountsData || accountsData.length === 0) {
        toast({ 
          title: 'No Accounts Found', 
          description: 'Please create accounts in Chart of Accounts first', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Fetch accounts error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load accounts', 
        variant: 'destructive' 
      });
      setAccounts([]);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', hsnSac: '', amount: 0, gstRate: 18, cgst: 0, sgst: 0, igst: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast({ title: 'Warning', description: 'At least one item is required', variant: 'destructive' });
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    const numFields = ['amount', 'gstRate', 'cgst', 'sgst', 'igst'];
    updated[index] = { ...updated[index], [field]: numFields.includes(field) ? Number(value) : value };
    
    // Auto-calculate GST
    if (field === 'amount' || field === 'gstRate') {
      const amount = field === 'amount' ? Number(value) : updated[index].amount;
      const gstRate = field === 'gstRate' ? Number(value) : updated[index].gstRate;
      const gstAmount = (amount * gstRate) / 100;
      
      // For intra-state: CGST + SGST, for inter-state: IGST
      if (formData.placeOfSupply === 'intra-state') {
        updated[index].cgst = gstAmount / 2;
        updated[index].sgst = gstAmount / 2;
        updated[index].igst = 0;
      } else {
        updated[index].igst = gstAmount;
        updated[index].cgst = 0;
        updated[index].sgst = 0;
      }
    }
    
    setItems(updated);
    setErrors({ ...errors, [`item_${index}_${field === 'description' ? 'desc' : 'amt'}`]: undefined });
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.accountId) newErrors.accountId = 'Account is required';
    if (!formData.billDate) newErrors.billDate = 'Bill date is required';
    if (items.length === 0) newErrors.items = 'At least one item is required';
    
    items.forEach((item, idx) => {
      if (!item.description) newErrors[`item_${idx}_desc`] = 'Description required';
      if (!item.amount || item.amount <= 0) newErrors[`item_${idx}_amt`] = 'Valid amount required';
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    
    setLoading(true);

    try {
      await api.post('/bills', { ...formData, items });
      toast({ title: 'Success', description: 'Bill created successfully' });
      onSuccess();
    } catch (error: any) {
      console.error('Create bill error:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to create bill', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalGST = items.reduce((sum, item) => sum + Number(item.cgst) + Number(item.sgst) + Number(item.igst), 0);
  const totalAmount = subtotal + totalGST;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Bill</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account <span className="text-red-500">*</span></Label>
                <select
                  className={`w-full border rounded px-3 py-2 ${errors.accountId ? 'border-red-500' : ''}`}
                  value={formData.accountId}
                  onChange={(e) => {
                    setFormData({ ...formData, accountId: e.target.value });
                    setErrors({ ...errors, accountId: undefined });
                  }}
                  required
                >
                  <option value="">{accounts.length === 0 ? 'No accounts available' : `Select Account (${accounts.length} available)`}</option>
                  {accounts && accounts.length > 0 && accounts.map((acc: any) => (
                    <option key={acc._id || acc.id} value={acc._id || acc.id}>
                      {acc.name || acc.accountName || 'Unnamed Account'} {acc.code ? `(${acc.code})` : ''}
                    </option>
                  ))}
                </select>
                {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId}</p>}
                {accounts.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">Create accounts in Finance → Chart of Accounts first</p>
                )}
              </div>
              <div>
                <Label>Vendor <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Vendor/Supplier name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Vendor GSTIN</Label>
                <Input
                  value={formData.vendorGSTIN}
                  onChange={(e) => setFormData({ ...formData, vendorGSTIN: e.target.value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>
              <div>
                <Label>Invoice Number <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="INV-2024-001"
                  required
                />
              </div>
              <div>
                <Label>Place of Supply <span className="text-red-500">*</span></Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.placeOfSupply}
                  onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  <option value="intra-state">Intra-State (CGST+SGST)</option>
                  <option value="inter-state">Inter-State (IGST)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={formData.billDate}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Bill Items</Label>
                <Button type="button" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index}>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Input
                          placeholder="Item description *"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className={errors[`item_${index}_desc`] ? 'border-red-500' : ''}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="HSN/SAC"
                          value={item.hsnSac}
                          onChange={(e) => updateItem(index, 'hsnSac', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Amount *"
                          value={item.amount || ''}
                          onChange={(e) => updateItem(index, 'amount', e.target.value)}
                          className={errors[`item_${index}_amt`] ? 'border-red-500' : ''}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          className="w-full border rounded px-3 py-2 h-10"
                          value={item.gstRate}
                          onChange={(e) => updateItem(index, 'gstRate', e.target.value)}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          ₹{(item.cgst + item.sgst + item.igst).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {(errors[`item_${index}_desc`] || errors[`item_${index}_amt`]) && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[`item_${index}_desc`] || errors[`item_${index}_amt`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total GST:</span>
                  <span className="font-mono text-blue-600">₹{totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount:</span>
                  <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Creating...' : 'Create Bill'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
