'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGeneralLedger } from '@/hooks/finance/useGeneralLedger';
import { useCreateEntryShortcut } from '@/hooks/useKeyboardShortcuts';
import { useDateShortcuts } from '@/hooks/useDateShortcuts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Upload, Download, Copy, AlertTriangle, CheckCircle, Paperclip, X, Save, Zap, FileSpreadsheet, Keyboard, Calculator, History, Eye, Link } from 'lucide-react';
import axios from 'axios';
import { AccountSelector } from './AccountSelector';
import { ReferenceSelector } from './ReferenceSelector';
import CreateReference from './CreateReference';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from '@/hooks/use-toast';
const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

const JournalEntry = () => {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const prefilledAccountId = searchParams.get('accountId');
  const { accounts, loading, fetchAccounts, createJournalEntry } = useGeneralLedger();
  const { currency, symbol, formatAmount } = useCurrency();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 },
      { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 }
    ]
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [budgetWarnings, setBudgetWarnings] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState<{index: number, field: 'debit' | 'credit'} | null>(null);
  const [calcExpression, setCalcExpression] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewEntry, setViewEntry] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCreateRefDialog, setShowCreateRefDialog] = useState(false);
  const [selectedEntryForRef, setSelectedEntryForRef] = useState<any>(null);

  // Auto-save draft
  useEffect(() => {
    const timer = setInterval(() => {
      if (formData.lines.some(l => l.accountId || l.debit || l.credit)) {
        localStorage.setItem('journal-draft', JSON.stringify(formData));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('journal-draft');
    if (draft && !editId) {
      const parsed = JSON.parse(draft);
      if (parsed.lines.some((l: any) => l.accountId)) {
        toast({ title: 'Draft Loaded', description: 'Your previous draft has been restored' });
        setFormData(parsed);
      }
    }
  }, []);

  useCreateEntryShortcut(() => {
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  useDateShortcuts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S to save
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isBalanced) {
          document.querySelector('button[type="submit"]')?.dispatchEvent(new Event('click', { bubbles: true }));
        }
        return;
      }

      // Ctrl + Enter to add line
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addLine();
        return;
      }

      if (!e.ctrlKey) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      // Don't navigate if dropdown is open
      if (document.querySelector('[data-state="open"]')) return;
      
      const target = e.target as HTMLElement;
      const parent = target.closest('[data-field]');
      if (!parent) return;
      
      const currentField = parent.getAttribute('data-field');
      const currentIndex = parseInt(parent.getAttribute('data-index') || '0');
      
      e.preventDefault();
      
      let newIndex = currentIndex;
      let newField = currentField;
      
      if (e.key === 'ArrowDown') {
        newIndex = Math.min(currentIndex + 1, formData.lines.length - 1);
      } else if (e.key === 'ArrowUp') {
        newIndex = Math.max(currentIndex - 1, 0);
      } else if (e.key === 'ArrowRight') {
        const fields = ['account', 'debit', 'credit', 'description'];
        const idx = fields.indexOf(currentField || '');
        newField = fields[Math.min(idx + 1, fields.length - 1)];
      } else if (e.key === 'ArrowLeft') {
        const fields = ['account', 'debit', 'credit', 'description'];
        const idx = fields.indexOf(currentField || '');
        newField = fields[Math.max(idx - 1, 0)];
      }
      
      setTimeout(() => {
        const selector = `[data-index="${newIndex}"][data-field="${newField}"] input, [data-index="${newIndex}"][data-field="${newField}"] button`;
        const element = document.querySelector(selector) as HTMLElement;
        element?.focus();
      }, 10);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData.lines.length]);

  useEffect(() => {
    console.log('=== JOURNAL ENTRY INIT ===');
    console.log('prefilledAccountId:', prefilledAccountId);
    console.log('editId:', editId);
    
    fetchAccounts();
    fetchTemplates();
    fetchRecentEntries();
    if (editId) loadEntryForEdit(editId);
  }, [fetchAccounts, editId]);
  
  // Separate effect for pre-filling account
  useEffect(() => {
    if (prefilledAccountId && !editId && accounts.length > 0) {
      console.log('Pre-filling account:', prefilledAccountId);
      const accountExists = accounts.find(a => a._id === prefilledAccountId);
      console.log('Account exists:', accountExists);
      
      setFormData(prev => {
        const newData = {
          ...prev,
          lines: [
            { accountId: prefilledAccountId, debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 },
            { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 }
          ]
        };
        console.log('New form data:', newData);
        return newData;
      });
    }
  }, [prefilledAccountId, editId, accounts]);

  const loadEntryForEdit = async (id: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await axios.get(`${API_URL}/api/journal-entries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entry = res.data.data || res.data;
      setFormData({
        date: new Date(entry.entryDate || entry.date).toISOString().split('T')[0],
        reference: entry.reference || '',
        description: entry.description,
        lines: entry.lines.map((line: any) => ({
          accountId: line.account?._id || line.accountId || '',
          debit: line.debit || 0,
          credit: line.credit || 0,
          description: line.description || '',
          refType: line.refType || 'on-account',
          refId: line.refId || '',
          refAmount: line.refAmount || 0
        }))
      });
      setEditingId(id);
    } catch (error) {
      console.error('Failed to load entry:', error);
    }
  };

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
      console.log('Recent entries fetched:', entries);
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
    const newLine = { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 };
    const newLines = [...formData.lines, newLine];
    setFormData({ ...formData, lines: newLines });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
    
    // Real-time validation
    if (field === 'accountId' && value) {
      const account = accounts.find(a => a._id === value);
      if (account && (account as any).balance < 0) {
        toast({ title: 'Warning', description: `${account.name} has negative balance`, variant: 'destructive' });
      }
    }
  };

  const removeLine = (index: number) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    if (newLines.length < 2) {
      newLines.push({ accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 });
    }
    setFormData({ ...formData, lines: newLines });
  };

  const totalDebits = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredits = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  useEffect(() => {
    if (!isBalanced && formData.lines.length > 0) {
      const lastLine = formData.lines[formData.lines.length - 1];
      const hasData = lastLine.accountId || lastLine.debit > 0 || lastLine.credit > 0 || lastLine.description;
      
      if (hasData) {
        const timer = setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 }]
          }));
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isBalanced, formData.lines]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
  };

  const handleDrop = (e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(f => 
        f.type.includes('pdf') || 
        f.type.includes('image') || 
        f.type.includes('document') || 
        f.name.endsWith('.doc') || 
        f.name.endsWith('.docx')
      );
      
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
        toast({ title: 'Success', description: `${validFiles.length} file(s) added` });
      } else {
        toast({ title: 'Error', description: 'Only PDF, images, and documents allowed', variant: 'destructive' });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleWindowDrop = (e: DragEvent) => {
      handleDrop(e);
    };
    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragleave', handleWindowDragLeave);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragleave', handleWindowDragLeave);
    };
  }, [attachments]);

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const saveAsTemplate = async () => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
        return;
      }
      await axios.post(`${API_URL}/api/journal-entry-templates`, {
        name: templateName,
        description: formData.description,
        category: 'CUSTOM',
        lines: formData.lines.map(l => ({ account: l.accountId, description: l.description })),
        variables: []
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: 'Template saved successfully' });
      fetchTemplates();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    }
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
    if (!csvFile) {
      toast({ title: 'Error', description: 'Please select a CSV file', variant: 'destructive' });
      return;
    }
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
        return;
      }
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await axios.post(`${API_URL}/api/journal-entries/bulk-import`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Success', description: `${res.data.data.length} entries imported successfully` });
      setShowBatchDialog(false);
      setCsvFile(null);
      fetchRecentEntries();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to import', variant: 'destructive' });
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
    if (!isBalanced) {
      toast({ title: 'Error', description: 'Debits must equal credits', variant: 'destructive' });
      return;
    }

    const validLines = formData.lines.filter(line => 
      line.accountId && (line.debit > 0 || line.credit > 0)
    );

    if (validLines.length < 2) {
      toast({ title: 'Error', description: 'At least 2 valid lines required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
        return;
      }
      
      const method = editingId ? 'put' : 'post';
      const url = editingId ? `${API_URL}/api/journal-entries/${editingId}` : `${API_URL}/api/journal-entries`;
      
      const res = await axios[method](url, {
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
      
      try {
        await axios.post(`${API_URL}/api/general-ledger/journal-entries/${entryId}/post`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (postError: any) {
        toast({ title: 'Warning', description: 'Entry created but failed to post', variant: 'destructive' });
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

      toast({ title: 'Success', description: editingId ? 'Journal entry updated successfully' : 'Journal entry created and posted successfully' });
      localStorage.removeItem('journal-draft');
      await fetchRecentEntries();
      resetForm();
      setEditingId(null);
      window.history.replaceState({}, '', '/dashboard/finance/journal-entry');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to create journal entry', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 },
        { accountId: '', debit: 0, credit: 0, description: '', refType: 'on-account', refId: '', refAmount: 0 }
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
    <div className="min-h-screen p-6 bg-background relative">
      {isDragging && (
        <div
          className="fixed inset-0 z-[100] bg-primary/20 backdrop-blur-sm flex items-center justify-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="bg-card border-4 border-dashed border-primary rounded-2xl p-12 text-center shadow-2xl">
            <Upload className="w-24 h-24 mx-auto mb-4 text-primary animate-bounce" />
            <h3 className="text-3xl font-bold mb-2">Drop Files Here</h3>
            <p className="text-muted-foreground text-lg">Release to attach files to journal entry</p>
            <p className="text-sm text-muted-foreground mt-2">PDF, Images, Documents accepted</p>
          </div>
        </div>
      )}
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
              <Button variant="outline" size="sm" onClick={() => setShowShortcutsDialog(true)} className="bg-background text-foreground">
                <Keyboard className="w-4 h-4 mr-2" />Shortcuts
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
                <div className="mt-1">
                  <ReferenceSelector
                    value={formData.reference}
                    onValueChange={(value) => setFormData({ ...formData, reference: value })}
                    placeholder="Select or enter reference (e.g., INV-001, PO-123)"
                  />
                </div>
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
              
              <div className="border rounded-lg overflow-visible bg-card border-border">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b bg-muted/50 border-border">
                      <th className="text-left p-3 font-medium text-foreground w-[25%]">Account</th>
                      <th className="text-left p-3 font-medium text-foreground w-[12%]">Party</th>
                      <th className="text-right p-3 font-medium text-foreground w-[10%]">Debit</th>
                      <th className="text-right p-3 font-medium text-foreground w-[10%]">Credit</th>
                      <th className="text-left p-3 font-medium text-foreground w-[15%]">Ref Type</th>
                      <th className="text-left p-3 font-medium text-foreground w-[18%]">Description</th>
                      <th className="text-center p-3 font-medium text-foreground w-[10%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, index) => (
                      <tr key={index} className="border-b last:border-b-0 border-border">
                        <td className="p-3" data-field="account" data-index={index}>
                          <AccountSelector
                            value={line.accountId}
                            onValueChange={(value) => updateLine(index, 'accountId', value)}
                            accounts={accounts}
                            onAccountCreated={fetchAccounts}
                          />
                          {line.accountId && (() => {
                            const account = accounts.find(a => a._id === line.accountId);
                            return account ? (
                              <div className="text-xs text-muted-foreground mt-1">
                                Balance: {formatAmount((account as any).balance || 0)}
                              </div>
                            ) : null;
                          })()}
                        </td>
                        <td className="p-3">
                          {line.accountId && (() => {
                            const account = accounts.find(a => a._id === line.accountId);
                            const party = (account as any)?.contactInfo;
                            const isDebit = line.debit > 0;
                            return (
                              <div className="text-xs">
                                {party ? (
                                  <>
                                    <p className="font-medium truncate">{party.primaryEmail || party.email || 'N/A'}</p>
                                    <p className="text-muted-foreground truncate">{party.primaryPhone || party.phone || ''}</p>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">{isDebit ? 'To' : 'From'}: {account?.name || '-'}</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3" data-field="debit" data-index={index}>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setShowCalculator({index, field: 'debit'}); setCalcExpression(''); }}>
                              <Calculator className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3" data-field="credit" data-index={index}>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                            <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setShowCalculator({index, field: 'credit'}); setCalcExpression(''); }}>
                              <Calculator className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <Select
                            value={line.refType || 'on-account'}
                            onValueChange={(value) => updateLine(index, 'refType', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="on-account">On Account</SelectItem>
                              <SelectItem value="agst-ref">Agst Ref</SelectItem>
                              <SelectItem value="new-ref">New Ref</SelectItem>
                              <SelectItem value="advance">Advance</SelectItem>
                            </SelectContent>
                          </Select>
                          {line.refType === 'agst-ref' && line.accountId && (
                            <div className="mt-1">
                              <ReferenceSelector
                                value={line.refId || ''}
                                onValueChange={(value) => updateLine(index, 'refId', value)}
                                placeholder="Select reference"
                                accountId={line.accountId}
                              />
                            </div>
                          )}
                          {line.refType === 'new-ref' && (
                            <Input
                              placeholder="New ref number"
                              value={line.refId || ''}
                              onChange={(e) => updateLine(index, 'refId', e.target.value)}
                              className="mt-1"
                            />
                          )}
                        </td>
                        <td className="p-3" data-field="description" data-index={index}>
                          <Input
                            placeholder="Line description"
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(index)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Paperclip className="w-5 h-5" />Attachments
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm text-muted-foreground">
                    {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                  </p>
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
                  <div className="text-2xl font-bold text-foreground">{formatAmount(totalDebits)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Total Credits</div>
                  <div className="text-2xl font-bold text-foreground">{formatAmount(totalCredits)}</div>
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
              <div className="flex justify-between items-center pt-6 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={() => localStorage.removeItem('journal-draft')}>
                  <Trash2 className="w-4 h-4 mr-2" />Clear Draft
                </Button>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
                  <Button type="submit" disabled={loading || !isBalanced || submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? <Spinner className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    {submitting ? 'Creating...' : 'Create Entry'}
                  </Button>
                </div>
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
                      Debit: {formatAmount(entry.totalDebit || 0)} | 
                      Credit: {formatAmount(entry.totalCredit || 0)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setViewEntry(entry); setShowViewDialog(true); }}>
                      <Eye className="w-4 h-4 mr-2" />View
                    </Button>
                    {entry.reference && entry.status === 'POSTED' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          setSelectedEntryForRef(entry);
                          setShowCreateRefDialog(true);
                        }}
                      >
                        <Link className="w-4 h-4 mr-2" />Create Ref
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => duplicateEntry(entry)}>
                      <Copy className="w-4 h-4 mr-2" />Duplicate
                    </Button>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-sm">Save Entry</span>
              <Badge variant="outline">Ctrl + S</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-sm">Add Line</span>
              <Badge variant="outline">Ctrl + Enter</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-sm">Navigate Lines</span>
              <Badge variant="outline">Ctrl + Arrows</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-sm">New Entry</span>
              <Badge variant="outline">Ctrl + N</Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-sm">Create Account</span>
              <Badge variant="outline">Ctrl + Shift + A</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Journal Entry Details
            </DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Entry Number:</span>
                  <p className="font-semibold">{viewEntry.entryNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <p className="font-semibold">{new Date(viewEntry.entryDate || viewEntry.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Reference:</span>
                  <p className="font-semibold">{viewEntry.reference || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge>{viewEntry.status}</Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="font-semibold">{viewEntry.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Transaction Lines</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Account</th>
                        <th className="text-left p-3 text-sm font-medium">From/To Party</th>
                        <th className="text-right p-3 text-sm font-medium">Debit</th>
                        <th className="text-right p-3 text-sm font-medium">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEntry.lines?.map((line: any, idx: number) => {
                        const account = line.account;
                        const party = account?.contactInfo;
                        const isDebit = line.debit > 0;
                        const direction = isDebit ? 'To' : 'From';
                        return (
                          <tr key={idx} className="border-t">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{account?.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{account?.code}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              {party ? (
                                <div className="text-sm">
                                  <Badge variant="outline" className="mb-1">{direction}</Badge>
                                  <p className="font-medium">{party.primaryEmail || party.email || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{party.primaryPhone || party.phone || ''}</p>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <Badge variant="outline">{direction}</Badge>
                                  <p className="text-muted-foreground mt-1">{account?.name || 'N/A'}</p>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {line.debit > 0 ? formatAmount(line.debit) : '-'}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {line.credit > 0 ? formatAmount(line.credit) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 bg-muted/30 font-bold">
                        <td className="p-3" colSpan={2}>Total</td>
                        <td className="p-3 text-right">{formatAmount(viewEntry.totalDebit || 0)}</td>
                        <td className="p-3 text-right">{formatAmount(viewEntry.totalCredit || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {viewEntry.attachments && viewEntry.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({viewEntry.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {viewEntry.attachments.map((attachment: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{attachment.split('/').pop()}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open(`${API_URL}${attachment}`, '_blank')}>
                          <Download className="w-4 h-4 mr-2" />Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showCalculator && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border-2 border-border rounded-lg shadow-2xl">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="font-semibold text-sm">Calculator</span>
            </div>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowCalculator(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 space-y-3">
            <Input
              value={calcExpression}
              onChange={(e) => setCalcExpression(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  try {
                    const result = eval(calcExpression);
                    if (showCalculator) {
                      updateLine(showCalculator.index, showCalculator.field, parseFloat(result));
                      setShowCalculator(null);
                    }
                  } catch { toast({ title: 'Error', description: 'Invalid expression', variant: 'destructive' }); }
                } else if (e.key === 'Escape') {
                  setShowCalculator(null);
                }
              }}
              placeholder="Enter expression"
              className="text-right text-2xl font-mono h-12"
              autoFocus
            />
            <div className="text-xs text-muted-foreground text-center">Press Enter to apply, Esc to close</div>
            <div className="grid grid-cols-4 gap-2">
              {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','.','+'].map(btn => (
                <Button
                  key={btn}
                  type="button"
                  variant={btn === 'C' ? 'destructive' : 'outline'}
                  className="h-12 text-lg font-semibold"
                  onClick={() => {
                    if (btn === 'C') {
                      setCalcExpression('');
                    } else {
                      setCalcExpression(prev => prev + btn);
                    }
                  }}
                >{btn}</Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={() => setCalcExpression(prev => prev.slice(0, -1))}
              >← Backspace</Button>
              <Button
                type="button"
                variant="default"
                className="h-12 bg-primary"
                onClick={() => {
                  try {
                    const result = eval(calcExpression);
                    if (showCalculator) {
                      updateLine(showCalculator.index, showCalculator.field, parseFloat(result));
                      setShowCalculator(null);
                    }
                  } catch { toast({ title: 'Error', description: 'Invalid expression', variant: 'destructive' }); }
                }}
              >= Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Reference Dialog */}
      {selectedEntryForRef && (
        <CreateReference
          open={showCreateRefDialog}
          onClose={() => {
            setShowCreateRefDialog(false);
            setSelectedEntryForRef(null);
          }}
          journalEntryId={selectedEntryForRef._id}
          entryNumber={selectedEntryForRef.entryNumber}
          reference={selectedEntryForRef.reference}
          description={selectedEntryForRef.description}
          onSuccess={() => {
            toast({ title: 'Success', description: 'Reference created successfully' });
            setShowCreateRefDialog(false);
            setSelectedEntryForRef(null);
          }}
        />
      )}
    </div>
  );
};

export default JournalEntry;
