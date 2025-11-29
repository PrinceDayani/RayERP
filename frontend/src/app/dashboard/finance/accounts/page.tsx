'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import FinanceAccountCreationForm from '@/components/finance/AccountCreationForm';
import { 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Eye, 
  Building2, 
  CreditCard, 
  FileText,
  Download,
  Upload,
  RefreshCw,
  MapPin
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
  subType: string;
  balance: number;
  currency: string;
  isActive: boolean;
  contactInfo?: {
    city?: string;
    state?: string;
    primaryPhone?: string;
    primaryEmail?: string;
  };
  taxInfo?: {
    gstNo?: string;
    panNo?: string;
    tdsApplicable?: boolean;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [duplicateAccount, setDuplicateAccount] = useState<Account | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchAccounts();
  }, [searchTerm, typeFilter, pagination.page]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await fetch(`${API_URL}/api/accounts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateAccount = async (account: Account) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/accounts/${account._id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Account duplicated successfully"
        });
        fetchAccounts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate account",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to deactivate this account?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Account deactivated successfully"
        });
        fetchAccounts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive"
      });
    }
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-green-100 text-green-800',
      revenue: 'bg-purple-100 text-purple-800',
      expense: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const accountTypes = [
    { value: 'asset', label: 'Assets' },
    { value: 'liability', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expenses' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-muted-foreground">Manage your chart of accounts</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) setDuplicateAccount(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <FinanceAccountCreationForm
                  onAccountCreated={(account) => {
                    setShowCreateDialog(false);
                    setDuplicateAccount(null);
                    fetchAccounts();
                    toast({
                      title: "Success",
                      description: `Account "${account.name}" created successfully`
                    });
                  }}
                  duplicateFrom={duplicateAccount}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {accountTypes.map((type) => {
          const count = accounts.filter(acc => acc.type === type.value).length;
          const totalBalance = accounts
            .filter(acc => acc.type === type.value)
            .reduce((sum, acc) => sum + acc.balance, 0);
          
          return (
            <Card key={type.value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeFilter(type.value)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{type.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                  <Badge className={getAccountTypeColor(type.value)}>
                    {type.value.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search accounts by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchAccounts} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setTypeFilter('all'); }} title="Clear filters">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Accounts ({pagination.total})</span>
            <Badge variant="outline">Page {pagination.page} of {pagination.pages}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading accounts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sub Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tax Info</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account._id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/finance/account-ledger/${account._id}`)}>
                      <TableCell className="font-mono text-sm">
                        {account.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAccountTypeColor(account.type)}>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {account.subType || '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(account.balance, account.currency)}
                      </TableCell>
                      <TableCell className="text-sm">
                          {account.contactInfo?.city && (
                          <div className="space-y-1">
                            <div className="text-xs">{account.contactInfo.city}, {account.contactInfo.state}</div>
                            {account.contactInfo.primaryPhone && (
                              <div className="text-xs text-muted-foreground">
                                {account.contactInfo.primaryPhone}
                              </div>
                            )}
                            {account.contactInfo.primaryEmail && (
                              <div className="text-xs text-muted-foreground">
                                {account.contactInfo.primaryEmail}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                          <div className="space-y-1">
                          {account.taxInfo?.gstNo && (
                            <div className="text-xs font-mono">GST: {account.taxInfo.gstNo}</div>
                          )}
                          {account.taxInfo?.panNo && (
                            <div className="text-xs font-mono">PAN: {account.taxInfo.panNo}</div>
                          )}
                          {account.taxInfo?.tdsApplicable && (
                            <Badge variant="secondary" className="text-xs">TDS</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                          {account.bankDetails?.bankName && (
                          <div className="space-y-1">
                            <div className="text-xs">{account.bankDetails.bankName}</div>
                            {account.bankDetails.accountNumber && (
                              <div className="text-xs text-muted-foreground font-mono">
                                ***{account.bankDetails.accountNumber.slice(-4)}
                              </div>
                            )}
                            {account.bankDetails.ifscCode && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {account.bankDetails.ifscCode}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccount(account);
                            }}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDuplicateAccount(account);
                              setShowCreateDialog(true);
                            }}
                            title="Duplicate account"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAccount(account._id);
                            }}
                            title="Deactivate account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} accounts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Details Dialog */}
      {selectedAccount && (
        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Account Details: {selectedAccount.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Account Code</Label>
                  <p className="font-mono">{selectedAccount.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <Badge className={getAccountTypeColor(selectedAccount.type)}>
                    {selectedAccount.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Balance</Label>
                  <p className="font-mono text-lg">
                    {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedAccount.isActive ? "default" : "secondary"}>
                    {selectedAccount.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              {selectedAccount.contactInfo && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedAccount.contactInfo.primaryEmail && (
                      <div>
                        <Label>Email</Label>
                        <p>{selectedAccount.contactInfo.primaryEmail}</p>
                      </div>
                    )}
                    {selectedAccount.contactInfo.primaryPhone && (
                      <div>
                        <Label>Phone</Label>
                        <p>{selectedAccount.contactInfo.primaryPhone}</p>
                      </div>
                    )}
                    {selectedAccount.contactInfo.city && (
                      <div>
                        <Label>Location</Label>
                        <p>{selectedAccount.contactInfo.city}, {selectedAccount.contactInfo.state}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tax Info */}
              {selectedAccount.taxInfo && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tax Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedAccount.taxInfo.gstNo && (
                      <div>
                        <Label>GST Number</Label>
                        <p className="font-mono">{selectedAccount.taxInfo.gstNo}</p>
                      </div>
                    )}
                    {selectedAccount.taxInfo.panNo && (
                      <div>
                        <Label>PAN Number</Label>
                        <p className="font-mono">{selectedAccount.taxInfo.panNo}</p>
                      </div>
                    )}
                    {selectedAccount.taxInfo.tdsApplicable && (
                      <div>
                        <Label>TDS Status</Label>
                        <Badge variant="secondary">TDS Applicable</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Details */}
              {selectedAccount.bankDetails && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedAccount.bankDetails.bankName && (
                      <div>
                        <Label>Bank Name</Label>
                        <p>{selectedAccount.bankDetails.bankName}</p>
                      </div>
                    )}
                    {selectedAccount.bankDetails.accountNumber && (
                      <div>
                        <Label>Account Number</Label>
                        <p className="font-mono">***{selectedAccount.bankDetails.accountNumber.slice(-4)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-muted-foreground ${className}`}>{children}</label>;
}