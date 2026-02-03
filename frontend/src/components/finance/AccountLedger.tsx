'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCreateEntryShortcut } from '@/hooks/useKeyboardShortcuts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter, Plus, TrendingUp, TrendingDown, ArrowLeft, RefreshCw, Edit, FileText, Image, Paperclip, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface LedgerEntry {
  _id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  journalEntryId: string | {
    _id: string;
    entryNumber: string;
    reference: string;
    description: string;
    date: string;
    entries: Array<{
      account: { code: string; name: string };
      debit: number;
      credit: number;
      description: string;
    }>;
    createdBy: { name: string };
    status: string;
    attachments?: string[];
  };
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  currentBalance: number;
  description?: string;
  category?: string;
  subCategory?: string;
  isActive?: boolean;
}

interface AccountLedgerProps {
  accountId?: string;
}

const AccountLedger: React.FC<AccountLedgerProps> = ({ accountId: propAccountId }) => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { formatAmount } = useCurrencyFormat();
  const accountId = propAccountId || (params.id as string);
  
  const [account, setAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    from: '',
    to: '',
    page: 1,
    limit: 50
  });
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
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
      if (filters.from) queryParams.append('from', filters.from);
      if (filters.to) queryParams.append('to', filters.to);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const token = localStorage.getItem('auth-token');
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/ledger?${queryParams}`;
      console.log('=== FETCHING ACCOUNT LEDGER ===');
      console.log('URL:', url);
      console.log('Account ID:', accountId);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch account ledger');
      }

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Account:', data.account);
      console.log('Entries count:', data.entries?.length);
      
      setAccount(data.account);
      setEntries(data.entries);
    } catch (err) {
      console.error('=== FETCH ERROR ===', err);
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

  const exportWhole = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.from) queryParams.append('from', filters.from);
      if (filters.to) queryParams.append('to', filters.to);
      queryParams.append('format', 'csv');

      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/export?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${account?.code}-ledger-full.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const exportSelected = async () => {
    const entryIds = Array.from(selectedEntries);
    if (entryIds.length === 0) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/export-selected`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ entryIds, from: filters.from, to: filters.to })
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${account?.code}-ledger-selected.csv`;
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
        body: JSON.stringify({ entryIds, format, accountId, from: filters.from, to: filters.to })
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

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEntries(new Set());
      setSelectAll(false);
    } else {
      setSelectedEntries(new Set(entries.map(e => e._id)));
      setSelectAll(true);
    }
  };

  const toggleEntryCheckbox = (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) newSet.delete(entryId);
      else newSet.add(entryId);
      return newSet;
    });
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
        setShowExportMenu(false);
      } else if (e.key === 'Enter' && showViewDialog && selectedEntry) {
        e.preventDefault();
        const jeId = typeof selectedEntry.journalEntryId === 'string' 
          ? selectedEntry.journalEntryId 
          : selectedEntry.journalEntryId?._id;
        if (jeId) {
          setShowViewDialog(false);
          router.push(`/dashboard/finance/journal-entry?edit=${jeId}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showViewDialog, showExportMenu, selectedEntry, router]);

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
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="space-y-2">
                    <div>
                      <h1 className="text-2xl font-bold flex items-center gap-2">
                        Account Ledger
                        <Badge variant="outline" className="capitalize text-sm">{account.type}</Badge>
                        {account.isActive === false && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-mono font-semibold text-blue-600">{account.code}</span> • {account.name}
                      </p>
                    </div>
                    {(account.description || account.category || account.subCategory) && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {account.description && <p>📝 {account.description}</p>}
                        {account.category && <p>📂 Category: {account.category}</p>}
                        {account.subCategory && <p>📁 Sub-category: {account.subCategory}</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchAccountLedger} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => router.push(`/dashboard/finance/journal-entry?accountId=${accountId}`)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                  </Button>
                  <div className="relative">
                    <Button onClick={() => setShowExportMenu(!showExportMenu)} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export {selectedEntries.size > 0 && `(${selectedEntries.size})`}
                    </Button>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                        <button onClick={() => { exportWhole(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                          <Download className="w-4 h-4" /> Export All
                        </button>
                        {selectedEntries.size > 0 && (
                          <button onClick={() => { exportSelected(); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Selected ({selectedEntries.size})
                          </button>
                        )}
                        <button onClick={() => { exportInvoice('pdf'); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Invoice PDF
                        </button>
                      </div>
                    )}
                  </div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <Label htmlFor="from">From Account</Label>
              <Input
                id="from"
                type="text"
                placeholder="Account code/name"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="to">To Account</Label>
              <Input
                id="to"
                type="text"
                placeholder="Account code/name"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setFilters({ startDate: '', endDate: '', from: '', to: '', page: 1, limit: 50 })}
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
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Journal Entry</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, idx) => {
                    const isDebit = entry.debit > 0;
                    const direction = isDebit ? 'To' : 'From';
                    const otherAccount = typeof entry.journalEntryId === 'object' ? entry.journalEntryId?.entries?.find(e => e.account.code !== account?.code) : undefined;
                    return (
                    <TableRow 
                      key={entry._id}
                      {...getRowProps(idx)}
                      onClick={(e) => toggleEntrySelection(entry._id, e)}
                      className={`cursor-pointer ${selectedEntries.has(entry._id) ? 'bg-blue-50' : ''} ${entry.reference === highlightId ? 'bg-yellow-100 border-2 border-yellow-400' : ''}`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry._id)}
                          onChange={(e) => toggleEntryCheckbox(entry._id, e)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell>
                        {otherAccount && (
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="outline" className="text-xs">{direction}</Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium truncate max-w-[150px]">{otherAccount.account.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">
                        {entry.reference}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="outline">{typeof entry.journalEntryId === 'object' ? entry.journalEntryId?.entryNumber : 'N/A'}</Badge>
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
                  )})}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewDialog(false)}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Complete Entry Details</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Journal Entry: {typeof selectedEntry.journalEntryId === 'string' ? 'N/A' : selectedEntry.journalEntryId?.entryNumber}
                  </p>
                </div>
                <Badge variant={typeof selectedEntry.journalEntryId === 'object' && selectedEntry.journalEntryId?.status === 'posted' ? 'default' : 'secondary'}>
                  {typeof selectedEntry.journalEntryId === 'object' ? selectedEntry.journalEntryId?.status || 'N/A' : 'N/A'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Account Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-sm text-blue-900 mb-3">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-blue-700">Account Code</Label>
                    <p className="text-sm font-mono font-semibold mt-1">{account?.code}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-blue-700">Account Name</Label>
                    <p className="text-sm font-medium mt-1">{account?.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-blue-700">Account Type</Label>
                    <p className="text-sm font-medium mt-1 capitalize">{account?.type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-blue-700">Current Balance</Label>
                    <p className="text-sm font-bold mt-1">{formatAmount(account?.currentBalance || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Entry Details */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Entry Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <p className="text-sm font-medium mt-1">{format(new Date(selectedEntry.date), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Reference</Label>
                    <p className="text-sm font-mono font-medium mt-1">{selectedEntry.reference || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Description</Label>
                    <p className="text-sm font-medium mt-1">{selectedEntry.description}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Debit Amount</Label>
                    <p className="text-lg font-bold text-red-600 mt-1">{selectedEntry.debit > 0 ? formatAmount(selectedEntry.debit) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Credit Amount</Label>
                    <p className="text-lg font-bold text-green-600 mt-1">{selectedEntry.credit > 0 ? formatAmount(selectedEntry.credit) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Running Balance</Label>
                    <p className={`text-lg font-bold mt-1 ${selectedEntry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(selectedEntry.balance)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Created By</Label>
                    <p className="text-sm font-medium mt-1">{typeof selectedEntry.journalEntryId === 'object' ? selectedEntry.journalEntryId?.createdBy?.name || 'N/A' : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Full Double Entry */}
              {typeof selectedEntry.journalEntryId === 'object' && selectedEntry.journalEntryId?.entries && selectedEntry.journalEntryId.entries.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">Complete Double Entry (All Accounts)</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Account Code</TableHead>
                          <TableHead className="font-semibold">Account Name</TableHead>
                          <TableHead className="font-semibold">From/To</TableHead>
                          <TableHead className="font-semibold">Description</TableHead>
                          <TableHead className="text-right font-semibold">Debit</TableHead>
                          <TableHead className="text-right font-semibold">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEntry.journalEntryId.entries.map((entry, idx) => {
                          const isDebit = entry.debit > 0;
                          const direction = isDebit ? 'To' : 'From';
                          return (
                          <TableRow key={idx} className={entry.account.code === account?.code ? 'bg-blue-50' : ''}>
                            <TableCell className="font-mono font-semibold">{entry.account.code}</TableCell>
                            <TableCell className="font-medium">{entry.account.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{direction}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{entry.description || '-'}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-red-600">
                              {entry.debit > 0 ? formatAmount(entry.debit) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-600">
                              {entry.credit > 0 ? formatAmount(entry.credit) : '-'}
                            </TableCell>
                          </TableRow>
                        )})}
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell colSpan={4} className="text-right">Total:</TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            {formatAmount(selectedEntry.journalEntryId.entries.reduce((sum, e) => sum + e.debit, 0))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            {formatAmount(selectedEntry.journalEntryId.entries.reduce((sum, e) => sum + e.credit, 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">* Highlighted row indicates the current account</p>
                </div>
              )}

              {/* Journal Entry Info */}
              {typeof selectedEntry.journalEntryId === 'object' && selectedEntry.journalEntryId?.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-xs">Journal Entry Description</Label>
                  <p className="text-sm font-medium mt-1">{selectedEntry.journalEntryId.description}</p>
                </div>
              )}

              {/* Attachments */}
              {typeof selectedEntry.journalEntryId === 'object' && selectedEntry.journalEntryId?.attachments && Array.isArray(selectedEntry.journalEntryId.attachments) && selectedEntry.journalEntryId.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({selectedEntry.journalEntryId.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedEntry.journalEntryId.attachments.map((attachment: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{attachment.split('/').pop()}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${attachment}`, '_blank')}>
                          <Download className="w-4 h-4 mr-2" />Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => exportInvoice('pdf')}>
                  <Download className="w-4 h-4 mr-2" />Export PDF
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close (Esc)</Button>
                  <Button variant="outline" onClick={() => {
                    const jeId = typeof selectedEntry.journalEntryId === 'string' 
                      ? selectedEntry.journalEntryId 
                      : selectedEntry.journalEntryId?._id;
                    if (jeId) {
                      setShowViewDialog(false);
                      router.push(`/dashboard/finance/journal-entry/${jeId}`);
                    }
                  }}>
                    <FileText className="w-4 h-4 mr-2" />View Full Entry
                  </Button>
                  <Button onClick={() => {
                    const jeId = typeof selectedEntry.journalEntryId === 'string' 
                      ? selectedEntry.journalEntryId 
                      : selectedEntry.journalEntryId?._id;
                    if (jeId) {
                      setShowViewDialog(false);
                      router.push(`/dashboard/finance/journal-entry?edit=${jeId}`);
                    }
                  }}>
                    <Edit className="w-4 h-4 mr-2" />Edit Entry (Enter)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
};

export default AccountLedger;
