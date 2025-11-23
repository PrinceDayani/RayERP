"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { BudgetCategory, BudgetItem, BudgetTemplate, Currency } from "@/types/budget";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
  budgetId?: string;
  editMode?: boolean;
}

export default function BudgetDialog({ open, onOpenChange, onSuccess, projectId, projectName, budgetId, editMode = false }: BudgetDialogProps) {
  const [formData, setFormData] = useState({
    projectId: projectId || "",
    projectName: projectName || "",
    totalBudget: 0,
    currency: "INR",
    templateId: ""
  });
  const [projectLoading, setProjectLoading] = useState(!!projectId && !projectName);

  useEffect(() => {
    if (projectId && projectName) {
      setFormData(prev => ({
        ...prev,
        projectId,
        projectName
      }));
      setProjectLoading(false);
    } else if (projectId && !projectName && open) {
      fetchProjectName();
    }
  }, [projectId, projectName, open]);

  const fetchProjectName = async () => {
    if (!projectId) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const project = data.data || data;
        if (project && project._id) {
          setFormData(prev => ({
            ...prev,
            projectId: project._id,
            projectName: project.name || 'Unnamed Project'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setProjectLoading(false);
    }
  };
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [currencies] = useState<Currency[]>([
    { code: "INR", name: "Indian Rupee", symbol: "₹", exchangeRate: 1 },
    { code: "INR", name: "US Dollar", symbol: "$", exchangeRate: 83.12 },
    { code: "EUR", name: "Euro", symbol: "€", exchangeRate: 90.45 },
    { code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 105.23 }
  ]);

  const [loading, setLoading] = useState(false);
  const [sendForApproval, setSendForApproval] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (editMode && budgetId) {
        fetchBudgetData();
      }
    }
  }, [open, editMode, budgetId]);

  const fetchBudgetData = async () => {
    if (!budgetId || !projectId) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget/${budgetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const budget = data.data || data;
        
        setFormData(prev => ({
          ...prev,
          totalBudget: budget.totalBudget || 0,
          currency: budget.currency || 'INR'
        }));
        
        if (budget.categories) {
          setCategories(budget.categories.map((cat: any) => ({
            ...cat,
            _id: cat._id || Math.random().toString(36).substr(2, 9),
            items: cat.items?.map((item: any) => ({
              ...item,
              _id: item._id || Math.random().toString(36).substr(2, 9)
            })) || []
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budget-templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    }
  };



  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setCategories([]);
      setFormData(prev => ({ ...prev, templateId: "" }));
      return;
    }
    
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setCategories(template.categories.map(cat => ({
        ...cat,
        _id: Math.random().toString(36).substr(2, 9),
        spentAmount: 0
      })));
      setFormData(prev => ({ ...prev, templateId }));
    }
  };

  const addCategory = () => {
    const newCategory: BudgetCategory = {
      _id: Math.random().toString(36).substr(2, 9),
      name: "",
      type: "labor",
      allocatedAmount: 0,
      spentAmount: 0,
      items: []
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: string, field: string, value: any) => {
    setCategories(categories.map(cat => 
      cat._id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(cat => cat._id !== id));
  };

  const addItem = (categoryId: string) => {
    const newItem: BudgetItem = {
      _id: Math.random().toString(36).substr(2, 9),
      name: "",
      description: "",
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    
    setCategories(categories.map(cat => 
      cat._id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ));
  };

  const updateItem = (categoryId: string, itemId: string, field: string, value: any) => {
    setCategories(categories.map(cat => 
      cat._id === categoryId 
        ? {
            ...cat,
            items: cat.items.map(item => {
              if (item._id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === "quantity" || field === "unitCost") {
                  updatedItem.totalCost = updatedItem.quantity * updatedItem.unitCost;
                }
                return updatedItem;
              }
              return item;
            })
          }
        : cat
    ));
  };

  const removeItem = (categoryId: string, itemId: string) => {
    setCategories(categories.map(cat => 
      cat._id === categoryId 
        ? { ...cat, items: cat.items.filter(item => item._id !== itemId) }
        : cat
    ));
  };

  const calculateTotalBudget = () => {
    return categories.reduce((total, cat) => 
      total + cat.items.reduce((catTotal, item) => catTotal + item.totalCost, 0), 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.projectId || !formData.projectName) {
        alert('Project selection is required');
        return;
      }

      if (categories.length === 0) {
        alert('At least one budget category is required');
        return;
      }

      const totalBudget = calculateTotalBudget();
      if (totalBudget <= 0) {
        alert('Budget total must be greater than zero');
        return;
      }

      const budgetData = {
        projectId: formData.projectId,
        projectName: formData.projectName,
        totalBudget,
        currency: formData.currency,
        categories: categories.map(cat => ({
          name: cat.name.trim(),
          type: cat.type,
          allocatedAmount: cat.items.reduce((sum, item) => sum + item.totalCost, 0),
          spentAmount: 0,
          items: cat.items.map(item => ({
            name: item.name.trim(),
            description: item.description?.trim() || '',
            quantity: Number(item.quantity) || 1,
            unitCost: Number(item.unitCost) || 0,
            totalCost: Number(item.totalCost) || 0
          }))
        }))
      };

      const token = localStorage.getItem('auth-token');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const url = editMode && budgetId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${formData.projectId}/budget/${budgetId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${formData.projectId}/budget`;
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(budgetData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${editMode ? 'update' : 'create'} budget`);
      }
      
      // If sendForApproval is checked and we just created a budget, submit it
      if (!editMode && sendForApproval && result.data?._id) {
        try {
          const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${formData.projectId}/budget/${result.data._id}/submit`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (submitResponse.ok) {
            alert('Budget created and sent for approval successfully!');
          } else {
            alert('Budget created but failed to send for approval');
          }
        } catch (submitError) {
          console.error('Error submitting for approval:', submitError);
          alert('Budget created but failed to send for approval');
        }
      } else {
        alert(`Budget ${editMode ? 'updated' : 'created'} successfully!`);
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} budget:`, error);
      alert(`Failed to ${editMode ? 'update' : 'create'} budget: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (!editMode) {
      setFormData({
        projectId: projectId || "",
        projectName: projectName || "",
        totalBudget: 0,
        currency: "INR",
        templateId: ""
      });
      setCategories([]);
    }
  };

  const addQuickCategory = () => {
    const quickCategories = [
      { name: 'Development', type: 'labor' as const },
      { name: 'Materials', type: 'materials' as const },
      { name: 'Equipment', type: 'equipment' as const },
      { name: 'Overhead', type: 'overhead' as const }
    ];

    const existingNames = categories.map(cat => cat.name.toLowerCase());
    const availableCategories = quickCategories.filter(cat => 
      !existingNames.includes(cat.name.toLowerCase())
    );

    if (availableCategories.length > 0) {
      const newCategory: BudgetCategory = {
        _id: Math.random().toString(36).substr(2, 9),
        name: availableCategories[0].name,
        type: availableCategories[0].type,
        allocatedAmount: 0,
        spentAmount: 0,
        items: [{
          _id: Math.random().toString(36).substr(2, 9),
          name: `${availableCategories[0].name} Work`,
          description: '',
          quantity: 1,
          unitCost: 0,
          totalCost: 0
        }]
      };
      setCategories([...categories, newCategory]);
    }
  };

  const addStarterBudget = () => {
    const starterCategories: BudgetCategory[] = [
      {
        _id: Math.random().toString(36).substr(2, 9),
        name: 'Development',
        type: 'labor',
        allocatedAmount: 0,
        spentAmount: 0,
        items: [{
          _id: Math.random().toString(36).substr(2, 9),
          name: 'Frontend Development',
          description: 'UI/UX development work',
          quantity: 40,
          unitCost: 100,
          totalCost: 4000
        }]
      },
      {
        _id: Math.random().toString(36).substr(2, 9),
        name: 'Materials',
        type: 'materials',
        allocatedAmount: 0,
        spentAmount: 0,
        items: [{
          _id: Math.random().toString(36).substr(2, 9),
          name: 'Software Licenses',
          description: 'Required software and tools',
          quantity: 1,
          unitCost: 500,
          totalCost: 500
        }]
      }
    ];
    setCategories(starterCategories);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {projectLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading project...</span>
                  </div>
                ) : (
                  <span className="font-medium">
                    {formData.projectName || 'Project not found'}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, currency: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency, index) => (
                    <SelectItem key={`${currency.code}-${index}`} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="template">Budget Template (Optional)</Label>
            <Select value={formData.templateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Start from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="none" value="none">Start from scratch</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="categories" className="w-full">
            <TabsList>
              <TabsTrigger value="categories">Budget Categories</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              {categories.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">No Budget Categories Yet</h3>
                  <p className="text-gray-600 mb-6">Get started by adding your first budget category</p>
                  <div className="flex justify-center gap-3">
                    <Button type="button" onClick={addStarterBudget} className="bg-blue-600 hover:bg-blue-700">
                      Add Starter Budget
                    </Button>
                    <Button type="button" onClick={addQuickCategory} variant="outline">
                      Quick Add Category
                    </Button>
                    <Button type="button" onClick={addCategory} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Custom Category
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Budget Categories ({categories.length})</h3>
                    <div className="flex gap-2">
                      <Button type="button" onClick={addQuickCategory} variant="outline" size="sm">
                        Quick Add
                      </Button>
                      <Button type="button" onClick={addCategory} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  </div>

              {categories.map((category) => (
                <Card key={category._id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <Input
                          placeholder="Category name"
                          value={category.name}
                          onChange={(e) => updateCategory(category._id, "name", e.target.value)}
                        />
                        <Select value={category.type} onValueChange={(value) => 
                          updateCategory(category._id, "type", value)
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="labor" value="labor">Labor</SelectItem>
                            <SelectItem key="materials" value="materials">Materials</SelectItem>
                            <SelectItem key="equipment" value="equipment">Equipment</SelectItem>
                            <SelectItem key="overhead" value="overhead">Overhead</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addItem(category._id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCategory(category._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.items.map((item) => (
                        <div key={item._id} className="grid grid-cols-6 gap-2 items-center">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateItem(category._id, item._id, "name", e.target.value)}
                          />
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem(category._id, item._id, "description", e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(category._id, item._id, "quantity", Number(e.target.value))}
                          />
                          <Input
                            type="number"
                            placeholder="Unit cost"
                            value={item.unitCost}
                            onChange={(e) => updateItem(category._id, item._id, "unitCost", Number(e.target.value))}
                          />
                          <div className="text-sm font-medium">
                            {formData.currency} {item.totalCost.toLocaleString()}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(category._id, item._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Budget:</span>
                      <span>{formData.currency} {calculateTotalBudget().toLocaleString()}</span>
                    </div>
                    {categories.map((category) => {
                      const categoryTotal = category.items.reduce((sum, item) => sum + item.totalCost, 0);
                      return (
                        <div key={category._id} className="flex justify-between">
                          <span className="capitalize">{category.name || category.type}:</span>
                          <span>{formData.currency} {categoryTotal.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            {!editMode && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendForApproval"
                  checked={sendForApproval}
                  onChange={(e) => setSendForApproval(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="sendForApproval" className="text-sm font-medium">
                  Send for approval after creating
                </label>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || projectLoading || !formData.projectName}>
                {loading ? (editMode ? "Updating..." : "Creating...") : (editMode ? "Update Budget" : "Create Budget")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}