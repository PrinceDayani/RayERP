import React, { useState } from 'react';
import { Save, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProjectTaskTemplates } from '@/hooks/tasks/useProjectTaskTemplates';

interface ProjectTaskTemplatesProps {
  currentTaskId?: string;
  onCreateFromTemplate?: (templateId: string) => void;
}

export const ProjectTaskTemplates: React.FC<ProjectTaskTemplatesProps> = ({
  currentTaskId,
  onCreateFromTemplate
}) => {
  const { templates, isLoading, saveAsTemplate, deleteTemplate } = useProjectTaskTemplates();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleSaveAsTemplate = async () => {
    if (!currentTaskId || !templateName.trim()) return;
    
    try {
      await saveAsTemplate({ taskId: currentTaskId, templateName: templateName.trim() });
      setShowSaveDialog(false);
      setTemplateName('');
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;
    
    try {
      await deleteTemplate(selectedTemplateId);
      setShowDeleteDialog(false);
      setSelectedTemplateId(null);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    if (onCreateFromTemplate) {
      onCreateFromTemplate(templateId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Templates</CardTitle>
            {currentTaskId && (
              <Button size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-1" />
                Save as Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: any) => (
                <Card key={template._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{template.templateName}</h3>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTemplateId(template._id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>Priority: {template.priority}</span>
                      <span>{template.estimatedHours}h</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUseTemplate(template._id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No templates available</p>
              {currentTaskId && (
                <p className="text-sm mt-2">Save this task as a template to reuse it later</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Bug Fix Template, Feature Template"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will save the current task structure (title, description, checklist, tags, etc.) as a reusable template.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Tasks created from this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
