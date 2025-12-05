'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { createBudget } from '@/lib/api/budgetAPI';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Info, DollarSign, Calendar, FileText } from 'lucide-react';

interface BudgetCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projects?: Array<{ _id: string; name: string }>;
  departments?: Array<{ _id: string; name: string }>;
}

export default function BudgetCreateDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  projects = [],
  departments = []
}: BudgetCreateDialogProps) {
  console.log('📝 BudgetCreateDialog rendered');
  console.log('📝 Open:', open);
  console.log('📝 Projects received:', projects);
  console.log('📝 Projects count:', projects?.length);
  console.log('📝 Departments received:', departments);
  console.log('📝 Departments count:', departments?.length);
  
  // Validate projects structure
  if (projects && projects.length > 0) {
    console.log('✅ First project:', projects[0]);
    console.log('✅ Has _id?', !!projects[0]._id);
    console.log('✅ Has name?', !!projects[0].name);
  }
  
  const [formData, setFormData] = useState({
    budgetType: 'project' as 'project' | 'department' | 'special',
    projectId: '',
    departmentId: '',
    projectName: '',
    departmentName: '',
    totalBudget: '',
    currency: 'INR',
    fiscalYear: new Date().getFullYear().toString(),
    fiscalPeriod: 'Q1',
    description: '',
    notes: ''
  });
  const [categories, setCategories] = useState<Array<{
    name: string;
    type: 'labor' | 'materials' | 'equipment' | 'overhead' | 'special';
    allocatedAmount: string;
    description?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleSubmit = async () => {
    // Validation
    if (formData.budgetType === 'project' && !formData.projectId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a Project',
        variant: 'destructive'
      });
      return;
    }

    if (formData.budgetType === 'department' && !formData.departmentId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a Department',
        variant: 'destructive'
      });
      return;
    }

    if (formData.budgetType === 'special' && !formData.projectName) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a budget name for special budget',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.totalBudget || Number(formData.totalBudget) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid budget amount',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const selectedProject = projects.find(p => p._id === formData.projectId);
      const selectedDepartment = departments.find(d => d._id === formData.departmentId);

      const budgetCategories = categories
        .filter(cat => cat.name && cat.allocatedAmount)
        .map(cat => ({
          name: cat.name,
          type: cat.type,
          allocatedAmount: Number(cat.allocatedAmount),
          spentAmount: 0,
          items: []
        }));

      const payload: any = {
        budgetType: formData.budgetType,
        totalBudget: Number(formData.totalBudget),
        currency: formData.currency,
        fiscalYear: Number(formData.fiscalYear),
        fiscalPeriod: formData.fiscalPeriod,
        categories: budgetCategories
      };

      if (formData.description) payload.description = formData.description;
      
      if (formData.budgetType === 'project' && formData.projectId) {
        payload.projectId = formData.projectId;
        payload.projectName = selectedProject?.name;
      } else if (formData.budgetType === 'department' && formData.departmentId) {
        payload.departmentId = formData.departmentId;
        payload.departmentName = selectedDepartment?.name;
      } else if (formData.budgetType === 'special' && formData.projectName) {
        payload.projectName = formData.projectName;
      }

      console.log('📤 Sending budget payload:', JSON.stringify(payload, null, 2));

      await createBudget(payload);

      toast({
        title: 'Success',
        description: 'Budget created successfully'
      });
      
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        budgetType: 'project',
        projectId: '',
        departmentId: '',
        projectName: '',
        departmentName: '',
        totalBudget: '',
        currency: 'INR',
        fiscalYear: new Date().getFullYear().toString(),
        fiscalPeriod: 'Q1',
        description: '',
        notes: ''
      });
      setCategories([]);
      setActiveTab('basic');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create budget';
      console.error('❌ Budget creation error:', error);
      console.error('❌ Error response:', error?.response?.data);
      console.error('❌ Error status:', error?.response?.status);
      toast({
        title: 'Budget Creation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    setCategories([...categories, { name: '', type: 'overhead', allocatedAmount: '', description: '' }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const totalCategoryAmount = categories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0);
  const budgetAmount = Number(formData.totalBudget) || 0;
  const remainingBudget = budgetAmount - totalCategoryAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Create New Budget
          </DialogTitle>
          <DialogDescription>
            Set up a comprehensive budget with categories and allocations
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
          <div>
            <Label>Budget Type *</Label>
            <Select 
              value={formData.budgetType} 
              onValueChange={(value: any) => setFormData({ ...formData, budgetType: value, projectId: '', departmentId: '' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project Budget</SelectItem>
                <SelectItem value="department">Department Budget</SelectItem>
                <SelectItem value="special">Special Budget</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.budgetType === 'special' && 'Special budgets can exist without project/department'}
            </p>
          </div>

          {formData.budgetType === 'project' && (
            <div>
              <Label>Project * ({projects?.length || 0} available)</Label>
              {!projects || projects.length === 0 ? (
                <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium">No projects available</p>
                  <p className="text-xs text-yellow-700 mt-1">Please create a project first or select a different budget type (Department or Special).</p>
                </div>
              ) : (
                <>
                  <Select value={formData.projectId} onValueChange={(value) => {
                    console.log('🎯 Selected project ID:', value);
                    setFormData({ ...formData, projectId: value });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project, idx) => {
                        console.log(`📝 Rendering project ${idx}:`, project);
                        return (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {projects.length} project{projects.length !== 1 ? 's' : ''} available for selection
                  </p>
                </>
              )}
            </div>
          )}

          {formData.budgetType === 'department' && (
            <div>
              <Label>Department * ({departments.length} available)</Label>
              <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  {departments.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">No departments available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.budgetType === 'special' && (
            <div>
              <Label>Budget Name *</Label>
              <Input
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="Enter budget name"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fiscal Year *</Label>
              <Select value={formData.fiscalYear} onValueChange={(value) => setFormData({ ...formData, fiscalYear: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map(offset => {
                    const year = new Date().getFullYear() + offset;
                    return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fiscal Period *</Label>
              <Select value={formData.fiscalPeriod} onValueChange={(value) => setFormData({ ...formData, fiscalPeriod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                  <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                  <SelectItem value="H1">H1 (Jan-Jun)</SelectItem>
                  <SelectItem value="H2">H2 (Jul-Dec)</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Budget *</Label>
              <Input
                type="number"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <div>
              <Label>Currency *</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the budget purpose and scope"
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('categories')}>
                Next: Categories
              </Button>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Budget Categories</h3>
                <p className="text-sm text-muted-foreground">Break down your budget into categories</p>
              </div>
              <Button onClick={addCategory} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {budgetAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Budget:</span>
                  <span className="font-semibold">{formData.currency} {budgetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Allocated:</span>
                  <span className="font-semibold">{formData.currency} {totalCategoryAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span className={`font-semibold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formData.currency} {remainingBudget.toLocaleString()}
                  </span>
                </div>
                {remainingBudget < 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                    <Info className="h-3 w-3" />
                    <span>Category allocations exceed total budget</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {categories.map((category, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">{category.type}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(index)}
                      className="h-6 w-6"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Category Name *</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(index, 'name', e.target.value)}
                        placeholder="e.g., Salaries, Equipment"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type *</Label>
                      <Select
                        value={category.type}
                        onValueChange={(value) => updateCategory(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="labor">Labor</SelectItem>
                          <SelectItem value="materials">Materials</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="overhead">Overhead</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Allocated Amount *</Label>
                    <Input
                      type="number"
                      value={category.allocatedAmount}
                      onChange={(e) => updateCategory(index, 'allocatedAmount', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Description (Optional)</Label>
                    <Input
                      value={category.description || ''}
                      onChange={(e) => updateCategory(index, 'description', e.target.value)}
                      placeholder="Category details"
                    />
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No categories added yet</p>
                  <p className="text-xs">Click "Add Category" to start</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab('basic')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('details')}>
                  Next: Details
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information, constraints, or special considerations"
                rows={4}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Budget Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{formData.budgetType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Budget:</span>
                  <span className="font-medium">{formData.currency} {budgetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categories:</span>
                  <span className="font-medium">{categories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fiscal Period:</span>
                  <span className="font-medium">{formData.fiscalPeriod} {formData.fiscalYear}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab('categories')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || (formData.budgetType === 'project' && projects.length === 0) || remainingBudget < 0}
                >
                  {loading ? 'Creating...' : 'Create Budget'}
                </Button>
              </div>
            </div>
            {formData.budgetType === 'project' && projects.length === 0 && (
              <p className="text-xs text-destructive">No projects available. Please create a project first or select a different budget type.</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
