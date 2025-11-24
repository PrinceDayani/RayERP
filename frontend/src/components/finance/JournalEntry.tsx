'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useGeneralLedger } from '@/hooks/finance/useGeneralLedger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Upload, Download, Copy, AlertTriangle, CheckCircle, Paperclip, X, Save, Zap, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import { AccountSelector } from './AccountSelector';
const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

const JournalEntry = () => {
  const { accounts, loading, fetchAccounts, createJournalEntry } = useGeneralLedger();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ]
  });

  const [templates, setTemplates] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [budgetWarnings, setBudgetWarnings] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
    fetchRecentEntries();
  }, [fetchAccounts]);

  useEffect(() => {
    const timer = setTimeout(() => validateEntry(), 500);
    return () => clearTimeout(timer);
  }, [formData, recentEntries]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await axios.get(`${API_URL}/api/journal-entry-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data.data || []);
    } catch (error) {}
  };

  const fetchRecentEntries = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/journal-entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entries = res.data.data || res.data || [];
      setRecentEntries(entries.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent entries:', error);
    }
  };

  const validateEntry = async () => {
    if (!formData.description || formData.lines.length < 2) return;
    
    const isDuplicate = recentEntries.some(entry => 
      entry.description?.toLowerCase() === formData.description.toLowerCase() &&
      entry.reference === formData.reference &&
      Math.abs(new Date(entry.entryDate || entry.date).getTime() - new Date(formData.date).getTime()) < 86400000
    );
    
    setDuplicateWarning(isDuplicate ? '⚠️ Similar entry found in recent transactions' : '');
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const totalDebits = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredits = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const saveAsTemplate = async () => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return alert('Authentication required');
      await axios.post(`${API_URL}/api/journal-entry-templates`, {
        name: templateName,
        description: formData.description,
        category: 'CUSTOM',
        lines: formData.lines.map(l => ({ account: l.accountId, description: l.description })),
        variables: []
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Template saved!');
      fetchTemplates();
    } catch (error) { alert('Failed to save template'); }
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    if (!template) return;
    setFormData({
      ...formData,
      description: template.description,
      lines: template.lines.map((line: any) => ({
        accountId: line.account || '',
        debit: 0,
        credit: 0,
        description: line.description || ''
      }))
    });
    setShowTemplateDialog(false);
  };

  const duplicateEntry = (entry: any) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: entry.description,
      lines: entry.lines.map((line: any) => ({
        accountId: line.account?._id || line.accountId || '',
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description || ''
      }))
    });
  };

  const handleBatchImport = async () => {
    if (!csvFile) return alert('Please select a CSV file');
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return alert('Authentication required. Please login.');
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await axios.post(`${API_URL}/api/journal-entries/bulk-import`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert(`${res.data.data.length} entries imported!`);
      setShowBatchDialog(false);
      setCsvFile(null);
      fetchRecentEntries();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to import');
    }
  };

  const downloadCSVTemplate = () => {
    const csv = 'entryDate,description,lines\n2024-01-01,"Sample Entry","[{\"accountId\":\"123\",\"debit\":1000,\"credit\":0,\"description\":\"Debit line\"},{\"accountId\":\"456\",\"debit\":0,\"credit\":1000,\"description\":\"Credit line\"}]"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'journal-entry-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return alert('Debits must equal credits');

    const validLines = formData.lines.filter(line => 
      line.accountId && line.description && (line.debit > 0 || line.credit > 0)
    );

    if (validLines.length < 2) return alert('At least 2 valid lines required');

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return alert('Authentication required. Please login.');
      const res = await axios.post(`${API_URL}/api/journal-entries`, {
        ...formData,
        entryDate: formData.date,
        lines: validLines.map(line => ({
          account: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description
        })),
        totalDebit: totalDebits,
        totalCredit: totalCredits
      }, { headers: { Authorization: `Bearer ${token}` } });

      const entryId = res.data.data?._id || res.data._id;
      
      // Post the entry immediately
      try {
        await axios.post(`${API_URL}/api/general-ledger/journal-entries/${entryId}/post`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (postError: any) {
        console.error('Error posting entry:', postError);
        alert('Entry created but failed to post: ' + (postError?.response?.data?.message || postError.message));
      }

      if (attachments.length > 0) {
        for (const file of attachments) {
          const fd = new FormData();
          fd.append('file', file);
          await axios.post(`${API_URL}/api/journal-entries/${entryId}/attachment`, fd, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      alert('Journal entry created and posted successfully!');
      await fetchRecentEntries();
      resetForm();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to create journal entry');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' }
      ]
    });
    setAttachments([]);
    setBudgetWarnings([]);
    setDuplicateWarning('');
  };

  const quickTemplates = [
    { name: 'Depreciation', lines: [{ desc: 'Depreciation Expense', debit: true }, { desc: 'Accumulated Depreciation', credit: true }] },
    { name: 'Accrual', lines: [{ desc: 'Expense Account', debit: true }, { desc: 'Accrued Liability', credit: true }] },
    { name: 'Payroll', lines: [{ desc: 'Salary Expense', debit: true }, { desc: 'Cash/Bank', credit: true }] }
  ];

  return (
    <div className="min-h-screen p-6 bg-background">
      <Card className="max-w-7xl mx-auto shadow-xl bg-card border-border">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-2xl">
              <FileText className="w-7 h-7 mr-3" />
              Enhanced Journal Entry
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-background text-foreground">
                    <Zap className="w-4 h-4 mr-2" />Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Load Template</DialogTitle></DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {templates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No templates found. Create your first template by saving an entry.</p>
                      </div>
                    ) : templates.map(template => (
                      <Card key={template._id} className="p-4 hover:bg-muted/50 cursor-pointer" onClick={() => loadTemplate(template._id)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <Badge className="mt-2">{template.category}</Badge>
                          </div>
                          <Button size="sm" variant="ghost">Load</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-background text-foreground">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />Batch Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Bulk Import from CSV</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Upload CSV File</Label>
                      <Input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button variant="outline" onClick={downloadCSVTemplate} className="w-full">
                      <Download className="w-4 h-4 mr-2" />Download CSV Template
                    </Button>
                    <Button onClick={handleBatchImport} className="w-full" disabled={!csvFile}>
                      <Upload className="w-4 h-4 mr-2" />Import Entries
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={saveAsTemplate} className="bg-background text-foreground">
                <Save className="w-4 h-4 mr-2" />Save as Template
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <Tabs defaultValue="entry" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="entry">New Entry</TabsTrigger>
              <TabsTrigger value="quick">Quick Actions</TabsTrigger>
              <TabsTrigger value="recent">Recent Entries</TabsTrigger>
            </TabsList>

            <TabsContent value="entry">
              <form onSubmit={handleSubmit} className="space-y-6">
                {duplicateWarning && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-yellow-800 dark:text-yellow-200">{duplicateWarning}</span>
                  </div>
                )}

                {budgetWarnings.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-200">
                      <AlertTriangle className="w-5 h-5" />Budget Impact Warnings
                    </div>
                    {budgetWarnings.map((warning, idx) => (
                      <div key={idx} className="text-sm text-red-700 dark:text-red-300 ml-7">
                        {warning.message} (Variance: ${warning.variance?.toFixed(2)})
                      </div>
                    ))}
                  </div>
                )}
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-lg border bg-muted/50 border-border">
              <div>
                <Label htmlFor="date" className="font-medium text-foreground">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reference" className="font-medium text-foreground">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., INV-001"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="font-medium text-foreground">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Journal entry description"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* Journal Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-foreground">Journal Lines</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addLine}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-card border-border">
                <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium bg-muted/50 border-border text-foreground">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-2 text-center">Debit</div>
                  <div className="col-span-2 text-center">Credit</div>
                  <div className="col-span-3 text-center">Description</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
                
                {formData.lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 border-border bg-card">
                    <div className="col-span-4">
                      <AccountSelector
                        value={line.accountId}
                        onValueChange={(value) => updateLine(index, 'accountId', value)}
                        accounts={accounts}
                        onAccountCreated={fetchAccounts}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Line description"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={formData.lines.length <= 2}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Paperclip className="w-5 h-5" />Attachments
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/20">
                <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">PDF, Images, Documents (Max 10MB)</p>
                </label>
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals and Balance Check */}
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Debits</div>
                  <div className="text-2xl font-bold text-foreground">${totalDebits.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Credits</div>
                  <div className="text-2xl font-bold text-foreground">${totalCredits.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Status</div>
                  <Badge variant={isBalanced ? "default" : "destructive"} className="text-lg px-4 py-1">
                    {isBalanced ? <><CheckCircle className="w-4 h-4 mr-2 inline" />Balanced</> : <><AlertTriangle className="w-4 h-4 mr-2 inline" />Not Balanced</>}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
              <Button type="submit" disabled={loading || !isBalanced} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? <Spinner className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Create Entry
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="quick">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickTemplates.map((template, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card border-border" onClick={() => {
                setFormData({
                  ...formData,
                  description: template.name,
                  lines: template.lines.map(line => ({
                    accountId: '',
                    debit: 0,
                    credit: 0,
                    description: line.desc
                  }))
                });
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">Quick entry for {template.name.toLowerCase()}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="space-y-3">
            {recentEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No recent entries found</p>
                <p className="text-sm mt-2">Create your first journal entry to see it here</p>
              </div>
            ) : recentEntries.map((entry) => (
              <Card key={entry._id} className="p-4 hover:bg-muted/30 bg-card border-border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge>{entry.entryNumber}</Badge>
                      <span className="font-semibold">{entry.description}</span>
                      <Badge variant="outline">{entry.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Date: {new Date(entry.entryDate || entry.date).toLocaleDateString()} | 
                      Debit: ${entry.totalDebit?.toFixed(2)} | 
                      Credit: ${entry.totalCredit?.toFixed(2)}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => duplicateEntry(entry)}>
                    <Copy className="w-4 h-4 mr-2" />Duplicate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntry;