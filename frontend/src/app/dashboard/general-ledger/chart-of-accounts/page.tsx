'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FolderTree, Search, Filter, Download, Edit, ChevronRight, ChevronDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  category?: string;
  level: number;
  balance: number;
  openingBalance: number;
  isActive: boolean;
  isGroup: boolean;
  parentId?: any;
  description?: string;
  taxInfo?: { gstNo?: string; panNo?: string; taxRate?: number };
  contactInfo?: { address?: string; phone?: string; email?: string };
  bankDetails?: { accountNumber?: string; ifscCode?: string; bankName?: string; branch?: string };
  creditLimit?: number;
  children?: Account[];
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, typeFilter]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const accountsData = data.accounts || data || [];
        const flatAccounts = Array.isArray(accountsData) ? accountsData : [];
        setAccounts(flatAccounts);
        buildHierarchy(flatAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (flatAccounts: Account[]) => {
    const accountMap = new Map();
    const rootAccounts: Account[] = [];
    
    flatAccounts.forEach(acc => {
      accountMap.set(acc._id, { ...acc, children: [] });
    });
    
    flatAccounts.forEach(acc => {
      const account = accountMap.get(acc._id);
      if (acc.parentId && typeof acc.parentId === 'object' && acc.parentId._id) {
        const parent = accountMap.get(acc.parentId._id);
        if (parent) parent.children.push(account);
      } else if (acc.parentId && typeof acc.parentId === 'string') {
        const parent = accountMap.get(acc.parentId);
        if (parent) parent.children.push(account);
      } else {
        rootAccounts.push(account);
      }
    });
    
    setFilteredAccounts(rootAccounts);
  };

  const filterAccounts = () => {
    const accountsArray = Array.isArray(accounts) ? accounts : [];
    let filtered = accountsArray;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(acc => acc.type === typeFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(acc => 
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (viewMode === 'hierarchy') {
      buildHierarchy(filtered);
    } else {
      setFilteredAccounts(filtered);
    }
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const AccountForm = ({ account }: { account?: Account | null }) => {
    const [formData, setFormData] = useState({
      code: account?.code || '',
      name: account?.name || '',
      type: account?.type || 'asset',
      subType: account?.subType || '',
      category: account?.category || '',
      isGroup: account?.isGroup || false,
      parentId: account?.parentId?._id || '',
      openingBalance: account?.openingBalance || 0,
      description: account?.description || '',
      gstNo: account?.taxInfo?.gstNo || '',
      panNo: account?.taxInfo?.panNo || '',
      phone: account?.contactInfo?.phone || '',
      email: account?.contactInfo?.email || '',
      address: account?.contactInfo?.address || '',
      creditLimit: account?.creditLimit || 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('auth-token');
        const payload = {
          code: formData.code,
          name: formData.name,
          type: formData.type,
          subType: formData.subType,
          category: formData.category,
          isGroup: formData.isGroup,
          parentId: formData.parentId || undefined,
          openingBalance: formData.openingBalance,
          description: formData.description,
          taxInfo: {
            gstNo: formData.gstNo,
            panNo: formData.panNo
          },
          contactInfo: {
            phone: formData.phone,
            email: formData.email,
            address: formData.address
          },
          creditLimit: formData.creditLimit
        };

        const url = account 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts/${account._id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/accounts`;
        
        const res = await fetch(url, {
          method: account ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          await fetchAccounts();
          setShowDialog(false);
          setEditingAccount(null);
        } else {
          const error = await res.json();
          alert(error.message || 'Error saving account');
        }
      } catch (error) {
        console.error('Error saving account:', error);
        alert('Error saving account');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Account Code *</Label>
            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <div>
            <Label>Account Name *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
            <Label>Sub Type</Label>
            <Input value={formData.subType} onChange={(e) => setFormData({ ...formData, subType: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Parent Account</Label>
            <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
              <SelectTrigger><SelectValue placeholder="None (Root Level)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Root Level)</SelectItem>
                {Array.isArray(accounts) && accounts.filter(a => a.isGroup).map(acc => (
                  <SelectItem key={acc._id} value={acc._id}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Opening Balance</Label>
            <Input type="number" step="0.01" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input type="checkbox" checked={formData.isGroup} onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })} />
          <Label>This is a Group Account (can have sub-accounts)</Label>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="tax">Tax Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label>Credit Limit</Label>
              <Input type="number" step="0.01" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} />
            </div>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GST Number</Label>
                <Input value={formData.gstNo} onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })} placeholder="27ABCDE1234F1Z5" />
              </div>
              <div>
                <Label>PAN Number</Label>
                <Input value={formData.panNo} onChange={(e) => setFormData({ ...formData, panNo: e.target.value })} placeholder="ABCDE1234F" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditingAccount(null); }}>Cancel</Button>
          <Button type="submit">{account ? 'Update' : 'Create'} Account</Button>
        </div>
      </form>
    );
  };

  const renderAccountTree = (account: Account, depth: number = 0) => {
    const isExpanded = expandedNodes.has(account._id);
    const hasChildren = account.children && account.children.length > 0;

    return (
      <div key={account._id}>
        <div 
          className={`flex items-center justify-between p-3 hover:bg-gray-50 border-b`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <button onClick={() => toggleNode(account._id)} className="p-1 hover:bg-gray-200 rounded">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-600">{account.code}</span>
                <span className="font-medium">{account.name}</span>
                {account.isGroup && <Badge variant="outline">Group</Badge>}
                <Badge variant={account.type === 'asset' ? 'default' : account.type === 'liability' ? 'destructive' : 'secondary'}>
                  {account.type}
                </Badge>
              </div>
              {account.description && <p className="text-xs text-gray-500 mt-1">{account.description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-sm">₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(account); setShowDialog(true); }}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && account.children?.map(child => renderAccountTree(child, depth + 1))}
      </div>
    );
  };

  const renderFlatList = (account: Account) => (
    <div key={account._id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b">
      <div className="flex items-center space-x-3 flex-1">
        <span className="font-mono text-sm text-gray-600 w-24">{account.code}</span>
        <span className="font-medium flex-1">{account.name}</span>
        {account.isGroup && <Badge variant="outline">Group</Badge>}
        <Badge variant={account.type === 'asset' ? 'default' : account.type === 'liability' ? 'destructive' : 'secondary'}>
          {account.type}
        </Badge>
      </div>
      <div className="flex items-center space-x-4">
        <span className="font-mono text-sm">₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(account); setShowDialog(true); }}>
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your complete account structure</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button onClick={() => { setEditingAccount(null); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />New Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
          const accountsArray = Array.isArray(accounts) ? accounts : [];
          const count = accountsArray.filter(a => a.type === type).length;
          const total = accountsArray.filter(a => a.type === type).reduce((sum, a) => sum + a.balance, 0);
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600 capitalize">{type}s</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-500 mt-1">₹{total.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <FolderTree className="w-5 h-5 mr-2" />
              Accounts ({filteredAccounts.length})
            </CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" variant={viewMode === 'hierarchy' ? 'default' : 'outline'} onClick={() => setViewMode('hierarchy')}>
                Hierarchy
              </Button>
              <Button size="sm" variant={viewMode === 'flat' ? 'default' : 'outline'} onClick={() => setViewMode('flat')}>
                Flat
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Assets</SelectItem>
                <SelectItem value="liability">Liabilities</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredAccounts.length > 0 ? (
              viewMode === 'hierarchy' 
                ? filteredAccounts.map(acc => renderAccountTree(acc))
                : filteredAccounts.map(acc => renderFlatList(acc))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No accounts found. Click "New Account" to create one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit' : 'Create'} Account</DialogTitle>
          </DialogHeader>
          <AccountForm account={editingAccount} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
