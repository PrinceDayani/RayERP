"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Save,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Calculator
} from "lucide-react";
import { projectFinanceApi } from "@/lib/api/projectFinanceApi";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import { ProjectLedgerEntry, ProjectJournalEntry } from "@/types/project-finance.types";
import { toast } from "@/components/ui/use-toast";

interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

interface NewJournalEntry {
  date: string;
  description: string;
  reference: string;
  lines: JournalEntryLine[];
}

const accounts = [
  { code: '1001', name: 'Cash' },
  { code: '1200', name: 'Accounts Receivable' },
  { code: '1300', name: 'Inventory' },
  { code: '1500', name: 'Equipment' },
  { code: '2001', name: 'Accounts Payable' },
  { code: '2100', name: 'Accrued Expenses' },
  { code: '3001', name: 'Project Capital' },
  { code: '4001', name: 'Project Revenue' },
  { code: '5001', name: 'Direct Costs' },
  { code: '5100', name: 'Labor Costs' },
  { code: '6001', name: 'Operating Expenses' }
];

const ProjectLedgerPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [ledgerEntries, setLedgerEntries] = useState<ProjectLedgerEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<ProjectJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewJournalDialog, setShowNewJournalDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ProjectJournalEntry | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  
  const [newJournalEntry, setNewJournalEntry] = useState<NewJournalEntry>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
      { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
    ]
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchData();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData || []);
      if (projectsData?.length > 0) {
        setSelectedProject(projectsData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const [ledgerData, journalData] = await Promise.all([
        projectFinanceApi.getLedgerEntries(selectedProject),
        projectFinanceApi.getJournalEntries(selectedProject)
      ]);
      setLedgerEntries(ledgerData || []);
      setJournalEntries(journalData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setLedgerEntries([]);
      setJournalEntries([]);
      toast({
        title: "Warning",
        description: "Could not fetch ledger data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (lineIndex: number, accountCode: string) => {
    const account = accounts.find(acc => acc.code === accountCode);
    if (account) {
      const updatedLines = [...newJournalEntry.lines];
      updatedLines[lineIndex] = {
        ...updatedLines[lineIndex],
        accountCode: account.code,
        accountName: account.name
      };
      setNewJournalEntry({ ...newJournalEntry, lines: updatedLines });
    }
  };

  const handleDebitCredit = (lineIndex: number, type: 'debit' | 'credit', amount: number) => {
    const updatedLines = [...newJournalEntry.lines];
    if (type === 'debit') {
      updatedLines[lineIndex].debit = amount;
      updatedLines[lineIndex].credit = 0;
    } else {
      updatedLines[lineIndex].credit = amount;
      updatedLines[lineIndex].debit = 0;
    }
    setNewJournalEntry({ ...newJournalEntry, lines: updatedLines });
  };
  
  const quickDebitCredit = (lineIndex: number, type: 'debit' | 'credit') => {
    const updatedLines = [...newJournalEntry.lines];
    const currentAmount = type === 'debit' ? updatedLines[lineIndex].debit : updatedLines[lineIndex].credit;
    const newAmount = currentAmount > 0 ? 0 : 1000;
    handleDebitCredit(lineIndex, type, newAmount);
  };

  const addJournalLine = () => {
    setNewJournalEntry({
      ...newJournalEntry,
      lines: [...newJournalEntry.lines, { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const getTotalDebits = () => {
    return newJournalEntry.lines.reduce((sum, line) => sum + line.debit, 0);
  };

  const getTotalCredits = () => {
    return newJournalEntry.lines.reduce((sum, line) => sum + line.credit, 0);
  };

  const isBalanced = () => {
    return getTotalDebits() === getTotalCredits() && getTotalDebits() > 0;
  };

  const handleSaveJournalEntry = async () => {
    if (!isBalanced()) {
      toast({
        title: "Error",
        description: "Journal entry must be balanced (Total Debits = Total Credits)",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      const entryData = {
        date: newJournalEntry.date,
        reference: newJournalEntry.reference,
        description: newJournalEntry.description,
        lines: newJournalEntry.lines.filter(line => line.accountCode && (line.debit > 0 || line.credit > 0))
      };

      await projectFinanceApi.createJournalEntry(selectedProject, entryData);
      
      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });
      
      setShowNewJournalDialog(false);
      setNewJournalEntry({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
          { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
          { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
        ]
      });
      
      // Refresh data to show the new entry
      await fetchData();
    } catch (error: any) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create journal entry",
        variant: "destructive",
      });
    }
  };

  const getVoucherTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'receipt': return 'bg-green-100 text-green-800';
      case 'payment': return 'bg-red-100 text-red-800';
      case 'journal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'posted':
        return <Badge variant="default">Posted</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExport = () => {
    const selectedProjectName = projects.find(p => p._id === selectedProject)?.name || 'Project';
    const csvContent = [
      ['Project Ledger Export - ' + selectedProjectName],
      ['Generated on: ' + new Date().toLocaleDateString()],
      [],
      ['Date', 'Account Code', 'Account Name', 'Description', 'Voucher Type', 'Voucher Number', 'Debit', 'Credit', 'Balance'],
      ...ledgerEntries.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.accountCode,
        entry.accountName,
        entry.description,
        entry.voucherType,
        entry.voucherNumber,
        entry.debit > 0 ? entry.debit.toString() : '',
        entry.credit > 0 ? entry.credit.toString() : '',
        entry.balance.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-ledger-${selectedProjectName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Ledger data exported successfully",
    });
  };

  return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold">Project Ledger</h1>
              <p className="text-muted-foreground">Manage financial transactions and accounting entries</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={showNewJournalDialog} onOpenChange={setShowNewJournalDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Journal Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Journal Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newJournalEntry.date}
                        onChange={(e) => setNewJournalEntry({ ...newJournalEntry, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">Reference</Label>
                      <Input
                        id="reference"
                        placeholder="JV001"
                        value={newJournalEntry.reference}
                        onChange={(e) => setNewJournalEntry({ ...newJournalEntry, reference: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Entry description"
                        value={newJournalEntry.description}
                        onChange={(e) => setNewJournalEntry({ ...newJournalEntry, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Journal Lines</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addJournalLine}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Line
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newJournalEntry.lines.map((line, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-3">
                              <Label>Account</Label>
                              <Select
                                value={line.accountCode}
                                onValueChange={(value) => handleAccountSelect(index, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts.map((account) => (
                                    <SelectItem key={account.code} value={account.code}>
                                      {account.code} - {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="col-span-3">
                              <Label>Description</Label>
                              <Input
                                placeholder="Line description"
                                value={line.description}
                                onChange={(e) => {
                                  const updatedLines = [...newJournalEntry.lines];
                                  updatedLines[index].description = e.target.value;
                                  setNewJournalEntry({ ...newJournalEntry, lines: updatedLines });
                                }}
                              />
                            </div>
                            
                            <div className="col-span-3">
                              <Label>Debit</Label>
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={line.debit || ''}
                                  onChange={(e) => handleDebitCredit(index, 'debit', parseFloat(e.target.value) || 0)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={line.debit > 0 ? "default" : "outline"}
                                  className={line.debit > 0 ? "bg-green-600 hover:bg-green-700" : ""}
                                  onClick={() => quickDebitCredit(index, 'debit')}
                                  title="Quick Debit"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="col-span-3">
                              <Label>Credit</Label>
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={line.credit || ''}
                                  onChange={(e) => handleDebitCredit(index, 'credit', parseFloat(e.target.value) || 0)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={line.credit > 0 ? "default" : "outline"}
                                  className={line.credit > 0 ? "bg-red-600 hover:bg-red-700" : ""}
                                  onClick={() => quickDebitCredit(index, 'credit')}
                                  title="Quick Credit"
                                >
                                  <TrendingDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Total Debits: </span>
                          <span className="font-bold text-green-600">${getTotalDebits().toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">Total Credits: </span>
                          <span className="font-bold text-red-600">${getTotalCredits().toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBalanced() ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">Difference: </span>
                          <span className={`font-bold ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(getTotalDebits() - getTotalCredits()).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowNewJournalDialog(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveJournalEntry}
                          disabled={!isBalanced()}
                          className={isBalanced() ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Entry
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold text-blue-600">{journalEntries.length}</p>
                  <p className="text-xs text-muted-foreground">Journal entries</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Money in</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Money out</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(ledgerEntries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Current position</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading ledger data...</div>
            </CardContent>
          </Card>
        ) : selectedProject ? (
          <Tabs defaultValue="ledger" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ledger" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Ledger Entries
              </TabsTrigger>
              <TabsTrigger value="journal" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Journal Entries
              </TabsTrigger>
              <TabsTrigger value="quick-entry" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Quick Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ledger">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    General Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Account</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Voucher</TableHead>
                        <TableHead className="text-right font-semibold text-green-700">Debit</TableHead>
                        <TableHead className="text-right font-semibold text-red-700">Credit</TableHead>
                        <TableHead className="text-right font-semibold">Balance</TableHead>
                        <TableHead className="text-center font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.accountName}</p>
                              <p className="text-xs text-muted-foreground">{entry.accountCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.voucherNumber}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.debit > 0 ? (
                              <span className="text-green-600 font-medium">
                                ${entry.debit.toLocaleString()}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.credit > 0 ? (
                              <span className="text-red-600 font-medium">
                                ${entry.credit.toLocaleString()}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${Math.abs(entry.balance).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button variant="outline" size="sm" title="Edit Entry">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" title="View Details">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Journal Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Voucher</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="text-right font-semibold text-green-700">Total Debit</TableHead>
                        <TableHead className="text-right font-semibold text-red-700">Total Credit</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-center font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.entryNumber || entry.voucherNumber}</Badge>
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ${entry.totalDebit.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            ${entry.totalCredit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(entry.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setShowEntryDetails(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {entry.status === 'draft' && (
                                <Button variant="outline" size="sm" title="Edit Entry">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {entry.status === 'draft' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700"
                                  title="Post Entry"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick-entry">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Debit Entry */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="h-5 w-5" />
                      Quick Debit Entry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input type="number" placeholder="0.00" className="text-right" />
                      </div>
                    </div>
                    <div>
                      <Label>Account</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.filter(acc => ['1001', '1200', '1300', '1500'].includes(acc.code)).map(acc => (
                            <SelectItem key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input placeholder="Transaction description" />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Add Debit Entry
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Credit Entry */}
                <Card className="border-red-200">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <TrendingDown className="h-5 w-5" />
                      Quick Credit Entry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input type="number" placeholder="0.00" className="text-right" />
                      </div>
                    </div>
                    <div>
                      <Label>Account</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.filter(acc => ['2001', '2100', '3001', '4001'].includes(acc.code)).map(acc => (
                            <SelectItem key={acc.code} value={acc.code}>
                              {acc.code} - {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input placeholder="Transaction description" />
                    </div>
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Add Credit Entry
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Common Transactions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Common Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <DollarSign className="h-6 w-6" />
                      <span className="text-sm">Cash Receipt</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <TrendingDown className="h-6 w-6" />
                      <span className="text-sm">Cash Payment</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">Invoice Entry</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">Expense Entry</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project to view its transaction history and manage ledger entries
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Journal Entry Details Dialog */}
        <Dialog open={showEntryDetails} onOpenChange={setShowEntryDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Journal Entry Details</DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <p className="font-medium">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Voucher Number</Label>
                    <p className="font-medium">{selectedEntry.entryNumber || selectedEntry.voucherNumber}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div>{getStatusBadge(selectedEntry.status)}</div>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <p className="font-medium">{selectedEntry.description}</p>
                </div>
                
                <div>
                  <Label>Journal Lines</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedEntry.lines || selectedEntry.entries || []).map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{line.accountName}</p>
                              <p className="text-xs text-muted-foreground">{line.accountCode}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {line.debit > 0 ? (
                              <span className="text-green-600 font-medium">
                                ${line.debit.toLocaleString()}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.credit > 0 ? (
                              <span className="text-red-600 font-medium">
                                ${line.credit.toLocaleString()}
                              </span>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-6">
                    <div>
                      <span className="text-sm font-medium">Total Debits: </span>
                      <span className="font-bold text-green-600">${selectedEntry.totalDebit.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Total Credits: </span>
                      <span className="font-bold text-red-600">${selectedEntry.totalCredit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ProjectLedgerPage;