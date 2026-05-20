"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, ArrowLeft, Zap, Copy, Trash2, Edit, MoreHorizontal,
  GitBranch, Clock, Layers, CheckCircle2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { workflowsAPI, WorkflowTemplate } from "@/lib/api/workflowsAPI";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (entityFilter !== 'all') params.entityType = entityFilter;
      const res = await workflowsAPI.getTemplates(params);
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, entityFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleClone = async (id: string) => {
    try {
      await workflowsAPI.cloneTemplate(id);
      toast.success('Template cloned successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to clone template');
    }
  };

  const handleDelete = async () => {
    try {
      await workflowsAPI.deleteTemplate(deleteDialog.id);
      toast.success('Template deactivated');
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'procurement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'finance': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'project': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'hr': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'operations': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push('/dashboard/workflows')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workflows
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Workflow Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Reusable workflow blueprints for your organization
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/workflows/templates/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="work-order">Work Order</SelectItem>
            <SelectItem value="purchase-order">Purchase Order</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="boq">BOQ</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="leave">Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm">Create your first workflow template to get started.</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/workflows/templates/create')}>
              <Plus className="h-4 w-4 mr-2" /> Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template._id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description || 'No description'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/workflows/templates/${template._id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClone(template._id)}>
                        <Copy className="h-4 w-4 mr-2" /> Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, id: template._id, name: template.name })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={getCategoryColor(template.category)} variant="secondary">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{template.entityType}</Badge>
                  {template.isDefault && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs" variant="secondary">
                      Default
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {template.steps?.length || 0} steps
                  </span>
                  {template.estimatedDurationHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.estimatedDurationHours < 24
                        ? `${template.estimatedDurationHours}h`
                        : `${Math.round(template.estimatedDurationHours / 24)}d`
                      }
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    v{template.version}
                  </span>
                </div>

                {/* Step preview */}
                <div className="flex items-center gap-1 overflow-hidden">
                  {template.steps?.slice(0, 4).map((step, i) => (
                    <React.Fragment key={step.stepId}>
                      <div className="flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded whitespace-nowrap">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <span className="truncate max-w-[80px]">{step.name}</span>
                      </div>
                      {i < Math.min(template.steps.length - 1, 3) && (
                        <span className="text-muted-foreground text-xs">→</span>
                      )}
                    </React.Fragment>
                  ))}
                  {template.steps?.length > 4 && (
                    <span className="text-xs text-muted-foreground">+{template.steps.length - 4}</span>
                  )}
                </div>

                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{deleteDialog.name}"? This will prevent new workflows from being started with this template. Existing workflows will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
