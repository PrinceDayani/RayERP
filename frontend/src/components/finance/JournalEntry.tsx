'use client';

import React, { useState, useEffect } from 'react';
import { useGeneralLedger } from '@/hooks/finance/useGeneralLedger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Plus, FileText, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Debits must equal credits');
      return;
    }
    try {
      await createJournalEntry(formData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [
          { accountId: '', debit: 0, credit: 0, description: '' },
          { accountId: '', debit: 0, credit: 0, description: '' }
        ]
      });
    } catch (error) {
      console.error('Error creating journal entry:', error);
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
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <Card className="max-w-6xl mx-auto bg-white border-gray-200 shadow-sm">
        <CardHeader className="bg-white border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-800">
            <FileText className="w-6 h-6 mr-3 text-gray-600" />
            Journal Entry
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <Label htmlFor="date" className="text-gray-700 font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 bg-white border-gray-300 focus:border-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reference" className="text-gray-700 font-medium">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., INV-001"
                  className="mt-1 bg-white border-gray-300 focus:border-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Journal entry description"
                  className="mt-1 bg-white border-gray-300 focus:border-gray-500"
                  required
                />
              </div>
            </div>

            {/* Journal Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-gray-800">Journal Lines</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addLine}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line
                </Button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-2 text-center">Debit</div>
                  <div className="col-span-2 text-center">Credit</div>
                  <div className="col-span-3 text-center">Description</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
                
                {formData.lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 last:border-b-0 bg-white">
                    <div className="col-span-4">
                      <Select
                        value={line.accountId}
                        onValueChange={(value) => updateLine(index, 'accountId', value)}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {`${account.code} - ${account.name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                        className="text-right bg-white border-gray-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                        className="text-right bg-white border-gray-300"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Line description"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        className="bg-white border-gray-300"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={formData.lines.length <= 2}
                        className="bg-white border-gray-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals and Balance Check */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Debits</div>
                  <div className="text-xl font-semibold text-gray-800">${totalDebits.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Credits</div>
                  <div className="text-xl font-semibold text-gray-800">${totalCredits.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Status</div>
                  <Badge 
                    variant={isBalanced ? "default" : "destructive"}
                    className={isBalanced ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}
                  >
                    {isBalanced ? "Balanced" : "Not Balanced"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !isBalanced}
                className="bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-400"
              >
                {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                Create Journal Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntry;