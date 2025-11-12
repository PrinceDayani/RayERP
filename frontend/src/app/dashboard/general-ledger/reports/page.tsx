'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, FileSpreadsheet, Download, Eye } from 'lucide-react';
import { generalLedgerAPI, type TrialBalance } from '@/lib/api/generalLedgerAPI';
import { toast } from '@/components/ui/use-toast';

export default function ReportsPage() {
  const router = useRouter();
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportParams, setReportParams] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const generateTrialBalance = async () => {
    try {
      setLoading(true);
      const data = await generalLedgerAPI.getTrialBalance(reportParams.asOfDate);
      setTrialBalance(data);
      toast({
        title: 'Success',
        description: 'Trial balance generated successfully'
      });
    } catch (error) {
      console.error('Error generating trial balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate trial balance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateProfitLoss = async () => {
    try {
      setLoading(true);
      const data = await generalLedgerAPI.getFinancialReports('profit-loss', {
        startDate: reportParams.startDate,
        endDate: reportParams.endDate
      });
      console.log('P&L Report:', data);
      toast({
        title: 'Success',
        description: 'Profit & Loss report generated successfully'
      });
    } catch (error) {
      console.error('Error generating P&L:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate Profit & Loss report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBalanceSheet = async () => {
    try {
      setLoading(true);
      const data = await generalLedgerAPI.getFinancialReports('balance-sheet', {
        endDate: reportParams.asOfDate
      });
      console.log('Balance Sheet:', data);
      toast({
        title: 'Success',
        description: 'Balance Sheet generated successfully'
      });
    } catch (error) {
      console.error('Error generating Balance Sheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate Balance Sheet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      title: 'Trial Balance',
      description: 'List of all accounts with their debit and credit balances',
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: generateTrialBalance
    },
    {
      title: 'Profit & Loss Statement',
      description: 'Income and expense summary for a period',
      icon: FileSpreadsheet,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: generateProfitLoss
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities and equity as of a date',
      icon: FileSpreadsheet,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: generateBalanceSheet
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive financial reports</p>
          </div>
        </div>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>As of Date</Label>
              <Input 
                type="date" 
                value={reportParams.asOfDate}
                onChange={(e) => setReportParams({ ...reportParams, asOfDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Start Date (for P&L)</Label>
              <Input 
                type="date" 
                value={reportParams.startDate}
                onChange={(e) => setReportParams({ ...reportParams, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date (for P&L)</Label>
              <Input 
                type="date" 
                value={reportParams.endDate}
                onChange={(e) => setReportParams({ ...reportParams, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`w-8 h-8 ${report.color}`} />
                  </div>
                  <Button 
                    onClick={report.action} 
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trial Balance Display */}
      {trialBalance && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Trial Balance
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>As of Date:</strong> {new Date(trialBalance.asOfDate).toLocaleDateString('en-IN')} | 
                <strong> Accounts with Balances:</strong> {trialBalance.accounts.length}
              </p>
            </div>
            
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
                {trialBalance.accounts.map((account: any) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell className="capitalize">{account.type}</TableCell>
                    <TableCell className="text-right font-mono">
                      {account.debit > 0 ? `₹${account.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {account.credit > 0 ? `₹${account.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold bg-gray-50">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">
                    ₹{trialBalance.totals.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{trialBalance.totals.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-4 text-center">
              <Badge variant={trialBalance.totals.balanced ? "default" : "destructive"} className="text-lg p-2">
                {trialBalance.totals.balanced ? "✓ Trial Balance is Balanced" : "✗ Trial Balance is NOT Balanced"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 w-8 mx-auto mb-2 text-gray-600" />
            <h3 className="font-medium">Account Ledger</h3>
            <p className="text-sm text-muted-foreground">View individual account transactions</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <FileSpreadsheet className="w-8 w-8 mx-auto mb-2 text-gray-600" />
            <h3 className="font-medium">Cash Flow</h3>
            <p className="text-sm text-muted-foreground">Cash flow statement</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Calculator className="w-8 w-8 mx-auto mb-2 text-gray-600" />
            <h3 className="font-medium">Ratio Analysis</h3>
            <p className="text-sm text-muted-foreground">Financial ratios and analysis</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <FileSpreadsheet className="w-8 w-8 mx-auto mb-2 text-gray-600" />
            <h3 className="font-medium">Comparative Reports</h3>
            <p className="text-sm text-muted-foreground">Period-wise comparison</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}