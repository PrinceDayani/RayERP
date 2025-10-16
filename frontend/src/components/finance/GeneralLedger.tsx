'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGeneralLedger } from '@/hooks/finance/useGeneralLedger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Plus, FileText, Calculator, DollarSign } from 'lucide-react';

const GeneralLedger = () => {
  const router = useRouter();
  const {
    accounts,
    journalEntries,
    trialBalance,
    loading,
    error,
    fetchAccounts,
    createAccount,
    fetchJournalEntries,
    createJournalEntry,
    fetchTrialBalance
  } = useGeneralLedger();

  const [activeTab, setActiveTab] = useState('accounts');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchJournalEntries();
  }, [fetchAccounts, fetchJournalEntries]);

  const AccountForm = () => {
    const [formData, setFormData] = useState({
      code: '',
      name: '',
      type: '',
      subType: '',
      description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createAccount(formData);
        setShowAccountDialog(false);
        setFormData({ code: '', name: '', type: '', subType: '', description: '' });
      } catch (error) {
        console.error('Error creating account:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Account Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., 1000"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cash"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Account Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="subType">Sub Type</Label>
            <Input
              id="subType"
              value={formData.subType}
              onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
              placeholder="e.g., Current Asset"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Account description"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowAccountDialog(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Create Account
          </Button>
        </div>
      </form>
    );
  };

  const JournalEntryForm = () => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' }
      ]
    });

    const addLine = () => {
      setFormData({
        ...formData,
        lines: [...formData.lines, { accountId: '', debit: 0, credit: 0, description: '' }]
      });
    };

    const updateLine = (index: number, field: string, value: any) => {
      const newLines = [...formData.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      setFormData({ ...formData, lines: newLines });
    };

    const removeLine = (index: number) => {
      if (formData.lines.length > 2) {
        const newLines = formData.lines.filter((_, i) => i !== index);
        setFormData({ ...formData, lines: newLines });
      }
    };

    const totalDebits = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredits = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isBalanced) {
        alert('Debits must equal credits');
        return;
      }
      try {
        await createJournalEntry(formData);
        setShowJournalDialog(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          reference: '',
          description: '',
          lines: [
            { accountId: '', debit: 0, credit: 0, description: '' },
            { accountId: '', debit: 0, credit: 0, description: '' }
          ]
        });
      } catch (error) {
        console.error('Error creating journal entry:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g., INV-001"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Journal entry description"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Journal Lines</Label>
          {formData.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <Select
                  value={line.accountId}
                  onValueChange={(value) => updateLine(index, 'accountId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Debit"
                  value={line.debit || ''}
                  onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Credit"
                  value={line.credit || ''}
                  onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  placeholder="Line description"
                  value={line.description}
                  onChange={(e) => updateLine(index, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={formData.lines.length <= 2}
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addLine}>
            Add Line
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <div className="flex justify-between">
            <span>Total Debits: ${totalDebits.toFixed(2)}</span>
            <span>Total Credits: ${totalCredits.toFixed(2)}</span>
          </div>
          <div className="text-center mt-2">
            <Badge variant={isBalanced ? "default" : "destructive"}>
              {isBalanced ? "Balanced" : "Not Balanced"}
            </Badge>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowJournalDialog(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isBalanced}>
            {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Create Entry
          </Button>
        </div>
      </form>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">General Ledger</h1>
        <div className="flex space-x-2">
          <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
              </DialogHeader>
              <AccountForm />
            </DialogContent>
          </Dialog>

          <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                New Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Journal Entry</DialogTitle>
              </DialogHeader>
              <JournalEntryForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Chart of Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spinner className="w-8 h-8" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sub Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account._id} className="hover:bg-gray-50 cursor-pointer">
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell 
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          onClick={() => router.push(`/dashboard/finance/account-ledger/${account._id}`)}
                        >
                          {account.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.type}</Badge>
                        </TableCell>
                        <TableCell>{account.subType || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${account.balance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Journal Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spinner className="w-8 h-8" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.reference}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${entry.totalDebit.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.isPosted ? "default" : "secondary"}>
                            {entry.isPosted ? "Posted" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Trial Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchTrialBalance} disabled={loading} className="mb-4">
                {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                Generate Trial Balance
              </Button>
              
              {trialBalance && (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts?.map((account: any) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono">{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {account.debit > 0 ? `$${account.debit.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {account.credit > 0 ? `$${account.credit.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">
                          ${trialBalance.totals?.debits.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${trialBalance.totals?.credits.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 text-center">
                    <Badge variant={trialBalance.totals?.balanced ? "default" : "destructive"}>
                      {trialBalance.totals?.balanced ? "Trial Balance is Balanced" : "Trial Balance is NOT Balanced"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneralLedger;