//path: frontend/src/components/projects/CloneProjectDialog.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { projectTemplateAPI } from '@/lib/api/projectTemplateAPI';
import { toast } from '@/hooks/use-toast';

interface CloneProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export default function CloneProjectDialog({ open, onClose, projectId, projectName, onSuccess }: CloneProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: `${projectName} (Copy)`,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectTemplateAPI.cloneProject(projectId, formData);
      toast({ title: 'Project cloned successfully' });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Error cloning project', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>New Project Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Clone Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
