'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function CreateBudgetPage() {
  const [budgetName, setBudgetName] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [description, setDescription] = useState('');
  const [allocations, setAllocations] = useState([
    { account: '', amount: 0, period: 'Q1' }
  ]);

  const addAllocation = () => {
    setAllocations([...allocations, { account: '', amount: 0, period: 'Q1' }]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: string, value: any) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const totalBudget = allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Budget</h1>
          <p className="text-gray-600 mt-1">Set up a new budget plan with allocations</p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetName">Budget Name</Label>
                  <Input
                    id="budgetName"
                    value={budgetName}
                    onChange={(e) => setBudgetName(e.target.value)}
                    placeholder="Enter budget name"
                  />
                </div>
                <div>
                  <Label htmlFor="fiscalYear">Fiscal Year</Label>
                  <Select value={fiscalYear} onValueChange={setFiscalYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Budget description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Budget Allocations</CardTitle>
                <Button onClick={addAllocation} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Allocation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allocations.map((allocation, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label>Account</Label>
                      <Select
                        value={allocation.account}
                        onValueChange={(value) => updateAllocation(index, 'account', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales Revenue</SelectItem>
                          <SelectItem value="marketing">Marketing Expenses</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={allocation.amount}
                        onChange={(e) => updateAllocation(index, 'amount', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Period</Label>
                      <Select
                        value={allocation.period}
                        onValueChange={(value) => updateAllocation(index, 'period', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAllocation(index)}
                        disabled={allocations.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  ${totalBudget.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total Budget</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Allocations:</span>
                  <span className="text-sm font-medium">{allocations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Fiscal Year:</span>
                  <span className="text-sm font-medium">{fiscalYear}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}