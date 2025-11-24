"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, Copy, Star, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { getBudgetTemplates, createBudgetTemplate } from "@/lib/api/budgetAPI";
import { BudgetTemplate } from "@/types/budget";
import auditLogger from "@/lib/auditLog";
import { useCurrency } from "@/hooks/useCurrency";

export default function BudgetTemplatesPage() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<BudgetTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { user } = useAuth();
  const { displayCurrency, setDisplayCurrency, formatAmount } = useCurrency();
  
  const [formData, setFormData] = useState<BudgetTemplate>({
    _id: "",
    name: "",
    description: "",
    projectType: "",
    categories: [],
    isDefault: false,
    createdAt: ""
  });

  useEffect(() => {
    fetchTemplates();
    const saved = localStorage.getItem('template-favorites');
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    const filtered = templates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.projectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [templates, searchQuery]);

  const fetchTemplates = async () => {
    console.log('Fetching templates...');
    try {
      const token = localStorage.getItem('auth-token');
      console.log('Token exists:', !!token);
      
      const response = await fetch('/api/budget-templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Raw result:', result);
        
        const templateData = result.data || result || [];
        console.log('Template data:', templateData);
        console.log('Is array:', Array.isArray(templateData));
        console.log('Length:', templateData.length);
        
        const templates = (Array.isArray(templateData) ? templateData : []).map((t: any) => ({
          ...t,
          categories: (t.categories || []).map((cat: any) => ({
            ...cat,
            items: cat.items || []
          }))
        }));
        
        console.log('Processed templates:', templates);
        setTemplates(templates);
        toast({
          title: "Templates Loaded",
          description: `Found ${templates.length} template(s)`,
        });
      } else {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
      toast({
        title: "Error",
        description: "Failed to load templates. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const validateTemplate = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push("Template name is required");
    } else if (formData.name.length < 3) {
      errors.push("Template name must be at least 3 characters");
    }
    
    if (!formData.projectType.trim()) {
      errors.push("Project type is required");
    }
    
    if (formData.categories.length === 0) {
      errors.push("Add at least one category");
    }
    
    formData.categories.forEach((cat, idx) => {
      if (!cat.name.trim()) {
        errors.push(`Category ${idx + 1} name is required`);
      }
      if (cat.items.length === 0) {
        errors.push(`Category "${cat.name}" must have at least one item`);
      }
      cat.items.forEach((item, itemIdx) => {
        if (!item.name.trim()) {
          errors.push(`Item ${itemIdx + 1} in "${cat.name}" needs a name`);
        }
        if (item.quantity <= 0) {
          errors.push(`Item "${item.name}" quantity must be > 0`);
        }
        if (item.unitCost < 0) {
          errors.push(`Item "${item.name}" unit cost cannot be negative`);
        }
      });
    });
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateTemplate();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(". "),
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const templateData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        projectType: formData.projectType.trim(),
        categories: formData.categories.map(cat => ({
          name: cat.name.trim(),
          type: cat.type,
          allocatedAmount: cat.items.reduce((sum, item) => sum + item.totalCost, 0),
          items: cat.items.map(item => ({
            name: item.name.trim(),
            description: item.description?.trim() || "",
            quantity: Number(item.quantity) || 1,
            unitCost: Number(item.unitCost) || 0,
            totalCost: Number(item.totalCost) || 0
          }))
        })),
        isDefault: Boolean(formData.isDefault)
      };

      // Direct API call
      const token = localStorage.getItem('auth-token');
      const url = editingTemplate ? `/api/budget-templates/${editingTemplate._id}` : '/api/budget-templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save template');
      }
      
      if (user) {
        auditLogger.log({
          userId: user._id,
          userName: user.name,
          action: editingTemplate ? "UPDATE" : "CREATE",
          resource: "BUDGET_TEMPLATE",
          resourceId: editingTemplate?._id || "new",
          details: { name: templateData.name, projectType: templateData.projectType }
        });
      }
      
      toast({ title: "Success", description: "Template saved successfully" });
      await fetchTemplates();
      resetForm();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`/api/budget-templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        if (user) {
          auditLogger.log({
            userId: user._id,
            userName: user.name,
            action: "DELETE",
            resource: "BUDGET_TEMPLATE",
            resourceId: id
          });
        }
        toast({ title: "Success", description: "Template deleted successfully" });
        await fetchTemplates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
    localStorage.setItem("template-favorites", JSON.stringify([...next]));
  };

  const useTemplate = async (template: BudgetTemplate) => {
    try {
      const typeMap: Record<string, 'labor' | 'materials' | 'equipment' | 'overhead'> = {
        'income': 'materials',
        'expense': 'overhead',
        'labor': 'labor',
        'materials': 'materials',
        'equipment': 'equipment',
        'overhead': 'overhead'
      };

      const budgetData = {
        projectName: `${template.name} - ${new Date().toLocaleDateString()}`,
        totalBudget: getTotalAmount(template),
        currency: 'INR',
        status: 'draft',
        categories: template.categories.map(cat => ({
          name: cat.name,
          type: typeMap[cat.type] || 'overhead',
          allocatedAmount: cat.allocatedAmount,
          spentAmount: 0,
          items: cat.items.map(item => ({
            name: item.name,
            description: item.description || '',
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost
          }))
        }))
      };

      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(budgetData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create budget from template');
      }

      if (user) {
        auditLogger.log({
          userId: user._id,
          userName: user.name,
          action: "CREATE",
          resource: "BUDGET",
          resourceId: "new",
          details: { fromTemplate: template.name, projectName: budgetData.projectName }
        });
      }

      toast({
        title: "Success",
        description: "Budget created from template! Redirecting...",
      });

      // Redirect to budgets page after 1 second
      setTimeout(() => {
        router.push('/dashboard/budgets');
      }, 1000);
    } catch (error: any) {
      console.error('Error using template:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create budget from template",
        variant: "destructive",
      });
    }
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, {
        _id: Math.random().toString(36).substr(2, 9),
        name: "",
        type: "labor",
        allocatedAmount: 0,
        items: []
      }] as any
    }));
  };

  const addItem = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        (cat as any)._id === categoryId
          ? {
              ...cat,
              items: [...cat.items, {
                _id: Math.random().toString(36).substr(2, 9),
                name: "",
                description: "",
                quantity: 1,
                unitCost: 0,
                totalCost: 0
              }]
            }
          : cat
      )
    }));
  };

  const updateCategory = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        (cat as any)._id === id ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const updateItem = (categoryId: string, itemId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        (cat as any)._id === categoryId
          ? {
              ...cat,
              items: cat.items.map(item => {
                if ((item as any)._id === itemId) {
                  const updated = { ...item, [field]: value };
                  if (field === "quantity" || field === "unitCost") {
                    updated.totalCost = updated.quantity * updated.unitCost;
                  }
                  return updated;
                }
                return item;
              })
            }
          : cat
      )
    }));
  };

  const removeCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => (cat as any)._id !== id)
    }));
  };

  const removeItem = (categoryId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        (cat as any)._id === categoryId
          ? { ...cat, items: cat.items.filter(item => (item as any)._id !== itemId) }
          : cat
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      name: "",
      description: "",
      projectType: "",
      categories: [],
      isDefault: false,
      createdAt: ""
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const getTotalAmount = (template: BudgetTemplate) => {
    return template.categories.reduce((sum, cat) =>
      sum + cat.items.reduce((catSum, item) => catSum + (item.totalCost || 0), 0), 0
    );
  };

  const canManageTemplates = () => {
    const allowedRoles = ["Root", "Super Admin", "Admin", "Manager"];
    return user && allowedRoles.includes(user.role.name);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/budgets")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Budget Templates</h1>
          </div>
          <p className="text-sm text-muted-foreground">{filteredTemplates.length} templates available</p>
        </div>
        <div className="flex gap-2">
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD $</SelectItem>
              <SelectItem value="INR">INR ₹</SelectItem>
              <SelectItem value="EUR">EUR €</SelectItem>
              <SelectItem value="GBP">GBP £</SelectItem>
            </SelectContent>
          </Select>
          {canManageTemplates() && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Web Development Project"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label>Project Type <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.projectType}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                    placeholder="e.g., Software, Construction"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this template..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Categories</h3>
                  <Button type="button" onClick={addCategory} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                {formData.categories.map((category) => (
                  <Card key={(category as any)._id}>
                    <CardHeader className="pb-3">
                      <div className="flex gap-4 items-center">
                        <Input
                          placeholder="Category name"
                          value={category.name}
                          onChange={(e) => updateCategory((category as any)._id!, "name", e.target.value)}
                          className="flex-1"
                        />
                        <Select value={category.type} onValueChange={(value) => updateCategory((category as any)._id!, "type", value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="overhead">Overhead</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem((category as any)._id!)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Item
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCategory((category as any)._id!)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.items.map((item) => (
                          <div key={(item as any)._id} className="grid grid-cols-6 gap-2">
                            <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem((category as any)._id!, (item as any)._id!, "name", e.target.value)} />
                            <Input placeholder="Description" value={item.description} onChange={(e) => updateItem((category as any)._id!, (item as any)._id!, "description", e.target.value)} />
                            <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem((category as any)._id!, (item as any)._id!, "quantity", Number(e.target.value))} />
                            <Input type="number" placeholder="Unit cost" value={item.unitCost} onChange={(e) => updateItem((category as any)._id!, (item as any)._id!, "unitCost", Number(e.target.value))} />
                            <div className="text-sm font-medium flex items-center">${item.totalCost.toLocaleString()}</div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem((category as any)._id!, (item as any)._id!)}>
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
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleFavorite(template._id!)}>
                      <Star className={`h-4 w-4 ${favorites.has(template._id!) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </Button>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.projectType}</p>
                </div>
                {template.isDefault && <Badge>Default</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="flex justify-between text-sm">
                  <span>Categories:</span>
                  <span className="font-medium">{template.categories.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-semibold">{formatAmount(getTotalAmount(template))}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => useTemplate(template)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                {canManageTemplates() && (
                  <Button variant="outline" size="sm" onClick={() => handleDelete(template._id!)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
}
