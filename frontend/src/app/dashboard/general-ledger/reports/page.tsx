'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, FileSpreadsheet, TrendingUp, Download, Calendar } from 'lucide-react';

interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export default function ReportsPage() {
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const generateTrialBalance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/trial-balance?asOfDate=${asOfDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTrialBalance(data);
      }
    } catch (error) {
      console.error('Error generating trial balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view accounting reports</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Calculator className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1">Trial Balance</h3>
            <p className="text-xs text-gray-600">Verify accounting accuracy</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
          <CardContent className="p-6">
            <FileSpreadsheet className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold mb-1">Balance Sheet</h3>
            <p className="text-xs text-gray-600">Assets & Liabilities</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-1">Profit & Loss</h3>
            <p className="text-xs text-gray-600">Income & Expenses</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
          <CardContent className="p-6">
            <FileSpreadsheet className="w-10 h-10 text-orange-600 mb-3" />
            <h3 className="font-semibold mb-1">Cash Flow</h3>
            <p className="text-xs text-gray-600">Cash movements</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trial-balance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="balance-sheet" disabled>Balance Sheet</TabsTrigger>
          <TabsTrigger value="profit-loss" disabled>Profit & Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Trial Balance Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label>As of Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input 
                      type="date" 
                      value={asOfDate} 
                      onChange={(e) => setAsOfDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button onClick={generateTrialBalance} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>

              {trialBalance && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Report Date</p>
                        <p className="font-semibold">{new Date(trialBalance.asOfDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Accounts</p>
                        <p className="font-semibold">{trialBalance.accounts?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <Badge variant={trialBalance.totals?.balanced ? 'default' : 'destructive'}>
                          {trialBalance.totals?.balanced ? '✓ Balanced' : '✗ Not Balanced'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Account Code</TableHead>
                          <TableHead className="font-semibold">Account Name</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="text-right font-semibold">Debit (₹)</TableHead>
                          <TableHead className="text-right font-semibold">Credit (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.accounts?.map((account: TrialBalanceAccount) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-mono text-sm">{account.code}</TableCell>
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{account.type}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {account.debit > 0 ? account.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {account.credit > 0 ? account.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-100 font-bold border-t-2">
                          <TableCell colSpan={3} className="text-right">Total</TableCell>
                          <TableCell className="text-right font-mono">
                            {trialBalance.totals?.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trialBalance.totals?.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50 font-semibold">
                          <TableCell colSpan={3} className="text-right">Difference</TableCell>
                          <TableCell colSpan={2} className="text-center">
                            {Math.abs(trialBalance.totals?.debits - trialBalance.totals?.credits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-center">
                    <Badge 
                      variant={trialBalance.totals?.balanced ? 'default' : 'destructive'} 
                      className="text-lg py-2 px-4"
                    >
                      {trialBalance.totals?.balanced 
                        ? '✓ Trial Balance is Balanced' 
                        : '✗ Trial Balance is NOT Balanced'}
                    </Badge>
                  </div>
                </div>
              )}

              {!trialBalance && (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a date and click "Generate Report" to view the trial balance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Balance Sheet report coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit-loss">
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Profit & Loss report coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
