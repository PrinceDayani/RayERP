'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Play, FileText, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { AccountSelector } from '@/components/finance/AccountSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function InterestCalculationsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [calculationType, setCalculationType] = useState('simple');
  const [interestRate, setInterestRate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [compoundingFrequency, setCompoundingFrequency] = useState('monthly');
  const [tdsRate, setTdsRate] = useState('10');
  const [loanMonths, setLoanMonths] = useState('12');
  const [gracePeriodDays, setGracePeriodDays] = useState('0');
  const [penaltyRate, setPenaltyRate] = useState('');
  const [calculatedInterest, setCalculatedInterest] = useState(0);
  const [effectiveRate, setEffectiveRate] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
    fetchCalculations();
    fetchSummary();
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

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/interest-calculations/summary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSummary(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateInterest = async () => {
    const account = accounts.find(a => a._id === selectedAccount);
    if (!account || !fromDate || !toDate) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    if (!interestRate || parseFloat(interestRate) <= 0) {
      toast({ title: 'Error', description: 'Please enter valid interest rate', variant: 'destructive' });
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
          calculationType,
          fromDate,
          toDate,
          principalAmount: account.balance,
          interestRate: parseFloat(interestRate),
          compoundingFrequency: calculationType === 'compound' ? compoundingFrequency : undefined,
          tdsRate: parseFloat(tdsRate),
          loanMonths: calculationType === 'emi' ? parseInt(loanMonths) : undefined,
          gracePeriodDays: calculationType === 'overdue' ? parseInt(gracePeriodDays) : undefined,
          penaltyRate: calculationType === 'overdue' ? parseFloat(penaltyRate || interestRate) : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedInterest(data.data.interestAmount);
        setEffectiveRate(data.data.effectiveRate || parseFloat(interestRate));
        toast({ title: 'Success', description: 'Interest calculated' });
        fetchCalculations();
        fetchSummary();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to calculate', variant: 'destructive' });
    }
  };

  const postCalculation = async (calcId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/interest-calculations/${calcId}/post`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Interest entry posted' });
        fetchCalculations();
        fetchSummary();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post entry', variant: 'destructive' });
    }
  };

  const scheduleAutoCalculation = async () => {
    try {
      const res = await fetch(`${API_URL}/api/interest-calculations/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          interestRate: parseFloat(interestRate),
          calculationType,
          compoundingFrequency,
          scheduledDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Auto-calculation scheduled' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to schedule', variant: 'destructive' });
    }
  };

  const totalInterest = calculations.reduce((sum, c) => sum + parseFloat(c.interestAmount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interest Calculations</h1>
          <p className="text-gray-600 mt-1">Simple, Compound, EMI & TDS calculations</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Calculations</p>
                <p className="text-2xl font-bold">{calculations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Interest</p>
                <p className="text-2xl font-bold">₹{summary?.totalInterest?.toLocaleString('en-IN') || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">TDS Deducted</p>
                <p className="text-2xl font-bold">₹{summary?.totalTDS?.toLocaleString('en-IN') || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Net Interest</p>
                <p className="text-2xl font-bold">₹{summary?.netInterest?.toLocaleString('en-IN') || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calculate">
        <TabsList>
          <TabsTrigger value="calculate">Calculate Interest</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="accruals">Accruals</TabsTrigger>
          <TabsTrigger value="emi">EMI Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate">
          <Card>
            <CardHeader>
              <CardTitle>Calculate Interest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Calculation Type</Label>
                  <Select value={calculationType} onValueChange={setCalculationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple Interest</SelectItem>
                      <SelectItem value="compound">Compound Interest</SelectItem>
                      <SelectItem value="emi">EMI/Loan Interest</SelectItem>
                      <SelectItem value="overdue">Overdue/Penalty Interest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account</Label>
                  <AccountSelector
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                    accounts={accounts}
                    onAccountCreated={fetchAccounts}
                  />
                </div>
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="5.00" />
                </div>
                {calculationType === 'compound' && (
                  <div>
                    <Label>Compounding Frequency</Label>
                    <Select value={compoundingFrequency} onValueChange={setCompoundingFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {calculationType === 'emi' && (
                  <div>
                    <Label>Loan Period (Months)</Label>
                    <Input type="number" value={loanMonths} onChange={(e) => setLoanMonths(e.target.value)} placeholder="12" />
                  </div>
                )}
                {calculationType === 'overdue' && (
                  <>
                    <div>
                      <Label>Grace Period (Days)</Label>
                      <Input type="number" value={gracePeriodDays} onChange={(e) => setGracePeriodDays(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <Label>Penalty Rate (%)</Label>
                      <Input type="number" step="0.01" value={penaltyRate} onChange={(e) => setPenaltyRate(e.target.value)} placeholder="18.00" />
                    </div>
                  </>
                )}
                <div>
                  <Label>From Date</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div>
                  <Label>TDS Rate (%)</Label>
                  <Input type="number" step="0.01" value={tdsRate} onChange={(e) => setTdsRate(e.target.value)} placeholder="10.00" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={calculateInterest}>
                  <Calculator className="w-4 h-4 mr-2" />Calculate Interest
                </Button>
                <Button variant="outline" onClick={scheduleAutoCalculation}>
                  <Calendar className="w-4 h-4 mr-2" />Schedule Auto-Calculation
                </Button>
              </div>

              {calculatedInterest > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Gross Interest</p>
                        <p className="text-2xl font-bold text-blue-600">₹{calculatedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">TDS @ {tdsRate}%</p>
                        <p className="text-2xl font-bold text-orange-600">₹{(calculatedInterest * parseFloat(tdsRate) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Interest</p>
                        <p className="text-2xl font-bold text-green-600">₹{(calculatedInterest * (1 - parseFloat(tdsRate) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    {calculationType === 'compound' && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">Effective Annual Rate: <span className="font-bold">{effectiveRate.toFixed(2)}%</span></p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
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
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map(calc => (
                    <TableRow key={calc._id}>
                      <TableCell>{new Date(calc.createdAt).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="font-medium">{calc.accountId?.name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{calc.calculationType}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(calc.fromDate).toLocaleDateString('en-IN')} - {new Date(calc.toDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">{calc.interestRate}%</TableCell>
                      <TableCell className="text-right font-semibold">₹{parseFloat(calc.interestAmount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{(calc.tdsDetails?.tdsAmount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">₹{(calc.tdsDetails?.netInterest || calc.interestAmount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant={calc.status === 'posted' ? 'default' : 'secondary'}>
                          {calc.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {calc.status === 'draft' && (
                          <Button size="sm" onClick={() => postCalculation(calc._id)}>
                            Post
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accruals">
          <Card>
            <CardHeader>
              <CardTitle>Interest Accruals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Daily interest accrual tracking for accurate financial reporting</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emi">
          <Card>
            <CardHeader>
              <CardTitle>EMI Amortization Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View EMI schedules for loan calculations</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
