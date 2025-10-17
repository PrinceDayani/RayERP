'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileText, Download, TrendingUp, DollarSign, Building, Calendar, Printer, Settings, Eye, Filter, RefreshCw, BarChart3, PieChart, Users, Clock, AlertCircle, CheckCircle, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ReportTemplate {
  _id: string;
  name: string;
  type: 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'trial-balance' | 'aging' | 'custom';
  description: string;
  parameters: ReportParameter[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  lastGenerated?: string;
}

interface ReportParameter {
  name: string;
  type: 'date' | 'select' | 'text' | 'number' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

interface GeneratedReport {
  _id: string;
  templateId: string;
  templateName: string;
  parameters: Record<string, any>;
  data: any;
  generatedAt: string;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  format: 'pdf' | 'excel' | 'csv';
  filePath?: string;
}

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  isActive: boolean;
}

const Reports = () => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportParameters, setReportParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('generate');

  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    type: ReportTemplate['type'];
    description: string;
    parameters: ReportParameter[];
  }>({
    name: '',
    type: 'profit-loss',
    description: '',
    parameters: []
  });

  const defaultTemplates: ReportTemplate[] = [
    {
      _id: 'tpl1',
      name: 'Profit & Loss Statement',
      type: 'profit-loss',
      description: 'Income and expense statement for a specific period',
      parameters: [
        { name: 'startDate', type: 'date', label: 'Start Date', required: true },
        { name: 'endDate', type: 'date', label: 'End Date', required: true },
        { name: 'includeSubAccounts', type: 'boolean', label: 'Include Sub-Accounts', required: false, defaultValue: true },
        { name: 'comparison', type: 'select', label: 'Comparison Period', required: false, options: ['None', 'Previous Period', 'Previous Year'] }
      ],
      isDefault: true,
      createdBy: 'System',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: 'tpl2',
      name: 'Balance Sheet',
      type: 'balance-sheet',
      description: 'Financial position statement as of a specific date',
      parameters: [
        { name: 'asOfDate', type: 'date', label: 'As of Date', required: true },
        { name: 'includeSubAccounts', type: 'boolean', label: 'Include Sub-Accounts', required: false, defaultValue: true },
        { name: 'showComparative', type: 'boolean', label: 'Show Comparative', required: false, defaultValue: false }
      ],
      isDefault: true,
      createdBy: 'System',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: 'tpl3',
      name: 'Cash Flow Statement',
      type: 'cash-flow',
      description: 'Cash inflows and outflows for a specific period',
      parameters: [
        { name: 'startDate', type: 'date', label: 'Start Date', required: true },
        { name: 'endDate', type: 'date', label: 'End Date', required: true },
        { name: 'method', type: 'select', label: 'Method', required: true, options: ['Direct', 'Indirect'], defaultValue: 'Indirect' }
      ],
      isDefault: true,
      createdBy: 'System',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: 'tpl4',
      name: 'Trial Balance',
      type: 'trial-balance',
      description: 'List of all accounts with their debit and credit balances',
      parameters: [
        { name: 'asOfDate', type: 'date', label: 'As of Date', required: true },
        { name: 'includeZeroBalances', type: 'boolean', label: 'Include Zero Balances', required: false, defaultValue: false },
        { name: 'accountType', type: 'select', label: 'Account Type', required: false, options: ['All', 'Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'] }
      ],
      isDefault: true,
      createdBy: 'System',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: 'tpl5',
      name: 'Aging Report',
      type: 'aging',
      description: 'Outstanding receivables and payables by age',
      parameters: [
        { name: 'asOfDate', type: 'date', label: 'As of Date', required: true },
        { name: 'reportType', type: 'select', label: 'Report Type', required: true, options: ['Receivables', 'Payables', 'Both'] },
        { name: 'agingPeriods', type: 'text', label: 'Aging Periods (days)', required: false, defaultValue: '30,60,90,120' }
      ],
      isDefault: true,
      createdBy: 'System',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    fetchReportTemplates();
    fetchGeneratedReports();
    fetchAccounts();
  }, []);

  const fetchReportTemplates = async () => {
    try {
      const storedTemplates = localStorage.getItem('report_templates');
      if (storedTemplates) {
        setReportTemplates(JSON.parse(storedTemplates));
      } else {
        setReportTemplates(defaultTemplates);
        localStorage.setItem('report_templates', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch report templates', variant: 'destructive' });
    }
  };

  const fetchGeneratedReports = async () => {
    try {
      const storedReports = localStorage.getItem('generated_reports');
      if (storedReports) {
        setGeneratedReports(JSON.parse(storedReports));
      } else {
        const sampleReports: GeneratedReport[] = [
          {
            _id: 'rep1',
            templateId: 'tpl1',
            templateName: 'Profit & Loss Statement',
            parameters: { startDate: '2024-01-01', endDate: '2024-01-31' },
            data: {},
            generatedAt: '2024-01-31T15:30:00Z',
            generatedBy: 'John Doe',
            status: 'completed',
            format: 'pdf',
            filePath: '/reports/pl-2024-01.pdf'
          }
        ];
        setGeneratedReports(sampleReports);
        localStorage.setItem('generated_reports', JSON.stringify(sampleReports));
      }
    } catch (error) {
      console.error('Error fetching generated reports:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const storedAccounts = localStorage.getItem('gl_accounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const generateReport = async (format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    if (!selectedTemplate) {
      toast({ title: 'Error', description: 'Please select a report template', variant: 'destructive' });
      return;
    }

    // Validate required parameters
    const missingParams = selectedTemplate.parameters
      .filter(param => param.required && !reportParameters[param.name])
      .map(param => param.label);

    if (missingParams.length > 0) {
      toast({ 
        title: 'Missing Parameters', 
        description: `Please provide: ${missingParams.join(', ')}`, 
        variant: 'destructive' 
      });
      return;
    }

    try {
      setLoading(true);

      // Simulate report generation
      const reportData = await generateReportData(selectedTemplate, reportParameters);

      const newReport: GeneratedReport = {
        _id: `rep${Date.now()}`,
        templateId: selectedTemplate._id,
        templateName: selectedTemplate.name,
        parameters: { ...reportParameters },
        data: reportData,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Current User',
        status: 'completed',
        format,
        filePath: `/reports/${selectedTemplate.type}-${Date.now()}.${format}`
      };

      const updatedReports = [...generatedReports, newReport];
      setGeneratedReports(updatedReports);
      localStorage.setItem('generated_reports', JSON.stringify(updatedReports));

      // Update template last generated
      const updatedTemplates = reportTemplates.map(template =>
        template._id === selectedTemplate._id
          ? { ...template, lastGenerated: new Date().toISOString() }
          : template
      );
      setReportTemplates(updatedTemplates);
      localStorage.setItem('report_templates', JSON.stringify(updatedTemplates));

      toast({ title: 'Success', description: `Report generated successfully in ${format.toUpperCase()} format` });
      setActiveTab('history');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = async (template: ReportTemplate, params: Record<string, any>) => {
    // Simulate different report types
    switch (template.type) {
      case 'profit-loss':
        return generateProfitLossData(params);
      case 'balance-sheet':
        return generateBalanceSheetData(params);
      case 'trial-balance':
        return generateTrialBalanceData(params);
      case 'cash-flow':
        return generateCashFlowData(params);
      case 'aging':
        return generateAgingData(params);
      default:
        return {};
    }
  };

  const generateProfitLossData = (params: Record<string, any>) => {
    const incomeAccounts = accounts.filter(acc => acc.type === 'income');
    const expenseAccounts = accounts.filter(acc => acc.type === 'expense');
    
    const totalIncome = incomeAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      period: { startDate: params.startDate, endDate: params.endDate },
      income: { accounts: incomeAccounts, total: totalIncome },
      expenses: { accounts: expenseAccounts, total: totalExpenses },
      netIncome
    };
  };

  const generateBalanceSheetData = (params: Record<string, any>) => {
    const assets = accounts.filter(acc => acc.type === 'asset');
    const liabilities = accounts.filter(acc => acc.type === 'liability');
    const equity = accounts.filter(acc => acc.type === 'equity');
    
    return {
      asOfDate: params.asOfDate,
      assets: { accounts: assets, total: assets.reduce((sum, acc) => sum + acc.balance, 0) },
      liabilities: { accounts: liabilities, total: liabilities.reduce((sum, acc) => sum + acc.balance, 0) },
      equity: { accounts: equity, total: equity.reduce((sum, acc) => sum + acc.balance, 0) }
    };
  };

  const generateTrialBalanceData = (params: Record<string, any>) => {
    let filteredAccounts = accounts;
    
    if (params.accountType && params.accountType !== 'All') {
      filteredAccounts = accounts.filter(acc => acc.type === params.accountType.toLowerCase());
    }
    
    if (!params.includeZeroBalances) {
      filteredAccounts = filteredAccounts.filter(acc => acc.balance !== 0);
    }

    const totalDebits = filteredAccounts.reduce((sum, acc) => 
      acc.balance > 0 ? sum + acc.balance : sum, 0
    );
    const totalCredits = filteredAccounts.reduce((sum, acc) => 
      acc.balance < 0 ? sum + Math.abs(acc.balance) : sum, 0
    );

    return {
      asOfDate: params.asOfDate,
      accounts: filteredAccounts,
      totalDebits,
      totalCredits
    };
  };

  const generateCashFlowData = (params: Record<string, any>) => {
    // Simplified cash flow data
    return {
      period: { startDate: params.startDate, endDate: params.endDate },
      method: params.method,
      operatingActivities: {
        netIncome: 50000,
        depreciation: 10000,
        accountsReceivableChange: -5000,
        accountsPayableChange: 3000,
        total: 58000
      },
      investingActivities: {
        equipmentPurchase: -25000,
        total: -25000
      },
      financingActivities: {
        loanProceeds: 20000,
        dividendsPaid: -10000,
        total: 10000
      },
      netCashFlow: 43000
    };
  };

  const generateAgingData = (params: Record<string, any>) => {
    const agingPeriods = params.agingPeriods.split(',').map((p: string) => parseInt(p.trim()));
    
    return {
      asOfDate: params.asOfDate,
      reportType: params.reportType,
      agingPeriods,
      data: [
        { customer: 'ABC Corp', current: 5000, days30: 2000, days60: 1000, days90: 500, over90: 0 },
        { customer: 'XYZ Ltd', current: 3000, days30: 0, days60: 1500, days90: 0, over90: 2000 }
      ]
    };
  };

  const createTemplate = async () => {
    try {
      if (!newTemplate.name || !newTemplate.description) {
        toast({ title: 'Error', description: 'Name and description are required', variant: 'destructive' });
        return;
      }

      const template: ReportTemplate = {
        _id: editingTemplate?._id || `tpl${Date.now()}`,
        name: newTemplate.name,
        type: newTemplate.type,
        description: newTemplate.description,
        parameters: newTemplate.parameters,
        isDefault: false,
        createdBy: 'Current User',
        createdAt: editingTemplate?.createdAt || new Date().toISOString()
      };

      let updatedTemplates;
      if (editingTemplate) {
        updatedTemplates = reportTemplates.map(t => t._id === editingTemplate._id ? template : t);
      } else {
        updatedTemplates = [...reportTemplates, template];
      }

      setReportTemplates(updatedTemplates);
      localStorage.setItem('report_templates', JSON.stringify(updatedTemplates));

      resetTemplateForm();
      setShowTemplateDialog(false);
      toast({ title: 'Success', description: `Template ${editingTemplate ? 'updated' : 'created'} successfully` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    }
  };

  const resetTemplateForm = () => {
    setNewTemplate({
      name: '',
      type: 'profit-loss',
      description: '',
      parameters: []
    });
    setEditingTemplate(null);
  };

  const editTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      type: template.type,
      description: template.description,
      parameters: [...template.parameters]
    });
    setShowTemplateDialog(true);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = reportTemplates.filter(t => t._id !== templateId);
    setReportTemplates(updatedTemplates);
    localStorage.setItem('report_templates', JSON.stringify(updatedTemplates));
    toast({ title: 'Success', description: 'Template deleted successfully' });
  };

  const addParameter = () => {
    setNewTemplate(prev => ({
      ...prev,
      parameters: [...prev.parameters, {
        name: '',
        type: 'text',
        label: '',
        required: false
      }]
    }));
  };

  const updateParameter = (index: number, field: keyof ReportParameter, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const removeParameter = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'profit-loss': return <TrendingUp className="h-5 w-5" />;
      case 'balance-sheet': return <Building className="h-5 w-5" />;
      case 'cash-flow': return <DollarSign className="h-5 w-5" />;
      case 'trial-balance': return <BarChart3 className="h-5 w-5" />;
      case 'aging': return <Clock className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'generating': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.history.back()}
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Financial Reports
                </h1>
              </div>
              <p className="text-gray-600 text-lg ml-20">Generate and manage financial reports</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={resetTemplateForm} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Report Template</DialogTitle>
                <DialogDescription>
                  {editingTemplate ? 'Update the report template' : 'Create a custom report template'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly P&L Report"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateType">Report Type</Label>
                    <Select value={newTemplate.type} onValueChange={(value: ReportTemplate['type']) => setNewTemplate(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                        <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                        <SelectItem value="cash-flow">Cash Flow</SelectItem>
                        <SelectItem value="trial-balance">Trial Balance</SelectItem>
                        <SelectItem value="aging">Aging Report</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="templateDescription">Description</Label>
                  <Textarea
                    id="templateDescription"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the report"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Parameters</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Parameter
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {newTemplate.parameters.map((param, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                        <div className="col-span-3">
                          <Label className="text-xs">Name</Label>
                          <Input
                            className="h-8"
                            value={param.name}
                            onChange={(e) => updateParameter(index, 'name', e.target.value)}
                            placeholder="parameterName"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Label</Label>
                          <Input
                            className="h-8"
                            value={param.label}
                            onChange={(e) => updateParameter(index, 'label', e.target.value)}
                            placeholder="Display Label"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Type</Label>
                          <Select value={param.type} onValueChange={(value) => updateParameter(index, 'type', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Default Value</Label>
                          <Input
                            className="h-8"
                            value={param.defaultValue || ''}
                            onChange={(e) => updateParameter(index, 'defaultValue', e.target.value)}
                            placeholder="Default"
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          <Switch
                            checked={param.required}
                            onCheckedChange={(checked) => updateParameter(index, 'required', checked)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-full"
                            onClick={() => removeParameter(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTemplate}>
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold text-blue-600">{reportTemplates.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Generated Reports</p>
                  <p className="text-2xl font-bold text-green-600">{generatedReports.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {generatedReports.filter(r => 
                      new Date(r.generatedAt).getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round((generatedReports.filter(r => r.status === 'completed').length / generatedReports.length) * 100)}%
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg p-1">
            <TabsTrigger value="generate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Generate Reports</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Templates</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Report History</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Template Selection */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Select Report Template
                  </CardTitle>
                </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportTemplates.map(template => (
                    <div
                      key={template._id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedTemplate?._id === template._id 
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                          : 'border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        // Set default parameter values
                        const defaultParams: Record<string, any> = {};
                        template.parameters.forEach(param => {
                          if (param.defaultValue !== undefined) {
                            defaultParams[param.name] = param.defaultValue;
                          }
                        });
                        setReportParameters(defaultParams);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {getReportTypeIcon(template.type)}
                        <div className="flex-1">
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {template.type.replace('-', ' ')}
                            </Badge>
                            {template.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            {template.lastGenerated && (
                              <span className="text-xs text-muted-foreground">
                                Last: {new Date(template.lastGenerated).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

              {/* Parameters & Generation */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100/50">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {selectedTemplate ? `Configure ${selectedTemplate.name}` : 'Select a Template'}
                  </CardTitle>
                </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    {selectedTemplate.parameters.map(param => (
                      <div key={param.name}>
                        <Label htmlFor={param.name}>
                          {param.label}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {param.type === 'date' && (
                          <Input
                            id={param.name}
                            type="date"
                            value={reportParameters[param.name] || ''}
                            onChange={(e) => setReportParameters(prev => ({ ...prev, [param.name]: e.target.value }))}
                          />
                        )}
                        {param.type === 'text' && (
                          <Input
                            id={param.name}
                            value={reportParameters[param.name] || ''}
                            onChange={(e) => setReportParameters(prev => ({ ...prev, [param.name]: e.target.value }))}
                            placeholder={param.defaultValue}
                          />
                        )}
                        {param.type === 'number' && (
                          <Input
                            id={param.name}
                            type="number"
                            value={reportParameters[param.name] || ''}
                            onChange={(e) => setReportParameters(prev => ({ ...prev, [param.name]: parseFloat(e.target.value) || 0 }))}
                          />
                        )}
                        {param.type === 'select' && (
                          <Select 
                            value={reportParameters[param.name] || ''} 
                            onValueChange={(value) => setReportParameters(prev => ({ ...prev, [param.name]: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              {param.options?.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {param.type === 'boolean' && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={param.name}
                              checked={reportParameters[param.name] || false}
                              onCheckedChange={(checked) => setReportParameters(prev => ({ ...prev, [param.name]: checked }))}
                            />
                            <Label htmlFor={param.name} className="text-sm">
                              {param.label}
                            </Label>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="pt-4 border-t">
                      <Label className="text-sm font-medium">Output Format</Label>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        <Button 
                          onClick={() => generateReport('pdf')} 
                          disabled={loading}
                          className="flex flex-col gap-2 h-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
                        >
                          <FileText className="h-6 w-6" />
                          <span className="text-sm font-medium">PDF</span>
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => generateReport('excel')} 
                          disabled={loading}
                          className="flex flex-col gap-2 h-20 bg-white/80 backdrop-blur-sm border-green-200 text-green-700 hover:bg-green-50 shadow-lg"
                        >
                          <Download className="h-6 w-6" />
                          <span className="text-sm font-medium">Excel</span>
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => generateReport('csv')} 
                          disabled={loading}
                          className="flex flex-col gap-2 h-20 bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50 shadow-lg"
                        >
                          <FileText className="h-6 w-6" />
                          <span className="text-sm font-medium">CSV</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a report template to configure parameters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
              <CardTitle className="text-gray-800">Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Last Generated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportTemplates.map(template => (
                    <TableRow key={template._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getReportTypeIcon(template.type)}
                          <span className="font-medium">{template.name}</span>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {template.type.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.parameters.length} params
                        </Badge>
                      </TableCell>
                      <TableCell>{template.createdBy}</TableCell>
                      <TableCell>
                        {template.lastGenerated ? 
                          new Date(template.lastGenerated).toLocaleDateString() : 
                          'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedTemplate(template);
                            setActiveTab('generate');
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!template.isDefault && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => editTemplate(template)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => deleteTemplate(template._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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

        <TabsContent value="history">
          <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-800">Generated Reports</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedReports.map(report => (
                    <TableRow key={report._id}>
                      <TableCell className="font-medium">{report.templateName}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {Object.entries(report.parameters).map(([key, value]) => (
                            <div key={key}>{key}: {String(value)}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(report.generatedAt).toLocaleString()}</TableCell>
                      <TableCell>{report.generatedBy}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {report.format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          <span className="capitalize">{report.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4" />
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

        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Report Usage Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                      <p className="text-2xl font-bold">{generatedReports.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Templates</p>
                      <p className="text-2xl font-bold">{reportTemplates.length}</p>
                    </div>
                    <Building className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">
                        {generatedReports.filter(r => 
                          new Date(r.generatedAt).getMonth() === new Date().getMonth()
                        ).length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((generatedReports.filter(r => r.status === 'completed').length / generatedReports.length) * 100)}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Report Generation Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', reports: 12 },
                        { month: 'Feb', reports: 19 },
                        { month: 'Mar', reports: 15 },
                        { month: 'Apr', reports: 25 },
                        { month: 'May', reports: 22 },
                        { month: 'Jun', reports: 30 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Report Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'P&L', value: 35, fill: '#3b82f6' },
                            { name: 'Balance Sheet', value: 25, fill: '#ef4444' },
                            { name: 'Cash Flow', value: 20, fill: '#22c55e' },
                            { name: 'Trial Balance', value: 15, fill: '#eab308' },
                            { name: 'Aging', value: 5, fill: '#a855f7' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'P&L', value: 35, fill: '#3b82f6' },
                            { name: 'Balance Sheet', value: 25, fill: '#ef4444' },
                            { name: 'Cash Flow', value: 20, fill: '#22c55e' },
                            { name: 'Trial Balance', value: 15, fill: '#eab308' },
                            { name: 'Aging', value: 5, fill: '#a855f7' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Most Used Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportTemplates
                    .sort((a, b) => (b.lastGenerated ? 1 : 0) - (a.lastGenerated ? 1 : 0))
                    .slice(0, 5)
                    .map((template, index) => (
                      <div key={template._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {generatedReports.filter(r => r.templateId === template._id).length}
                          </p>
                          <p className="text-sm text-muted-foreground">uses</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;