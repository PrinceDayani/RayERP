'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Download, FileText, TrendingUp, TrendingDown, Coins, Filter } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

export default function LedgerPage() {
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const { getRowProps } = useKeyboardNavigation({
    items: filteredAccounts,
    onSelect: (account) => handleRowClick(account._id),
    enabled: !loading
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    let filtered = accounts.filter(acc =>
      acc.code.toLowerCase().includes(search.toLowerCase()) ||
      acc.name.toLowerCase().includes(search.toLowerCase())
    );
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(acc => acc.type === typeFilter);
    }
    
    if (balanceFilter === 'positive') {
      filtered = filtered.filter(acc => acc.balance > 0);
    } else if (balanceFilter === 'negative') {
      filtered = filtered.filter(acc => acc.balance < 0);
    } else if (balanceFilter === 'zero') {
      filtered = filtered.filter(acc => acc.balance === 0);
    }
    
    setFilteredAccounts(filtered);
  }, [search, typeFilter, balanceFilter, accounts]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
      setFilteredAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({ title: 'Error', description: 'Failed to load accounts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (accountId: string) => {
    router.push(`/dashboard/finance/account-ledger/${accountId}`);
  };

  const exportToCSV = () => {
    const csv = [
      ['Code', 'Account Name', 'Type', 'Balance'],
      ...filteredAccounts.map(a => [a.code, a.name, a.type, a.balance])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Please allow popups', variant: 'destructive' });
      return;
    }

    const totalBalance = filteredAccounts.reduce((sum, a) => sum + a.balance, 0);
    const html = `<!DOCTYPE html>
<html><head><title>Accounts Report - RayERP</title><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 30px; background: white; color: #000; }
.header { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
.company { font-size: 24px; font-weight: bold; }
.title { font-size: 18px; margin-top: 5px; }
.meta { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: #f5f5f5; }
.meta-item { font-size: 12px; }
.meta-label { font-weight: bold; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #333; color: white; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
.amount { text-align: right; font-family: monospace; }
.footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
@media print { body { padding: 15px; } @page { margin: 15mm; size: A4; } }
</style></head><body>
<div class="header">
  <div class="company">RayERP</div>
  <div class="title">Chart of Accounts</div>
</div>
<div class="meta">
  <div><span class="meta-label">Date:</span> ${new Date().toLocaleDateString('en-IN')}</div>
  <div><span class="meta-label">Total Accounts:</span> ${filteredAccounts.length}</div>
  <div><span class="meta-label">Total Balance:</span> ₹${totalBalance.toLocaleString('en-IN')}</div>
</div>
<table>
  <thead><tr>
    <th>Code</th><th>Account Name</th><th>Type</th><th class="amount">Balance (₹)</th>
  </tr></thead>
  <tbody>
    ${filteredAccounts.map(a => `<tr>
      <td>${a.code}</td>
      <td>${a.name}</td>
      <td style="text-transform: capitalize;">${a.type}</td>
      <td class="amount">${a.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="footer">
  <p><strong>RayERP</strong> - Enterprise Resource Planning System</p>
  <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const stats = {
    total: accounts.length,
    positive: accounts.filter(a => a.balance > 0).length,
    negative: accounts.filter(a => a.balance < 0).length,
    totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0)
  };

  const accountTypes = [...new Set(accounts.map(a => a.type))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Account Ledgers
          </h1>
          <p className="text-muted-foreground mt-1">View detailed transaction history for each account</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Coins className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive Balance</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.positive}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negative Balance</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.negative}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold mt-1">{formatAmount(stats.totalBalance)}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by account code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {accountTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Balance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Balances</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="zero">Zero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading accounts...</span>
              </div>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account, index) => (
                  <TableRow 
                    key={account._id} 
                    {...getRowProps(index)}
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleRowClick(account._id)}
                  >
                    <TableCell className="font-mono font-semibold">{account.code}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{account.type}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${
                      account.balance > 0 ? 'text-green-600' : 
                      account.balance < 0 ? 'text-red-600' : ''
                    }`}>
                      {formatAmount(account.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(account._id);
                        }}
                      >
                        View Ledger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
