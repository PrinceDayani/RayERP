"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { BudgetCategory, BudgetItem, BudgetTemplate } from "@/types/budget";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  template?: BudgetTemplate | null;
}

export default function TemplateDialog({ open, onOpenChange, onSuccess, template }: TemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectType: "",
    isDefault: false
  });
  const [categories, setCategories] = useState<Omit<BudgetCategory, '_id' | 'spentAmount'>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        projectType: template.projectType,
        isDefault: template.isDefault
      });
      setCategories(template.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          _id: item._id || Math.random().toString(36).substr(2, 9)
        }))
      })));
    } else {
      resetForm();
    }
  }, [template]);

  const addCategory = () => {
    const newCategory = {
      name: "",
      type: "labor" as const,
      allocatedAmount: 0,
      items: []
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (index: number, field: string, value: any) => {
    setCategories(categories.map((cat, i) => 
      i === index ? { ...cat, [field]: value } : cat
    ));
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const addItem = (categoryIndex: number) => {
    const newItem: BudgetItem = {
      _id: Math.random().toString(36).substr(2, 9),
      name: "",
      description: "",
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    
    setCategories(categories.map((cat, i) => 
      i === categoryIndex 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ));
  };

  const updateItem = (categoryIndex: number, itemIndex: number, field: string, value: any) => {
    setCategories(categories.map((cat, i) => 
      i === categoryIndex 
        ? {
            ...cat,
            items: cat.items.map((item, j) => {
              if (j === itemIndex) {
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

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    setCategories(categories.map((cat, i) => 
      i === categoryIndex 
        ? { ...cat, items: cat.items.filter((_, j) => j !== itemIndex) }
        : cat
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const templateData = {
        ...formData,
        categories: categories.map(cat => ({
          ...cat,
          allocatedAmount: cat.items.reduce((sum, item) => sum + item.totalCost, 0)
        }))
      };

      const url = template ? `/api/budget-templates/${template._id}` : "/api/budget-templates";
      const method = template ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      projectType: "",
      isDefault: false
    });
    setCategories([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle>
        </DialogHeader>

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
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Template Categories</h3>
              <Button type="button" onClick={addCategory} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            {categories.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      <Input
                        placeholder="Category name"
                        value={category.name}
                        onChange={(e) => updateCategory(categoryIndex, "name", e.target.value)}
                      />
                      <Select 
                        value={category.type} 
                        onValueChange={(value) => updateCategory(categoryIndex, "type", value)}
                      >
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
                        onClick={() => addItem(categoryIndex)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(categoryIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-6 gap-2 items-center">
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, "description", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, "quantity", Number(e.target.value))}
                        />
                        <Input
                          type="number"
                          placeholder="Unit cost"
                          value={item.unitCost}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, "unitCost", Number(e.target.value))}
                        />
                        <div className="text-sm font-medium">
                          ${item.totalCost.toLocaleString()}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(categoryIndex, itemIndex)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}