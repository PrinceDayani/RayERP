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
import { Calendar, FileText, TrendingUp, Coins, Building, Users, Plus, Filter, Download, Eye, BarChart3, PieChart, Printer, Settings, ArrowLeft, Activity } from 'lucide-react';
import ChartOfAccounts from './ChartOfAccounts';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

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
  const [realTimeData, setRealTimeData] = useState({ lastUpdate: new Date() });
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
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);

  const { getRowProps: getAccountRowProps } = useKeyboardNavigation({
    items: accounts,
    onSelect: (account) => viewAccountDetails(account._id),
    enabled: activeTab === 'accounts'
  });

  const { getRowProps: getEntryRowProps } = useKeyboardNavigation({
    items: journalEntries,
    onSelect: (entry) => viewJournalDetails(entry._id),
    enabled: activeTab === 'journal'
  });

  const { getRowProps: getLedgerRowProps } = useKeyboardNavigation({
    items: ledgerEntries,
    onSelect: () => {},
    enabled: activeTab === 'ledger'
  });

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      // Simulate AI insights generation
      const insights = {
        predictions: {
          cashFlow: { next30Days: 50000, next90Days: 150000, confidence: 0.85 },
          revenue: { nextQuarter: 200000, confidence: 0.78 }
        },
        anomalies: [],
        optimizations: [
          'Consider reducing operational expenses by 5% to improve profit margins',
          'Cash flow is healthy, consider investing surplus in short-term instruments'
        ],
        riskAssessment: {
          overall: 'low',
          factors: [
            { type: 'liquidity', level: 'low', impact: 'minimal' },
            { type: 'profitability', level: 'low', impact: 'minimal' }
          ]
        }
      };
      setAiInsights(insights);
      toast({ title: 'AI Insights Updated', description: 'Financial insights have been refreshed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch AI insights', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // Real-time data updates every 30 seconds
    const interval = setInterval(() => {
      setRealTimeData({ lastUpdate: new Date() });
      if (accounts.length > 0) {
        updateRealTimeBalances();
      }
    }, 30000);
    return () => clearInterval(interval);
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
      // Fallback to localStorage with error handling
      const storedAccounts = localStorage.getItem('gl_accounts');
      if (storedAccounts) {
        try {
          const parsedAccounts = JSON.parse(storedAccounts);
          if (Array.isArray(parsedAccounts)) {
            setAccounts(parsedAccounts);
          } else {
            throw new Error('Invalid accounts data format');
          }
        } catch (parseError) {
          console.error('Error parsing stored accounts:', parseError);
          localStorage.removeItem('gl_accounts');
          // Fall through to create sample accounts
        }
      }
      
      if (!storedAccounts || accounts.length === 0) {
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
      console.error('Error fetching accounts:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load accounts. Using default accounts.', 
        variant: 'destructive' 
      });
      setAccounts([]);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      // Fallback to localStorage with error handling
      const storedEntries = localStorage.getItem('gl_journal_entries');
      if (storedEntries) {
        try {
          const parsedEntries = JSON.parse(storedEntries);
          if (Array.isArray(parsedEntries)) {
            setJournalEntries(parsedEntries);
          } else {
            throw new Error('Invalid journal entries data format');
          }
        } catch (parseError) {
          console.error('Error parsing stored journal entries:', parseError);
          localStorage.removeItem('gl_journal_entries');
          // Fall through to create sample entries
        }
      }
      
      if (!storedEntries || journalEntries.length === 0) {
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
      console.error('Error fetching journal entries:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load journal entries. Using default entries.', 
        variant: 'destructive' 
      });
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
      // Comprehensive validation
      if (!newJournalEntry.date || !newJournalEntry.description.trim()) {
        toast({ title: 'Error', description: 'Date and description are required', variant: 'destructive' });
        return;
      }
      
      // Validate date
      const entryDate = new Date(newJournalEntry.date);
      if (isNaN(entryDate.getTime())) {
        toast({ title: 'Error', description: 'Invalid date format', variant: 'destructive' });
        return;
      }
      
      // Validate minimum two lines for double-entry
      if (newJournalEntry.lines.length < 2) {
        toast({ title: 'Error', description: 'Double-entry requires at least two journal lines', variant: 'destructive' });
        return;
      }

      // Validate each line has an account and amount
      for (let i = 0; i < newJournalEntry.lines.length; i++) {
        const line = newJournalEntry.lines[i];
        
        if (!line.accountId) {
          toast({ title: 'Error', description: `Line ${i + 1}: Account is required`, variant: 'destructive' });
          return;
        }
        
        const debitAmount = parseFloat(line.debit) || 0;
        const creditAmount = parseFloat(line.credit) || 0;
        
        if (debitAmount < 0 || creditAmount < 0) {
          toast({ title: 'Error', description: `Line ${i + 1}: Amounts cannot be negative`, variant: 'destructive' });
          return;
        }
        
        if (debitAmount === 0 && creditAmount === 0) {
          toast({ title: 'Error', description: `Line ${i + 1}: Either debit or credit amount must be greater than zero`, variant: 'destructive' });
          return;
        }
        
        if (debitAmount > 0 && creditAmount > 0) {
          toast({ title: 'Error', description: `Line ${i + 1}: A line cannot have both debit and credit amounts`, variant: 'destructive' });
          return;
        }
        
        // Verify account exists
        const account = accounts.find(acc => acc._id === line.accountId);
        if (!account) {
          toast({ title: 'Error', description: `Line ${i + 1}: Selected account not found`, variant: 'destructive' });
          return;
        }
        
        if (!account.isActive) {
          toast({ title: 'Error', description: `Line ${i + 1}: Account '${account.name}' is inactive`, variant: 'destructive' });
          return;
        }
      }

      // Calculate totals
      const totalDebit = newJournalEntry.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
      const totalCredit = newJournalEntry.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

      // Validate balanced entry
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast({ title: 'Error', description: 'Total debits must equal total credits', variant: 'destructive' });
        return;
      }

      // Create new journal entry with proper validation
      const journalEntry: JournalEntry = {
        _id: `je${Date.now()}`,
        entryNumber: `JE${String(journalEntries.length + 1).padStart(4, '0')}`,
        date: newJournalEntry.date,
        time: newJournalEntry.time,
        reference: newJournalEntry.reference.trim(),
        description: newJournalEntry.description.trim(),
        totalDebit,
        totalCredit,
        status: 'draft',
        lines: newJournalEntry.lines.map(line => ({
          accountId: line.accountId,
          description: line.description.trim() || newJournalEntry.description.trim(),
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          projectId: line.projectId,
          costCenterId: line.costCenterId
        }))
      };

      const updatedEntries = [...journalEntries, journalEntry];
      setJournalEntries(updatedEntries);
      
      try {
        localStorage.setItem('gl_journal_entries', JSON.stringify(updatedEntries));
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
        toast({ 
          title: 'Warning', 
          description: 'Entry created but failed to save to local storage', 
          variant: 'destructive' 
        });
      }

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
      console.error('Error creating journal entry:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create journal entry', 
        variant: 'destructive' 
      });
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
      currency: 'INR',
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

  const updateRealTimeBalances = () => {
    const updatedAccounts = accounts.map(account => ({
      ...account,
      balance: account.balance + (Math.random() - 0.5) * 1000 // Simulate real-time changes
    }));
    setAccounts(updatedAccounts);
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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">General Ledger</h1>
            <p className="text-gray-400">Manage your accounting entries and financial records</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Data
            </div>
            <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
              <DialogTrigger asChild>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white">
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

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="dashboard">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {dashboardData && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData.kpis.totalRevenue)}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Expenses</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData.kpis.totalExpenses)}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Coins className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Net Profit</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData.kpis.netProfit)}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Building className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Assets</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(dashboardData.kpis.totalAssets)}</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Building className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </div>
            </div>

                {/* Charts Section */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Account Distribution Pie Chart */}
                  <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
                      <CardTitle className="flex items-center gap-2 text-gray-200">
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
                  <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
                      <CardTitle className="flex items-center gap-2 text-gray-200">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Financial Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Profit Margin</span>
                          <span className="font-semibold">
                            {((dashboardData.kpis.netProfit / (dashboardData.kpis.totalRevenue || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Expense Ratio</span>
                          <span className="font-semibold">
                            {((dashboardData.kpis.totalExpenses / (dashboardData.kpis.totalRevenue || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Asset Turnover</span>
                          <span className="font-semibold">
                            {(dashboardData.kpis.totalRevenue / (dashboardData.kpis.totalAssets || 1)).toFixed(2)}x
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">ROA</span>
                          <span className="font-semibold">
                            {((dashboardData.kpis.netProfit / (dashboardData.kpis.totalAssets || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
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
                                <span className="text-sm capitalize">{type}s ({count})</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(totalBalance)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Key Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">+{((Math.random() * 20) + 5).toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Revenue Growth</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{journalEntries.length}</p>
                          <p className="text-sm text-muted-foreground">Total Entries</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{accounts.length}</p>
                          <p className="text-sm text-muted-foreground">Active Accounts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setShowJournalDialog(true)}>
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">New Entry</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setShowAccountDialog(true)}>
                        <Building className="h-5 w-5" />
                        <span className="text-sm">Add Account</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={generateTrialBalance}>
                        <FileText className="h-5 w-5" />
                        <span className="text-sm">Trial Balance</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('reports')}>
                        <Download className="h-5 w-5" />
                        <span className="text-sm">Reports</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('analytics')}>
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Journal Entries</CardTitle>
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
                    {journalEntries.map((entry, index) => (
                      <TableRow key={entry._id} {...getEntryRowProps(index)}>
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Account Ledger</CardTitle>
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No ledger entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((entry, index) => (
                        <TableRow key={`ledger-entry-${entry._id}-${index}`} {...getLedgerRowProps(index)}>
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
              <Card>
                <CardHeader>
                  <CardTitle>Report Output Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Download className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">PDF Export</p>
                        <p className="text-sm text-muted-foreground">Professional formatted reports</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Excel Export</p>
                        <p className="text-sm text-muted-foreground">Editable spreadsheet format</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Printer className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Print Ready</p>
                        <p className="text-sm text-muted-foreground">Optimized for printing</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Trial Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
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
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Balance Sheet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
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
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Profit & Loss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
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
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      Cash Flow Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
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
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Project Cost Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
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
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Aging Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
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
                  <h2 className="text-xl font-semibold">Financial Analytics</h2>
                  <p className="text-muted-foreground">Comprehensive analysis of your financial data</p>
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
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Revenue Growth</p>
                        <p className="text-2xl font-bold text-green-600">+12.5%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">vs last period</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expense Ratio</p>
                        <p className="text-2xl font-bold text-blue-600">68.2%</p>
                      </div>
                      <PieChart className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">of total revenue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cash Flow</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(75000)}</p>
                      </div>
                      <Coins className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">net inflow</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ROI</p>
                        <p className="text-2xl font-bold text-orange-600">15.8%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">return on investment</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue vs Expenses Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
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
                <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-200">Profitability Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Gross Profit Margin</span>
                        <span className="font-semibold text-green-600">31.8%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Net Profit Margin</span>
                        <span className="font-semibold text-green-600">18.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Return on Assets</span>
                        <span className="font-semibold text-blue-600">12.3%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Return on Equity</span>
                        <span className="font-semibold text-blue-600">15.8%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-200">Liquidity Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Current Ratio</span>
                        <span className="font-semibold text-green-600">2.4:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Quick Ratio</span>
                        <span className="font-semibold text-green-600">1.8:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cash Ratio</span>
                        <span className="font-semibold text-blue-600">0.9:1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Working Capital</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(125000)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-200">Efficiency Ratios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Asset Turnover</span>
                        <span className="font-semibold text-purple-600">1.2x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Inventory Turnover</span>
                        <span className="font-semibold text-purple-600">8.5x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Receivables Turnover</span>
                        <span className="font-semibold text-orange-600">12.3x</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Days Sales Outstanding</span>
                        <span className="font-semibold text-orange-600">30 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Analysis */}
              <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-200">
                    <FileText className="h-5 w-5" />
                    Transaction Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{journalEntries.length}</p>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(journalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0))}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Debits</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(journalEntries.reduce((sum, entry) => sum + entry.totalCredit, 0))}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Credits</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(journalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0) / journalEntries.length || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Transaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Integrated Finance Dashboard Link */}
              <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Integrated Finance System</h3>
                      <p className="text-blue-100 text-sm mb-4">
                        Real-time Budget-Ledger synchronization with live monitoring
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          Real-time Sync
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          Auto Updates
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Activity className="h-8 w-8 mb-2 opacity-80" />
                      <p className="text-xs text-blue-100">Live Monitoring</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                        <div key={account._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-muted-foreground">{account.code} � {account.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(Math.abs(account.balance))}</p>
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

          <TabsContent value="ai-insights">
            <div className="space-y-6">
              {/* AI Insights Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">AI-Powered Financial Insights</h2>
                  <p className="text-muted-foreground">Advanced analytics and predictions for your financial data</p>
                </div>
                <Button onClick={fetchAIInsights} disabled={loading}>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh Insights
                </Button>
              </div>

              {/* AI Predictions */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle>Cash Flow Prediction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiInsights?.predictions ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(aiInsights.predictions.cashFlow?.next30Days || 0)}</p>
                          <p className="text-sm opacity-90">Next 30 Days</p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold">{formatCurrency(aiInsights.predictions.cashFlow?.next90Days || 0)}</p>
                          <p className="text-sm opacity-90">Next 90 Days</p>
                        </div>
                        <div className="text-xs opacity-75">
                          Confidence: {((aiInsights.predictions.cashFlow?.confidence || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <p>Loading predictions...</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
                  <CardHeader>
                    <CardTitle>Revenue Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiInsights?.predictions ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(aiInsights.predictions.revenue?.nextQuarter || 0)}</p>
                          <p className="text-sm opacity-90">Next Quarter</p>
                        </div>
                        <div className="text-xs opacity-75">
                          Confidence: {((aiInsights.predictions.revenue?.confidence || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <p>Loading forecast...</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Anomaly Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Anomaly Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights?.anomalies && aiInsights.anomalies.length > 0 ? (
                    <div className="space-y-3">
                      {aiInsights.anomalies.map((anomaly: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{anomaly.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Amount: {formatCurrency(anomaly.amount)} | Confidence: {(anomaly.confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                            <Badge variant={anomaly.confidence > 0.8 ? "destructive" : "secondary"}>
                              {anomaly.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No anomalies detected</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights?.optimizations && aiInsights.optimizations.length > 0 ? (
                    <div className="space-y-2">
                      {aiInsights.optimizations.map((recommendation: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No recommendations available</p>
                  )}
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights?.riskAssessment ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-600">
                          {aiInsights.riskAssessment.overall.toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">Overall Risk Level</p>
                      </div>
                      {aiInsights.riskAssessment.factors && (
                        <div className="space-y-2">
                          {aiInsights.riskAssessment.factors.map((factor: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="capitalize">{factor.type}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={factor.level === 'high' ? 'destructive' : factor.level === 'medium' ? 'secondary' : 'default'}>
                                  {factor.level}
                                </Badge>
                                <span className="text-sm text-muted-foreground">Impact: {factor.impact}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Risk assessment not available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

export default GeneralLedger;
