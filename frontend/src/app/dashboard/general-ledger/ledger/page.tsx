'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Download, Filter, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface LedgerEntry {
  _id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  journalEntryId: { entryNumber: string };
}

interface Account {
  _id: string;
  code: string;
  name: string;
}

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchLedgerEntries();
    }
  }, [selectedAccount, filters]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts`, {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      const ledgers = (data.accounts || []).filter((a: Account & { isGroup?: boolean }) => !a.isGroup);
      setAccounts(ledgers);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLedgerEntries = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${selectedAccount}/ledger?${params}`,
        { headers, credentials: 'include' }
      );
      
      if (!res.ok) {
        console.error('Failed to fetch ledger:', res.status, res.statusText);
        setEntries([]);
        return;
      }
      
      const data = await res.json();
      console.log('Ledger data received:', data);
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const exportLedger = () => {
    const account = accounts.find(a => a._id === selectedAccount);
    const csv = [
      ['Date', 'Description', 'Reference', 'Journal Entry', 'Debit', 'Credit', 'Balance'],
      ...entries.map(e => [
        format(new Date(e.date), 'yyyy-MM-dd'),
        e.description,
        e.reference,
        e.journalEntryId?.entryNumber || '',
        e.debit.toFixed(2),
        e.credit.toFixed(2),
        e.balance.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${account?.code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  const handleAddEntry = async (formData: any) => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/journal-entries`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create entry' }));
        throw new Error(error.message || 'Failed to create entry');
      }
      const entry = await res.json();
      
      // Auto-post the entry
      const postRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/journal-entries/${entry._id}/post`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });
      if (!postRes.ok) {
        const error = await postRes.json().catch(() => ({ message: 'Failed to post entry' }));
        throw new Error(error.message || 'Failed to post entry');
      }
      
      setShowAddDialog(false);
      fetchLedgerEntries();
      alert('Entry added successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to add entry');
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 dark:text-gray-100">
            <BookOpen className="w-8 h-8" />
            General Ledger
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View all account transactions</p>
        </div>
        {selectedAccount && (
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <Button onClick={exportLedger} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setFilters({ startDate: '', endDate: '' })}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">Ledger entries are created when journal entries are posted.</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    To see entries here: Create a journal entry → Post it → Entries will appear in this ledger
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Debits</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{totalDebit.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Credits</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{totalCredit.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Balance</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{(totalDebit - totalCredit).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ledger Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No ledger entries found for this account.</p>
                  <p className="text-xs">Ledger entries are created when journal entries are posted.</p>
                </div>
              ) : (
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
                    {entries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {entry.journalEntryId?.entryNumber}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                          {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                          {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          ₹{entry.balance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Ledger Entry</DialogTitle>
          </DialogHeader>
          <AddEntryForm onSubmit={handleAddEntry} onCancel={() => setShowAddDialog(false)} accounts={accounts} selectedAccountId={selectedAccount} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddEntryForm({ onSubmit, onCancel, accounts, selectedAccountId }: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    debit: 0,
    credit: 0,
    offsetAccountId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.offsetAccountId || (!formData.debit && !formData.credit)) {
      alert('Please fill all required fields');
      return;
    }

    const lines = formData.debit > 0 ? [
      { accountId: selectedAccountId, description: formData.description, debit: formData.debit, credit: 0 },
      { accountId: formData.offsetAccountId, description: formData.description, debit: 0, credit: formData.debit }
    ] : [
      { accountId: selectedAccountId, description: formData.description, debit: 0, credit: formData.credit },
      { accountId: formData.offsetAccountId, description: formData.description, debit: formData.credit, credit: 0 }
    ];

    onSubmit({
      date: formData.date,
      reference: formData.reference,
      description: formData.description,
      lines
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date *</Label>
          <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
        </div>
        <div>
          <Label>Reference</Label>
          <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="REF001" />
        </div>
      </div>
      <div>
        <Label>Description *</Label>
        <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
      </div>
      <div>
        <Label>Offset Account *</Label>
        <Select value={formData.offsetAccountId} onValueChange={(value) => setFormData({ ...formData, offsetAccountId: value })}>
          <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
          <SelectContent>
            {accounts.filter((a: any) => !a.isGroup && a._id !== selectedAccountId).map((acc: any) => (
              <SelectItem key={acc._id} value={acc._id}>{acc.code} - {acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Debit</Label>
          <Input type="number" step="0.01" value={formData.debit || ''} onChange={(e) => setFormData({ ...formData, debit: parseFloat(e.target.value) || 0, credit: 0 })} disabled={formData.credit > 0} />
        </div>
        <div>
          <Label>Credit</Label>
          <Input type="number" step="0.01" value={formData.credit || ''} onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) || 0, debit: 0 })} disabled={formData.debit > 0} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Entry</Button>
      </div>
    </form>
  );
}
