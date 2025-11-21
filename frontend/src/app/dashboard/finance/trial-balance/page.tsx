'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTrialBalance();
  }, [startDate, endDate]);

  const fetchTrialBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const totalDebit = accounts.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);
  const totalCredit = accounts.reduce((sum, acc) => sum + (acc.balance < 0 ? Math.abs(acc.balance) : 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-gray-600 mt-1">Verify account balances and double-entry accuracy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><FileSpreadsheet className="w-4 h-4 mr-2" />Export Excel</Button>
          <Button><Download className="w-4 h-4 mr-2" />Download PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trial Balance Report</CardTitle>
            <div className="flex gap-4">
              <div>
                <Label className="text-xs">From Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
              </div>
              <div>
                <Label className="text-xs">To Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {accounts.map(acc => (
                <TableRow key={acc._id}>
                  <TableCell className="font-mono">{acc.code}</TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell className="capitalize">{acc.type}</TableCell>
                  <TableCell className="text-right">
                    {acc.balance > 0 ? `₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {acc.balance < 0 ? `₹${Math.abs(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-gray-50">
                <TableCell colSpan={3} className="text-right">Total</TableCell>
                <TableCell className="text-right">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
              <TableRow className={`font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-green-50' : 'bg-red-50'}`}>
                <TableCell colSpan={3} className="text-right">Difference</TableCell>
                <TableCell colSpan={2} className="text-center">
                  {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                    <span className="text-green-600">✓ Balanced</span>
                  ) : (
                    <span className="text-red-600">₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Debit</p>
            <p className="text-2xl font-bold">₹{totalDebit.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Credit</p>
            <p className="text-2xl font-bold">₹{totalCredit.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-2xl font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(totalDebit - totalCredit) < 0.01 ? 'Balanced' : 'Unbalanced'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
