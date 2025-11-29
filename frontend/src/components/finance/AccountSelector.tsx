'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FinanceAccountCreationForm from './AccountCreationForm';

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

  const handleAccountCreated = (account: any) => {
    setShowDialog(false);
    onAccountCreated?.();
    onValueChange(account._id);
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <FinanceAccountCreationForm onAccountCreated={handleAccountCreated} />
        </DialogContent>
      </Dialog>
    </>
  );
}
