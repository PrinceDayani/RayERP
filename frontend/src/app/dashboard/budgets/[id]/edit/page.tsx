'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { getBudget, updateBudget } from '@/lib/api/budgetAPI';
import { Budget, BudgetCategory, BudgetItem } from '@/types/budget';
import Layout from '@/components/Layout';

export default function EditBudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  const [formData, setFormData] = useState({
    projectName: '',
    totalBudget: '',
    currency: 'USD',
    categories: [] as BudgetCategory[]
  });

  useEffect(() => {
    if (budgetId) {
      fetchBudget();
    }
  }, [budgetId]);

  const fetchBudget = async () => {
    try {
      const data = await getBudget(budgetId);
      setBudget(data);
      setFormData({
        projectName: data.projectName,
        totalBudget: data.totalBudget.toString(),
        currency: data.currency,
        categories: data.categories
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateBudget(budgetId, {
        projectName: formData.projectName,
        totalBudget: Number(formData.totalBudget),
        currency: formData.currency,
        categories: formData.categories
      });
      router.push(`/dashboard/budgets/${budgetId}`);
    } catch (error) {
      console.error('Error updating budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newCategory: BudgetCategory = {
      _id: Date.now().toString(),
      name: '',
      type: 'labor',
      allocatedAmount: 0,
      spentAmount: 0,
      items: []
    };
    setFormData({
      ...formData,
      categories: [...formData.categories, newCategory]
    });
  };

  const updateCategory = (index: number, field: keyof BudgetCategory, value: any) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setFormData({ ...formData, categories: updatedCategories });
  };

  const removeCategory = (index: number) => {
    const updatedCategories = formData.categories.filter((_, i) => i !== index);
    setFormData({ ...formData, categories: updatedCategories });
  };

  const addItem = (categoryIndex: number) => {
    const newItem: BudgetItem = {
      _id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].items.push(newItem);
    setFormData({ ...formData, categories: updatedCategories });
  };

  const updateItem = (categoryIndex: number, itemIndex: number, field: keyof BudgetItem, value: any) => {
    const updatedCategories = [...formData.categories];
    const item = { ...updatedCategories[categoryIndex].items[itemIndex], [field]: value };
    
    if (field === 'quantity' || field === 'unitCost') {
      item.totalCost = item.quantity * item.unitCost;
    }
    
    updatedCategories[categoryIndex].items[itemIndex] = item;
    
    // Update category allocated amount
    updatedCategories[categoryIndex].allocatedAmount = updatedCategories[categoryIndex].items.reduce(
      (sum, item) => sum + item.totalCost, 0
    );
    
    setFormData({ ...formData, categories: updatedCategories });
  };

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].items = updatedCategories[categoryIndex].items.filter((_, i) => i !== itemIndex);
    
    // Update category allocated amount
    updatedCategories[categoryIndex].allocatedAmount = updatedCategories[categoryIndex].items.reduce(
      (sum, item) => sum + item.totalCost, 0
    );
    
    setFormData({ ...formData, categories: updatedCategories });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!budget) {
    return <div className="flex justify-center items-center h-64">Budget not found</div>;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(`/dashboard/budgets/${budgetId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budget
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Budget</h1>
              <p className="text-gray-600">{budget.projectName}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total Budget</label>
                <Input
                  type="number"
                  value={formData.totalBudget}
                  onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                  placeholder="Enter total budget"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Budget Categories</CardTitle>
            <Button onClick={addCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.categories.map((category, categoryIndex) => (
              <div key={category._id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Category {categoryIndex + 1}</h4>
                  <Button variant="destructive" size="sm" onClick={() => removeCategory(categoryIndex)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category Name</label>
                    <Input
                      value={category.name}
                      onChange={(e) => updateCategory(categoryIndex, 'name', e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={category.type} onValueChange={(value) => updateCategory(categoryIndex, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="overhead">Overhead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">Items</h5>
                    <Button size="sm" onClick={() => addItem(categoryIndex)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {category.items.map((item, itemIndex) => (
                    <div key={item._id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-3 bg-gray-50 rounded">
                      <div>
                        <label className="text-xs font-medium">Name</label>
                        <Input
                          size="sm"
                          value={item.name}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, 'name', e.target.value)}
                          placeholder="Item name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Description</label>
                        <Input
                          size="sm"
                          value={item.description}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Quantity</label>
                        <Input
                          size="sm"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Unit Cost</label>
                        <Input
                          size="sm"
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, 'unitCost', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Total</label>
                        <Input
                          size="sm"
                          value={item.totalCost.toFixed(2)}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeItem(categoryIndex, itemIndex)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Category Total: {formData.currency} {category.allocatedAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            
            {formData.categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No categories added yet. Click "Add Category" to get started.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/budgets/${budgetId}`)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}