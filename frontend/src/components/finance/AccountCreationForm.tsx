'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCreateAccountTypeShortcut } from '@/hooks/useKeyboardShortcuts';
import { toast } from '@/hooks/use-toast';
import AccountCreationForm from '@/components/common/AccountCreationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

interface FinanceAccountCreationFormProps {
  onAccountCreated?: (account: any) => void;
  duplicateFrom?: any;
}

export default function FinanceAccountCreationForm({ onAccountCreated, duplicateFrom }: FinanceAccountCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [accountTypes, setAccountTypes] = useState([
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' }
  ]);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: '', description: '', nature: 'debit' as 'debit' | 'credit' });

  useCreateAccountTypeShortcut(() => setShowTypeDialog(true));

  useEffect(() => {
    fetchAccountTypes();
  }, []);

  const fetchAccountTypes = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/accounts/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const uniqueTypes = Array.from(
            new Map(data.data.map((t: any) => [t.value, { value: t.value, label: t.label }])).values()
          ) as { value: string; label: string; }[];
          setAccountTypes(uniqueTypes);
        }
      }
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const handleCreateType = async () => {
    const name = newTypeData.name.trim();
    
    // Validation
    if (!name) {
      toast({ title: 'Error', description: 'Type name is required', variant: 'destructive' });
      return;
    }
    
    if (name.length < 2 || name.length > 50) {
      toast({ title: 'Error', description: 'Name must be between 2 and 50 characters', variant: 'destructive' });
      return;
    }
    
    if (newTypeData.description && newTypeData.description.length > 200) {
      toast({ title: 'Error', description: 'Description must be less than 200 characters', variant: 'destructive' });
      return;
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
        return;
      }
      
      const response = await fetch(`${API_URL}/api/accounts/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newTypeData, name })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Account type created successfully' });
        setShowTypeDialog(false);
        setNewTypeData({ name: '', description: '', nature: 'debit' });
        fetchAccountTypes();
      } else {
        throw new Error(data.message || 'Failed to create type');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create account type', variant: 'destructive' });
    }
  };

  const accountFormSections = useMemo(() => [
    {
      id: 'basic',
      label: 'Basic Info',
      fields: [
        { name: 'code', label: 'Account Code', type: 'text' as const, placeholder: 'Auto-generated' },
        { name: 'name', label: 'Account Name', type: 'text' as const, required: true, placeholder: 'Enter account name' },
        { name: 'type', label: 'Account Type', type: 'select' as const, required: true, options: accountTypes },
        { name: 'subType', label: 'Sub Type', type: 'text' as const, placeholder: 'e.g., Current Assets' },
        { name: 'openingBalance', label: 'Opening Balance', type: 'number' as const, step: 0.01, placeholder: '0.00' },
        { name: 'currency', label: 'Currency', type: 'select' as const, options: [
          { value: 'INR', label: 'INR' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }
        ]},
        { name: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Account description' }
      ]
    },
    {
      id: 'contact',
      label: 'Contact',
      fields: [
        { name: 'contactInfo.primaryEmail', label: 'Primary Email', type: 'email' as const, placeholder: 'email@example.com' },
        { name: 'contactInfo.primaryPhone', label: 'Primary Phone', type: 'text' as const, placeholder: '+91-XXXXXXXXXX' },
        { name: 'contactInfo.mobile', label: 'Mobile', type: 'text' as const, placeholder: '+91-XXXXXXXXXX' },
        { name: 'contactInfo.address', label: 'Address', type: 'textarea' as const, placeholder: 'Complete address' },
        { name: 'contactInfo.city', label: 'City', type: 'text' as const, placeholder: 'City' },
        { name: 'contactInfo.state', label: 'State', type: 'text' as const, placeholder: 'State' },
        { name: 'contactInfo.pincode', label: 'PIN Code', type: 'text' as const, placeholder: 'PIN Code' }
      ]
    },
    {
      id: 'tax',
      label: 'Tax & GST',
      fields: [
        { name: 'taxInfo.gstNo', label: 'GST Number', type: 'text' as const, placeholder: 'GSTIN' },
        { name: 'taxInfo.panNo', label: 'PAN Number', type: 'text' as const, placeholder: 'PAN' },
        { name: 'taxInfo.taxRate', label: 'Tax Rate (%)', type: 'number' as const, step: 0.01, min: 0, max: 100 },
        { name: 'taxInfo.tdsApplicable', label: 'TDS Applicable', type: 'switch' as const },
        { name: 'taxInfo.tdsRate', label: 'TDS Rate (%)', type: 'number' as const, step: 0.01, min: 0, max: 100 },
        { name: 'taxInfo.tdsSection', label: 'TDS Section', type: 'text' as const, placeholder: 'e.g., 194C' }
      ]
    },
    {
      id: 'bank',
      label: 'Bank Details',
      fields: [
        { name: 'bankDetails.bankName', label: 'Bank Name', type: 'text' as const, placeholder: 'Bank name' },
        { name: 'bankDetails.branch', label: 'Branch', type: 'text' as const, placeholder: 'Branch name' },
        { name: 'bankDetails.accountNumber', label: 'Account Number', type: 'text' as const, placeholder: 'Account number' },
        { name: 'bankDetails.ifscCode', label: 'IFSC Code', type: 'text' as const, placeholder: 'IFSC Code' },
        { name: 'bankDetails.accountType', label: 'Account Type', type: 'select' as const, options: [
          { value: 'savings', label: 'Savings' },
          { value: 'current', label: 'Current' },
          { value: 'cc', label: 'Cash Credit' },
          { value: 'od', label: 'Overdraft' }
        ]}
      ]
    }
  ], [accountTypes]);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        toast({ title: "Success", description: "Account created successfully" });
        onAccountCreated?.(data.data);
      } else {
        throw new Error(data.message || JSON.stringify(data));
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      toast({ title: "Error", description: error.message || "Failed to create account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowTypeDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account Type
        </Button>
      </div>
      
      <AccountCreationForm
        sections={accountFormSections}
        onSubmit={handleSubmit}
        initialData={duplicateFrom}
        loading={loading}
      />

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type Name *</Label>
              <Input
                value={newTypeData.name}
                onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                placeholder="e.g., Fixed Assets"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newTypeData.description}
                onChange={(e) => setNewTypeData({ ...newTypeData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Nature *</Label>
              <Select value={newTypeData.nature} onValueChange={(v: 'debit' | 'credit') => setNewTypeData({ ...newTypeData, nature: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit (Assets, Expenses)</SelectItem>
                  <SelectItem value="credit">Credit (Liabilities, Revenue, Equity)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateType}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
