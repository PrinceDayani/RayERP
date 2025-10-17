'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Download, Eye, Calendar, TrendingUp, DollarSign, Building, FileText, Printer, Settings, RefreshCw, BarChart3, PieChart, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  isActive: boolean;
  parentId?: string;
  description?: string;
}

interface LedgerEntry {
  _id: string;
  date: string;
  time?: string;
  entryNumber: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  accountId: string;
  projectId?: string;
  departmentId?: string;
  createdBy: string;
  status: 'draft' | 'posted' | 'reversed';
}

interface AccountSummary {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  transactionCount: number;
}

const Ledger = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountType: 'all',
    status: 'all',
    amountFrom: '',
    amountTo: '',
    project: 'all',
    department: 'all'
  });

  const [viewMode, setViewMode] = useState<'detailed' | 'summary' | 'chart'>('detailed');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchLedgerEntries();
  }, []);

  useEffect(() => {
    applyFilters();
    generateAccountSummaries();
  }, [ledgerEntries, selectedAccount, filters, searchTerm]);

  const fetchAccounts = async () => {
    try {
      const storedAccounts = localStorage.getItem('gl_accounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        const sampleAccounts: Account[] = [
          { _id: '1', code: '1001', name: 'Cash in Hand', type: 'asset', balance: 50000, isActive: true },
          { _id: '2', code: '1002', name: 'Bank Account - Main', type: 'asset', balance: 100000, isActive: true },
          { _id: '3', code: '1003', name: 'Accounts Receivable', type: 'asset', balance: 75000, isActive: true },
          { _id: '4', code: '1004', name: 'Inventory', type: 'asset', balance: 45000, isActive: true },
          { _id: '5', code: '2001', name: 'Accounts Payable', type: 'liability', balance: 25000, isActive: true },
          { _id: '6', code: '2002', name: 'Accrued Expenses', type: 'liability', balance: 15000, isActive: true },
          { _id: '7', code: '3001', name: 'Owner\'s Capital', type: 'equity', balance: 125000, isActive: true },
          { _id: '8', code: '3002', name: 'Retained Earnings', type: 'equity', balance: 85000, isActive: true },
          { _id: '9', code: '4001', name: 'Sales Revenue', type: 'income', balance: 150000, isActive: true },
          { _id: '10', code: '4002', name: 'Service Revenue', type: 'income', balance: 75000, isActive: true },
          { _id: '11', code: '5001', name: 'Office Expenses', type: 'expense', balance: 25000, isActive: true },
          { _id: '12', code: '5002', name: 'Salaries Expense', type: 'expense', balance: 80000, isActive: true }
        ];
        setAccounts(sampleAccounts);
        localStorage.setItem('gl_accounts', JSON.stringify(sampleAccounts));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch accounts', variant: 'destructive' });
    }
  };

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      const storedEntries = localStorage.getItem('ledger_entries');
      if (storedEntries) {
        setLedgerEntries(JSON.parse(storedEntries));
      } else {
        // Generate sample ledger entries
        const sampleEntries: LedgerEntry[] = [
          {
            _id: 'le1',
            date: '2024-01-15',
            time: '10:30:00',
            entryNumber: 'JE0001',
            reference: 'INV001',
            description: 'Initial capital investment',
            debit: 50000,
            credit: 0,
            balance: 50000,
            accountId: '1',
            createdBy: 'John Doe',
            status: 'posted'
          },
          {
            _id: 'le2',
            date: '2024-01-15',
            time: '10:30:00',
            entryNumber: 'JE0001',
            reference: 'INV001',
            description: 'Initial capital investment',
            debit: 0,
            credit: 50000,
            balance: 50000,
            accountId: '7',
            createdBy: 'John Doe',
            status: 'posted'
          },
          {
            _id: 'le3',
            date: '2024-01-20',
            time: '14:15:00',
            entryNumber: 'JE0002',
            reference: 'SAL001',
            description: 'Sales transaction',
            debit: 25000,
            credit: 0,
            balance: 75000,
            accountId: '1',
            createdBy: 'Jane Smith',
            status: 'posted'
          },
          {
            _id: 'le4',
            date: '2024-01-20',
            time: '14:15:00',
            entryNumber: 'JE0002',
            reference: 'SAL001',
            description: 'Sales transaction',
            debit: 0,
            credit: 25000,
            balance: 25000,
            accountId: '9',
            createdBy: 'Jane Smith',
            status: 'posted'
          }
        ];
        setLedgerEntries(sampleEntries);
        localStorage.setItem('ledger_entries', JSON.stringify(sampleEntries));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch ledger entries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ledgerEntries];

    // Account filter
    if (selectedAccount) {
      filtered = filtered.filter(entry => entry.accountId === selectedAccount);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(entry => entry.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => entry.date <= filters.dateTo);
    }

    // Account type filter
    if (filters.accountType !== 'all') {
      const accountsOfType = accounts.filter(acc => acc.type === filters.accountType);
      const accountIds = accountsOfType.map(acc => acc._id);
      filtered = filtered.filter(entry => accountIds.includes(entry.accountId));
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Amount filters
    if (filters.amountFrom) {
      filtered = filtered.filter(entry => 
        Math.max(entry.debit, entry.credit) >= parseFloat(filters.amountFrom)
      );
    }
    if (filters.amountTo) {
      filtered = filtered.filter(entry => 
        Math.max(entry.debit, entry.credit) <= parseFloat(filters.amountTo)
      );
    }

    // Sort entries
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof LedgerEntry];
      const bValue = b[sortConfig.key as keyof LedgerEntry];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEntries(filtered);
  };

  const generateAccountSummaries = () => {
    const summaries: AccountSummary[] = accounts.map(account => {
      const accountEntries = ledgerEntries.filter(entry => entry.accountId === account._id);
      
      const totalDebits = accountEntries.reduce((sum, entry) => sum + entry.debit, 0);
      const totalCredits = accountEntries.reduce((sum, entry) => sum + entry.credit, 0);
      
      // Calculate closing balance based on account type
      let closingBalance = account.balance;
      if (['asset', 'expense'].includes(account.type)) {
        closingBalance = account.balance + totalDebits - totalCredits;
      } else {
        closingBalance = account.balance + totalCredits - totalDebits;
      }

      return {
        accountId: account._id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        openingBalance: account.balance,
        totalDebits,
        totalCredits,
        closingBalance,
        transactionCount: accountEntries.length
      };
    });

    setAccountSummaries(summaries);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportLedger = () => {
    const csvContent = [
      ['Date', 'Entry #', 'Reference', 'Description', 'Debit', 'Credit', 'Balance', 'Account', 'Status'].join(','),
      ...filteredEntries.map(entry => {
        const account = accounts.find(acc => acc._id === entry.accountId);
        return [
          entry.date,
          entry.entryNumber,
          entry.reference,
          `"${entry.description}"`,
          entry.debit.toFixed(2),
          entry.credit.toFixed(2),
          entry.balance.toFixed(2),
          `"${account?.code} - ${account?.name}"`,
          entry.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${selectedAccount || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({ title: 'Success', description: 'Ledger exported successfully' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAccountBalanceData = () => {
    const selectedAccountData = accounts.find(acc => acc._id === selectedAccount);
    if (!selectedAccountData) return [];

    const accountEntries = ledgerEntries
      .filter(entry => entry.accountId === selectedAccount)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = selectedAccountData.balance;
    return accountEntries.map(entry => {
      if (['asset', 'expense'].includes(selectedAccountData.type)) {
        runningBalance += entry.debit - entry.credit;
      } else {
        runningBalance += entry.credit - entry.debit;
      }
      
      return {
        date: entry.date,
        balance: runningBalance,
        debit: entry.debit,
        credit: entry.credit
      };
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
            <p className="text-gray-600">View detailed account transactions and balances</p>
          </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLedger}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm border-gray-200 mb-6">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Filter className="h-5 w-5" />
              Filters & Options
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="account">Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Accounts</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={filters.accountType} onValueChange={(value) => setFilters(prev => ({ ...prev, accountType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="liability">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="viewMode">View Mode</Label>
              <Select value={viewMode} onValueChange={(value: 'detailed' | 'summary' | 'chart') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="chart">Chart View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => {
              setFilters({
                dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
                accountType: 'all',
                status: 'all',
                amountFrom: '',
                amountTo: '',
                project: 'all',
                department: 'all'
              });
              setSelectedAccount('');
              setSearchTerm('');
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'detailed' | 'summary' | 'chart')}>
        <TabsList>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="summary">Account Summary</TabsTrigger>
          <TabsTrigger value="chart">Chart Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Ledger Entries
                  {selectedAccount && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      - {accounts.find(acc => acc._id === selectedAccount)?.name}
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filteredEntries.length} entries
                  </Badge>
                  <Badge variant="outline">
                    Total: {formatCurrency(filteredEntries.reduce((sum, entry) => sum + Math.max(entry.debit, entry.credit), 0))}
                  </Badge>
                </div>
              </div>

              {selectedEntries.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedEntries.length} entry(ies) selected
                  </span>
                  <div className="flex gap-1 ml-auto">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Export Selected
                    </Button>
                    <Button size="sm" variant="outline">
                      <Printer className="h-4 w-4 mr-1" />
                      Print Selected
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
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
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1">
                        Date
                        <SortIcon column="date" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('entryNumber')}>
                      <div className="flex items-center gap-1">
                        Entry #
                        <SortIcon column="entryNumber" />
                      </div>
                    </TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    {!selectedAccount && <TableHead>Account</TableHead>}
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('debit')}>
                      <div className="flex items-center justify-end gap-1">
                        Debit
                        <SortIcon column="debit" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('credit')}>
                      <div className="flex items-center justify-end gap-1">
                        Credit
                        <SortIcon column="credit" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('balance')}>
                      <div className="flex items-center justify-end gap-1">
                        Balance
                        <SortIcon column="balance" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map(entry => {
                    const account = accounts.find(acc => acc._id === entry.accountId);
                    return (
                      <TableRow key={entry._id}>
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
                          />
                        </TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{entry.entryNumber}</TableCell>
                        <TableCell>{entry.reference}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        {!selectedAccount && (
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{account?.code}</div>
                              <div className="text-muted-foreground">{account?.name}</div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.balance)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                    <TableHead className="text-right">Total Debits</TableHead>
                    <TableHead className="text-right">Total Credits</TableHead>
                    <TableHead className="text-right">Closing Balance</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountSummaries.map(summary => (
                    <TableRow key={summary.accountId}>
                      <TableCell className="font-medium">{summary.accountCode}</TableCell>
                      <TableCell>{summary.accountName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {summary.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.openingBalance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.totalDebits)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.totalCredits)}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={summary.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(summary.closingBalance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {summary.transactionCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(summary.accountId);
                            setViewMode('detailed');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <div className="space-y-6">
            {selectedAccount ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Account Balance Trend - {accounts.find(acc => acc._id === selectedAccount)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getAccountBalanceData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.3}
                          name="Balance"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Account Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['asset', 'liability', 'equity', 'income', 'expense'].map(type => {
                        const typeAccounts = accountSummaries.filter(acc => acc.accountType === type);
                        const totalBalance = typeAccounts.reduce((sum, acc) => sum + Math.abs(acc.closingBalance), 0);
                        const count = typeAccounts.length;
                        return (
                          <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${
                                type === 'asset' ? 'bg-blue-500' :
                                type === 'liability' ? 'bg-red-500' :
                                type === 'equity' ? 'bg-green-500' :
                                type === 'income' ? 'bg-yellow-500' : 'bg-purple-500'
                              }`} />
                              <div>
                                <p className="font-medium capitalize">{type}s</p>
                                <p className="text-sm text-muted-foreground">{count} accounts</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(totalBalance)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Transaction Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accountSummaries
                        .sort((a, b) => b.transactionCount - a.transactionCount)
                        .slice(0, 5)
                        .map((account, index) => (
                          <div key={account.accountId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{account.accountName}</p>
                                <p className="text-sm text-muted-foreground">{account.accountCode}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{account.transactionCount}</p>
                              <p className="text-sm text-muted-foreground">transactions</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold">{filteredEntries.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(filteredEntries.reduce((sum, entry) => sum + entry.debit, 0))}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(filteredEntries.reduce((sum, entry) => sum + entry.credit, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                      <p className="text-2xl font-bold">{accounts.filter(acc => acc.isActive).length}</p>
                    </div>
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Ledger;