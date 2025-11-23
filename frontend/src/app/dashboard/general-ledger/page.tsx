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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Calculator, DollarSign, Trash2, AlertCircle, FolderOpen, Building2, Users, Package, CreditCard, Banknote, Receipt, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { generalLedgerAPI, type Account, type JournalEntry } from '@/lib/api/generalLedgerAPI';

interface TrialBalance {
  accounts: any[];
  totals: { debits: number; credits: number; balanced: boolean };
  asOfDate: string;
}
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
  accountId: string;
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
  const [accountingMode, setAccountingMode] = useState<'western' | 'indian'>('western');




  

  
  const [journalTemplates] = useState<JournalTemplate[]>([
    {
      id: '1', name: 'Salary Payment', description: 'Monthly salary payment template',
      lines: [
        { accountId: '8', isDebit: true, narration: 'Salary for the month' },
        { accountId: '2', isDebit: false, narration: 'Payment through bank' }
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
    fetchAccountingMode();
  }, []);

  const fetchAccountingMode = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounting-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAccountingMode(data.accountingMode || 'western');
    } catch (error) {
      console.error('Failed to fetch accounting mode', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, journalData] = await Promise.all([
        generalLedgerAPI.getAccounts({}),
        generalLedgerAPI.getJournalEntries({ limit: 50, page: 1 })
      ]);
      
      console.log('Fetched accounts:', accountsData.accounts);
      console.log('Groups:', accountsData.accounts?.filter((a: Account) => a.isGroup));
      console.log('Ledgers:', accountsData.accounts?.filter((a: Account) => !a.isGroup));
      setAccounts(accountsData.accounts || []);
      setJournalEntries(journalData.journalEntries || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to load data',
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

  const deleteLedger = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ledger "${name}"?`)) return;
    
    try {
      await generalLedgerAPI.deleteAccount(id);
      toast({
        title: 'Success',
        description: 'Ledger deleted successfully'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete ledger',
        variant: 'destructive'
      });
    }
  };

  const deleteGroup = async (id: string, name: string) => {
    const ledgersInGroup = accounts.filter(a => a.parentId === id).length;
    if (ledgersInGroup > 0) {
      toast({
        title: 'Error',
        description: `Cannot delete group with ${ledgersInGroup} ledger(s). Delete ledgers first.`,
        variant: 'destructive'
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete group "${name}"?`)) return;
    
    try {
      await generalLedgerAPI.deleteAccount(id);
      toast({
        title: 'Success',
        description: 'Group deleted successfully'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive'
      });
    }
  };

  const deleteVoucher = async (id: string, entryNumber: string) => {
    if (!confirm(`Are you sure you want to delete voucher "${entryNumber}"?`)) return;
    
    try {
      await generalLedgerAPI.deleteJournalEntry(id);
      toast({
        title: 'Success',
        description: 'Voucher deleted successfully'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete voucher',
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
        const accountData = {
          name: formData.name,
          type: formData.nature as any,
          parentId: formData.parentId || undefined,
          isGroup: true,
          isActive: true,
          balance: 0,
          code: `${formData.name.substring(0, 3).toUpperCase()}${Date.now()}`,
          level: 0
        };
        
        console.log('Creating account with data:', accountData);
        const result = await generalLedgerAPI.createAccount(accountData);
        console.log('Account created:', result);
        
        toast({
          title: 'Success',
          description: 'Account group created successfully'
        });
        
        setShowGroupDialog(false);
        fetchData();
      } catch (error: any) {
        console.error('Error creating account group:', error);
        const errorMessage = error?.message || error?.error || 'Failed to create account group';
        toast({
          title: 'Error',
          description: errorMessage,
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
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
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
      
      if (!formData.groupId) {
        toast({
          title: 'Error',
          description: 'Please select a group',
          variant: 'destructive'
        });
        return;
      }
      
      try {
        await generalLedgerAPI.createAccount({
          name: formData.name,
          code: `${formData.name.substring(0, 3).toUpperCase()}${Date.now()}`,
          parentId: formData.groupId,
          balance: formData.openingBalance,
          isGroup: false,
          isActive: true,
          level: 1,
          type: 'asset'
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
        { accountId: '', amount: 0, isDebit: true, narration: '', costCenter: '', billRef: '' },
        { accountId: '', amount: 0, isDebit: false, narration: '', costCenter: '', billRef: '' }
      ]
    });
    
    const [showCostCenter, setShowCostCenter] = useState(false);
    const [showBillRef, setShowBillRef] = useState(false);
    
    const applyTemplate = (templateId: string) => {
      const template = journalTemplates.find(t => t.id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev, narration: template.description,
          lines: template.lines.map(line => ({ ...line, amount: 0, costCenter: '', billRef: '', narration: line.narration || '' }))
        }));
      }
    };

    const addLine = () => {
      setFormData({ ...formData, lines: [...formData.lines, { accountId: '', amount: 0, isDebit: true, narration: '', costCenter: '', billRef: '' }] });
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
          accountId: line.accountId,
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
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm font-medium grid grid-cols-6 gap-2">
            <div>Ledger</div>
            <div>Dr/Cr</div>
            <div>Amount</div>
            <div>Narration</div>
            {showCostCenter && <div>Cost Center</div>}
            <div>Action</div>
          </div>
          {formData.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-6 gap-2">
              <Select value={line.accountId} onValueChange={(value) => updateLine(index, 'accountId', value)}>
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

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">General Ledger</h1>
            <div className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Complete accounting and financial management
              <Badge variant="outline" className="ml-2">
                {accountingMode === 'indian' ? '🇮🇳 Indian Mode' : '🌍 Western Mode'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all">
                <FolderOpen className="w-4 h-4 mr-2" />Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Account Group</DialogTitle>
                <DialogDescription>Create a new account group to organize your ledger accounts.</DialogDescription>
              </DialogHeader>
              <GroupForm />
            </DialogContent>
          </Dialog>

          <Dialog open={showLedgerDialog} onOpenChange={setShowLedgerDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all">
                <Plus className="w-4 h-4 mr-2" />Create Ledger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Ledger</DialogTitle>
                <DialogDescription>Add a new ledger account under an existing group.</DialogDescription>
              </DialogHeader>
              <LedgerForm />
            </DialogContent>
          </Dialog>

          <Dialog open={showAdvancedJournal} onOpenChange={setShowAdvancedJournal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all">
                <Calculator className="w-4 h-4 mr-2" />Advanced Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Advanced Journal Entry</DialogTitle>
                <DialogDescription>Create a multi-line journal entry with cost centers and bill references.</DialogDescription>
              </DialogHeader>
              <AdvancedJournalForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20" onClick={() => router.push('/dashboard/general-ledger/chart-of-accounts')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Chart of Accounts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage account structure and hierarchy</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{accounts.filter(a => a.isGroup).length}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Groups</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20" onClick={() => setActiveTab('ledgers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Ledger Accounts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">View and manage all ledger accounts</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">{accounts.filter(a => !a.isGroup).length}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ledgers</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20" onClick={() => router.push('/dashboard/general-ledger/journal-entries')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Journal Entries</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create and manage journal vouchers</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{journalEntries.length}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Entries</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20" onClick={() => router.push('/dashboard/general-ledger/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-600 rounded-xl shadow-lg">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Trial balance and financial reports</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">5</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Reports</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20" onClick={() => router.push('/dashboard/general-ledger/ledger')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-600 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">View Ledger</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Account-wise transaction history</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{accounts.length}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Accounts</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20" onClick={() => router.push('/dashboard/general-ledger/bills')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-600 rounded-xl shadow-lg">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Bill-wise Details</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Invoice-level tracking & payments</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-pink-600 dark:text-pink-400">NEW</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Feature</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20" onClick={() => router.push('/dashboard/general-ledger/interest')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Interest Calculations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Calculate & post interest entries</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">NEW</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Feature</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20" onClick={() => router.push('/dashboard/general-ledger/budgets')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">GL Budgets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Budget tracking & variance analysis</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">NEW</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Feature</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20" onClick={() => router.push('/dashboard/general-ledger/cost-centers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Cost Centers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Department/project allocation</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">NEW</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Feature</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20" onClick={() => router.push('/dashboard/general-ledger/manage')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-600 rounded-xl shadow-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Manage All + Advanced</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">CRUD + Reports, Audit, Import/Export, Batch</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">⚡</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">All-in-One</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20" onClick={() => router.push('/dashboard/general-ledger/bank-reconciliation')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-600 rounded-xl shadow-lg">
                <Banknote className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Bank Reconciliation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Match bank statements with books</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">✓</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Critical</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20" onClick={() => router.push('/dashboard/general-ledger/recurring-entries')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-violet-600 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Recurring Entries</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Automate repetitive journal entries</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">🔄</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Auto</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20" onClick={() => router.push('/dashboard/general-ledger/vouchers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-600 rounded-xl shadow-lg">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">All Vouchers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Payment, Receipt, Contra, Sales, Purchase</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">6</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Types</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20" onClick={() => router.push('/dashboard/general-ledger/advanced-reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-600 rounded-xl shadow-lg">
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </div>
              <ChevronRight className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Advanced Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Detailed P&L, Balance Sheet, Cash Flow</p>
            <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
              <span className="text-3xl font-bold text-sky-600 dark:text-sky-400">📊</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pro</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <TabsList className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <TabsTrigger value="groups" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm">Account Groups</TabsTrigger>
          <TabsTrigger value="ledgers" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm">Ledgers</TabsTrigger>
          <TabsTrigger value="vouchers" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm">Vouchers</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-sm">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b dark:border-gray-700">
              <CardTitle className="flex items-center text-gray-800 dark:text-gray-100">
                <FolderOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />Account Groups ({accounts.filter(a => a.isGroup).length} groups)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Affects</TableHead>
                    <TableHead>Ledgers Count</TableHead>
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGroup(group._id, group.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
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
                    {accountingMode === 'indian' && <TableHead>GST/PAN</TableHead>}
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
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
                        {accountingMode === 'indian' && (
                          <TableCell>
                            <div className="text-xs">
                              <div>GST: N/A</div>
                              <div>PAN: N/A</div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="text-sm">{ledger.code}</div>
                          {ledger.description && <div className="text-xs text-muted-foreground">{ledger.description}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ledger.isActive ? "default" : "secondary"}>
                            {ledger.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLedger(ledger._id, ledger.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                    <TableHead>Actions</TableHead>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVoucher(entry._id, entry.entryNumber)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
                        <TableRow className="border-t-2 font-bold bg-gray-50 dark:bg-gray-800">
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