'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Edit, Trash2, ArrowLeft, Download, Upload, FileText, Search, TrendingUp, TrendingDown, DollarSign, Layers, RefreshCw } from 'lucide-react';
import { generalLedgerAPI, type Account } from '@/lib/api/generalLedgerAPI';
import { chartOfAccountsAPI } from '@/lib/api/chartOfAccountsAPI';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await chartOfAccountsAPI.getTemplates();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await generalLedgerAPI.getAccounts({ hierarchy: true, _t: Date.now() });
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chart of accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/recalculate-balances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log('Recalculate result:', result);
      toast({
        title: 'Success',
        description: `Reset ${result.accountsReset} accounts, processed ${result.entriesProcessed} entries, updated ${result.balancesUpdated} balances`
      });
      fetchAccounts();
    } catch (error) {
      console.error('Recalculate error:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate balances',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const CreateAccountForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      code: '',
      type: 'asset',
      parentId: '',
      isGroup: false,
      description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await generalLedgerAPI.createAccount({
          ...formData,
          isActive: true,
          balance: 0,
          level: formData.parentId ? 1 : 0
        });

        toast({
          title: 'Success',
          description: 'Account created successfully'
        });

        setShowCreateDialog(false);
        fetchAccounts();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to create account',
          variant: 'destructive'
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Account Name *</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>
          <div>
            <Label>Account Code *</Label>
            <Input 
              value={formData.code} 
              onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
              required 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Account Type *</Label>
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
            <Select value={formData.parentId || 'none'} onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? '' : value })}>
              <SelectTrigger><SelectValue placeholder="Select parent (optional)" /></SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="none">None (Root Level)</SelectItem>
                {accounts
                  .filter(a => a.isGroup)
                  .slice(0, 50)
                  .map(account => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name} ({account.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={formData.isGroup} 
              onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })} 
            />
            <span>Is Group Account</span>
          </label>
        </div>

        <div>
          <Label>Description</Label>
          <Input 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            placeholder="Optional description"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">Create Account</Button>
        </div>
      </form>
    );
  };

  const EditAccountForm = () => {
    const [formData, setFormData] = useState({
      name: selectedAccount?.name || '',
      code: selectedAccount?.code || '',
      type: selectedAccount?.type || 'asset',
      parentId: selectedAccount?.parentId || '',
      isGroup: selectedAccount?.isGroup || false,
      description: selectedAccount?.description || ''
    });

    // Update form data when selectedAccount changes
    useEffect(() => {
      if (selectedAccount) {
        setFormData({
          name: selectedAccount.name || '',
          code: selectedAccount.code || '',
          type: selectedAccount.type || 'asset',
          parentId: selectedAccount.parentId || '',
          isGroup: selectedAccount.isGroup || false,
          description: selectedAccount.description || ''
        });
      }
    }, [selectedAccount]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAccount) return;
      
      try {
        console.log('Updating account:', selectedAccount._id, formData);
        const result = await generalLedgerAPI.updateAccount(selectedAccount._id, formData);
        console.log('Update result:', result);

        toast({
          title: 'Success',
          description: 'Account updated successfully'
        });

        setShowEditDialog(false);
        fetchAccounts();
      } catch (error: any) {
        console.error('Update error:', error);
        console.error('Error response:', error?.response?.data);
        toast({
          title: 'Error',
          description: error?.response?.data?.message || error?.message || 'Failed to update account',
          variant: 'destructive'
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Account Name *</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>
          <div>
            <Label>Account Code *</Label>
            <Input 
              value={formData.code} 
              onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
              required 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Account Type *</Label>
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
            <Select value={formData.parentId || 'none'} onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? '' : value })}>
              <SelectTrigger><SelectValue placeholder="Select parent (optional)" /></SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="none">None (Root Level)</SelectItem>
                {accounts
                  .filter(a => a.isGroup && a._id !== selectedAccount?._id)
                  .slice(0, 50)
                  .map(account => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name} ({account.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={formData.isGroup} 
              onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })} 
            />
            <span>Is Group Account</span>
          </label>
        </div>

        <div>
          <Label>Description</Label>
          <Input 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            placeholder="Optional description"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">Update Account</Button>
        </div>
      </form>
    );
  };

  const renderAccountTree = (accounts: Account[], level = 0) => {
    return accounts.map(account => (
      <React.Fragment key={account._id}>
        <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/finance/account-ledger/${account._id}`)}>
          <TableCell style={{ paddingLeft: `${level * 20 + 16}px` }}>
            <div className="flex items-center">
              {account.isGroup && <FolderOpen className="w-4 h-4 mr-2 text-blue-600" />}
              <span className="font-medium">{account.name}</span>
            </div>
          </TableCell>
          <TableCell className="font-mono">{account.code}</TableCell>
          <TableCell>
            <Badge variant="outline" className="capitalize">{account.type}</Badge>
          </TableCell>
          <TableCell className="text-right font-mono">
            ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </TableCell>
          <TableCell>
            <Badge variant={account.isActive ? "default" : "secondary"}>
              {account.isActive ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedAccount(account);
                  setShowEditDialog(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={async () => {
                  if (confirm(`Delete account "${account.name}"?`)) {
                    try {
                      await generalLedgerAPI.deleteAccount(account._id);
                      toast({ title: 'Success', description: 'Account deleted' });
                      fetchAccounts();
                    } catch (error) {
                      toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' });
                    }
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {account.children && renderAccountTree(account.children, level + 1)}
      </React.Fragment>
    ));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading chart of accounts...</div>
      </div>
    );
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const accountsByType = accounts.reduce((acc: any, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1;
    return acc;
  }, {});

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const assetBalance = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const liabilityBalance = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <p className="text-gray-600 mt-1">Manage your account structure and hierarchy</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecalculateBalances}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate Balances
          </Button>
          <Button variant="outline" onClick={fetchAccounts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Account Template</DialogTitle>
                <DialogDescription>Choose an industry template to create accounts</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {templates.map(t => (
                  <Card key={t._id} className="cursor-pointer hover:bg-gray-50" onClick={async () => {
                    try {
                      await chartOfAccountsAPI.applyTemplate(t._id);
                      toast({ title: 'Success', description: `Applied ${t.name} template` });
                      setShowTemplateDialog(false);
                      fetchAccounts();
                    } catch (error) {
                      toast({ title: 'Error', description: 'Failed to apply template', variant: 'destructive' });
                    }
                  }}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-sm text-gray-600">{t.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.accounts?.length || 0} accounts</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={async () => {
            try {
              const blob = await chartOfAccountsAPI.exportCSV();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `chart-of-accounts-${Date.now()}.csv`;
              a.click();
              toast({ title: 'Success', description: 'Exported successfully' });
            } catch (error) {
              toast({ title: 'Error', description: 'Export failed', variant: 'destructive' });
            }
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogDescription>
                  Add a new account to your chart of accounts. Group accounts can contain sub-accounts.
                </DialogDescription>
              </DialogHeader>
              <CreateAccountForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold mt-1">{accounts.length}</p>
              </div>
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold mt-1">₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assets</p>
                <p className="text-2xl font-bold mt-1 text-green-600">₹{assetBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Liabilities</p>
                <p className="text-2xl font-bold mt-1 text-red-600">₹{liabilityBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search accounts by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Account Hierarchy ({filteredAccounts.length} of {accounts.length} accounts)</CardTitle>
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No accounts found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                renderAccountTree(filteredAccounts)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <EditAccountForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}