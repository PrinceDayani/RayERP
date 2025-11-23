'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { FileText, Download, TrendingUp, DollarSign } from 'lucide-react';

interface ReportData {
  reportType: string;
  period?: { startDate: string; endDate: string };
  asOfDate?: string;
  revenue?: { accounts: any[]; total: number };
  expenses?: { accounts: any[]; total: number };
  assets?: { accounts: any[]; total: number };
  liabilities?: { accounts: any[]; total: number };
  equity?: { accounts: any[]; total: number };
  netIncome?: number;
  totalLiabilitiesAndEquity?: number;
}

const FinancialReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    reportType: 'profit-loss',
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        reportType: filters.reportType,
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const response = await fetch(`/api/general-ledger/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const queryParams = new URLSearchParams({
        reportType: filters.reportType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        export: 'true'
      });

      const response = await fetch(`/api/general-ledger/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filters.reportType}-${filters.startDate}-${filters.endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const ProfitLossReport = ({ data }: { data: ReportData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
        <p className="text-gray-600">
          For the period {data.period?.startDate} to {data.period?.endDate}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {data.revenue?.accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>{account.code} - {account.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${account.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right font-mono">
                    ${data.revenue?.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {data.expenses?.accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>{account.code} - {account.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${account.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Total Expenses</TableCell>
                  <TableCell className="text-right font-mono">
                    ${data.expenses?.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Net Income</h3>
            <p className={`text-3xl font-bold ${(data.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${data.netIncome?.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const BalanceSheetReport = ({ data }: { data: ReportData }) => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Balance Sheet</h2>
        <p className="text-gray-600">As of {data.asOfDate}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {data.assets?.accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>{account.code} - {account.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${account.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Total Assets</TableCell>
                    <TableCell className="text-right font-mono">
                      ${data.assets?.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {data.liabilities?.accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>{account.code} - {account.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${account.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Total Liabilities</TableCell>
                    <TableCell className="text-right font-mono">
                      ${data.liabilities?.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {data.equity?.accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>{account.code} - {account.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${account.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Total Equity</TableCell>
                    <TableCell className="text-right font-mono">
                      ${data.equity?.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="font-bold">Total Liabilities & Equity</p>
                <p className="text-xl font-mono">
                  ${data.totalLiabilitiesAndEquity?.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        {reportData && (
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters({ ...filters, reportType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                  <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? <Spinner className="w-4 h-4 mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error: {error}</p>
              <Button onClick={generateReport} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-12">
            <div className="flex justify-center items-center">
              <Spinner className="w-8 h-8 mr-2" />
              <span>Generating report...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && !loading && (
        <Card>
          <CardContent className="p-6">
            {filters.reportType === 'profit-loss' && <ProfitLossReport data={reportData} />}
            {filters.reportType === 'balance-sheet' && <BalanceSheetReport data={reportData} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialReports;