'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCreateEntryShortcut } from '@/hooks/useKeyboardShortcuts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter, Plus, TrendingUp, TrendingDown, ArrowLeft, RefreshCw, Edit, FileText, Image } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface LedgerEntry {
  _id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  journalEntryId: {
    entryNumber: string;
    reference: string;
  };
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  currentBalance: number;
}

interface AccountLedgerProps {
  accountId?: string;
}

const AccountLedger: React.FC<AccountLedgerProps> = ({ accountId: propAccountId }) => {
  const params = useParams();
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const accountId = propAccountId || (params.id as string);
  
  const [account, setAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { getRowProps, selectedIndex } = useKeyboardNavigation({
    items: entries,
    onSelect: (entry) => {
      setSelectedEntry(entry);
      setSelectedEntries(new Set([entry._id]));
      setShowViewDialog(true);
    },
    enabled: !loading && entries.length > 0
  });

  useEffect(() => {
    if (entries.length > 0 && selectedIndex >= 0) {
      setSelectedEntry(entries[selectedIndex]);
      setSelectedEntries(new Set([entries[selectedIndex]._id]));
    }
  }, [selectedIndex, entries]);

  useCreateEntryShortcut(() => {
    router.push(`/dashboard/finance/journal-entry?accountId=${accountId}`);
  }, true);

  const fetchAccountLedger = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/ledger?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch account ledger');

      const data = await response.json();
      setAccount(data.account);
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchAccountLedger();
    }
  }, [accountId, filters]);



  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const exportLedger = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('export', 'true');

      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/ledger?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to export ledger');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${account?.code}-${account?.name}-ledger.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const exportInvoice = async (format: 'pdf' | 'jpg') => {
    const entryIds = Array.from(selectedEntries);
    if (entryIds.length === 0) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/export-invoice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ entryIds, format, accountId })
      });

      if (!response.ok) throw new Error('Failed to export invoice');

      const html = await response.text();
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
      setShowExportMenu(false);
    } catch (err) {
      console.error('Export invoice failed:', err);
    }
  };

  const toggleEntrySelection = (entryId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedEntries(prev => {
        const newSet = new Set(prev);
        if (newSet.has(entryId)) newSet.delete(entryId);
        else newSet.add(entryId);
        return newSet;
      });
    } else {
      const entry = entries.find(entry => entry._id === entryId);
      setSelectedEntry(entry || null);
      setSelectedEntries(new Set([entryId]));
      if (entry) setShowViewDialog(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowViewDialog(false);
        setShowEditDialog(false);
        setShowExportMenu(false);
      } else if (e.key === 'Enter' && showViewDialog) {
        e.preventDefault();
        setShowViewDialog(false);
        setShowEditDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showViewDialog, showEditDialog, showExportMenu]);

  if (loading && !account) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button onClick={fetchAccountLedger} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDebits = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = entries.reduce((sum, e) => sum + e.credit, 0);
  const netChange = totalDebits - totalCredits;

  return (
    <div className="p-6 space-y-6">
      {account && (
        <>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      Account Ledger
                      <Badge variant="outline" className="capitalize text-sm">{account.type}</Badge>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono font-semibold text-blue-600">{account.code}</span> • {account.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchAccountLedger} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {selectedEntries.size > 0 && (
                    <div className="relative">
                      <Button onClick={() => setShowExportMenu(!showExportMenu)} size="sm" variant="default">
                        <FileText className="w-4 h-4 mr-2" />
                        Export Invoice ({selectedEntries.size})
                      </Button>
                      {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50">
                          <button onClick={() => exportInvoice('pdf')} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> PDF
                          </button>
                          <button onClick={() => exportInvoice('jpg')} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                            <Image className="w-4 h-4" /> JPG
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <Button onClick={() => router.push('/dashboard/finance/journal-entry')} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                  </Button>
                  <Button onClick={exportLedger} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-t-4 border-t-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Balance</p>
                    <p className="text-3xl font-bold mt-2">{formatAmount(account.currentBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Debits</p>
                    <p className="text-3xl font-bold mt-2 text-red-600">{formatAmount(totalDebits)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Credits</p>
                    <p className="text-3xl font-bold mt-2 text-green-600">{formatAmount(totalCredits)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className={`border-t-4 ${netChange >= 0 ? 'border-t-green-500' : 'border-t-red-500'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Change</p>
                    <p className={`text-3xl font-bold mt-2 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netChange >= 0 ? '+' : '-'}{formatAmount(Math.abs(netChange))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setFilters({ startDate: '', endDate: '', page: 1, limit: 50 })}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner className="w-8 h-8" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No ledger entries found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Journal Entry</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, idx) => (
                    <TableRow 
                      key={entry._id}
                      {...getRowProps(idx)}
                      onClick={(e) => toggleEntrySelection(entry._id, e)}
                    >
                      <TableCell className="font-medium">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">
                        {entry.reference}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="outline">{entry.journalEntryId?.entryNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debit > 0 ? (
                          <span className="font-semibold text-red-600">{formatAmount(entry.debit)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit > 0 ? (
                          <span className="font-semibold text-green-600">{formatAmount(entry.credit)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatAmount(entry.balance)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {entries.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Showing {entries.length} entries {selectedEntries.size > 0 && `• ${selectedEntries.size} selected`}</span>
                    <div className="flex gap-4">
                      <span className="text-gray-600">Total Debits: <span className="font-semibold text-red-600">{formatAmount(totalDebits)}</span></span>
                      <span className="text-gray-600">Total Credits: <span className="font-semibold text-green-600">{formatAmount(totalCredits)}</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEntry && showViewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowViewDialog(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Ledger Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p className="text-sm font-medium mt-1">{format(new Date(selectedEntry.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label>Reference</Label>
                  <p className="text-sm font-medium mt-1">{selectedEntry.reference}</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm font-medium mt-1">{selectedEntry.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Debit</Label>
                  <p className="text-sm font-semibold text-red-600 mt-1">{selectedEntry.debit > 0 ? formatAmount(selectedEntry.debit) : '-'}</p>
                </div>
                <div>
                  <Label>Credit</Label>
                  <p className="text-sm font-semibold text-green-600 mt-1">{selectedEntry.credit > 0 ? formatAmount(selectedEntry.credit) : '-'}</p>
                </div>
                <div>
                  <Label>Balance</Label>
                  <p className={`text-sm font-bold mt-1 ${selectedEntry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatAmount(selectedEntry.balance)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close (Esc)</Button>
                <Button onClick={() => { setShowViewDialog(false); setShowEditDialog(true); }}>
                  <Edit className="w-4 h-4 mr-2" />Edit (Enter)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedEntry && showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditDialog(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit Ledger Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" defaultValue={selectedEntry.date.split('T')[0]} />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input defaultValue={selectedEntry.reference} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input defaultValue={selectedEntry.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Debit</Label>
                  <Input type="number" step="0.01" defaultValue={selectedEntry.debit} />
                </div>
                <div>
                  <Label>Credit</Label>
                  <Input type="number" step="0.01" defaultValue={selectedEntry.credit} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button onClick={() => {
                  // TODO: Implement save logic
                  setShowEditDialog(false);
                }}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountLedger;
