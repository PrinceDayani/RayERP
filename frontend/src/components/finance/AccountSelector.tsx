'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AccountSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  accounts: any[];
  onAccountCreated?: () => void;
  placeholder?: string;
  className?: string;
}

export function AccountSelector({ value, onValueChange, accounts, onAccountCreated, placeholder = "Select account", className }: AccountSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    description: ''
  });
  
  console.log('AccountSelector - accounts:', accounts.length, accounts);

  const handleCreate = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('Please login to continue');
      window.location.href = '/login';
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.status === 401) {
        alert('Session expired. Please login again');
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setShowDialog(false);
        setFormData({ code: '', name: '', type: 'asset', description: '' });
        if (onAccountCreated) {
          await onAccountCreated();
        }
        onValueChange(data._id);
      } else {
        const error = await res.json();
        console.error('Error creating account:', error.message);
        alert(error.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account');
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto" position="popper" sideOffset={5}>
            {!accounts || accounts.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No accounts available. Click + to create one.</div>
            ) : (
              accounts.map((acc) => (
                <SelectItem key={acc._id} value={acc._id}>
                  {acc.code} - {acc.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button type="button" size="icon" variant="outline" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="e.g., 1000" required />
            </div>
            <div>
              <Label>Account Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Cash" required />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional description" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="button" onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
