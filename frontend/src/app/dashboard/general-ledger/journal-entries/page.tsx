'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Trash2, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface JournalLine {
  accountId: string;
  accountName?: string;
  accountCode?: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  createdAt: string;
}

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
  isGroup: boolean;
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const [entriesRes, accountsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/journal-entries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.journalEntries || []);
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        const accountsData = data.accounts || data || [];
        const accountsArray = Array.isArray(accountsData) ? accountsData : [];
        setAccounts(accountsArray.filter((a: Account) => !a.isGroup));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const postEntry = async (id: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/journal-entries/${id}/post`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error posting entry:', error);
    }
  };

  const JournalForm = () => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' }
      ]
    });

    const addLine = () => {
      setFormData({
        ...formData,
        lines: [...formData.lines, { accountId: '', debit: 0, credit: 0, description: '' }]
      });
    };

    const updateLine = (index: number, field: string, value: any) => {
      const newLines = [...formData.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      setFormData({ ...formData, lines: newLines });
    };

    const removeLine = (index: number) => {
      if (formData.lines.length > 2) {
        setFormData({
          ...formData,
          lines: formData.lines.filter((_, i) => i !== index)
        });
      }
    };

    const totalDebit = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isBalanced) {
        alert('Debits must equal credits');
        return;
      }

      try {
        const token = localStorage.getItem('auth-token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/journal-entries`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          fetchData();
          setShowDialog(false);
        }
      } catch (error) {
        console.error('Error creating journal entry:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Date *</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div>
            <Label>Reference</Label>
            <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="REF-001" />
          </div>
          <div className="col-span-1" />
        </div>

        <div>
          <Label>Description *</Label>
          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={2} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Journal Lines</Label>
            <Button type="button" size="sm" variant="outline" onClick={addLine}>
              <Plus className="w-4 h-4 mr-2" />Add Line
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Account</TableHead>
                  <TableHead className="w-[20%]">Debit</TableHead>
                  <TableHead className="w-[20%]">Credit</TableHead>
                  <TableHead className="w-[15%]">Description</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select value={line.accountId} onValueChange={(value) => updateLine(index, 'accountId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(accounts) && accounts.map(acc => (
                            <SelectItem key={acc._id} value={acc._id}>
                              {acc.code} - {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} placeholder="Line desc" />
                    </TableCell>
                    <TableCell>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(index)} disabled={formData.lines.length <= 2}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell>₹{totalDebit.toFixed(2)}</TableCell>
                  <TableCell>₹{totalCredit.toFixed(2)}</TableCell>
                  <TableCell colSpan={2}>
                    <Badge variant={isBalanced ? 'default' : 'destructive'}>
                      {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button type="submit" disabled={!isBalanced}>Create Entry</Button>
        </div>
      </form>
    );
  };

  const filteredEntries = filterStatus === 'all' 
    ? entries 
    : entries.filter(e => filterStatus === 'posted' ? e.isPosted : !e.isPosted);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Create and manage accounting journal entries</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />New Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Posted</p>
                <p className="text-2xl font-bold">{entries.filter(e => e.isPosted).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold">{entries.filter(e => !e.isPosted).length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Journal Entries ({filteredEntries.length})</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="posted">Posted Only</SelectItem>
                <SelectItem value="draft">Draft Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(entry.date).toLocaleDateString('en-IN')}
                    </div>
                  </TableCell>
                  <TableCell>{entry.reference || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{entry.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.isPosted ? 'default' : 'secondary'}>
                      {entry.isPosted ? 'Posted' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!entry.isPosted && (
                      <Button size="sm" onClick={() => postEntry(entry._id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />Post
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
          </DialogHeader>
          <JournalForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
