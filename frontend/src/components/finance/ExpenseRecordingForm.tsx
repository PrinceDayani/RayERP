"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseRecordingFormProps {
  projectId: string;
  onExpenseRecorded?: (expense: any) => void;
}

interface ExpenseData {
  amount: number;
  category: 'labor' | 'materials' | 'equipment' | 'overhead';
  description: string;
  accountCode: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'labor', label: 'Labor', accountCode: '5100' },
  { value: 'materials', label: 'Materials', accountCode: '5200' },
  { value: 'equipment', label: 'Equipment', accountCode: '5300' },
  { value: 'overhead', label: 'Overhead', accountCode: '5400' }
];

const ACCOUNT_CODES = [
  { code: '5100', name: 'Labor Expenses', category: 'labor' },
  { code: '5200', name: 'Material Costs', category: 'materials' },
  { code: '5300', name: 'Equipment Expenses', category: 'equipment' },
  { code: '5400', name: 'Overhead Costs', category: 'overhead' },
  { code: '5500', name: 'Travel Expenses', category: 'overhead' },
  { code: '5600', name: 'Utilities', category: 'overhead' },
  { code: '5700', name: 'Professional Services', category: 'overhead' }
];

export default function ExpenseRecordingForm({ projectId, onExpenseRecorded }: ExpenseRecordingFormProps) {
  const [formData, setFormData] = useState<ExpenseData>({
    amount: 0,
    category: 'labor',
    description: '',
    accountCode: '5100'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCategoryChange = (category: string) => {
    const categoryData = EXPENSE_CATEGORIES.find(cat => cat.value === category);
    setFormData(prev => ({
      ...prev,
      category: category as any,
      accountCode: categoryData?.accountCode || '5100'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.accountCode) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/integrated-finance/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setFormData({
          amount: 0,
          category: 'labor',
          description: '',
          accountCode: '5100'
        });
        
        if (onExpenseRecorded) {
          onExpenseRecorded(result.data);
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message || 'Failed to record expense');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error recording expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccountCodes = ACCOUNT_CODES.filter(
    account => account.category === formData.category
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Record Project Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Expense recorded successfully! Budget and ledgers have been updated in real-time.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-10"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
                required
              />
            </div>
            {formData.amount > 0 && (
              <p className="text-sm text-gray-600">
                Amount: {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Expense Category *</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.label}</span>
                      <Badge variant="outline" className="ml-2">
                        {category.accountCode}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Code */}
          <div className="space-y-2">
            <Label htmlFor="accountCode">Account Code *</Label>
            <Select
              value={formData.accountCode}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                accountCode: value
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {filteredAccountCodes.map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    <div className="flex flex-col">
                      <span className="font-medium">{account.code} - {account.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              required
              rows={3}
            />
          </div>

          {/* Impact Preview */}
          {formData.amount > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Real-time Impact Preview</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Budget category "{formData.category}" will increase by {formatCurrency(formData.amount)}</p>
                <p>• Project ledger will record new journal entry</p>
                <p>• General ledger account {formData.accountCode} will be debited</p>
                <p>• Cash account will be credited</p>
                <p>• Budget utilization percentage will be recalculated</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.amount || !formData.description}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Recording Expense...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Record Expense & Update Ledgers
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• This will automatically update the project budget in real-time</p>
            <p>• Journal entries will be created in both project and general ledgers</p>
            <p>• Account balances will be updated immediately</p>
            <p>• Budget variance analysis will be recalculated</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}