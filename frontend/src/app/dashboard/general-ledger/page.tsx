'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, FileText, Calculator, DollarSign, Trash2, AlertCircle, FolderOpen, Building2, Users, Package, CreditCard, Banknote, Receipt, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { generalLedgerAPI, type Account, type JournalEntry, type TrialBalance } from '@/lib/api/generalLedgerAPI';
import { toast } from '@/components/ui/use-toast';

interface AccountGroup {
  id: string;
  name: string;
  parentId?: string;
  nature: 'asset' | 'liability' | 'income' | 'expense';
  affects: 'balance-sheet' | 'profit-loss';
}

interface Ledger {
  id: string;
  name: string;
  alias?: string;
  groupId: string;
  openingBalance: number;
  currentBalance: number;
  address?: string;
  phone?: string;
  email?: string;
  panNo?: string;
  gstNo?: string;
  isActive: boolean;
  isBankAccount?: boolean;
  creditLimit?: number;
}

interface VoucherLine {
  ledgerId: string;
  ledgerName?: string;
  amount: number;
  isDebit: boolean;
  narration?: string;
  costCenter?: string;
  billRef?: string;
}

interface Voucher {
  id: string;
  voucherType: 'payment' | 'receipt' | 'journal' | 'contra' | 'sales' | 'purchase';
  voucherNo: string;
  date: string;
  reference?: string;
  narration: string;
  lines: VoucherLine[];
  totalAmount: number;
  isPosted: boolean;
  createdAt: string;
  project?: string;
  department?: string;
}

interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  lines: Omit<VoucherLine, 'amount'>[];
}

interface CostCenter {
  id: string;
  name: string;
  code: string;
}

export default function GeneralLedgerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);


  

  
  const [journalTemplates] = useState<JournalTemplate[]>([
    {
      id: '1', name: 'Salary Payment', description: 'Monthly salary payment template',
      lines: [
        { ledgerId: '8', isDebit: true, narration: 'Salary for the month' },
        { ledgerId: '2', isDebit: false, narration: 'Payment through bank' }
      ]
    }
  ]);
  
  const [costCenters] = useState<CostCenter[]>([
    { id: '1', name: 'Head Office', code: 'HO' },
    { id: '2', name: 'Sales Department', code: 'SALES' }
  ]);
  
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, journalData] = await Promise.all([
        generalLedgerAPI.getAccounts({ hierarchy: true }),
        generalLedgerAPI.getJournalEntries({ limit: 50 })
      ]);
      
      setAccounts(accountsData.accounts || []);
      setJournalEntries(journalData.journalEntries || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTrialBalance = async () => {
    try {
      const trialBalanceData = await generalLedgerAPI.getTrialBalance();
      setTrialBalance(trialBalanceData);
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
    }
  };
  const [activeTab, setActiveTab] = useState('groups');
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showLedgerDialog, setShowLedgerDialog] = useState(false);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [showAdvancedJournal, setShowAdvancedJournal] = useState(false);
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>('payment');

  const GroupForm = () => {
    const [formData, setFormData] = useState({
      name: '', parentId: '', nature: 'asset', affects: 'balance-sheet'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await generalLedgerAPI.createAccount({
          name: formData.name,
          type: formData.nature as any,
          parentId: formData.parentId || undefined,
          isGroup: true,
          isActive: true,
          balance: 0,
          code: `${formData.name.substring(0, 3).toUpperCase()}${Date.now()}`,
          level: 0
        });
        
        toast({
          title: 'Success',
          description: 'Account group created successfully'
        });
        
        setShowGroupDialog(false);
        fetchData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create account group',
          variant: 'destructive'
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Group Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nature *</Label>
            <Select value={formData.nature} onValueChange={(value) => setFormData({ ...formData, nature: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Affects *</Label>
            <Select value={formData.affects} onValueChange={(value) => setFormData({ ...formData, affects: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                <SelectItem value="profit-loss">Profit & Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
          <Button type="submit">Create Group</Button>
        </div>
      </form>
    );
  };

  const LedgerForm = () => {
    const [formData, setFormData] = useState({
      name: '', alias: '', groupId: '', openingBalance: 0, address: '', phone: '', email: '', gstNo: '', panNo: '', creditLimit: 0, isBankAccount: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await generalLedgerAPI.createAccount({
          name: formData.name,
          code: `${formData.name.substring(0, 3).toUpperCase()}${Date.now()}`,
          parentId: formData.groupId,
          balance: formData.openingBalance,
          isGroup: false,
          isActive: true,
          level: 1,
          type: 'asset' // This should be determined by parent group
        });
        
        toast({
          title: 'Success',
          description: 'Ledger account created successfully'
        });
        
        setShowLedgerDialog(false);
        fetchData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create ledger account',
          variant: 'destructive'
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ledger Name *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <Label>Under Group *</Label>
            <Select value={formData.groupId} onValueChange={(value) => setFormData({ ...formData, groupId: value })}>
              <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.isGroup).map(group => (
                  <SelectItem key={group._id} value={group._id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Opening Balance</Label>
            <Input type="number" step="0.01" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>GST No</Label>
            <Input value={formData.gstNo} onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })} placeholder="27ABCDE1234F1Z5" />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowLedgerDialog(false)}>Cancel</Button>
          <Button type="submit">Create Ledger</Button>
        </div>
      </form>
    );
  };

  const AdvancedJournalForm = () => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0], reference: '', narration: '', project: '', department: '', templateId: '',
      lines: [
        { ledgerId: '', amount: 0, isDebit: true, narration: '', costCenter: '', billRef: '' },
        { ledgerId: '', amount: 0, isDebit: false, narration: '', costCenter: '', billRef: '' }
      ]
    });
    
    const [showCostCenter, setShowCostCenter] = useState(false);
    const [showBillRef, setShowBillRef] = useState(false);
    
    const applyTemplate = (templateId: string) => {
      const template = journalTemplates.find(t => t.id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev, narration: template.description,
          lines: template.lines.map(line => ({ ...line, amount: 0, costCenter: '', billRef: '' }))
        }));
      }
    };

    const addLine = () => {
      setFormData({ ...formData, lines: [...formData.lines, { ledgerId: '', amount: 0, isDebit: true, narration: '', costCenter: '', billRef: '' }] });
    };

    const updateLine = (index: number, field: string, value: any) => {
      const newLines = [...formData.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      setFormData({ ...formData, lines: newLines });
    };

    const totalDebits = formData.lines.filter(l => l.isDebit).reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    const totalCredits = formData.lines.filter(l => !l.isDebit).reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isBalanced) {
        toast({
          title: 'Error',
          description: 'Debits must equal credits',
          variant: 'destructive'
        });
        return;
      }

      try {
        const journalLines = formData.lines.map(line => ({
          accountId: line.ledgerId,
          description: line.narration || formData.narration,
          debit: line.isDebit ? line.amount : 0,
          credit: !line.isDebit ? line.amount : 0
        }));

        await generalLedgerAPI.createJournalEntry({
          date: formData.date,
          reference: formData.reference,
          description: formData.narration,
          lines: journalLines
        });

        toast({
          title: 'Success',
          description: 'Journal entry created successfully'
        });

        setShowAdvancedJournal(false);
        fetchData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create journal entry',
          variant: 'destructive'
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Date *</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div>
            <Label>Reference</Label>
            <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="REF001" />
          </div>
          <div>
            <Label>Project</Label>
            <Input value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} placeholder="Project Name" />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="accounts">Accounts</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label>Template</Label>
          <Select value={formData.templateId} onValueChange={(value) => { setFormData({ ...formData, templateId: value }); applyTemplate(value); }}>
            <SelectTrigger><SelectValue placeholder="Select Template (Optional)" /></SelectTrigger>
            <SelectContent>
              {journalTemplates.map(template => (
                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Narration *</Label>
          <Textarea value={formData.narration} onChange={(e) => setFormData({ ...formData, narration: e.target.value })} required rows={2} />
        </div>
        
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={showCostCenter} onChange={(e) => setShowCostCenter(e.target.checked)} />
            <span>Cost Center</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={showBillRef} onChange={(e) => setShowBillRef(e.target.checked)} />
            <span>Bill Reference</span>
          </label>
        </div>
        
        <div className="space-y-3">
          <Label>Journal Lines</Label>
          <div className="bg-gray-50 p-2 rounded text-sm font-medium grid grid-cols-6 gap-2">
            <div>Ledger</div>
            <div>Dr/Cr</div>
            <div>Amount</div>
            <div>Narration</div>
            {showCostCenter && <div>Cost Center</div>}
            <div>Action</div>
          </div>
          {formData.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-6 gap-2">
              <Select value={line.ledgerId} onValueChange={(value) => updateLine(index, 'ledgerId', value)}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => !a.isGroup).map(account => (
                    <SelectItem key={account._id} value={account._id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={line.isDebit.toString()} onValueChange={(value) => updateLine(index, 'isDebit', value === 'true')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Dr</SelectItem>
                  <SelectItem value="false">Cr</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" value={line.amount || ''} onChange={(e) => updateLine(index, 'amount', parseFloat(e.target.value) || 0)} />
              <Input value={line.narration} onChange={(e) => updateLine(index, 'narration', e.target.value)} placeholder="Line narration" />
              {showCostCenter && (
                <Select value={line.costCenter} onValueChange={(value) => updateLine(index, 'costCenter', value)}>
                  <SelectTrigger><SelectValue placeholder="Cost Center" /></SelectTrigger>
                  <SelectContent>
                    {costCenters.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => formData.lines.length > 2 && setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== index) })} disabled={formData.lines.length <= 2}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus className="w-4 h-4 mr-2" />Add Line
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><strong>Total Debits:</strong> ₹{totalDebits.toFixed(2)}</div>
            <div><strong>Total Credits:</strong> ₹{totalCredits.toFixed(2)}</div>
            <div><strong>Difference:</strong> ₹{Math.abs(totalDebits - totalCredits).toFixed(2)}</div>
          </div>
          <div className="text-center mt-2">
            <Badge variant={isBalanced ? "default" : "destructive"}>
              {isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
            </Badge>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowAdvancedJournal(false)}>Cancel</Button>
          <Button type="submit" disabled={!isBalanced}>Create Journal Entry</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-gray-600 mt-1">Complete accounting and financial management</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderOpen className="w-4 h-4 mr-2" />Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Account Group</DialogTitle></DialogHeader>
              <GroupForm />
            </DialogContent>
          </Dialog>

          <Dialog open={showLedgerDialog} onOpenChange={setShowLedgerDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />Create Ledger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Create New Ledger</DialogTitle></DialogHeader>
              <LedgerForm />
            </DialogContent>
          </Dialog>

          <Dialog open={showAdvancedJournal} onOpenChange={setShowAdvancedJournal}>
            <DialogTrigger asChild>
              <Button>
                <Calculator className="w-4 h-4 mr-2" />Advanced Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Advanced Journal Entry</DialogTitle></DialogHeader>
              <AdvancedJournalForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/general-ledger/chart-of-accounts')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FolderOpen className="w-12 h-12 text-blue-600" />
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Chart of Accounts</h3>
            <p className="text-sm text-gray-600">Manage account structure and hierarchy</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold">{accounts.filter(a => a.isGroup).length}</span>
              <span className="text-xs text-gray-500">Groups</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('ledgers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-12 h-12 text-green-600" />
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ledger Accounts</h3>
            <p className="text-sm text-gray-600">View and manage all ledger accounts</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold">{accounts.filter(a => !a.isGroup).length}</span>
              <span className="text-xs text-gray-500">Ledgers</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/general-ledger/journal-entries')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Receipt className="w-12 h-12 text-purple-600" />
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Journal Entries</h3>
            <p className="text-sm text-gray-600">Create and manage journal vouchers</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold">{journalEntries.length}</span>
              <span className="text-xs text-gray-500">Entries</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/general-ledger/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calculator className="w-12 h-12 text-orange-600" />
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Reports</h3>
            <p className="text-sm text-gray-600">Trial balance and financial reports</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold">5</span>
              <span className="text-xs text-gray-500">Reports</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Account Groups</TabsTrigger>
          <TabsTrigger value="ledgers">Ledgers</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="w-5 h-5 mr-2" />Account Groups ({accounts.filter(a => a.isGroup).length} groups)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Affects</TableHead>
                    <TableHead>Ledgers Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.filter(a => a.isGroup).map((group) => (
                    <TableRow key={group._id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{group.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={['asset', 'liability', 'equity'].includes(group.type) ? 'default' : 'secondary'}>
                          {['asset', 'liability', 'equity'].includes(group.type) ? 'Balance Sheet' : 'P&L Account'}
                        </Badge>
                      </TableCell>
                      <TableCell>{accounts.filter(l => l.parentId === group._id).length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledgers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />Ledgers ({accounts.filter(a => !a.isGroup).length} ledgers)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ledger Name</TableHead>
                    <TableHead>Under Group</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.filter(a => !a.isGroup).map((ledger) => {
                    const parentGroup = accounts.find(g => g._id === ledger.parentId);
                    return (
                      <TableRow key={ledger._id}>
                        <TableCell className="font-medium">
                          {ledger.name}
                          {ledger.type === 'asset' && ledger.name.toLowerCase().includes('bank') && <Badge variant="outline" className="ml-2">Bank</Badge>}
                        </TableCell>
                        <TableCell>{parentGroup?.name || 'No Group'}</TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{ledger.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{ledger.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{ledger.code}</div>
                          {ledger.description && <div className="text-xs text-muted-foreground">{ledger.description}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ledger.isActive ? "default" : "secondary"}>
                            {ledger.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />Journal Entries ({journalEntries.length} entries)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.map((entry) => {
                    const totalAmount = entry.lines.reduce((sum, line) => sum + Math.max(line.debit, line.credit), 0);
                    return (
                      <TableRow key={entry._id}>
                        <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Journal</Badge>
                        </TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell>{entry.reference || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.isPosted ? "default" : "secondary"}>
                            {entry.isPosted ? "Posted" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Trial Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={generateTrialBalance} className="mb-4">
                  Generate Trial Balance
                </Button>
                
                {trialBalance && (
                  <div>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>As of Date:</strong> {new Date(trialBalance.asOfDate).toLocaleDateString('en-IN')} | 
                        <strong>Accounts with Balances:</strong> {trialBalance.accounts.length}
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
                        {trialBalance.accounts?.map((account: any) => (
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
                            ₹{trialBalance.totals?.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{trialBalance.totals?.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 text-center">
                      <Badge variant={trialBalance.totals?.balanced ? "default" : "destructive"} className="text-lg p-2">
                        {trialBalance.totals?.balanced ? "✓ Trial Balance is Balanced" : "✗ Trial Balance is NOT Balanced"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Balance Sheet</h3>
                  <p className="text-sm text-muted-foreground">Assets, Liabilities & Capital</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Profit & Loss</h3>
                  <p className="text-sm text-muted-foreground">Income & Expenses</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Voucher Register</h3>
                  <p className="text-sm text-muted-foreground">All Voucher Entries</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}