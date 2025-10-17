'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, 
  Building, TrendingUp, AlertCircle, CheckCircle, Copy, 
  FileText, BarChart3, Settings, Archive, RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subType?: string;
  parentId?: string;
  balance: number;
  isActive: boolean;
  description?: string;
  taxCode?: string;
  bankAccount?: boolean;
  reconcilable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');
  
  const [newAccount, setNewAccount] = useState<{
    code: string;
    name: string;
    type: Account['type'];
    subType: string;
    parentId: string;
    balance: string;
    description: string;
    taxCode: string;
    bankAccount: boolean;
    reconcilable: boolean;
  }>({
    code: '',
    name: '',
    type: 'asset',
    subType: '',
    parentId: '',
    balance: '0',
    description: '',
    taxCode: '',
    bankAccount: false,
    reconcilable: false
  });

  const accountTypes = [
    { value: 'asset', label: 'Asset', color: 'bg-blue-100 text-blue-800' },
    { value: 'liability', label: 'Liability', color: 'bg-red-100 text-red-800' },
    { value: 'equity', label: 'Equity', color: 'bg-green-100 text-green-800' },
    { value: 'income', label: 'Income', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'expense', label: 'Expense', color: 'bg-purple-100 text-purple-800' }
  ];

  const subTypes = {
    asset: ['Current Asset', 'Fixed Asset', 'Intangible Asset', 'Investment'],
    liability: ['Current Liability', 'Long-term Liability', 'Contingent Liability'],
    equity: ['Share Capital', 'Retained Earnings', 'Other Equity'],
    income: ['Operating Revenue', 'Non-operating Revenue', 'Other Income'],
    expense: ['Operating Expense', 'Administrative Expense', 'Financial Expense', 'Other Expense']
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedType, selectedStatus]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const storedAccounts = localStorage.getItem('coa_accounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        const sampleAccounts: Account[] = [
          { _id: '1', code: '1000', name: 'ASSETS', type: 'asset', balance: 0, isActive: true, description: 'Main Asset Account' },
          { _id: '2', code: '1100', name: 'Current Assets', type: 'asset', parentId: '1', balance: 0, isActive: true, subType: 'Current Asset' },
          { _id: '3', code: '1110', name: 'Cash and Cash Equivalents', type: 'asset', parentId: '2', balance: 50000, isActive: true, subType: 'Current Asset', bankAccount: true, reconcilable: true },
          { _id: '4', code: '1120', name: 'Accounts Receivable', type: 'asset', parentId: '2', balance: 25000, isActive: true, subType: 'Current Asset' },
          { _id: '5', code: '1130', name: 'Inventory', type: 'asset', parentId: '2', balance: 15000, isActive: true, subType: 'Current Asset' },
          { _id: '6', code: '1200', name: 'Fixed Assets', type: 'asset', parentId: '1', balance: 0, isActive: true, subType: 'Fixed Asset' },
          { _id: '7', code: '1210', name: 'Property, Plant & Equipment', type: 'asset', parentId: '6', balance: 100000, isActive: true, subType: 'Fixed Asset' },
          { _id: '8', code: '2000', name: 'LIABILITIES', type: 'liability', balance: 0, isActive: true, description: 'Main Liability Account' },
          { _id: '9', code: '2100', name: 'Current Liabilities', type: 'liability', parentId: '8', balance: 0, isActive: true, subType: 'Current Liability' },
          { _id: '10', code: '2110', name: 'Accounts Payable', type: 'liability', parentId: '9', balance: 20000, isActive: true, subType: 'Current Liability' },
          { _id: '11', code: '3000', name: 'EQUITY', type: 'equity', balance: 0, isActive: true, description: 'Main Equity Account' },
          { _id: '12', code: '3100', name: 'Share Capital', type: 'equity', parentId: '11', balance: 100000, isActive: true, subType: 'Share Capital' },
          { _id: '13', code: '4000', name: 'REVENUE', type: 'income', balance: 0, isActive: true, description: 'Main Revenue Account' },
          { _id: '14', code: '4100', name: 'Sales Revenue', type: 'income', parentId: '13', balance: 75000, isActive: true, subType: 'Operating Revenue' },
          { _id: '15', code: '5000', name: 'EXPENSES', type: 'expense', balance: 0, isActive: true, description: 'Main Expense Account' },
          { _id: '16', code: '5100', name: 'Operating Expenses', type: 'expense', parentId: '15', balance: 0, isActive: true, subType: 'Operating Expense' },
          { _id: '17', code: '5110', name: 'Salaries and Wages', type: 'expense', parentId: '16', balance: 30000, isActive: true, subType: 'Operating Expense' },
          { _id: '18', code: '5120', name: 'Office Rent', type: 'expense', parentId: '16', balance: 12000, isActive: true, subType: 'Operating Expense' }
        ];
        setAccounts(sampleAccounts);
        localStorage.setItem('coa_accounts', JSON.stringify(sampleAccounts));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch accounts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(account => account.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(account => 
        selectedStatus === 'active' ? account.isActive : !account.isActive
      );
    }

    setFilteredAccounts(filtered);
  };

  const createAccount = async () => {
    try {
      if (!newAccount.code || !newAccount.name) {
        toast({ title: 'Error', description: 'Account code and name are required', variant: 'destructive' });
        return;
      }

      const existingAccount = accounts.find(acc => acc.code === newAccount.code);
      if (existingAccount && !editingAccount) {
        toast({ title: 'Error', description: 'Account code already exists', variant: 'destructive' });
        return;
      }

      const account: Account = {
        _id: editingAccount?._id || `acc${Date.now()}`,
        code: newAccount.code,
        name: newAccount.name,
        type: newAccount.type,
        subType: newAccount.subType,
        parentId: newAccount.parentId || undefined,
        balance: parseFloat(newAccount.balance) || 0,
        description: newAccount.description,
        taxCode: newAccount.taxCode,
        bankAccount: newAccount.bankAccount,
        reconcilable: newAccount.reconcilable,
        isActive: true,
        createdAt: editingAccount?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedAccounts;
      if (editingAccount) {
        updatedAccounts = accounts.map(acc => acc._id === editingAccount._id ? account : acc);
      } else {
        updatedAccounts = [...accounts, account];
      }

      setAccounts(updatedAccounts);
      localStorage.setItem('coa_accounts', JSON.stringify(updatedAccounts));

      resetForm();
      setShowDialog(false);
      toast({ 
        title: 'Success', 
        description: `Account ${editingAccount ? 'updated' : 'created'} successfully` 
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save account', variant: 'destructive' });
    }
  };

  const editAccount = (account: Account) => {
    setEditingAccount(account);
    setNewAccount({
      code: account.code,
      name: account.name,
      type: account.type,
      subType: account.subType || '',
      parentId: account.parentId || '',
      balance: account.balance.toString(),
      description: account.description || '',
      taxCode: account.taxCode || '',
      bankAccount: account.bankAccount || false,
      reconcilable: account.reconcilable || false
    });
    setShowDialog(true);
  };

  const deleteAccount = async (accountId: string) => {
    try {
      const hasChildren = accounts.some(acc => acc.parentId === accountId);
      if (hasChildren) {
        toast({ title: 'Error', description: 'Cannot delete account with child accounts', variant: 'destructive' });
        return;
      }

      const updatedAccounts = accounts.filter(acc => acc._id !== accountId);
      setAccounts(updatedAccounts);
      localStorage.setItem('coa_accounts', JSON.stringify(updatedAccounts));
      toast({ title: 'Success', description: 'Account deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' });
    }
  };

  const toggleAccountStatus = async (accountId: string) => {
    try {
      const updatedAccounts = accounts.map(acc => 
        acc._id === accountId ? { ...acc, isActive: !acc.isActive } : acc
      );
      setAccounts(updatedAccounts);
      localStorage.setItem('coa_accounts', JSON.stringify(updatedAccounts));
      toast({ title: 'Success', description: 'Account status updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update account status', variant: 'destructive' });
    }
  };

  const bulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    try {
      if (selectedAccounts.length === 0) {
        toast({ title: 'Error', description: 'No accounts selected', variant: 'destructive' });
        return;
      }

      let updatedAccounts = [...accounts];

      switch (action) {
        case 'activate':
          updatedAccounts = updatedAccounts.map(acc => 
            selectedAccounts.includes(acc._id) ? { ...acc, isActive: true } : acc
          );
          break;
        case 'deactivate':
          updatedAccounts = updatedAccounts.map(acc => 
            selectedAccounts.includes(acc._id) ? { ...acc, isActive: false } : acc
          );
          break;
        case 'delete':
          updatedAccounts = updatedAccounts.filter(acc => !selectedAccounts.includes(acc._id));
          break;
      }

      setAccounts(updatedAccounts);
      localStorage.setItem('coa_accounts', JSON.stringify(updatedAccounts));
      setSelectedAccounts([]);
      toast({ title: 'Success', description: `Bulk ${action} completed` });
    } catch (error) {
      toast({ title: 'Error', description: `Failed to perform bulk ${action}`, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setNewAccount({
      code: '',
      name: '',
      type: 'asset',
      subType: '',
      parentId: '',
      balance: '0',
      description: '',
      taxCode: '',
      bankAccount: false,
      reconcilable: false
    });
    setEditingAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const typeConfig = accountTypes.find(t => t.value === type);
    return typeConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getAccountLevel = (account: Account): number => {
    if (!account.parentId) return 0;
    const parent = accounts.find(acc => acc._id === account.parentId);
    return parent ? getAccountLevel(parent) + 1 : 0;
  };

  const renderHierarchy = (parentId?: string, level = 0) => {
    const children = accounts.filter(acc => acc.parentId === parentId);
    
    return children.map(account => (
      <React.Fragment key={account._id}>
        <TableRow className={`${level > 0 ? 'bg-gray-50' : ''}`}>
          <TableCell>
            <div className="flex items-center">
              <Checkbox
                checked={selectedAccounts.includes(account._id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAccounts([...selectedAccounts, account._id]);
                  } else {
                    setSelectedAccounts(selectedAccounts.filter(id => id !== account._id));
                  }
                }}
              />
            </div>
          </TableCell>
          <TableCell>
            <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center">
              {level > 0 && <span className="text-gray-400 mr-2">└─</span>}
              <span className="font-mono">{account.code}</span>
            </div>
          </TableCell>
          <TableCell>
            <div style={{ paddingLeft: `${level * 20}px` }}>
              <span className={level === 0 ? 'font-semibold' : ''}>{account.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge className={getAccountTypeColor(account.type)}>
              {account.type}
            </Badge>
          </TableCell>
          <TableCell>{account.subType || '-'}</TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(account.balance)}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Badge variant={account.isActive ? "default" : "secondary"}>
                {account.isActive ? "Active" : "Inactive"}
              </Badge>
              {account.bankAccount && <Badge variant="outline">Bank</Badge>}
              {account.reconcilable && <Badge variant="outline">Reconcilable</Badge>}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => editAccount(account)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleAccountStatus(account._id)}>
                {account.isActive ? <Archive className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteAccount(account._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {renderHierarchy(account._id, level + 1)}
      </React.Fragment>
    ));
  };

  const exportAccounts = () => {
    const csvContent = [
      ['Code', 'Name', 'Type', 'Sub Type', 'Balance', 'Status', 'Description'].join(','),
      ...filteredAccounts.map(acc => [
        acc.code,
        `"${acc.name}"`,
        acc.type,
        acc.subType || '',
        acc.balance,
        acc.isActive ? 'Active' : 'Inactive',
        `"${acc.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-of-accounts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'Create New Account'}</DialogTitle>
                <DialogDescription>
                  {editingAccount ? 'Update account details' : 'Add a new account to your chart of accounts'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Account Code *</Label>
                    <Input
                      id="code"
                      value={newAccount.code}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., 1001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Account Name *</Label>
                    <Input
                      id="name"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cash in Hand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Account Type *</Label>
                    <Select value={newAccount.type} onValueChange={(value: Account['type']) => 
                      setNewAccount(prev => ({ ...prev, type: value, subType: '' }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subType">Sub Type</Label>
                    <Select value={newAccount.subType} onValueChange={(value) => 
                      setNewAccount(prev => ({ ...prev, subType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub type" />
                      </SelectTrigger>
                      <SelectContent>
                        {subTypes[newAccount.type]?.map(subType => (
                          <SelectItem key={subType} value={subType}>
                            {subType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentId">Parent Account</Label>
                    <Select value={newAccount.parentId} onValueChange={(value) => 
                      setNewAccount(prev => ({ ...prev, parentId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Top Level)</SelectItem>
                        {accounts
                          .filter(acc => acc.type === newAccount.type && acc._id !== editingAccount?._id)
                          .map(account => (
                            <SelectItem key={account._id} value={account._id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="balance">Opening Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={newAccount.balance}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAccount.description}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Account description (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxCode">Tax Code</Label>
                    <Input
                      id="taxCode"
                      value={newAccount.taxCode}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, taxCode: e.target.value }))}
                      placeholder="e.g., GST, VAT"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="bankAccount"
                        checked={newAccount.bankAccount}
                        onCheckedChange={(checked) => setNewAccount(prev => ({ ...prev, bankAccount: checked }))}
                      />
                      <Label htmlFor="bankAccount">Bank Account</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="reconcilable"
                        checked={newAccount.reconcilable}
                        onCheckedChange={(checked) => setNewAccount(prev => ({ ...prev, reconcilable: checked }))}
                      />
                      <Label htmlFor="reconcilable">Reconcilable</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAccount}>
                    {editingAccount ? 'Update Account' : 'Create Account'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account List</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'table' ? 'hierarchy' : 'table')}
                  >
                    {viewMode === 'table' ? 'Hierarchy View' : 'Table View'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAccounts.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedAccounts.length} account(s) selected
                  </span>
                  <div className="flex gap-1 ml-auto">
                    <Button size="sm" variant="outline" onClick={() => bulkAction('activate')}>
                      Activate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulkAction('deactivate')}>
                      Deactivate
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => bulkAction('delete')}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAccounts(filteredAccounts.map(acc => acc._id));
                          } else {
                            setSelectedAccounts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sub Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'hierarchy' ? (
                    renderHierarchy()
                  ) : (
                    filteredAccounts.map(account => (
                      <TableRow key={account._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAccounts.includes(account._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAccounts([...selectedAccounts, account._id]);
                              } else {
                                setSelectedAccounts(selectedAccounts.filter(id => id !== account._id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>
                          <Badge className={getAccountTypeColor(account.type)}>
                            {account.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{account.subType || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(account.balance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={account.isActive ? "default" : "secondary"}>
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {account.bankAccount && <Badge variant="outline">Bank</Badge>}
                            {account.reconcilable && <Badge variant="outline">Reconcilable</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => editAccount(account)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleAccountStatus(account._id)}>
                              {account.isActive ? <Archive className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteAccount(account._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {accountTypes.map(type => {
              const typeAccounts = accounts.filter(acc => acc.type === type.value);
              const totalBalance = typeAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
              const activeCount = typeAccounts.filter(acc => acc.isActive).length;
              
              return (
                <Card key={type.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${type.color.split(' ')[0]}`} />
                      {type.label}s
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                      <div className="text-sm text-muted-foreground">
                        {activeCount} active accounts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {typeAccounts.length} total accounts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Configure your account structure and preferences</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Code Format</Label>
                  <Select defaultValue="numeric">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numeric (1000, 1100, 1110)</SelectItem>
                      <SelectItem value="alphanumeric">Alphanumeric (A1000, L2000)</SelectItem>
                      <SelectItem value="custom">Custom Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Account Hierarchy</Label>
                    <p className="text-sm text-muted-foreground">Allow parent-child relationships between accounts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Account Approval</Label>
                    <p className="text-sm text-muted-foreground">New accounts require approval before activation</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate Account Codes</Label>
                    <p className="text-sm text-muted-foreground">Automatically suggest account codes based on type</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccounts;