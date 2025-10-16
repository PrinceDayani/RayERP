"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import Layout from "@/components/Layout";

interface TemplateItem {
  _id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface TemplateCategory {
  _id?: string;
  name: string;
  type: 'labor' | 'materials' | 'equipment' | 'overhead';
  allocatedAmount: number;
  items: TemplateItem[];
}

interface BudgetTemplate {
  _id?: string;
  name: string;
  description?: string;
  projectType: string;
  categories: TemplateCategory[];
  isDefault: boolean;
}

export default function BudgetTemplatesPage() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<BudgetTemplate>({
    name: "",
    description: "",
    projectType: "",
    categories: [],
    isDefault: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const response = await fetch('/api/budget-templates', {
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
    }
  };

  const addCategory = () => {
    const newCategory: TemplateCategory = {
      _id: Math.random().toString(36).substr(2, 9),
      name: "",
      type: "labor",
      allocatedAmount: 0,
      items: []
    };
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const updateCategory = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat._id === id ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const removeCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat._id !== id)
    }));
  };

  const addItem = (categoryId: string) => {
    const newItem: TemplateItem = {
      _id: Math.random().toString(36).substr(2, 9),
      name: "",
      description: "",
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat._id === categoryId 
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      )
    }));
  };

  const updateItem = (categoryId: string, itemId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
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
      )
    }));
  };

  const removeItem = (categoryId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat._id === categoryId 
          ? { ...cat, items: cat.items.filter(item => item._id !== itemId) }
          : cat
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.projectType.trim()) {
        alert('Name and project type are required');
        return;
      }

      const templateData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        projectType: formData.projectType.trim(),
        categories: formData.categories.map(cat => ({
          name: cat.name.trim(),
          type: cat.type,
          allocatedAmount: cat.items.reduce((sum, item) => sum + item.totalCost, 0),
          items: cat.items.map(item => ({
            name: item.name.trim(),
            description: item.description?.trim() || '',
            quantity: Number(item.quantity) || 1,
            unitCost: Number(item.unitCost) || 0,
            totalCost: Number(item.totalCost) || 0
          }))
        })),
        isDefault: Boolean(formData.isDefault)
      };

      console.log('Sending template data:', templateData);

      const url = editingTemplate ? `/api/budget-templates/${editingTemplate._id}` : '/api/budget-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      await fetchTemplates();
      resetForm();
      alert('Template saved successfully!');
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert(`Failed to save template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: BudgetTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`/api/budget-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      projectType: "",
      categories: [],
      isDefault: false
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const getTotalAmount = (template: BudgetTemplate) => {
    return template.categories.reduce((sum, cat) => 
      sum + cat.items.reduce((catSum, item) => catSum + item.totalCost, 0), 0
    );
  };

  const createTestTemplate = async () => {
    try {
      const testData = {
        name: 'Test Template',
        description: 'Test template for debugging',
        projectType: 'Web Development',
        categories: [
          {
            name: 'Development',
            type: 'labor',
            allocatedAmount: 5000,
            items: [
              {
                name: 'Frontend Work',
                description: 'React development',
                quantity: 40,
                unitCost: 125,
                totalCost: 5000
              }
            ]
          }
        ],
        isDefault: false
      };

      console.log('Testing API with:', testData);

      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/budget-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      console.log('Test API response:', result);

      if (response.ok) {
        alert('Test template created successfully!');
        await fetchTemplates();
      } else {
        alert(`Test failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Test API error:', error);
      alert(`Test error: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Budget Templates</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
            <Button variant="outline" onClick={createTestTemplate}>
              Test API
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <Input
                      id="projectType"
                      value={formData.projectType}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Categories</h3>
                    <Button type="button" onClick={addCategory} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>

                  {formData.categories.map((category) => (
                    <Card key={category._id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            <Input
                              placeholder="Category name"
                              value={category.name}
                              onChange={(e) => updateCategory(category._id!, "name", e.target.value)}
                            />
                            <Select value={category.type} onValueChange={(value) => 
                              updateCategory(category._id!, "type", value)
                            }>
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
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addItem(category._id!)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Item
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCategory(category._id!)}
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
                                onChange={(e) => updateItem(category._id!, item._id!, "name", e.target.value)}
                              />
                              <Input
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateItem(category._id!, item._id!, "description", e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => updateItem(category._id!, item._id!, "quantity", Number(e.target.value))}
                              />
                              <Input
                                type="number"
                                placeholder="Unit cost"
                                value={item.unitCost}
                                onChange={(e) => updateItem(category._id!, item._id!, "unitCost", Number(e.target.value))}
                              />
                              <div className="text-sm font-medium">
                                ${item.totalCost.toLocaleString()}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(category._id!, item._id!)}
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

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600">{template.projectType}</p>
                  </div>
                  {template.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Categories:</span>
                    <span>{template.categories.length}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Amount:</span>
                    <span>${getTotalAmount(template).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template._id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}