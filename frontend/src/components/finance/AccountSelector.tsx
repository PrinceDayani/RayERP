'use client';

import { useState, useEffect, useRef } from 'react';
import { useCreateAccountShortcut } from '@/hooks/useKeyboardShortcuts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import FinanceAccountCreationForm from './AccountCreationForm';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  
  const filteredAccounts = safeAccounts.filter(acc => 
    searchQuery === '' || 
    acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  useCreateAccountShortcut(() => setShowDialog(true));

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const idx = filteredAccounts.findIndex(acc => acc._id === value);
    setSelectedIndex(idx >= 0 ? idx : 0);
  }, [value, filteredAccounts]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredAccounts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredAccounts[selectedIndex]) {
          onValueChange(filteredAccounts[selectedIndex]._id);
          setOpen(false);
          setSearchQuery('');
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredAccounts, onValueChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleAccountCreated = (account: any) => {
    setShowDialog(false);
    onAccountCreated?.();
    onValueChange(account._id);
  };

  const selectedAccount = safeAccounts.find(acc => acc._id === value);

  return (
    <>
      <div className="flex gap-2" ref={dropdownRef}>
        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(!open)}
            className={cn("w-full justify-between", className)}
          >
            <span className="truncate">
              {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          
          {open && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Search accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No accounts found</div>
                ) : (
                  filteredAccounts.map((acc, idx) => (
                    <div
                      key={acc._id}
                      onClick={() => {
                        onValueChange(acc._id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-accent",
                        idx === selectedIndex && "bg-accent",
                        value === acc._id && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Check className={cn("h-4 w-4", value === acc._id ? "opacity-100" : "opacity-0")} />
                        <span className="text-sm">{acc.code} - {acc.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">₹{acc.balance?.toLocaleString() || '0'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
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
