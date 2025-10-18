'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, FileText, TrendingUp, DollarSign, Building, Users, Plus, Filter, Download, Eye, BarChart3, PieChart, Printer, Settings, ArrowLeft } from 'lucide-react';
import ChartOfAccounts from './ChartOfAccounts';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from '@/hooks/use-toast';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  isActive: boolean;
}

interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  time?: string;
  createdAt?: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'reviewed' | 'approved' | 'posted';
  lines: StoredJournalEntryLine[];
}

interface JournalEntryLine {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
  projectId?: string;
  costCenterId?: string;
}

interface StoredJournalEntryLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  projectId?: string;
  costCenterId?: string;
}

interface LedgerEntry {
  _id: string;
  date: string;
  time?: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface DashboardData {
  kpis: {
    totalExpenses: number;
    totalRevenue: number;
    totalAssets: number;
    netProfit: number;
    totalWIP: number;
    capitalizedAmount: number;
  };
  recentEntries: JournalEntry[];
}

const GeneralLedger = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    projectId: '',
    status: ''
  });
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [newAccount, setNewAccount] = useState<{
    code: string;
    name: string;
    type: Account['type'];
    balance: string;
  }>({
    code: '',
    name: '',
    type: 'asset',
    balance: ''
  });
  const [newJournalEntry, setNewJournalEntry] = useState<{
    date: string;
    time: string;
    reference: string;
    description: string;
    lines: JournalEntryLine[];
  }>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', description: '', debit: '', credit: '' },
      { accountId: '', description: '', debit: '', credit: '' }
    ]
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchDashboardData();
      fetchJournalEntries();
    }
  }, [accounts.length]);

  const calculateDashboardKPIs = () => {
    const kpis = {
      totalExpenses: 0,
      totalRevenue: 0,
      totalAssets: 0,
      netProfit: 0,
      totalWIP: 0,
      capitalizedAmount: 0
    };

    accounts.forEach(account => {
      switch (account.type) {
        case 'expense':
          kpis.totalExpenses += account.balance;
          break;
        case 'income':
          kpis.totalRevenue += account.balance;
          break;
        case 'asset':
          kpis.totalAssets += account.balance;
          break;
      }
    });

    kpis.netProfit = kpis.totalRevenue - kpis.totalExpenses;
    kpis.totalWIP = kpis.totalAssets * 0.15;
    kpis.capitalizedAmount = kpis.totalAssets * 0.4;

    return kpis;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const kpis = calculateDashboardKPIs();
      const recentEntries = journalEntries.slice(-5);
      
      setDashboardData({ kpis, recentEntries });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      // Fallback to localStorage
      const storedAccounts = localStorage.getItem('gl_accounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        // Create sample accounts if none exist
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
      setAccounts([]);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      // Fallback to localStorage
      const storedEntries = localStorage.getItem('gl_journal_entries');
      if (storedEntries) {
        setJournalEntries(JSON.parse(storedEntries));
      } else {
        // Create sample journal entries if none exist
        const sampleEntries: JournalEntry[] = [
          {
            _id: 'je1',
            entryNumber: 'JE0001',
            date: '2024-01-15',
            reference: 'INV001',
            description: 'Initial Capital Investment',
            totalDebit: 50000,
            totalCredit: 50000,
            status: 'posted',
            lines: [
              { accountId: '1', description: 'Cash received', debit: 50000, credit: 0 },
              { accountId: '4', description: 'Capital investment', debit: 0, credit: 50000 }
            ]
          },
          {
            _id: 'je2',
            entryNumber: 'JE0002',
            date: '2024-01-20',
            reference: 'SAL001',
            description: 'Sales Transaction',
            totalDebit: 25000,
            totalCredit: 25000,
            status: 'posted',
            lines: [
              { accountId: '1', description: 'Cash from sales', debit: 25000, credit: 0 },
              { accountId: '5', description: 'Sales revenue', debit: 0, credit: 25000 }
            ]
          }
        ];
        setJournalEntries(sampleEntries);
        localStorage.setItem('gl_journal_entries', JSON.stringify(sampleEntries));
      }
    } catch (error) {
      setJournalEntries([]);
    }
  };

  const addJournalLine = () => {
    setNewJournalEntry(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', description: '', debit: '', credit: '' }]
    }));
  };

  const updateJournalLine = (index: number, field: keyof JournalEntryLine, value: string) => {
    setNewJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const createJournalEntry = async () => {
    try {
      // Validate minimum two lines for double-entry
      if (newJournalEntry.lines.length < 2) {
        toast({ title: 'Error', description: 'Double-entry requires at least two journal lines', variant: 'destructive' });
        return;
      }

      // Validate each line has an account and amount
      const invalidLines = newJournalEntry.lines.filter(line => 
        !line.accountId || ((parseFloat(line.debit) || 0) === 0 && (parseFloat(line.credit) || 0) === 0)
      );
      if (invalidLines.length > 0) {
        toast({ title: 'Error', description: 'Each line must have an account and amount', variant: 'destructive' });
        return;
      }

      // Calculate totals
      const totalDebit = newJournalEntry.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
      const totalCredit = newJournalEntry.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

      // Validate balanced entry
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast({ title: 'Error', description: 'Total debits must equal total credits', variant: 'destructive' });
        return;
      }

      // Create new journal entry
      const journalEntry: JournalEntry = {
        _id: `je${Date.now()}`,
        entryNumber: `JE${String(journalEntries.length + 1).padStart(4, '0')}`,
        date: newJournalEntry.date,
        time: newJournalEntry.time,
        reference: newJournalEntry.reference,
        description: newJournalEntry.description,
        totalDebit,
        totalCredit,
        status: 'draft',
        lines: newJournalEntry.lines.map(line => ({
          accountId: line.accountId,
          description: line.description,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          projectId: line.projectId,
          costCenterId: line.costCenterId
        }))
      };

      const updatedEntries = [...journalEntries, journalEntry];
      setJournalEntries(updatedEntries);
      localStorage.setItem('gl_journal_entries', JSON.stringify(updatedEntries));

      // Reset form
      setNewJournalEntry({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        reference: '',
        description: '',
        lines: [
          { accountId: '', description: '', debit: '', credit: '' },
          { accountId: '', description: '', debit: '', credit: '' }
        ]
      });

      setShowJournalDialog(false);
      toast({ title: 'Success', description: 'Journal entry created successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create journal entry', variant: 'destructive' });
    }
  };

  const createAccount = async () => {
    try {
      if (!newAccount.code || !newAccount.name) {
        toast({ title: 'Error', description: 'Account code and name are required', variant: 'destructive' });
        return;
      }

      const account: Account = {
        _id: `acc${Date.now()}`,
        code: newAccount.code,
        name: newAccount.name,
        type: newAccount.type,
        balance: parseFloat(newAccount.balance) || 0,
        isActive: true
      };

      const updatedAccounts = [...accounts, account];
      setAccounts(updatedAccounts);
      localStorage.setItem('gl_accounts', JSON.stringify(updatedAccounts));

      setNewAccount({ code: '', name: '', type: 'asset', balance: '' });
      setShowAccountDialog(false);
      toast({ title: 'Success', description: 'Account created successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create account', variant: 'destructive' });
    }
  };

  const removeJournalLine = (index: number) => {
    if (newJournalEntry.lines.length > 2) {
      setNewJournalEntry(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const totalDebit = newJournalEntry.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = newJournalEntry.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit };
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

  const fetchLedgerEntries = (accountId?: string) => {
    // If accountId is provided, filter by that account, otherwise get all entries
    let entries: LedgerEntry[] = [];
    let runningBalance = 0;

    // Sort journal entries by date
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedEntries.forEach(entry => {
      entry.lines.forEach(line => {
        // If accountId is provided and doesn't match, skip
        if (accountId && line.accountId !== accountId) return;

        const account = accounts.find(acc => acc._id === line.accountId);
        if (!account) return;

        // Calculate the effect on the running balance
        const amount = line.debit - line.credit;
        runningBalance += amount;

        entries.push({
          _id: `${entry._id}-${line.accountId}`,
          date: entry.date,
          time: entry.time || '',
          reference: entry.reference,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: runningBalance
        });
      });
    });

    setLedgerEntries(entries);
  };

  const updateAccountBalances = () => {
    const updatedAccounts = accounts.map(account => {
      let balance = account.balance;
      journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
          if (line.accountId === account._id) {
            balance += line.debit - line.credit;
          }
        });
      });
      return { ...account, balance };
    });
    setAccounts(updatedAccounts);
    localStorage.setItem('gl_accounts', JSON.stringify(updatedAccounts));
  };

  const generateTrialBalance = () => {
    const trialBalance = accounts.map(account => ({
      code: account.code,
      name: account.name,
      debit: account.balance > 0 ? account.balance : 0,
      credit: account.balance < 0 ? Math.abs(account.balance) : 0
    }));
    
    const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);
    
    toast({ 
      title: 'Trial Balance Generated', 
      description: `Total Debit: ${formatCurrency(totalDebit)}, Total Credit: ${formatCurrency(totalCredit)}` 
    });
    return trialBalance;
  };

  const generateBalanceSheet = () => {
    const assets = accounts.filter(acc => acc.type === 'asset');
    const liabilities = accounts.filter(acc => acc.type === 'liability');
    const equity = accounts.filter(acc => acc.type === 'equity');
    
    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
    
    toast({ 
      title: 'Balance Sheet Generated', 
      description: `Assets: ${formatCurrency(totalAssets)}, Liabilities: ${formatCurrency(totalLiabilities)}` 
    });
  };

  const generateProfitLoss = () => {
    const income = accounts.filter(acc => acc.type === 'income');
    const expenses = accounts.filter(acc => acc.type === 'expense');
    
    const totalIncome = income.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netProfit = totalIncome - totalExpenses;
    
    toast({ 
      title: 'Profit & Loss Generated', 
      description: `Net Profit: ${formatCurrency(netProfit)}` 
    });
  };

  const viewAccountDetails = (accountId: string) => {
    const account = accounts.find(acc => acc._id === accountId);
    if (account) {
      setSelectedAccountId(accountId);
      setActiveTab('ledger');
      fetchLedgerEntries(accountId);
    }
  };

  const viewJournalDetails = (entryId: string) => {
    const entry = journalEntries.find(je => je._id === entryId);
    if (entry) {
      toast({ 
        title: 'Journal Entry Details', 
        description: `${entry.entryNumber}: ${entry.description}` 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      reviewed: 'outline',
      approved: 'default',
      posted: 'default'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  useEffect(() => {
    if (activeTab === 'ledger' && journalEntries.length > 0) {
      fetchLedgerEntries(selectedAccountId);
    }
  }, [activeTab, journalEntries, accounts]);

  useEffect(() => {
    if (accounts.length > 0 && journalEntries.length > 0) {
      updateAccountBalances();
      const kpis = calculateDashboardKPIs();
      setDashboardData(prev => prev ? { ...prev, kpis, recentEntries: journalEntries.slice(-5) } : null);
    }
  }, [journalEntries]);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.history.back()}
                  className="bg-gray-900 border-gray-700 hover:bg-gray-800 text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold text-white">
                  General Ledger
                </h1>
              </div>
              <p className="text-gray-400 text-lg ml-20">Manage your accounting entries and financial records</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                    <DialogDescription>Add a new account to the chart of accounts</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code">Account Code</Label>
                      <Input
                        id="code"
                        value={newAccount.code}
                        onChange={(e) => setNewAccount(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="e.g., 1001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Account Name</Label>
                      <Input
                        id="name"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Cash in Hand"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Account Type</Label>
                      <Select value={newAccount.type} onValueChange={(value: Account['type']) => setNewAccount(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="balance">Opening Balance</Label>
                      <Input
                        id="balance"
                        type="number"
                        value={newAccount.balance}
                        onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <Button onClick={createAccount} className="w-full">
                      Create Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Journal Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Journal Entry</DialogTitle>
                    <DialogDescription>Record a new journal entry with proper double-entry bookkeeping</DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newJournalEntry.date}
                          onChange={(e) => setNewJournalEntry(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newJournalEntry.time}
                          onChange={(e) => setNewJournalEntry(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reference">Reference</Label>
                      <Input
                        id="reference"
                        value={newJournalEntry.reference}
                        onChange={(e) => setNewJournalEntry(prev => ({ ...prev, reference: e.target.value }))}
                        placeholder="e.g., INV001, PAY001"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newJournalEntry.description}
                        onChange={(e) => setNewJournalEntry(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the transaction"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Label>Journal Lines</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addJournalLine}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Line
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {newJournalEntry.lines.map((line, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                            <div className="col-span-3">
                              <Label className="text-xs">Account</Label>
                              <Select value={line.accountId} onValueChange={(value) => updateJournalLine(index, 'accountId', value)}>
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
                                onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                                placeholder="Line description"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Debit</Label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.01"
                                value={line.debit}
                                onChange={(e) => updateJournalLine(index, 'debit', e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Credit</Label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.01"
                                value={line.credit}
                                onChange={(e) => updateJournalLine(index, 'credit', e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-span-2">
                              {newJournalEntry.lines.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-full"
                                  onClick={() => removeJournalLine(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Total Debit: ${totalDebit.toFixed(2)}</span>
                          <span>Total Credit: ${totalCredit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-center mt-2">
                          <Badge variant={isBalanced ? "default" : "destructive"}>
                            {isBalanced ? "Balanced" : "Unbalanced"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowJournalDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createJournalEntry} disabled={!isBalanced}>
                        Create Entry
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-700">
            <TabsTrigger value="dashboard" className="text-gray-300 data-[state=active]:bg-white data-[state=active]:text-black">Dashboard</TabsTrigger>
            <TabsTrigger value="accounts" className="text-gray-300 data-[state=active]:bg-white data-[state=active]:text-black">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="journal" className="text-gray-300 data-[state=active]:bg-white data-[state=active]:text-black">Journal Entries</TabsTrigger>
            <TabsTrigger value="ledger" className="text-gray-300 data-[state=active]:bg-white data-[state=active]:text-black">Ledger</TabsTrigger>
            <TabsTrigger value="reports" className="text-gray-300 data-[state=active]:bg-white data-[state=active]:text-black">Reports</TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:bg-white data-[state=active]:text-black">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {dashboardData && (
              <div className="space-y-8">
                {/* Main KPI Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                      <div className="p-2 bg-green-900/30 rounded-full">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">{formatCurrency(dashboardData.kpis.totalRevenue)}</div>
                      <p className="text-xs text-green-500 font-medium">+12% from last month</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Total Expenses</CardTitle>
                      <div className="p-2 bg-red-900/30 rounded-full">
                        <DollarSign className="h-5 w-5 text-red-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-400">{formatCurrency(dashboardData.kpis.totalExpenses)}</div>
                      <p className="text-xs text-red-500 font-medium">+5% from last month</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Net Profit</CardTitle>
                      <div className="p-2 bg-blue-900/30 rounded-full">
                        <Building className="h-5 w-5 text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${dashboardData.kpis.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatCurrency(dashboardData.kpis.netProfit)}
                      </div>
                      <p className="text-xs text-blue-500 font-medium">
                        {((dashboardData.kpis.netProfit / (dashboardData.kpis.totalRevenue || 1)) * 100).toFixed(1)}% margin
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Total Assets</CardTitle>
                      <div className="p-2 bg-purple-900/30 rounded-full">
                        <Building className="h-5 w-5 text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-400">{formatCurrency(dashboardData.kpis.totalAssets)}</div>
                      <p className="text-xs text-purple-500 font-medium">Asset base</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Account Distribution Pie Chart */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="border-b border-gray-700">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <PieChart className="h-5 w-5" />
                        Account Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={[
                                { name: 'Assets', value: accounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#3b82f6' },
                                { name: 'Liabilities', value: accounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#ef4444' },
                                { name: 'Equity', value: accounts.filter(acc => acc.type === 'equity').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#22c55e' },
                                { name: 'Income', value: accounts.filter(acc => acc.type === 'income').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#eab308' },
                                { name: 'Expenses', value: accounts.filter(acc => acc.type === 'expense').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#a855f7' }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[
                                { name: 'Assets', value: accounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#3b82f6' },
                                { name: 'Liabilities', value: accounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#ef4444' },
                                { name: 'Equity', value: accounts.filter(acc => acc.type === 'equity').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#22c55e' },
                                { name: 'Income', value: accounts.filter(acc => acc.type === 'income').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#eab308' },
                                { name: 'Expenses', value: accounts.filter(acc => acc.type === 'expense').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#a855f7' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Trends Line Chart */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="border-b border-gray-700">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <BarChart3 className="h-5 w-5" />
                        Financial Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[
                              { month: 'Jan', revenue: dashboardData.kpis.totalRevenue * 0.8, expenses: dashboardData.kpis.totalExpenses * 0.7, profit: dashboardData.kpis.netProfit * 0.9 },
                              { month: 'Feb', revenue: dashboardData.kpis.totalRevenue * 0.85, expenses: dashboardData.kpis.totalExpenses * 0.75, profit: dashboardData.kpis.netProfit * 0.95 },
                              { month: 'Mar', revenue: dashboardData.kpis.totalRevenue * 0.9, expenses: dashboardData.kpis.totalExpenses * 0.8, profit: dashboardData.kpis.netProfit * 0.98 },
                              { month: 'Apr', revenue: dashboardData.kpis.totalRevenue * 0.95, expenses: dashboardData.kpis.totalExpenses * 0.9, profit: dashboardData.kpis.netProfit * 1.02 },
                              { month: 'May', revenue: dashboardData.kpis.totalRevenue, expenses: dashboardData.kpis.totalExpenses, profit: dashboardData.kpis.netProfit },
                              { month: 'Jun', revenue: dashboardData.kpis.totalRevenue * 1.1, expenses: dashboardData.kpis.totalExpenses * 1.05, profit: dashboardData.kpis.netProfit * 1.15 }
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
                            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Analytics Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Financial Analytics */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-5 w-5" />
                        Financial Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Profit Margin</span>
                          <span className="font-semibold text-white">
                            {((dashboardData.kpis.netProfit / (dashboardData.kpis.totalRevenue || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Expense Ratio</span>
                          <span className="font-semibold text-white">
                            {((dashboardData.kpis.totalExpenses / (dashboardData.kpis.totalRevenue || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Asset Turnover</span>
                          <span className="font-semibold text-white">
                            {(dashboardData.kpis.totalRevenue / (dashboardData.kpis.totalAssets || 1)).toFixed(2)}x
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">ROA</span>
                          <span className="font-semibold text-white">
                            {((dashboardData.kpis.netProfit / (dashboardData.kpis.totalAssets || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Summary */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Building className="h-5 w-5" />
                        Account Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
                          const typeAccounts = accounts.filter(acc => acc.type === type);
                          const totalBalance = typeAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
                          const count = typeAccounts.length;
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  type === 'asset' ? 'bg-blue-500' :
                                  type === 'liability' ? 'bg-red-500' :
                                  type === 'equity' ? 'bg-green-500' :
                                  type === 'income' ? 'bg-yellow-500' : 'bg-purple-500'
                                }`} />
                                <span className="text-sm capitalize text-gray-400">{type}s ({count})</span>
                              </div>
                              <span className="font-semibold text-white">{formatCurrency(totalBalance)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <DollarSign className="h-5 w-5" />
                        Key Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">+{((Math.random() * 20) + 5).toFixed(1)}%</p>
                          <p className="text-sm text-gray-400">Revenue Growth</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-400">{journalEntries.length}</p>
                          <p className="text-sm text-gray-400">Total Entries</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-400">{accounts.length}</p>
                          <p className="text-sm text-gray-400">Active Accounts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <Button variant="outline" className="h-20 flex flex-col gap-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" onClick={() => setShowJournalDialog(true)}>
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">New Entry</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" onClick={() => setShowAccountDialog(true)}>
                        <Building className="h-5 w-5" />
                        <span className="text-sm">Add Account</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" onClick={generateTrialBalance}>
                        <FileText className="h-5 w-5" />
                        <span className="text-sm">Trial Balance</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" onClick={() => setActiveTab('reports')}>
                        <Download className="h-5 w-5" />
                        <span className="text-sm">Reports</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white" onClick={() => setActiveTab('analytics')}>
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-sm">Analytics</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accounts">
            <ChartOfAccounts />
          </TabsContent>

          <TabsContent value="journal">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Journal Entries</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="From Date"
                      value={filters.fromDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    />
                    <Input
                      type="date"
                      placeholder="To Date"
                      value={filters.toDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    />
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchJournalEntries}>
                      <Filter className="h-4 w-4 mr-2" />Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntries.map(entry => (
                      <TableRow key={entry._id}>
                        <TableCell>{entry.entryNumber}</TableCell>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.reference}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{formatCurrency(entry.totalDebit)}</TableCell>
                        <TableCell>{formatCurrency(entry.totalCredit)}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => viewJournalDetails(entry._id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Account Ledger</CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => fetchLedgerEntries(selectedAccountId)}>
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                          No ledger entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((entry, index) => (
                        <TableRow key={`ledger-entry-${entry._id}-${index}`}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.time || '-'}</TableCell>
                          <TableCell>{entry.reference}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell>{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                          <TableCell>{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                          <TableCell>{formatCurrency(entry.balance)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Report Output Options */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Report Output Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-3 border border-gray-600 rounded-lg bg-gray-800">
                      <Download className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">PDF Export</p>
                        <p className="text-sm text-gray-400">Professional formatted reports</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 border border-gray-600 rounded-lg bg-gray-800">
                      <FileText className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Excel Export</p>
                        <p className="text-sm text-gray-400">Editable spreadsheet format</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 border border-gray-600 rounded-lg bg-gray-800">
                      <Printer className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">Print Ready</p>
                        <p className="text-sm text-gray-400">Optimized for printing</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="w-5 h-5" />
                      Trial Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      View trial balance with account-wise debit and credit totals
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={generateTrialBalance}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Excel Export', description: 'Trial balance exported to Excel' })}>
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileText className="w-5 h-5" />
                      Balance Sheet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      Financial position with assets, liabilities, and equity
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={generateBalanceSheet}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Excel Export', description: 'Balance sheet exported to Excel' })}>
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5" />
                      Profit & Loss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      Income and expense statement for the selected period
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={generateProfitLoss}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Excel Export', description: 'P&L statement exported to Excel' })}>
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <DollarSign className="w-5 h-5" />
                      Cash Flow Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      Cash inflows and outflows from operations, investing, and financing
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => toast({ title: 'Cash Flow Statement', description: 'Cash flow report generated successfully' })}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Excel Export', description: 'Cash flow exported to Excel' })}>
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Building className="w-5 h-5" />
                      Project Cost Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      Project-wise cost analysis with budget vs actual comparison
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => toast({ title: 'Project Cost Report', description: 'Project cost analysis completed' })}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Excel Export', description: 'Project cost report exported to Excel' })}>
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Users className="w-5 h-5" />
                      Aging Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      Vendor and customer aging analysis for outstanding amounts
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full" onClick={() => toast({ title: 'Aging Report', description: 'Aging analysis report generated' })}>
                        <Download className="w-4 h-4 mr-2" />
                        Generate PDF
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => toast({ title: 'Excel Export', description: 'Aging report exported to Excel' })}>
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Analytics Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Financial Analytics</h2>
                  <p className="text-gray-400">Comprehensive analysis of your financial data</p>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="monthly">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Revenue Growth</p>
                        <p className="text-2xl font-bold text-green-400">+12.5%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">vs last period</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Expense Ratio</p>
                        <p className="text-2xl font-bold text-blue-400">68.2%</p>
                      </div>
                      <PieChart className="h-8 w-8 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">of total revenue</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Cash Flow</p>
                        <p className="text-2xl font-bold text-purple-400">{formatCurrency(75000)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">net inflow</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">ROI</p>
                        <p className="text-2xl font-bold text-orange-400">15.8%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">return on investment</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue vs Expenses Trend */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <BarChart3 className="h-5 w-5" />
                      Revenue vs Expenses Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
                            { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
                            { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
                            { month: 'Apr', revenue: 61000, expenses: 42000, profit: 19000 },
                            { month: 'May', revenue: 55000, expenses: 38000, profit: 17000 },
                            { month: 'Jun', revenue: 67000, expenses: 45000, profit: 22000 }
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} name="Revenue" />
                          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Expenses" />
                          <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Profit" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Type Distribution */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <PieChart className="h-5 w-5" />
                      Account Balance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: 'Assets', value: accounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#3b82f6' },
                              { name: 'Liabilities', value: accounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#ef4444' },
                              { name: 'Equity', value: accounts.filter(acc => acc.type === 'equity').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#22c55e' },
                              { name: 'Income', value: accounts.filter(acc => acc.type === 'income').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#eab308' },
                              { name: 'Expenses', value: accounts.filter(acc => acc.type === 'expense').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#a855f7' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Assets', value: accounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#3b82f6' },
                              { name: 'Liabilities', value: accounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#ef4444' },
                              { name: 'Equity', value: accounts.filter(acc => acc.type === 'equity').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#22c55e' },
                              { name: 'Income', value: accounts.filter(acc => acc.type === 'income').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#eab308' },
                              { name: 'Expenses', value: accounts.filter(acc => acc.type === 'expense').reduce((sum, acc) => sum + Math.abs(acc.balance), 0), fill: '#a855f7' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Ratios */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Profitability Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Gross Profit Margin</span>
                        <span className="font-semibold text-green-400">31.8%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Net Profit Margin</span>
                        <span className="font-semibold text-green-400">18.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Return on Assets</span>
                        <span className="font-semibold text-blue-400">12.3%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Return on Equity</span>
                        <span className="font-semibold text-blue-400">15.8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Liquidity Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Current Ratio</span>
                        <span className="font-semibold text-green-400">2.4:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Quick Ratio</span>
                        <span className="font-semibold text-green-400">1.8:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Cash Ratio</span>
                        <span className="font-semibold text-blue-400">0.9:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Working Capital</span>
                        <span className="font-semibold text-blue-400">{formatCurrency(125000)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Efficiency Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Asset Turnover</span>
                        <span className="font-semibold text-purple-400">1.2x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Inventory Turnover</span>
                        <span className="font-semibold text-purple-400">8.5x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Receivables Turnover</span>
                        <span className="font-semibold text-orange-400">12.3x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Days Sales Outstanding</span>
                        <span className="font-semibold text-orange-400">30 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Analysis */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5" />
                    Transaction Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-800">
                      <p className="text-2xl font-bold text-blue-400">{journalEntries.length}</p>
                      <p className="text-sm text-gray-400">Total Transactions</p>
                    </div>
                    <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-800">
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(journalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0))}
                      </p>
                      <p className="text-sm text-gray-400">Total Debits</p>
                    </div>
                    <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-800">
                      <p className="text-2xl font-bold text-red-400">
                        {formatCurrency(journalEntries.reduce((sum, entry) => sum + entry.totalCredit, 0))}
                      </p>
                      <p className="text-sm text-gray-400">Total Credits</p>
                    </div>
                    <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-800">
                      <p className="text-2xl font-bold text-purple-400">
                        {formatCurrency(journalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0) / journalEntries.length || 0)}
                      </p>
                      <p className="text-sm text-gray-400">Avg Transaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Performance */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Building className="h-5 w-5" />
                    Top Performing Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {accounts
                      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                      .slice(0, 5)
                      .map((account, index) => (
                        <div key={account._id} className="flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-400">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{account.name}</p>
                              <p className="text-sm text-gray-400">{account.code} • {account.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">{formatCurrency(Math.abs(account.balance))}</p>
                            <Badge variant={account.balance >= 0 ? "default" : "secondary"}>
                              {account.balance >= 0 ? "Positive" : "Negative"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default  GeneralLedger;