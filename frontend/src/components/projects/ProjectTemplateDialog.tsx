//path: frontend/src/components/projects/ProjectTemplateDialog.tsx

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectTemplateAPI } from '@/lib/api/projectTemplateAPI';
import { toast } from '@/hooks/use-toast';

interface ProjectTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProjectTemplateDialog({ open, onClose, onSuccess }: ProjectTemplateDialogProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    manager: '',
    team: [],
    members: []
  });

  useEffect(() => {
    if (open) loadTemplates();
  }, [open]);

  const loadTemplates = async () => {
    try {
      const data = await projectTemplateAPI.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast({ title: 'Error loading templates', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectTemplateAPI.createProjectFromTemplate(selectedTemplate, formData);
      toast({ title: 'Project created from template' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Error creating project', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project from Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Project Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
          </div>
          <div>
            <Label>Manager ID</Label>
            <Input value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} required />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!selectedTemplate}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
