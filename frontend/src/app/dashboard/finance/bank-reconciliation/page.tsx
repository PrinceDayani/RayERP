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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, History, FileSpreadsheet, BarChart3, Bell, Search, Printer, AlertCircle } from 'lucide-react';
import { bankReconciliationApi } from '@/lib/api/finance/reportingApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [statements, setStatements] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [currentRecon, setCurrentRecon] = useState<any>(null);
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementBalance, setStatementBalance] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [outstandingItems, setOutstandingItems] = useState<any>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<any>({ date: 0, description: 1, debit: 2, credit: 3 });
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBankAccounts();
    setupKeyboardShortcuts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchStatements();
      fetchReconciliations();
      fetchOutstandingItems();
      fetchAnalytics();
    }
  }, [selectedAccount]);

  const setupKeyboardShortcuts = () => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') { e.preventDefault(); window.print(); }
        if (e.key === 'm') { e.preventDefault(); handleBulkMatch(); }
        if (e.key === 'f') { e.preventDefault(); document.getElementById('search-input')?.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAccounts((data.accounts || []).filter((a: any) => a.type === 'asset' && a.name.toLowerCase().includes('bank')));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStatements = async () => {
    try {
      const response = await bankReconciliationApi.getStatements(selectedAccount);
      if (response.success) setStatements(response.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchReconciliations = async () => {
    try {
      const response = await bankReconciliationApi.getReconciliations(selectedAccount);
      if (response.success) setReconciliations(response.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchOutstandingItems = async () => {
    try {
      const response = await bankReconciliationApi.getOutstandingItems(selectedAccount);
      if (response.success) setOutstandingItems(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAnalytics = async () => {
    const avgTime = reconciliations.length > 0 ? 
      reconciliations.reduce((sum, r) => sum + (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()), 0) / reconciliations.length / (1000 * 60 * 60) : 0;
    
    setAnalytics({
      avgReconciliationTime: avgTime.toFixed(1),
      totalReconciliations: reconciliations.length,
      completionRate: reconciliations.filter(r => r.status === 'completed').length / reconciliations.length * 100,
      commonDiscrepancies: ['Timing differences', 'Bank charges', 'Deposits in transit']
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        setCsvData(rows);
      };
      reader.readAsText(file);
    }
  };

  const handleImportCSV = async () => {
    if (!csvData.length) return;
    
    const transactions = csvData.slice(1).map(row => ({
      date: row[columnMapping.date],
      description: row[columnMapping.description],
      debit: parseFloat(row[columnMapping.debit]) || 0,
      credit: parseFloat(row[columnMapping.credit]) || 0,
      reference: row[0]
    }));

    try {
      const response = await bankReconciliationApi.uploadStatement({
        accountId: selectedAccount,
        statementDate,
        openingBalance: 0,
        closingBalance: parseFloat(statementBalance),
        transactions
      });
      if (response.success) {
        toast({ title: 'CSV imported successfully' });
        fetchStatements();
        setCsvFile(null);
        setCsvData([]);
      }
    } catch (error) {
      toast({ title: 'Error importing CSV', variant: 'destructive' });
    }
  };

  const handleStartReconciliation = async (statementId: string) => {
    try {
      const response = await bankReconciliationApi.startReconciliation(statementId);
      if (response.success) {
        setCurrentRecon(response.data);
        toast({ title: 'Auto-matching completed', description: `${response.data.matchedTransactions?.length || 0} transactions matched` });
      }
    } catch (error) {
      toast({ title: 'Error starting reconciliation', variant: 'destructive' });
    }
  };

  const handleBulkMatch = async () => {
    if (!currentRecon) return;
    const matches = Array.from(selectedTransactions).map(id => ({ ledgerId: id }));
    try {
      const response = await bankReconciliationApi.bulkMatch(currentRecon._id, matches);
      if (response.success) {
        setCurrentRecon(response.data);
        setSelectedTransactions(new Set());
        toast({ title: `${matches.length} transactions matched` });
      }
    } catch (error) {
      toast({ title: 'Error matching transactions', variant: 'destructive' });
    }
  };

  const handleCompleteReconciliation = async () => {
    if (!currentRecon) return;
    try {
      const response = await bankReconciliationApi.completeReconciliation(currentRecon._id, []);
      if (response.success) {
        toast({ title: 'Reconciliation completed' });
        setCurrentRecon(null);
        fetchReconciliations();
        fetchAnalytics();
      }
    } catch (error) {
      toast({ title: 'Error completing reconciliation', variant: 'destructive' });
    }
  };

  const toggleTransaction = (id: string) => {
    const newSet = new Set(selectedTransactions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTransactions(newSet);
  };

  const bookBalance = currentRecon?.bookBalance || 0;
  const bankBalance = currentRecon?.bankBalance || 0;
  const difference = Math.abs(bookBalance - bankBalance);

  const chartData = reconciliations.slice(-6).map(r => ({
    date: new Date(r.reconciliationDate).toLocaleDateString('en-IN', { month: 'short' }),
    matched: r.matchedTransactions?.length || 0,
    unmatched: r.unmatchedBookEntries?.length || 0
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
          <p className="text-gray-600 mt-1">AI-powered matching, CSV import, and analytics</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Bank Statement (CSV)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="file" accept=".csv" onChange={handleCSVUpload} />
                {csvData.length > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label>Date Column</Label>
                        <Input type="number" value={columnMapping.date} onChange={(e) => setColumnMapping({...columnMapping, date: parseInt(e.target.value)})} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input type="number" value={columnMapping.description} onChange={(e) => setColumnMapping({...columnMapping, description: parseInt(e.target.value)})} />
                      </div>
                      <div>
                        <Label>Debit</Label>
                        <Input type="number" value={columnMapping.debit} onChange={(e) => setColumnMapping({...columnMapping, debit: parseInt(e.target.value)})} />
                      </div>
                      <div>
                        <Label>Credit</Label>
                        <Input type="number" value={columnMapping.credit} onChange={(e) => setColumnMapping({...columnMapping, credit: parseInt(e.target.value)})} />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      <Table>
                        <TableBody>
                          {csvData.slice(0, 5).map((row, idx) => (
                            <TableRow key={idx}>
                              {row.map((cell, cellIdx) => (
                                <TableCell key={cellIdx} className="text-xs">{cell}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex gap-2">
                      <Input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
                      <Input type="number" placeholder="Closing Balance" value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} />
                    </div>
                    <Button onClick={handleImportCSV}>Import {csvData.length - 1} Transactions</Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Book Balance</p>
            <p className="text-2xl font-bold">₹{bookBalance.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Bank Balance</p>
            <p className="text-2xl font-bold">₹{bankBalance.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Difference</p>
            <p className={`text-2xl font-bold ${difference < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{difference.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current"><CheckCircle className="w-4 h-4 mr-2" />Current</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />History</TabsTrigger>
          <TabsTrigger value="outstanding"><AlertCircle className="w-4 h-4 mr-2" />Outstanding</TabsTrigger>
          <TabsTrigger value="statements"><FileSpreadsheet className="w-4 h-4 mr-2" />Statements</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Current Reconciliation</CardTitle>
                {currentRecon && (
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-48" />
                    </div>
                    <Button onClick={handleBulkMatch} disabled={selectedTransactions.size === 0}>
                      Match Selected ({selectedTransactions.size})
                    </Button>
                    <Button onClick={handleCompleteReconciliation}>Complete</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentRecon ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Matched</p>
                      <p className="text-lg font-bold text-green-600">{currentRecon.matchedTransactions?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unmatched Book</p>
                      <p className="text-lg font-bold text-orange-600">{currentRecon.unmatchedBookEntries?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unmatched Bank</p>
                      <p className="text-lg font-bold text-red-600">{currentRecon.unmatchedBankEntries?.length || 0}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRecon.unmatchedBookEntries?.slice(0, 10).map((entryId: string) => (
                        <TableRow key={entryId}>
                          <TableCell>
                            <input type="checkbox" checked={selectedTransactions.has(entryId)} onChange={() => toggleTransaction(entryId)} className="w-4 h-4" />
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>Transaction {entryId.substring(0, 8)}</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell><Badge variant="secondary">Unmatched</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No active reconciliation</p>
                  <p className="text-sm text-gray-500">Upload a statement to start with AI auto-matching</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Reconciliation History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliations.map((recon: any) => (
                    <TableRow key={recon._id}>
                      <TableCell>{new Date(recon.reconciliationDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{recon.accountId?.name || 'N/A'}</TableCell>
                      <TableCell>{recon.matchedTransactions?.length || 0}</TableCell>
                      <TableCell><Badge variant={recon.status === 'completed' ? 'default' : 'secondary'}>{recon.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card>
            <CardHeader><CardTitle>Outstanding Items</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Outstanding Cheques</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingItems?.outstandingCheques?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(item.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">₹{item.debit.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Deposits in Transit</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingItems?.depositsInTransit?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(item.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">₹{item.credit.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements">
          <Card>
            <CardHeader><CardTitle>Bank Statements</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((stmt: any) => (
                    <TableRow key={stmt._id}>
                      <TableCell>{new Date(stmt.statementDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>₹{stmt.closingBalance.toLocaleString('en-IN')}</TableCell>
                      <TableCell><Badge variant={stmt.status === 'reconciled' ? 'default' : 'secondary'}>{stmt.status}</Badge></TableCell>
                      <TableCell>
                        {stmt.status === 'pending' && (
                          <Button size="sm" onClick={() => handleStartReconciliation(stmt._id)}>Start Auto-Match</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Avg Time</p>
                  <p className="text-2xl font-bold">{analytics?.avgReconciliationTime || 0}h</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{analytics?.totalReconciliations || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Completion</p>
                  <p className="text-2xl font-bold">{analytics?.completionRate?.toFixed(0) || 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Auto-Match</p>
                  <p className="text-2xl font-bold">78%</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Reconciliation Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="matched" stroke="#10b981" name="Matched" strokeWidth={2} />
                    <Line type="monotone" dataKey="unmatched" stroke="#ef4444" name="Unmatched" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-gray-500">
        <p>Shortcuts: Ctrl+P (Print), Ctrl+M (Match), Ctrl+F (Search)</p>
      </div>
    </div>
  );
}
