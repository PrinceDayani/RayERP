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
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, ArrowLeft, Eye, Edit, Trash2 } from 'lucide-react';
import { generalLedgerAPI, type JournalEntry, type Account } from '@/lib/api/generalLedgerAPI';
import { toast } from '@/components/ui/use-toast';

export default function JournalEntriesPage() {
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [journalData, accountsData] = await Promise.all([
        generalLedgerAPI.getJournalEntries({ limit: 100 }),
        generalLedgerAPI.getAccounts()
      ]);
      
      setJournalEntries(journalData.journalEntries || []);
      setAccounts(accountsData.accounts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journal entries',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const CreateJournalForm = () => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', description: '', debit: 0, credit: 0 },
        { accountId: '', description: '', debit: 0, credit: 0 }
      ]
    });

    const addLine = () => {
      setFormData({
        ...formData,
        lines: [...formData.lines, { accountId: '', description: '', debit: 0, credit: 0 }]
      });
    };

    const updateLine = (index: number, field: string, value: any) => {
      const newLines = [...formData.lines];
      newLines[index] = { ...newLines[index], [field]: value };
      setFormData({ ...formData, lines: newLines });
    };

    const removeLine = (index: number) => {
      if (formData.lines.length > 2) {
        setFormData({
          ...formData,
          lines: formData.lines.filter((_, i) => i !== index)
        });
      }
    };

    const totalDebits = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredits = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
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
        await generalLedgerAPI.createJournalEntry(formData);
        
        toast({
          title: 'Success',
          description: 'Journal entry created successfully'
        });

        setShowCreateDialog(false);
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Date *</Label>
            <Input 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
              required 
            />
          </div>
          <div>
            <Label>Reference</Label>
            <Input 
              value={formData.reference} 
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })} 
              placeholder="REF001"
            />
          </div>
        </div>

        <div>
          <Label>Description *</Label>
          <Textarea 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            required 
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <Label>Journal Lines</Label>
          <div className="bg-gray-50 p-2 rounded text-sm font-medium grid grid-cols-5 gap-2">
            <div>Account</div>
            <div>Description</div>
            <div>Debit</div>
            <div>Credit</div>
            <div>Action</div>
          </div>
          
          {formData.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-5 gap-2">
              <Select 
                value={line.accountId} 
                onValueChange={(value) => updateLine(index, 'accountId', value)}
              >
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => !a.isGroup).map(account => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name} ({account.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                value={line.description} 
                onChange={(e) => updateLine(index, 'description', e.target.value)} 
                placeholder="Line description"
              />
              
              <Input 
                type="number" 
                step="0.01" 
                value={line.debit || ''} 
                onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} 
              />
              
              <Input 
                type="number" 
                step="0.01" 
                value={line.credit || ''} 
                onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} 
              />
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => removeLine(index)} 
                disabled={formData.lines.length <= 2}
              >
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
          <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isBalanced}>
            Create Journal Entry
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading journal entries...</div>
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
            <h1 className="text-3xl font-bold">Journal Entries</h1>
            <p className="text-gray-600 mt-1">Create and manage journal entries</p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Journal Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
            </DialogHeader>
            <CreateJournalForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal Entries ({journalEntries.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
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
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!entry.isPosted && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}