'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Filter, Plus, TrendingUp, TrendingDown, ArrowLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';

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

  const fetchAccountLedger = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/ledger?${queryParams}`, {
        credentials: 'include'
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/ledger?${queryParams}`, {
        credentials: 'include'
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Account Ledger</h1>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-mono font-semibold">{account.code}</span> - {account.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchAccountLedger} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => router.push('/dashboard/finance/journal-entry')} variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
              <Button onClick={exportLedger} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold mt-1">{formatAmount(account.currentBalance)}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{account.type}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Debits</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">{formatAmount(totalDebits)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Credits</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{formatAmount(totalCredits)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Change</p>
                    <p className={`text-2xl font-bold mt-1 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(Math.abs(netChange))}
                    </p>
                  </div>
                  <Badge variant={netChange >= 0 ? 'default' : 'destructive'}>
                    {netChange >= 0 ? '+' : '-'}
                  </Badge>
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
                    <TableRow key={entry._id} className="hover:bg-gray-50">
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
                          <span className="text-red-600 font-semibold">{formatAmount(entry.debit)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit > 0 ? (
                          <span className="text-green-600 font-semibold">{formatAmount(entry.credit)}</span>
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
                    <span className="text-gray-600">Showing {entries.length} entries</span>
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
    </div>
  );
};

export default AccountLedger;
