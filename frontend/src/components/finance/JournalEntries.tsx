'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, FileText, Search, Filter, Download, Eye, Edit, Trash2, Copy, Check, X, Calendar, Clock, DollarSign, Building, Users, AlertCircle, CheckCircle, Printer, Settings, Upload, RefreshCw, ArrowLeft, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  time: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'reviewed' | 'approved' | 'posted' | 'reversed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lines: JournalEntryLine[];
  attachments?: string[];
  tags?: string[];
  projectId?: string;
  departmentId?: string;
  reversalOf?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

interface JournalEntryLine {
  _id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description: string;
  debit: number;
  credit: number;
  projectId?: string;
  departmentId?: string;
  costCenterId?: string;
  taxCode?: string;
  reference?: string;
}

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  isActive: boolean;
}

const JournalEntries = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    createdBy: 'all',
    project: 'all'
  });

  const [newEntry, setNewEntry] = useState<{
    date: string;
    time: string;
    reference: string;
    description: string;
    lines: Omit<JournalEntryLine, '_id'>[];
    tags: string[];
    projectId: string;
    departmentId: string;
    isRecurring: boolean;
    recurringPattern: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', description: '', debit: 0, credit: 0 },
      { accountId: '', description: '', debit: 0, credit: 0 }
    ],
    tags: [],
    projectId: '',
    departmentId: '',
    isRecurring: false,
    recurringPattern: ''
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    reviewed: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    posted: 'bg-purple-100 text-purple-800',
    reversed: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, filters]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const storedEntries = localStorage.getItem('journal_entries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        // Sample data
        const sampleEntries: JournalEntry[] = [
          {
            _id: 'je1',
            entryNumber: 'JE0001',
            date: '2024-01-15',
            time: '10:30:00',
            reference: 'INV001',
            description: 'Initial Capital Investment',
            totalDebit: 50000,
            totalCredit: 50000,
            status: 'posted',
            createdBy: 'John Doe',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            lines: [
              { accountId: '1', accountCode: '1001', accountName: 'Cash', description: 'Cash received', debit: 50000, credit: 0 },
              { accountId: '4', accountCode: '3001', accountName: 'Capital', description: 'Capital investment', debit: 0, credit: 50000 }
            ],
            tags: ['capital', 'investment'],
            projectId: 'proj1'
          }
        ];
        setEntries(sampleEntries);
        localStorage.setItem('journal_entries', JSON.stringify(sampleEntries));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch journal entries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const storedAccounts = localStorage.getItem('gl_accounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        const sampleAccounts: Account[] = [
          { _id: '1', code: '1001', name: 'Cash in Hand', type: 'asset', balance: 50000, isActive: true },
          { _id: '2', code: '1002', name: 'Bank Account', type: 'asset', balance: 100000, isActive: true },
          { _id: '3', code: '2001', name: 'Accounts Payable', type: 'liability', balance: 25000, isActive: true },
          { _id: '4', code: '3001', name: 'Capital', type: 'equity', balance: 125000, isActive: true },
          { _id: '5', code: '4001', name: 'Sales Revenue', type: 'income', balance: 75000, isActive: true },
          { _id: '6', code: '5001', name: 'Office Expenses', type: 'expense', balance: 15000, isActive: true }
        ];
        setAccounts(sampleAccounts);
        localStorage.setItem('gl_accounts', JSON.stringify(sampleAccounts));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(entry => entry.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => entry.date <= filters.dateTo);
    }

    // Amount filters
    if (filters.amountFrom) {
      filtered = filtered.filter(entry => entry.totalDebit >= parseFloat(filters.amountFrom));
    }
    if (filters.amountTo) {
      filtered = filtered.filter(entry => entry.totalDebit <= parseFloat(filters.amountTo));
    }

    setFilteredEntries(filtered);
  };

  const addLine = () => {
    setNewEntry(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', description: '', debit: 0, credit: 0 }]
    }));
  };

  const updateLine = (index: number, field: keyof Omit<JournalEntryLine, '_id'>, value: any) => {
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const removeLine = (index: number) => {
    if (newEntry.lines.length > 2) {
      setNewEntry(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const totalDebit = newEntry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = newEntry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return { totalDebit, totalCredit };
  };

  const createEntry = async () => {
    try {
      const { totalDebit, totalCredit } = calculateTotals();
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast({ title: 'Error', description: 'Debits must equal credits', variant: 'destructive' });
        return;
      }

      const entry: JournalEntry = {
        _id: editingEntry?._id || `je${Date.now()}`,
        entryNumber: editingEntry?.entryNumber || `JE${String(entries.length + 1).padStart(4, '0')}`,
        date: newEntry.date,
        time: newEntry.time,
        reference: newEntry.reference,
        description: newEntry.description,
        totalDebit,
        totalCredit,
        status: 'draft',
        createdBy: 'Current User',
        createdAt: editingEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lines: newEntry.lines.map(line => ({
          ...line,
          accountCode: accounts.find(acc => acc._id === line.accountId)?.code,
          accountName: accounts.find(acc => acc._id === line.accountId)?.name
        })),
        tags: newEntry.tags,
        projectId: newEntry.projectId,
        departmentId: newEntry.departmentId,
        isRecurring: newEntry.isRecurring,
        recurringPattern: newEntry.recurringPattern
      };

      let updatedEntries;
      if (editingEntry) {
        updatedEntries = entries.map(e => e._id === editingEntry._id ? entry : e);
      } else {
        updatedEntries = [...entries, entry];
      }

      setEntries(updatedEntries);
      localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
      
      resetForm();
      setShowDialog(false);
      toast({ title: 'Success', description: `Journal entry ${editingEntry ? 'updated' : 'created'} successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save journal entry', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', description: '', debit: 0, credit: 0 },
        { accountId: '', description: '', debit: 0, credit: 0 }
      ],
      tags: [],
      projectId: '',
      departmentId: '',
      isRecurring: false,
      recurringPattern: ''
    });
    setEditingEntry(null);
  };

  const editEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      date: entry.date,
      time: entry.time,
      reference: entry.reference,
      description: entry.description,
      lines: entry.lines.map(line => ({
        accountId: line.accountId,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
        projectId: line.projectId,
        departmentId: line.departmentId,
        costCenterId: line.costCenterId,
        taxCode: line.taxCode,
        reference: line.reference
      })),
      tags: entry.tags || [],
      projectId: entry.projectId || '',
      departmentId: entry.departmentId || '',
      isRecurring: entry.isRecurring || false,
      recurringPattern: entry.recurringPattern || ''
    });
    setShowDialog(true);
  };

  const deleteEntry = (entryId: string) => {
    const updatedEntries = entries.filter(e => e._id !== entryId);
    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
    toast({ title: 'Success', description: 'Journal entry deleted successfully' });
  };

  const duplicateEntry = (entry: JournalEntry) => {
    const duplicated = {
      ...entry,
      _id: `je${Date.now()}`,
      entryNumber: `JE${String(entries.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedEntries = [...entries, duplicated];
    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
    toast({ title: 'Success', description: 'Journal entry duplicated successfully' });
  };

  const updateStatus = (entryId: string, newStatus: JournalEntry['status']) => {
    const updatedEntries = entries.map(entry =>
      entry._id === entryId ? { ...entry, status: newStatus, updatedAt: new Date().toISOString() } : entry
    );
    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
    toast({ title: 'Success', description: `Entry status updated to ${newStatus}` });
  };

  const bulkAction = (action: string) => {
    if (selectedEntries.length === 0) {
      toast({ title: 'Warning', description: 'Please select entries first', variant: 'destructive' });
      return;
    }

    let updatedEntries = [...entries];
    
    switch (action) {
      case 'approve':
        updatedEntries = entries.map(entry =>
          selectedEntries.includes(entry._id) ? { ...entry, status: 'approved' as const } : entry
        );
        break;
      case 'post':
        updatedEntries = entries.map(entry =>
          selectedEntries.includes(entry._id) ? { ...entry, status: 'posted' as const } : entry
        );
        break;
      case 'delete':
        updatedEntries = entries.filter(entry => !selectedEntries.includes(entry._id));
        break;
    }

    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
    setSelectedEntries([]);
    toast({ title: 'Success', description: `Bulk ${action} completed successfully` });
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.history.back()}
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Journal Entries
                </h1>
              </div>
              <p className="text-gray-600 text-lg ml-20">Create and manage accounting journal entries</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    New Entry
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEntry ? 'Edit' : 'Create'} Journal Entry</DialogTitle>
                <DialogDescription>
                  {editingEntry ? 'Update the journal entry details' : 'Create a new journal entry with proper double-entry bookkeeping'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Header Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEntry.time}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      value={newEntry.reference}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, reference: e.target.value }))}
                      placeholder="e.g., INV001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select value={newEntry.projectId} onValueChange={(value) => setNewEntry(prev => ({ ...prev, projectId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="proj1">Project Alpha</SelectItem>
                        <SelectItem value="proj2">Project Beta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the transaction"
                    rows={2}
                  />
                </div>

                {/* Journal Lines */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Journal Lines</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {newEntry.lines.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                        <div className="col-span-3">
                          <Label className="text-xs">Account</Label>
                          <Select value={line.accountId} onValueChange={(value) => updateLine(index, 'accountId', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map(account => (
                                <SelectItem key={account._id} value={account._id}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Description</Label>
                          <Input
                            className="h-8"
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            placeholder="Line description"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Debit</Label>
                          <Input
                            className="h-8"
                            type="number"
                            step="0.01"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Credit</Label>
                          <Input
                            className="h-8"
                            type="number"
                            step="0.01"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-2">
                          {newEntry.lines.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-full"
                              onClick={() => removeLine(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="flex justify-between text-sm">
                      <span>Total Debit: {formatCurrency(totalDebit)}</span>
                      <span>Total Credit: {formatCurrency(totalCredit)}</span>
                    </div>
                    <div className="flex justify-center mt-2">
                      <Badge variant={isBalanced ? "default" : "destructive"}>
                        {isBalanced ? "Balanced" : "Unbalanced"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recurring"
                      checked={newEntry.isRecurring}
                      onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, isRecurring: checked }))}
                    />
                    <Label htmlFor="recurring">Recurring Entry</Label>
                  </div>
                  {newEntry.isRecurring && (
                    <div>
                      <Label htmlFor="pattern">Recurring Pattern</Label>
                      <Select value={newEntry.recurringPattern} onValueChange={(value) => setNewEntry(prev => ({ ...prev, recurringPattern: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEntry} disabled={!isBalanced}>
                    {editingEntry ? 'Update' : 'Create'} Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Debits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(entries.reduce((sum, entry) => sum + entry.totalDebit, 0))}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posted Entries</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {entries.filter(e => e.status === 'posted').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft Entries</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {entries.filter(e => e.status === 'draft').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg p-1">
          <TabsTrigger value="entries" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">All Entries</TabsTrigger>
          <TabsTrigger value="drafts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Drafts</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">Pending Approval</TabsTrigger>
          <TabsTrigger value="posted" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Posted</TabsTrigger>
          <TabsTrigger value="recurring" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Journal Entries
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-36 bg-white/80 backdrop-blur-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="reversed">Reversed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>

              {selectedEntries.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
                  <span className="text-sm text-blue-700 font-semibold">
                    {selectedEntries.length} entry(ies) selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={() => bulkAction('approve')} className="bg-white/80 backdrop-blur-sm border-green-200 text-green-700 hover:bg-green-50">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkAction('post')} className="bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50">
                      <Check className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" onClick={() => bulkAction('delete')}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEntries(filteredEntries.map(entry => entry._id));
                          } else {
                            setSelectedEntries([]);
                          }
                        }}
                        className="border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Entry #</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Reference</TableHead>
                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created By</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map(entry => (
                    <TableRow key={entry._id} className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200">
                      <TableCell>
                        <Checkbox
                          checked={selectedEntries.includes(entry._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEntries(prev => [...prev, entry._id]);
                            } else {
                              setSelectedEntries(prev => prev.filter(id => id !== entry._id));
                            }
                          }}
                          className="border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">{entry.entryNumber}</TableCell>
                      <TableCell className="text-gray-700">{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-gray-700 font-medium">{entry.reference}</TableCell>
                      <TableCell className="max-w-xs truncate text-gray-700">{entry.description}</TableCell>
                      <TableCell className="text-right font-bold text-gray-900">{formatCurrency(entry.totalDebit)}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[entry.status]} font-medium shadow-sm`}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">{entry.createdBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => {}} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-blue-50 hover:border-blue-300">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => editEntry(entry)} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-green-50 hover:border-green-300">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => duplicateEntry(entry)} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-purple-50 hover:border-purple-300">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteEntry(entry._id)} className="bg-white/80 backdrop-blur-sm border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Draft Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Draft entries will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Entries pending approval will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posted">
          <Card>
            <CardHeader>
              <CardTitle>Posted Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Posted entries will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Recurring entries will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default JournalEntries;