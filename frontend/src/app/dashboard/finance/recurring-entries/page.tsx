'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Play, Pause, Trash2, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function RecurringEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [failed, setFailed] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const [allRes, failedRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/api/recurring-entries`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/recurring-entries/failed`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/recurring-entries/pending-approvals`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const [allData, failedData, pendingData] = await Promise.all([
        allRes.json(),
        failedRes.json(),
        pendingRes.json()
      ]);

      if (allData.success) setEntries(allData.data || []);
      if (failedData.success) setFailed(failedData.data || []);
      if (pendingData.success) setPending(pendingData.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating recurring entry:', formData);
    try {
      const res = await fetch(`${API_URL}/api/recurring-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      console.log('Response:', { status: res.status, data });
      if (data.success) {
        toast({ title: 'Success', description: 'Recurring entry created' });
        setShowDialog(false);
        fetchData();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating recurring entry:', error);
      toast({ title: 'Error', description: 'Failed to create entry', variant: 'destructive' });
    }
  };

  const handleSkipNext = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/recurring-entries/${id}/skip-next`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Next occurrence skipped' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to skip', variant: 'destructive' });
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/recurring-entries/${id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: 'Retry initiated' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to retry', variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/recurring-entries/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      if (data.success) {
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
      const res = await fetch(`${API_URL}/api/recurring-entries/batch-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ entryIds: ids })
      });
      const data = await res.json();
      if (data.success) {
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
      const res = await fetch(`${API_URL}/api/recurring-entries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Entry deleted' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recurring Entries</h1>
          <p className="text-gray-600 mt-1">Automate repetitive journal entries</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />Create Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
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
                <p className="text-sm text-gray-600">Active</p>
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
                <p className="text-sm text-gray-600">Failed</p>
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
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">{pending.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Recurring Entries</CardTitle>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell className="capitalize">{entry.frequency}</TableCell>
                      <TableCell>{new Date(entry.nextRunDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {entry.isActive ? (
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleSkipNext(entry._id)} title="Skip Next">
                            <Play className="w-4 h-4" />
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
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
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
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Recurring Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({...formData, frequency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div>
              <Label>End Date (Optional)</Label>
              <Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">Create Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
