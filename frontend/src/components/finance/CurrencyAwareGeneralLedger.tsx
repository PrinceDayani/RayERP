'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, TrendingUp, Building, RefreshCw, Globe } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/utils/currency';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
}

interface JournalEntry {
  _id: string;
  entryNumber: string;
  date: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description: string;
  }>;
}

const CurrencyAwareGeneralLedger = () => {
  const { currency, setCurrency, formatAmount, formatCompact } = useCurrency();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const currencies = [
    'INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF',
    'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'
  ];

  useEffect(() => {
    fetchData();
  }, [currency]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const sampleAccounts: Account[] = [
        { _id: '1', code: '1001', name: 'Cash in Hand', type: 'asset', balance: 50000, currency: 'INR' },
        { _id: '2', code: '1002', name: 'Bank Account', type: 'asset', balance: 100000, currency: 'INR' },
        { _id: '3', code: '2001', name: 'Accounts Payable', type: 'liability', balance: 25000, currency: 'INR' },
        { _id: '4', code: '3001', name: 'Capital', type: 'equity', balance: 125000, currency: 'INR' },
        { _id: '5', code: '4001', name: 'Sales Revenue', type: 'revenue', balance: 75000, currency: 'INR' },
        { _id: '6', code: '5001', name: 'Office Expenses', type: 'expense', balance: 15000, currency: 'INR' }
      ];
      setAccounts(sampleAccounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = () => {
    const totalRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, totalExpenses, totalAssets, netProfit };
  };

  const kpis = calculateKPIs();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Currency Switcher */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">General Ledger</h1>
            <p className="text-gray-400">Currency-aware financial management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg">
              <Globe className="h-4 w-4" />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-32 border-0 bg-transparent text-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(curr => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Revenue</p>
                        <p className="text-2xl font-bold text-white">{formatAmount(kpis.totalRevenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatCompact(kpis.totalRevenue)}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Expenses</p>
                        <p className="text-2xl font-bold text-white">{formatAmount(kpis.totalExpenses)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatCompact(kpis.totalExpenses)}</p>
                      </div>
                      <div className="p-3 bg-red-500/20 rounded-lg">
                        <Coins className="h-6 w-6 text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Net Profit</p>
                        <p className="text-2xl font-bold text-white">{formatAmount(kpis.netProfit)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatCompact(kpis.netProfit)}</p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Assets</p>
                        <p className="text-2xl font-bold text-white">{formatAmount(kpis.totalAssets)}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatCompact(kpis.totalAssets)}</p>
                      </div>
                      <div className="p-3 bg-purple-500/20 rounded-lg">
                        <Building className="h-6 w-6 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Account Summary by Type */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-200">Account Summary by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
                      const typeAccounts = accounts.filter(acc => acc.type === type);
                      const totalBalance = typeAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                      return (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              type === 'asset' ? 'bg-blue-500' :
                              type === 'liability' ? 'bg-red-500' :
                              type === 'equity' ? 'bg-green-500' :
                              type === 'revenue' ? 'bg-yellow-500' : 'bg-purple-500'
                            }`} />
                            <span className="capitalize text-gray-300">{type}s ({typeAccounts.length})</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">{formatAmount(totalBalance)}</p>
                            <p className="text-xs text-gray-500">{formatCompact(totalBalance)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Chart of Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Compact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map(account => (
                      <TableRow key={account._id}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {account.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatAmount(account.balance)}</TableCell>
                        <TableCell className="text-gray-400">{formatCompact(account.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Journal Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Journal entries with currency formatting will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Financial Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Trial Balance</h3>
                    <p className="text-sm text-gray-400">All amounts in {currency}</p>
                  </div>
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Balance Sheet</h3>
                    <p className="text-sm text-gray-400">All amounts in {currency}</p>
                  </div>
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">P&L Statement</h3>
                    <p className="text-sm text-gray-400">All amounts in {currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CurrencyAwareGeneralLedger;
