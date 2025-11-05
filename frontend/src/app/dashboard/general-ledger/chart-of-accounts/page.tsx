'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { generalLedgerAPI, type Account } from '@/lib/api/generalLedgerAPI';
import { toast } from '@/components/ui/use-toast';

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await generalLedgerAPI.getAccounts({ hierarchy: true });
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

  const CreateAccountForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      code: '',
      type: 'asset' as const,
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
            <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
              <SelectTrigger><SelectValue placeholder="Select parent (optional)" /></SelectTrigger>
              <SelectContent>
                {accounts.filter(a => a.isGroup).map(account => (
                  <SelectItem key={account._id} value={account._id}>{account.name}</SelectItem>
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

  const renderAccountTree = (accounts: Account[], level = 0) => {
    return accounts.map(account => (
      <React.Fragment key={account._id}>
        <TableRow>
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
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
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
            </DialogHeader>
            <CreateAccountForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Hierarchy ({accounts.length} accounts)</CardTitle>
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
              {renderAccountTree(accounts)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}