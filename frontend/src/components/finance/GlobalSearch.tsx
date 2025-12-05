'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Search, FileText, Building2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'account' | 'entry';
}

export default function GlobalSearch({ open, onOpenChange, type }: GlobalSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, type]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      
      const endpoint = type === 'account' 
        ? `${API_URL}/api/accounts?search=${search}&limit=10`
        : `${API_URL}/api/journal-entries?search=${search}&limit=10`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      setResults(data.data || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: any) => {
    if (type === 'account') {
      router.push(`/dashboard/finance/account-ledger/${item._id}`);
    } else {
      router.push(`/dashboard/finance/journal-entry/${item._id}`);
    }
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, results.length - 1);
      setSelectedIndex(newIndex);
      document.getElementById(`result-${newIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(newIndex);
      document.getElementById(`result-${newIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'account' ? <Building2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            Search {type === 'account' ? 'Accounts' : 'Entries'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder={type === 'account' ? 'Search by code, name...' : 'Search by number, reference, description...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading && <div className="text-center py-4 text-muted-foreground">Searching...</div>}
            
            {!loading && search && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No results found</div>
            )}

            {results.map((item, index) => (
              <div
                key={item._id}
                id={`result-${index}`}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => handleSelect(item)}
              >
                {type === 'account' ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{item.code}</span> • {item.type}
                      </div>
                    </div>
                    <Badge>{item.currency} {item.balance?.toLocaleString()}</Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.description}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{item.entryNumber}</span>
                        {item.reference && ` • ${item.reference}`}
                      </div>
                    </div>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
