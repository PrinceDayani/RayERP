'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Save, Plus, X } from 'lucide-react';

export default function SubmitClaimPage() {
  const [expenseData, setExpenseData] = useState({
    category: '',
    amount: '',
    date: '',
    description: '',
    merchant: ''
  });
  const [receipts, setReceipts] = useState<string[]>([]);

  const addReceipt = () => {
    setReceipts([...receipts, `receipt-${receipts.length + 1}.jpg`]);
  };

  const removeReceipt = (index: number) => {
    setReceipts(receipts.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Expense Claim</h1>
          <p className="text-gray-600 mt-1">Submit a new expense claim for reimbursement</p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={expenseData.category} onValueChange={(value) => setExpenseData({...expenseData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="office">Office Supplies</SelectItem>
                      <SelectItem value="transport">Transportation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseData.date}
                    onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="merchant">Merchant/Vendor</Label>
                  <Input
                    id="merchant"
                    value={expenseData.merchant}
                    onChange={(e) => setExpenseData({...expenseData, merchant: e.target.value})}
                    placeholder="Enter merchant name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                  placeholder="Describe the expense"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Receipts & Documentation</CardTitle>
                <Button onClick={addReceipt} size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {receipts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No receipts uploaded yet</p>
                  <p className="text-sm">Click "Upload Receipt" to add documentation</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {receipts.map((receipt, index) => (
                    <div key={index} className="relative border rounded-lg p-4 text-center">
                      <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm truncate">{receipt}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => removeReceipt(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Claim Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${expenseData.amount || '0.00'}
                </div>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Category:</span>
                  <span className="text-sm font-medium">{expenseData.category || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Date:</span>
                  <span className="text-sm font-medium">{expenseData.date || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Receipts:</span>
                  <span className="text-sm font-medium">{receipts.length}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Please ensure all receipts are uploaded and expense details are accurate before submitting.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}