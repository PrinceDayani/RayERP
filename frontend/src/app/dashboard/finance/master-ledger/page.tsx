'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Filter, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';

interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  createdAt: string;
  lines: {
    account: { code: string; name: string; type: string };
    debit: number;
    credit: number;
    description: string;
  }[];
}

export default function MasterLedgerPage() {
  const { formatAmount } = useCurrencyFormat();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchEntries();
  }, [filters.startDate, filters.endDate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '1000');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/journal-entries?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        console.error('API Error:', res.status, res.statusText, errorData);
        setError(`Failed to load entries: ${errorData.message || res.statusText}`);
        setEntries([]);
        return;
      }
      
      const data = await res.json();
      
      // Handle different response formats
      const entriesData = data.journalEntries || data.data || data || [];
      const validEntries = Array.isArray(entriesData) ? entriesData.map((entry: any) => ({
        ...entry,
        date: entry.entryDate || entry.date,
        lines: (entry.lines || []).map((line: any) => ({
          ...line,
          account: line.account || { code: 'N/A', name: 'Unknown', type: 'N/A' }
        }))
      })) : [];
      setEntries(validEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to connect to server. Please try again.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.entryNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
    entry.description.toLowerCase().includes(filters.search.toLowerCase()) ||
    entry.reference?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalDebits = filteredEntries.reduce((sum, e) => sum + e.totalDebit, 0);
  const totalCredits = filteredEntries.reduce((sum, e) => sum + e.totalCredit, 0);

  const exportToCSV = () => {
    const escapeCSV = (val: any) => {
      const str = String(val || '');
      return str.includes(',') || str.includes('"') || str.includes('\n') 
        ? `"${str.replace(/"/g, '""')}"` 
        : str;
    };
    
    const headers = ['Entry Number', 'Date', 'Description', 'Reference', 'Account', 'Debit', 'Credit', 'Created At'];
    const rows = filteredEntries.flatMap(entry =>
      entry.lines.map(line => [
        escapeCSV(entry.entryNumber),
        escapeCSV(format(new Date(entry.date), 'yyyy-MM-dd')),
        escapeCSV(entry.description),
        escapeCSV(entry.reference || ''),
        escapeCSV(`${line.account?.code || 'N/A'} - ${line.account?.name || 'Unknown'}`),
        line.debit,
        line.credit,
        escapeCSV(format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm:ss'))
      ])
    );
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Master Ledger
          </h1>
          <p className="text-muted-foreground mt-1">Complete journal entries across all accounts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEntries} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-xl font-bold">{filteredEntries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Debits</p>
            <p className="text-xl font-bold text-red-600">{formatAmount(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="text-xl font-bold text-green-600">{formatAmount(totalCredits)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8"
              />
            </div>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              placeholder="End Date"
            />
            <Button
              onClick={() => setFilters({ startDate: '', endDate: '', search: '' })}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">Loading entries...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No entries found</div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card key={entry._id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{entry.entryNumber}</Badge>
                        <Badge variant={entry.isPosted ? 'default' : 'secondary'} className="text-xs">
                          {entry.isPosted ? 'Posted' : 'Draft'}
                        </Badge>
                        <span className="font-semibold">{entry.description}</span>
                        {entry.reference && <span className="text-xs text-muted-foreground">({entry.reference})</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="py-2">Code</TableHead>
                          <TableHead className="py-2">Account</TableHead>
                          <TableHead className="py-2">Type</TableHead>
                          <TableHead className="text-right py-2">Debit</TableHead>
                          <TableHead className="text-right py-2">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.lines.map((line, idx) => (
                          <TableRow key={idx} className="text-sm">
                            <TableCell className="font-mono py-2">{line.account?.code || 'N/A'}</TableCell>
                            <TableCell className="py-2">{line.account?.name || 'Unknown'}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-xs capitalize">{line.account?.type || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono py-2">
                              {line.debit > 0 ? <span className="text-red-600">{formatAmount(line.debit)}</span> : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono py-2">
                              {line.credit > 0 ? <span className="text-green-600">{formatAmount(line.credit)}</span> : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50 text-sm">
                          <TableCell colSpan={3} className="text-right py-2">Total</TableCell>
                          <TableCell className="text-right text-red-600 py-2">{formatAmount(entry.totalDebit)}</TableCell>
                          <TableCell className="text-right text-green-600 py-2">{formatAmount(entry.totalCredit)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
