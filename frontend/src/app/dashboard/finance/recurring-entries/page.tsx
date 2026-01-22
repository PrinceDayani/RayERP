'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Play, Pause, Trash2, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Minus, Edit, History, Download, Search, Copy, Save, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { recurringEntriesAPI, accountsAPI } from '@/lib/api/financeAPI';
import { validateRecurringEntry } from '@/utils/validation';
import { exportRecurringEntries } from '@/utils/exportUtils';

export default function RecurringEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [failed, setFailed] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('all');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'frequency'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTab, setSelectedTab] = useState('all');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    entries: [{ accountId: '', debit: 0, credit: 0, description: '' }]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAll();
      setAccounts(response.data?.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load accounts', variant: 'destructive' });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allData, failedData, pendingData] = await Promise.all([
        recurringEntriesAPI.getAll(),
        recurringEntriesAPI.getFailed(),
        recurringEntriesAPI.getPendingApprovals()
      ]);

      setEntries(allData.data?.data || []);
      setFailed(failedData.data?.data || []);
      setPending(pendingData.data?.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addEntry = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { accountId: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const removeEntry = (index: number) => {
    setFormData({
      ...formData,
      entries: formData.entries.filter((_, i) => i !== index)
    });
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const updated = [...formData.entries];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, entries: updated });
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      frequency: entry.frequency,
      startDate: new Date(entry.startDate).toISOString().split('T')[0],
      endDate: entry.endDate ? new Date(entry.endDate).toISOString().split('T')[0] : '',
      description: entry.description || '',
      entries: entry.entries || [{ accountId: '', debit: 0, credit: 0, description: '' }]
    });
    setShowDialog(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await recurringEntriesAPI.update(id, { isActive: !currentStatus });
      if (response.data?.success) {
        toast({ title: 'Success', description: `Entry ${!currentStatus ? 'activated' : 'deactivated'}` });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' });
    }
  };

  const handleViewHistory = async (id: string) => {
    try {
      const response = await recurringEntriesAPI.getHistory(id);
      setHistoryData(response.data?.data || []);
      setShowHistory(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch history', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (entry: any) => {
    setFormData({
      name: `${entry.name} (Copy)`,
      frequency: entry.frequency,
      startDate: new Date().toISOString().split('T')[0],
      endDate: entry.endDate ? new Date(entry.endDate).toISOString().split('T')[0] : '',
      description: entry.description || '',
      entries: entry.entries || [{ accountId: '', debit: 0, credit: 0, description: '' }]
    });
    setShowDialog(true);
  };

  const handleSaveAsTemplate = async (entry: any) => {
    localStorage.setItem(`template-${entry.name}`, JSON.stringify(entry));
    toast({ title: 'Success', description: 'Template saved' });
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return;
    if (!confirm(`Delete ${selectedEntries.size} entries?`)) return;
    try {
      await Promise.all([...selectedEntries].map(id => recurringEntriesAPI.delete(id)));
      toast({ title: 'Success', description: `${selectedEntries.size} entries deleted` });
      setSelectedEntries(new Set());
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete entries', variant: 'destructive' });
    }
  };

  const handleBulkToggle = async (active: boolean) => {
    if (selectedEntries.size === 0) return;
    try {
      await Promise.all([...selectedEntries].map(id =>
        recurringEntriesAPI.update(id, { isActive: active })
      ));
      toast({ title: 'Success', description: `${selectedEntries.size} entries ${active ? 'activated' : 'deactivated'}` });
      setSelectedEntries(new Set());
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update entries', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Frequency', 'Next Run', 'Status', 'Description'],
      ...filteredEntries.map(e => [
        e.name,
        e.frequency,
        new Date(e.nextRunDate).toLocaleDateString(),
        e.isActive ? 'Active' : 'Inactive',
        e.description || ''
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recurring-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Success', description: 'Entries exported' });
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFrequency = filterFrequency === 'all' || e.frequency === filterFrequency;
    return matchesSearch && matchesFrequency;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'frequency') return a.frequency.localeCompare(b.frequency);
    return new Date(b.nextRunDate).getTime() - new Date(a.nextRunDate).getTime();
  });

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description,
      frequency: formData.frequency,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      entries: formData.entries.map(entry => ({
        accountId: entry.accountId,
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
        description: entry.description || ''
      }))
    };

    const totalDebit = payload.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = payload.entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({ title: 'Error', description: 'Debits must equal credits', variant: 'destructive' });
      return;
    }

    try {
      const response = editingEntry
        ? await recurringEntriesAPI.update(editingEntry._id, payload)
        : await recurringEntriesAPI.create(payload);

      if (response.data?.success) {
        toast({ title: 'Success', description: editingEntry ? 'Entry updated' : 'Entry created' });
        setShowDialog(false);
        setEditingEntry(null);
        setFormData({ name: '', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', entries: [{ accountId: '', debit: 0, credit: 0, description: '' }] });
        fetchData();
      } else {
        toast({ title: 'Error', description: response.data?.message || 'Failed to create entry', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  const handleSkipNext = async (id: string) => {
    try {
      const response = await recurringEntriesAPI.skipNext(id);
      if (response.data?.success) {
        toast({ title: 'Success', description: 'Next occurrence skipped' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to skip', variant: 'destructive' });
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const response = await recurringEntriesAPI.retry(id);
      if (response.data?.success) {
        toast({ title: 'Success', description: 'Retry initiated' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to retry', variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await recurringEntriesAPI.approve(id);
      if (response.data?.success) {
        toast({ title: 'Success', description: 'Entry approved' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleBatchApprove = async () => {
    try {
      const ids = pending.map(e => e._id);
      const response = await recurringEntriesAPI.batchApprove(ids);
      if (response.data?.success) {
        toast({ title: 'Success', description: `${ids.length} entries approved` });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to batch approve', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring entry?')) return;
    try {
      const response = await recurringEntriesAPI.delete(id);
      if (response.data?.success) {
        toast({ title: 'Success', description: 'Entry deleted' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return <PageLoader text="Loading recurring entries..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recurring Entries</h1>
          <p className="text-muted-foreground mt-1">Automate repetitive journal entries</p>
        </div>
        <div className="flex gap-2">
          {selectedEntries.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleBulkToggle(true)}>
                <Play className="w-4 h-4 mr-1" />Activate ({selectedEntries.size})
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkToggle(false)}>
                <Pause className="w-4 h-4 mr-1" />Deactivate ({selectedEntries.size})
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />Delete ({selectedEntries.size})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <Button onClick={() => { setEditingEntry(null); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />Create Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{entries.filter(e => e.isActive).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failed.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">{pending.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manage Recurring Entries</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64" />
              </div>
              <Select value={filterFrequency} onValueChange={setFilterFrequency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === 'name' ? 'date' : sortBy === 'date' ? 'frequency' : 'name')}>
                <ArrowUpDown className="w-4 h-4 mr-1" />{sortBy === 'name' ? 'Name' : sortBy === 'date' ? 'Date' : 'Frequency'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Entries ({entries.length})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({failed.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval ({pending.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input type="checkbox" checked={selectedEntries.size === paginatedEntries.length && paginatedEntries.length > 0} onChange={(e) => {
                        if (e.target.checked) setSelectedEntries(new Set(paginatedEntries.map(e => e._id)));
                        else setSelectedEntries(new Set());
                      }} />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <input type="checkbox" checked={selectedEntries.has(entry._id)} onChange={(e) => {
                          const newSet = new Set(selectedEntries);
                          if (e.target.checked) newSet.add(entry._id);
                          else newSet.delete(entry._id);
                          setSelectedEntries(newSet);
                        }} />
                      </TableCell>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell className="capitalize">{entry.frequency}</TableCell>
                      <TableCell>{new Date(entry.nextRunDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {entry.isActive ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(entry)} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDuplicate(entry)} title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSaveAsTemplate(entry)} title="Save as Template">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleViewHistory(entry._id)} title="View History">
                            <History className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleToggleActive(entry._id, entry.isActive)} title={entry.isActive ? 'Deactivate' : 'Activate'}>
                            {entry.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(entry._id)} title="Delete">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length} entries</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm py-2 px-3">{currentPage} / {totalPages}</span>
                    <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="failed" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Failure Reason</TableHead>
                    <TableHead>Retry Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failed.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell className="text-red-600">{entry.failureReason || 'Unknown error'}</TableCell>
                      <TableCell>{entry.retryCount || 0} / {entry.maxRetries || 3}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleRetry(entry._id)}>
                          <RefreshCw className="w-4 h-4 mr-2" />Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {failed.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No failed entries
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {pending.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <Button onClick={handleBatchApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />Approve All
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell className="capitalize">{entry.frequency}</TableCell>
                      <TableCell>{new Date(entry.nextRunDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(entry._id)} className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pending.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No pending approvals
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingEntry(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingEntry ? 'Edit' : 'Create'} Recurring Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
              {/* Basic Info Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Entry Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Monthly Rent Payment" />
                </div>
                <div>
                  <Label>Frequency *</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates & Description Row */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional notes" />
                </div>
              </div>

              {/* Journal Entries Section */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base">Journal Entries</Label>
                  <Button type="button" size="sm" onClick={addEntry}><Plus className="w-4 h-4 mr-1" />Add</Button>
                </div>

                {/* Entries Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="w-32">Debit</TableHead>
                        <TableHead className="w-32">Credit</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.entries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            <Select value={entry.accountId} onValueChange={(v) => updateEntry(index, 'accountId', v)} required>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {accounts.map(acc => (
                                  <SelectItem key={acc._id} value={acc._id}>
                                    <span className="font-mono text-xs mr-2">{acc.code}</span>{acc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" min="0" value={entry.debit} onChange={(e) => updateEntry(index, 'debit', e.target.value)} placeholder="0.00" className="h-9" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" step="0.01" min="0" value={entry.credit} onChange={(e) => updateEntry(index, 'credit', e.target.value)} placeholder="0.00" className="h-9" />
                          </TableCell>
                          <TableCell>
                            <Input value={entry.description} onChange={(e) => updateEntry(index, 'description', e.target.value)} placeholder="Details" className="h-9" />
                          </TableCell>
                          <TableCell>
                            {formData.entries.length > 1 && (
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeEntry(index)} className="h-8 w-8 p-0">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Balance Summary */}
                <div className={`mt-3 p-3 rounded-lg flex items-center justify-between ${Math.abs(formData.entries.reduce((sum, e) => sum + Number(e.debit), 0) - formData.entries.reduce((sum, e) => sum + Number(e.credit), 0)) > 0.01 ? 'bg-destructive/10 border border-destructive' : 'bg-green-50 dark:bg-green-950/20 border border-green-500'}`}>
                  <div className="flex gap-6">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Debit: </span>
                      <span className="font-mono font-semibold">${formData.entries.reduce((sum, e) => sum + Number(e.debit), 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total Credit: </span>
                      <span className="font-mono font-semibold">${formData.entries.reduce((sum, e) => sum + Number(e.credit), 0).toFixed(2)}</span>
                    </div>
                  </div>
                  {Math.abs(formData.entries.reduce((sum, e) => sum + Number(e.debit), 0) - formData.entries.reduce((sum, e) => sum + Number(e.credit), 0)) > 0.01 ? (
                    <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Unbalanced</Badge>
                  ) : (
                    <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Balanced</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setEditingEntry(null); }}>Cancel</Button>
              <Button type="submit">{editingEntry ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Entry History</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {historyData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                      <TableCell>{h.reference}</TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell><Badge>{h.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No history available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
