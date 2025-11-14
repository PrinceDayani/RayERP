'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FolderOpen, Building2, Receipt, Calculator, FileText, Trash2, Edit, Eye, CheckCircle, Download, BookOpen, Filter, Upload, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { generalLedgerAPI, type Account, type JournalEntry } from '@/lib/api/generalLedgerAPI';
import { toast } from '@/components/ui/use-toast';

export default function UnifiedGeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, journalData] = await Promise.all([
        generalLedgerAPI.getAccounts({}),
        generalLedgerAPI.getJournalEntries({ limit: 100, page: 1 })
      ]);
      setAccounts(accountsData.accounts || []);
      setJournalEntries(journalData.journalEntries || []);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerEntries = async (accountId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${accountId}/ledger`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      setLedgerEntries(data.entries || []);
    } catch (error) {
      setLedgerEntries([]);
    }
  };

  const generateTrialBalance = async () => {
    try {
      const data = await generalLedgerAPI.getTrialBalance();
      setTrialBalance(data);
      toast({ title: 'Success', description: 'Trial balance generated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate trial balance', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Unified General Ledger</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">All accounting features in one place</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-wrap h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="accounts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Journal Entries</TabsTrigger>
          <TabsTrigger value="ledger" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Ledger View</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Reports</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab accounts={accounts} journalEntries={journalEntries} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsTab accounts={accounts} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="journals">
          <JournalsTab accounts={accounts} journalEntries={journalEntries} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="ledger">
          <LedgerTab accounts={accounts} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} ledgerEntries={ledgerEntries} fetchLedgerEntries={fetchLedgerEntries} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab trialBalance={trialBalance} generateTrialBalance={generateTrialBalance} />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ accounts, journalEntries, onRefresh }: any) {
  const groups = accounts.filter((a: Account) => a.isGroup);
  const ledgers = accounts.filter((a: Account) => !a.isGroup);
  const totalBalance = ledgers.reduce((sum: number, a: Account) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FolderOpen className="w-10 h-10 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">{groups.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Account Groups</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organizational structure</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-10 h-10 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{ledgers.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ledger Accounts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Receipt className="w-10 h-10 text-purple-600" />
              <span className="text-3xl font-bold text-purple-600">{journalEntries.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Journal Entries</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-10 h-10 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">₹{totalBalance.toFixed(2)}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Total Balance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">All accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Receipt className="w-5 h-5 mr-2" />Recent Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.slice(0, 5).map((entry: JournalEntry) => (
                  <TableRow key={entry._id}>
                    <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="truncate max-w-xs">{entry.description}</TableCell>
                    <TableCell><Badge variant={entry.isPosted ? "default" : "secondary"}>{entry.isPosted ? "Posted" : "Draft"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Building2 className="w-5 h-5 mr-2" />Account Summary by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
                const typeAccounts = ledgers.filter((a: Account) => a.type === type);
                const typeBalance = typeAccounts.reduce((sum: number, a: Account) => sum + a.balance, 0);
                return (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="capitalize font-medium">{type}</span>
                    <div className="text-right">
                      <div className="font-bold">₹{typeBalance.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{typeAccounts.length} accounts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AccountsTab({ accounts, onRefresh }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'asset', parentId: '', isGroup: false, description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editAccount) {
        await generalLedgerAPI.updateAccount(editAccount._id, formData);
        toast({ title: 'Success', description: 'Account updated' });
      } else {
        await generalLedgerAPI.createAccount({ ...formData, isActive: true, balance: 0, level: formData.parentId ? 1 : 0 });
        toast({ title: 'Success', description: 'Account created' });
      }
      setShowDialog(false);
      setEditAccount(null);
      setFormData({ name: '', code: '', type: 'asset', parentId: '', isGroup: false, description: '' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete account "${name}"?`)) return;
    try {
      await generalLedgerAPI.deleteAccount(id);
      toast({ title: 'Success', description: 'Account deleted' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center"><FolderOpen className="w-5 h-5 mr-2" />Chart of Accounts</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditAccount(null); setFormData({ name: '', code: '', type: 'asset', parentId: '', isGroup: false, description: '' }); }}>
                <Plus className="w-4 h-4 mr-2" />Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editAccount ? 'Edit' : 'Create'} Account</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                  <div><Label>Code *</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Label>Parent Account</Label>
                    <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        {accounts.filter((a: Account) => a.isGroup).map((account: Account) => (
                          <SelectItem key={account._id} value={account._id}>{account.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><label className="flex items-center space-x-2"><input type="checkbox" checked={formData.isGroup} onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })} /><span>Is Group Account</span></label></div>
                <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button type="submit">{editAccount ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account: Account) => (
                <TableRow key={account._id}>
                  <TableCell className="font-medium">{account.isGroup && <FolderOpen className="w-4 h-4 inline mr-2 text-blue-600" />}{account.name}</TableCell>
                  <TableCell className="font-mono">{account.code}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{account.type}</Badge></TableCell>
                  <TableCell className="text-right font-mono">₹{account.balance.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={account.isActive ? "default" : "secondary"}>{account.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditAccount(account); setFormData({ name: account.name, code: account.code, type: account.type, parentId: account.parentId || '', isGroup: account.isGroup, description: account.description || '' }); setShowDialog(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(account._id, account.name)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
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

function JournalsTab({ accounts, journalEntries, onRefresh }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], reference: '', description: '', lines: [{ accountId: '', description: '', debit: 0, credit: 0 }, { accountId: '', description: '', debit: 0, credit: 0 }] });

  const addLine = () => setFormData({ ...formData, lines: [...formData.lines, { accountId: '', description: '', debit: 0, credit: 0 }] });
  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };
  const removeLine = (index: number) => formData.lines.length > 2 && setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== index) });

  const totalDebits = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredits = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast({ title: 'Error', description: 'Debits must equal credits', variant: 'destructive' });
      return;
    }
    try {
      await generalLedgerAPI.createJournalEntry(formData);
      toast({ title: 'Success', description: 'Journal entry created' });
      setShowDialog(false);
      setFormData({ date: new Date().toISOString().split('T')[0], reference: '', description: '', lines: [{ accountId: '', description: '', debit: 0, credit: 0 }, { accountId: '', description: '', debit: 0, credit: 0 }] });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create entry', variant: 'destructive' });
    }
  };

  const handlePost = async (id: string, entryNumber: string) => {
    if (!confirm(`Post journal entry ${entryNumber}?`)) return;
    try {
      await generalLedgerAPI.postJournalEntry(id);
      toast({ title: 'Success', description: 'Entry posted' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to post', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, entryNumber: string) => {
    if (!confirm(`Delete entry ${entryNumber}?`)) return;
    try {
      await generalLedgerAPI.deleteJournalEntry(id);
      toast({ title: 'Success', description: 'Entry deleted' });
      onRefresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center"><Receipt className="w-5 h-5 mr-2" />Journal Entries</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Entry</Button></DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Journal Entry</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Date *</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                  <div><Label>Reference</Label><Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="REF001" /></div>
                </div>
                <div><Label>Description *</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={2} /></div>
                <div className="space-y-3">
                  <Label>Journal Lines</Label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm font-medium grid grid-cols-5 gap-2">
                    <div>Account</div><div>Description</div><div>Debit</div><div>Credit</div><div>Action</div>
                  </div>
                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2">
                      <Select value={line.accountId} onValueChange={(value) => updateLine(index, 'accountId', value)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{accounts.filter((a: Account) => !a.isGroup).map((account: Account) => <SelectItem key={account._id} value={account._id}>{account.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} placeholder="Line desc" />
                      <Input type="number" step="0.01" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} />
                      <Input type="number" step="0.01" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeLine(index)} disabled={formData.lines.length <= 2}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addLine}><Plus className="w-4 h-4 mr-2" />Add Line</Button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><strong>Total Debits:</strong> ₹{totalDebits.toFixed(2)}</div>
                    <div><strong>Total Credits:</strong> ₹{totalCredits.toFixed(2)}</div>
                    <div><strong>Difference:</strong> ₹{Math.abs(totalDebits - totalCredits).toFixed(2)}</div>
                  </div>
                  <div className="text-center mt-2"><Badge variant={isBalanced ? "default" : "destructive"}>{isBalanced ? "✓ Balanced" : "✗ Not Balanced"}</Badge></div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button type="submit" disabled={!isBalanced}>Create Entry</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry: JournalEntry) => {
                const totalAmount = entry.lines.reduce((sum, line) => sum + Math.max(line.debit, line.credit), 0);
                return (
                  <TableRow key={entry._id}>
                    <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>{entry.reference || '-'}</TableCell>
                    <TableCell className="text-right font-mono">₹{totalAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={entry.isPosted ? "default" : "secondary"}>{entry.isPosted ? "Posted" : "Draft"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!entry.isPosted && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handlePost(entry._id, entry.entryNumber)} className="text-green-600"><CheckCircle className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(entry._id, entry.entryNumber)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LedgerTab({ accounts, selectedAccount, setSelectedAccount, ledgerEntries, fetchLedgerEntries }: any) {
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    if (selectedAccount) fetchLedgerEntries(selectedAccount);
  }, [selectedAccount, filters]);

  const totalDebit = ledgerEntries.reduce((sum: number, e: any) => sum + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum: number, e: any) => sum + e.credit, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center"><Filter className="w-5 h-5 mr-2" />Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a: Account) => !a.isGroup).map((acc: Account) => (
                    <SelectItem key={acc._id} value={acc._id}>{acc.code} - {acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} /></div>
            <div className="flex items-end"><Button variant="outline" onClick={() => setFilters({ startDate: '', endDate: '' })}>Clear</Button></div>
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-gray-600 dark:text-gray-400">Total Debits</p><p className="text-2xl font-bold text-green-600">₹{totalDebit.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-gray-600 dark:text-gray-400">Total Credits</p><p className="text-2xl font-bold text-red-600">₹{totalCredit.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-gray-600 dark:text-gray-400">Net Balance</p><p className="text-2xl font-bold text-blue-600">₹{(totalDebit - totalCredit).toFixed(2)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><BookOpen className="w-5 h-5 mr-2" />Ledger Entries</CardTitle></CardHeader>
            <CardContent>
              {ledgerEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No ledger entries found. Create and post journal entries to see them here.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.map((entry: any) => (
                      <TableRow key={entry._id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">{entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">{entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">₹{entry.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ReportsTab({ trialBalance, generateTrialBalance }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={generateTrialBalance}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100"><Calculator className="w-8 h-8 text-blue-600" /></div>
              <Button size="sm">Generate</Button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Trial Balance</h3>
            <p className="text-sm text-gray-600">All accounts with debit/credit balances</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100"><FileText className="w-8 h-8 text-green-600" /></div>
              <Button size="sm">Generate</Button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Profit & Loss</h3>
            <p className="text-sm text-gray-600">Income and expense summary</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100"><BarChart3 className="w-8 h-8 text-purple-600" /></div>
              <Button size="sm">Generate</Button>
            </div>
            <h3 className="text-lg font-semibold mb-2">Balance Sheet</h3>
            <p className="text-sm text-gray-600">Assets, liabilities and equity</p>
          </CardContent>
        </Card>
      </div>

      {trialBalance && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center"><Calculator className="w-5 h-5 mr-2" />Trial Balance</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export PDF</Button>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export Excel</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600"><strong>As of Date:</strong> {new Date(trialBalance.asOfDate).toLocaleDateString()} | <strong>Accounts:</strong> {trialBalance.accounts.length}</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
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
                    <TableCell className="text-right font-mono">{account.debit > 0 ? `₹${account.debit.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{account.credit > 0 ? `₹${account.credit.toFixed(2)}` : '-'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold bg-gray-50">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">₹{trialBalance.totals.debits.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{trialBalance.totals.credits.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 text-center">
              <Badge variant={trialBalance.totals.balanced ? "default" : "destructive"} className="text-lg p-2">
                {trialBalance.totals.balanced ? "✓ Balanced" : "✗ Not Balanced"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdvancedTab() {
  const [activeFeature, setActiveFeature] = useState('audit');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'audit', label: 'Audit Logs', icon: FileText },
          { id: 'import', label: 'Import/Export', icon: Upload },
          { id: 'batch', label: 'Batch Operations', icon: Receipt },
          { id: 'analysis', label: 'Financial Analysis', icon: TrendingUp }
        ].map(feature => (
          <Card key={feature.id} className={`cursor-pointer transition-all ${activeFeature === feature.id ? 'ring-2 ring-blue-600' : ''}`} onClick={() => setActiveFeature(feature.id)}>
            <CardContent className="p-4 text-center">
              <feature.icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">{feature.label}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{activeFeature === 'audit' ? 'Audit Logs' : activeFeature === 'import' ? 'Import/Export Data' : activeFeature === 'batch' ? 'Batch Operations' : 'Financial Analysis'}</CardTitle></CardHeader>
        <CardContent>
          {activeFeature === 'audit' && <div className="text-center py-8 text-gray-500">Audit logs feature - Track all changes to accounts and entries</div>}
          {activeFeature === 'import' && (
            <div className="space-y-4">
              <div><Button><Upload className="w-4 h-4 mr-2" />Import Accounts</Button></div>
              <div><Button><Download className="w-4 h-4 mr-2" />Export Accounts</Button></div>
              <div><Button><Upload className="w-4 h-4 mr-2" />Import Journal Entries</Button></div>
              <div><Button><Download className="w-4 h-4 mr-2" />Export Journal Entries</Button></div>
            </div>
          )}
          {activeFeature === 'batch' && (
            <div className="space-y-4">
              <div><Label>Entry IDs (comma separated)</Label><Input placeholder="ID1, ID2, ID3" /></div>
              <div className="flex gap-2">
                <Button className="bg-green-600">Batch Post</Button>
                <Button variant="destructive">Batch Delete</Button>
              </div>
            </div>
          )}
          {activeFeature === 'analysis' && (
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" /><h3 className="font-medium">Cash Flow Analysis</h3></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><h3 className="font-medium">Ratio Analysis</h3></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" /><h3 className="font-medium">Funds Flow</h3></CardContent></Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
