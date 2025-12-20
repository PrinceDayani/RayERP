'use client';

import { useState, useEffect, useRef } from 'react';
import { useCreateAccountShortcut } from '@/hooks/useKeyboardShortcuts';
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
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useCreateAccountShortcut(() => setShowDialog(true));

  useEffect(() => {
    if (!value && accounts.length > 0) {
      setSelectedIndex(0);
    } else {
      const idx = accounts.findIndex(acc => acc._id === value);
      if (idx >= 0) setSelectedIndex(idx);
    }
  }, [value, accounts]);

  useEffect(() => {
    if (!open || accounts.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, accounts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (accounts[selectedIndex]) {
          onValueChange(accounts[selectedIndex]._id);
          setOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, accounts, onValueChange]);

  const handleAccountCreated = (account: any) => {
    setShowDialog(false);
    onAccountCreated?.();
    onValueChange(account._id);
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto" position="popper" sideOffset={5}>
            {!accounts || accounts.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No accounts available. Click + to create one.</div>
            ) : (
              accounts.map((acc, idx) => (
                <SelectItem 
                  key={acc._id} 
                  value={acc._id}
                  className={idx === selectedIndex ? 'bg-primary/10' : ''}
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{acc.code} - {acc.name}</span>
                    <span className="text-xs text-muted-foreground ml-4">Bal: {acc.balance?.toLocaleString() || '0'}</span>
                  </div>
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
