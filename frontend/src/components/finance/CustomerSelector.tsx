'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerSelectorProps {
  value: string;
  onValueChange: (id: string, name: string) => void;
  customers: any[];
  onCustomerCreated?: () => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSelector({ value, onValueChange, customers, onCustomerCreated, placeholder = "Select customer", className }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  const filteredCustomers = safeCustomers.filter(cust => 
    searchQuery === '' || 
    cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const idx = filteredCustomers.findIndex(cust => cust._id === value);
    setSelectedIndex(idx >= 0 ? idx : 0);
  }, [value, filteredCustomers]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCustomers[selectedIndex]) {
          onValueChange(filteredCustomers[selectedIndex]._id, filteredCustomers[selectedIndex].name);
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
  }, [open, selectedIndex, filteredCustomers, onValueChange]);

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

  const selectedCustomer = safeCustomers.find(cust => cust._id === value);

  return (
    <div className="flex gap-2" ref={dropdownRef}>
      <div className="relative w-full">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(!open)}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">
            {selectedCustomer ? selectedCustomer.name : placeholder}
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
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No customers found</div>
              ) : (
                filteredCustomers.map((cust, idx) => (
                  <div
                    key={cust._id}
                    onClick={() => {
                      onValueChange(cust._id, cust.name);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      "flex items-center justify-between px-2 py-2 cursor-pointer hover:bg-accent",
                      idx === selectedIndex && "bg-accent",
                      value === cust._id && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4", value === cust._id ? "opacity-100" : "opacity-0")} />
                      <div>
                        <div className="text-sm font-medium">{cust.name}</div>
                        {cust.company && <div className="text-xs text-muted-foreground">{cust.company}</div>}
                      </div>
                    </div>
                    {cust.email && <span className="text-xs text-muted-foreground">{cust.email}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <Button type="button" size="icon" variant="outline" onClick={() => window.open('/dashboard/contacts/new', '_blank')}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
