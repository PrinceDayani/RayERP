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
import { Plus, FileText, Calculator, DollarSign, Trash2, AlertCircle, FolderOpen, Building2, Users, Package, CreditCard, Banknote, Receipt, FileSpreadsheet } from 'lucide-react';

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
  const [accountGroups] = useState<AccountGroup[]>([
    { id: '1', name: 'Capital Account', nature: 'liability', affects: 'balance-sheet' },
    { id: '2', name: 'Current Assets', nature: 'asset', affects: 'balance-sheet' },
    { id: '3', name: 'Current Liabilities', nature: 'liability', affects: 'balance-sheet' },
    { id: '4', name: 'Fixed Assets', nature: 'asset', affects: 'balance-sheet' },
    { id: '8', name: 'Sales Accounts', nature: 'income', affects: 'profit-loss' },
    { id: '9', name: 'Purchase Accounts', nature: 'expense', affects: 'profit-loss' },
    { id: '12', name: 'Indirect Expenses', nature: 'expense', affects: 'profit-loss' },
    { id: '14', name: 'Bank Accounts', parentId: '2', nature: 'asset', affects: 'balance-sheet' },
    { id: '15', name: 'Cash-in-Hand', parentId: '2', nature: 'asset', affects: 'balance-sheet' },
    { id: '16', name: 'Sundry Debtors', parentId: '2', nature: 'asset', affects: 'balance-sheet' },
    { id: '17', name: 'Sundry Creditors', parentId: '3', nature: 'liability', affects: 'balance-sheet' }
  ]);

  const [ledgers, setLedgers] = useState<Ledger[]>([
    { id: '1', name: 'Cash', groupId: '15', openingBalance: 50000, currentBalance: 50000, isActive: true },
    { id: '2', name: 'HDFC Bank', groupId: '14', openingBalance: 100000, currentBalance: 100000, isActive: true, isBankAccount: true },
    { id: '3', name: 'ICICI Bank', groupId: '14', openingBalance: 75000, currentBalance: 75000, isActive: true, isBankAccount: true },
    { id: '4', name: 'ABC Customer', groupId: '16', openingBalance: 25000, currentBalance: 25000, isActive: true, phone: '9876543210', email: 'abc@example.com' },
    { id: '5', name: 'XYZ Supplier', groupId: '17', openingBalance: -15000, currentBalance: -15000, isActive: true, gstNo: '27ABCDE1234F1Z5' },
    { id: '6', name: 'Sales Account', groupId: '8', openingBalance: 0, currentBalance: 0, isActive: true },
    { id: '7', name: 'Purchase Account', groupId: '9', openingBalance: 0, currentBalance: 0, isActive: true },
    { id: '8', name: 'Salary Expenses', groupId: '12', openingBalance: 0, currentBalance: 0, isActive: true },
    { id: '9', name: 'Rent Expenses', groupId: '12', openingBalance: 0, currentBalance: 0, isActive: true },
    { id: '10', name: 'Office Equipment', groupId: '4', openingBalance: 200000, currentBalance: 200000, isActive: true }
  ]);
  
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: '1', voucherType: 'receipt', voucherNo: 'RCP001', date: '2024-01-15', reference: 'INV-001',
      narration: 'Cash received from ABC Customer',
      lines: [
        { ledgerId: '1', ledgerName: 'Cash', amount: 25000, isDebit: true },
        { ledgerId: '4', ledgerName: 'ABC Customer', amount: 25000, isDebit: false }
      ],
      totalAmount: 25000, isPosted: true, createdAt: '2024-01-15T10:30:00Z'
    }
  ]);
  
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
  
  const [trialBalance, setTrialBalance] = useState<any>(null);

  const generateTrialBalance = () => {
    const ledgerBalances = new Map();
    
    ledgers.forEach(ledger => {
      ledgerBalances.set(ledger.id, ledger.currentBalance);
    });
    
    vouchers.filter(v => v.isPosted).forEach(voucher => {
      voucher.lines.forEach(line => {
        const currentBalance = ledgerBalances.get(line.ledgerId) || 0;
        const ledger = ledgers.find(l => l.id === line.ledgerId);
        const group = accountGroups.find(g => g.id === ledger?.groupId);
        
        if (ledger && group) {
          if (['asset', 'expense'].includes(group.nature)) {
            ledgerBalances.set(line.ledgerId, currentBalance + (line.isDebit ? line.amount : -line.amount));
          } else {
            ledgerBalances.set(line.ledgerId, currentBalance + (line.isDebit ? -line.amount : line.amount));
          }
        }
      });
    });
    
    const trialBalanceData = ledgers.map(ledger => {
      const balance = ledgerBalances.get(ledger.id) || 0;
      const group = accountGroups.find(g => g.id === ledger.groupId);
      let debitBalance = 0;
      let creditBalance = 0;

      if (group && ['asset', 'expense'].includes(group.nature)) {
        if (balance >= 0) {
          debitBalance = balance;
        } else {
          creditBalance = Math.abs(balance);
        }
      } else {
        if (balance >= 0) {
          creditBalance = balance;
        } else {
          debitBalance = Math.abs(balance);
        }
      }

      return {
        id: ledger.id,
        name: ledger.name,
        groupName: group?.name || '',
        debit: debitBalance,
        credit: creditBalance
      };
    });

    const totalDebits = trialBalanceData.reduce((sum, item) => sum + item.debit, 0);
    const totalCredits = trialBalanceData.reduce((sum, item) => sum + item.credit, 0);

    setTrialBalance({
      ledgers: trialBalanceData.filter(ledger => ledger.debit > 0 || ledger.credit > 0),
      totals: { debits: totalDebits, credits: totalCredits, balanced: Math.abs(totalDebits - totalCredits) < 0.01 },
      generatedAt: new Date().toLocaleString()
    });
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('New Group:', formData);
      setShowGroupDialog(false);
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newLedger: Ledger = {
        id: Date.now().toString(), ...formData, currentBalance: formData.openingBalance, isActive: true
      };
      setLedgers(prev => [...prev, newLedger]);
      setShowLedgerDialog(false);
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
                {accountGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
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
          lines: template.lines.map(line => ({ ...line, ledgerName: ledgers.find(l => l.id === line.ledgerId)?.name || '', amount: 0, costCenter: '', billRef: '' }))
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isBalanced) return alert('Debits must equal credits');

      const newVoucher: Voucher = {
        id: Date.now().toString(), voucherType: 'journal',
        voucherNo: `JV${String(vouchers.filter(v => v.voucherType === 'journal').length + 1).padStart(4, '0')}`,
        date: formData.date, reference: formData.reference, narration: formData.narration,
        lines: formData.lines.map(line => ({ ...line, ledgerName: ledgers.find(l => l.id === line.ledgerId)?.name || '' })),
        totalAmount: Math.max(totalDebits, totalCredits), isPosted: false, createdAt: new Date().toISOString(),
        project: formData.project, department: formData.department
      };

      setVouchers(prev => [newVoucher, ...prev]);
      setShowAdvancedJournal(false);
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
                <SelectTrigger><SelectValue placeholder="Select ledger" /></SelectTrigger>
                <SelectContent>
                  {ledgers.map(ledger => (
                    <SelectItem key={ledger.id} value={ledger.id}>{ledger.name}</SelectItem>
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
        <h1 className="text-3xl font-bold">Advanced General Ledger</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Groups</p>
                <p className="text-2xl font-bold">{accountGroups.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ledgers</p>
                <p className="text-2xl font-bold">{ledgers.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vouchers</p>
                <p className="text-2xl font-bold">{vouchers.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{journalTemplates.length}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-orange-600" />
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
                <FolderOpen className="w-5 h-5 mr-2" />Account Groups ({accountGroups.length} groups)
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
                  {accountGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{group.nature}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.affects === 'balance-sheet' ? 'default' : 'secondary'}>
                          {group.affects === 'balance-sheet' ? 'Balance Sheet' : 'P&L Account'}
                        </Badge>
                      </TableCell>
                      <TableCell>{ledgers.filter(l => l.groupId === group.id).length}</TableCell>
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
                <Building2 className="w-5 h-5 mr-2" />Ledgers ({ledgers.length} ledgers)
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
                  {ledgers.map((ledger) => (
                    <TableRow key={ledger.id}>
                      <TableCell className="font-medium">
                        {ledger.name}
                        {ledger.isBankAccount && <Badge variant="outline" className="ml-2">Bank</Badge>}
                      </TableCell>
                      <TableCell>{accountGroups.find(g => g.id === ledger.groupId)?.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{ledger.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{ledger.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {ledger.phone && <div className="text-sm">{ledger.phone}</div>}
                        {ledger.email && <div className="text-xs text-muted-foreground">{ledger.email}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ledger.isActive ? "default" : "secondary"}>
                          {ledger.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />Vouchers ({vouchers.length} entries)
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
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono">{voucher.voucherNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{voucher.voucherType}</Badge>
                      </TableCell>
                      <TableCell>{new Date(voucher.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="max-w-xs truncate">{voucher.narration}</TableCell>
                      <TableCell>{voucher.project || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{voucher.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={voucher.isPosted ? "default" : "secondary"}>
                          {voucher.isPosted ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
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
                        <strong>Generated:</strong> {trialBalance.generatedAt} | 
                        <strong>Ledgers with Balances:</strong> {trialBalance.ledgers.length}
                      </p>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ledger Name</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.ledgers?.map((ledger: any) => (
                          <TableRow key={ledger.id}>
                            <TableCell className="font-medium">{ledger.name}</TableCell>
                            <TableCell>{ledger.groupName}</TableCell>
                            <TableCell className="text-right font-mono">
                              {ledger.debit > 0 ? `₹${ledger.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {ledger.credit > 0 ? `₹${ledger.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 font-bold bg-gray-50">
                          <TableCell colSpan={2}>Total</TableCell>
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