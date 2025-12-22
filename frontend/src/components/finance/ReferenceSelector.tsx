'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateReference from './CreateReference';

interface ReferenceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  accountId?: string;
}

export function ReferenceSelector({ value, onValueChange, placeholder = "Select or enter reference", className, accountId }: ReferenceSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [references, setReferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const fetchReferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      
      if (accountId) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reference-payments/outstanding-references?accountId=${accountId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const refs = (data.references || []).map((ref: any) => ({
          id: ref._id,
          label: `${ref.reference} - ${ref.entryNumber} (Outstanding: ${ref.outstandingAmount})`,
          value: ref._id
        }));
        setReferences(refs.map((r: any) => r.label));
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal-entries?status=POSTED`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const uniqueRefs = [...new Set((data.data || []).map((je: any) => je.reference).filter(Boolean))];
        setReferences(uniqueRefs as string[]);
      }
    } catch (error) {
      console.error('Failed to fetch references:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReferences();
      searchRef.current?.focus();
    }
  }, [open]);

  const filteredReferences = references.filter(ref => 
    searchQuery === '' || ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const idx = filteredReferences.findIndex(ref => ref === value);
    setSelectedIndex(idx >= 0 ? idx : 0);
  }, [value, filteredReferences]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredReferences.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredReferences[selectedIndex]) {
          onValueChange(filteredReferences[selectedIndex]);
          setOpen(false);
          setSearchQuery('');
        } else if (searchQuery) {
          onValueChange(searchQuery);
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
  }, [open, selectedIndex, filteredReferences, searchQuery, onValueChange]);

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

  return (
    <>
      <div className="flex gap-2">
        <div className="relative w-full" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(!open)}
            className={cn("w-full justify-between", className)}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          
          {open && (
            <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-lg">
              <div className="p-2 border-b sticky top-0 bg-popover">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Search or type new reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {searchQuery && !filteredReferences.includes(searchQuery) && (
                  <div
                    onClick={() => {
                      onValueChange(searchQuery);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent border-b"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Create: "{searchQuery}"</span>
                  </div>
                )}
                {loading ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">Loading...</div>
                ) : filteredReferences.length === 0 && !searchQuery ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">No references found</div>
                ) : (
                  filteredReferences.map((ref, idx) => (
                    <div
                      key={ref}
                      onClick={() => {
                        onValueChange(ref);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors",
                        idx === selectedIndex && "bg-accent",
                        value === ref && "bg-primary/10 font-medium"
                      )}
                    >
                      <Check className={cn("h-4 w-4 shrink-0", value === ref ? "opacity-100 text-primary" : "opacity-0")} />
                      <span className="text-sm truncate">{ref}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <Button type="button" size="icon" variant="outline" onClick={() => setShowDialog(true)} className="shrink-0" title="Link to Journal Entry">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link Reference to Journal Entry</DialogTitle>
          </DialogHeader>
          <CreateReference 
            open={showDialog} 
            onClose={() => setShowDialog(false)}
            onSuccess={() => fetchReferences()}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
