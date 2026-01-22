'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionLoader } from '@/components/PageLoader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, Printer, Filter, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function TrialBalancePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTrialBalance();
  }, [endDate]);

  useEffect(() => {
    applyFilters();
  }, [accounts, accountTypeFilter, searchQuery]);

  const applyFilters = () => {
    let filtered = [...accounts];
    
    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter(acc => acc.type === accountTypeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.code.toLowerCase().includes(query) ||
        acc.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredAccounts(filtered);
  };

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (endDate) params.append('asOfDate', endDate);
      
      const res = await fetch(`${API_URL}/api/general-ledger/trial-balance?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch trial balance');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load trial balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = filteredAccounts.reduce((sum, acc) => sum + (acc.debit || 0), 0);
  const totalCredit = filteredAccounts.reduce((sum, acc) => sum + (acc.credit || 0), 0);

  const handleExportCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit'];
    const rows = filteredAccounts.map(acc => [
      acc.code,
      acc.name,
      acc.type,
      acc.debit || 0,
      acc.credit || 0
    ]);
    rows.push(['', '', 'TOTAL', totalDebit, totalCredit]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${endDate || 'current'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trial Balance - ${new Date(endDate).toLocaleDateString('en-IN')}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .logo-section { display: flex; align-items: center; }
            .logo { height: 50px; width: auto; }
            .company-info { text-align: right; font-size: 12px; color: #666; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; margin-bottom: 20px; }
            .date { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .font-mono { font-family: 'Courier New', monospace; }
            .total-row { font-weight: bold; background-color: #f9f9f9; border-top: 2px solid #000; }
            .balance-row { font-weight: bold; background-color: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '#e8f5e9' : '#ffebee'}; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print {
              body { padding: 10px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="/RAYlogo.webp" alt="RAY INFRA" class="logo" />
            </div>
            <div class="company-info">
              <div>Enterprise Resource Planning</div>
              <div>Financial Reports</div>
            </div>
          </div>
          
          <h1>Trial Balance</h1>
          <div class="subtitle">Verify account balances and double-entry accuracy</div>
          <div class="date">As of ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          
          <table>
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th class="text-right">Debit (₹)</th>
                <th class="text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAccounts.map(acc => `
                <tr>
                  <td class="font-mono">${acc.code}</td>
                  <td>${acc.name}</td>
                  <td style="text-transform: capitalize;">${acc.type}</td>
                  <td class="text-right">${acc.debit > 0 ? acc.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                  <td class="text-right">${acc.credit > 0 ? acc.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" class="text-right">Total</td>
                <td class="text-right">${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="text-right">${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="balance-row">
                <td colspan="3" class="text-right">Difference</td>
                <td colspan="2" class="text-center">
                  ${Math.abs(totalDebit - totalCredit) < 0.01 
                    ? '✓ Balanced' 
                    : '₹' + Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
                <p>Total Accounts: ${filteredAccounts.length}</p>
              </div>
              <div style="text-align: right;">
                <img src="/RAYlogo.webp" alt="RAY INFRA" style="height: 30px; opacity: 0.6;" />
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleRowClick = (accountId: string) => {
    router.push(`/dashboard/finance/ledger/${accountId}`);
  };

  const handleReset = () => {
    setAccountTypeFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-muted-foreground mt-1">Verify account balances and double-entry accuracy</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || filteredAccounts.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Search</Label>
                <Input 
                  placeholder="Search by code or name" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Account Type</Label>
                <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">From Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">As of Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trial Balance Report</CardTitle>
            <div className="text-sm text-muted-foreground">
              As of {new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              {filteredAccounts.length !== accounts.length && (
                <span className="ml-2">({filteredAccounts.length} of {accounts.length} accounts)</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
              {error}
            </div>
          )}
          {loading ? (
            <SectionLoader text="Loading trial balance..." />
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No accounts found</p>
              <p className="text-sm">{accounts.length === 0 ? 'Create accounts to see trial balance' : 'No accounts match your filters'}</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map(acc => (
                <TableRow 
                  key={acc._id || acc.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(acc._id || acc.id)}
                >
                  <TableCell className="font-mono">{acc.code}</TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell className="capitalize">{acc.type}</TableCell>
                  <TableCell className="text-right">
                    {acc.debit > 0 ? `₹${acc.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {acc.credit > 0 ? `₹${acc.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={3} className="text-right">Total</TableCell>
                <TableCell className="text-right">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
              <TableRow className={`font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
                <TableCell colSpan={3} className="text-right">Difference</TableCell>
                <TableCell colSpan={2} className="text-center">
                  {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                    <span className="text-green-600 dark:text-green-400">✓ Balanced</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Debit</p>
            <p className="text-2xl font-bold">₹{totalDebit.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Credit</p>
            <p className="text-2xl font-bold">₹{totalCredit.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`text-2xl font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {Math.abs(totalDebit - totalCredit) < 0.01 ? 'Balanced' : 'Unbalanced'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
