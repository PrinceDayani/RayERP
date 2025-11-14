'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Play, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function InterestCalculationsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculatedInterest, setCalculatedInterest] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
    fetchCalculations();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts((data.accounts || []).filter((a: any) => a.enableInterest));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCalculations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/interest-calculations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setCalculations(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateInterest = () => {
    const account = accounts.find(a => a._id === selectedAccount);
    if (!account || !fromDate || !toDate) return;

    const principal = account.balance;
    const rate = parseFloat(interestRate) / 100;
    const days = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));
    const interest = (principal * rate * days) / 365;
    
    setCalculatedInterest(interest);
  };

  const postInterestEntry = async () => {
    if (!selectedAccount || calculatedInterest === 0) {
      toast({ title: 'Error', description: 'Calculate interest first', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/interest-calculations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          fromDate,
          toDate,
          interestRate: parseFloat(interestRate),
          interestAmount: calculatedInterest
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Interest entry posted' });
        fetchCalculations();
        setCalculatedInterest(0);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post entry', variant: 'destructive' });
    }
  };

  const totalInterest = calculations.reduce((sum, c) => sum + parseFloat(c.interestAmount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interest Calculations</h1>
          <p className="text-gray-600 mt-1">Calculate and post interest entries</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Calculations</p>
            <p className="text-2xl font-bold">{calculations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Interest</p>
            <p className="text-2xl font-bold">₹{totalInterest.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold">
              {calculations.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Interest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.name} (Balance: ₹{acc.balance.toLocaleString('en-IN')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Interest Rate (%)</Label>
              <Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="5.00" />
            </div>
            <div>
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calculateInterest}>
              <Calculator className="w-4 h-4 mr-2" />Calculate Interest
            </Button>
            {calculatedInterest > 0 && (
              <Button onClick={postInterestEntry} variant="default">
                <FileText className="w-4 h-4 mr-2" />Post Entry
              </Button>
            )}
          </div>

          {calculatedInterest > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Calculated Interest</p>
                    <p className="text-3xl font-bold text-blue-600">₹{calculatedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>Rate: {interestRate}% p.a.</p>
                    <p>Period: {Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interest History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Interest Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map(calc => (
                <TableRow key={calc._id}>
                  <TableCell>{new Date(calc.createdAt).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell className="font-medium">{calc.accountId?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(calc.fromDate).toLocaleDateString('en-IN')} - {new Date(calc.toDate).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">{calc.interestRate}%</TableCell>
                  <TableCell className="text-right font-semibold">₹{parseFloat(calc.interestAmount || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant={calc.posted ? 'default' : 'secondary'}>
                      {calc.posted ? 'Posted' : 'Draft'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
