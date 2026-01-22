'use client';

import { useState, useEffect } from 'react';
import { PageLoader } from '@/components/PageLoader';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import tasksAPI from '@/lib/api/tasksAPI';

export default function TaskTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', estimatedHours: 0 });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await tasksAPI.getTaskTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await tasksAPI.update(editingTemplate._id, { ...formData, priority: formData.priority as 'low' | 'medium' | 'high' | 'critical' });
      } else {
        await tasksAPI.create({ ...formData, isTemplate: true, templateName: formData.title } as any);
      }
      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ title: '', description: '', priority: 'medium', estimatedHours: 0 });
      fetchTemplates();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await tasksAPI.delete(id);
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({ title: template.title, description: template.description, priority: template.priority, estimatedHours: template.estimatedHours });
    setIsDialogOpen(true);
  };

  const handleUseTemplate = async (templateId: string) => {
    router.push(`/dashboard/tasks/create?templateId=${templateId}`);
  };

  if (loading) return <PageLoader text="Loading task templates..." />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Templates</h1>
          <p className="text-gray-600">Create reusable task templates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); setFormData({ title: '', description: '', priority: 'medium', estimatedHours: 0 }); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Hours</Label>
                <Input type="number" value={formData.estimatedHours} onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })} />
              </div>
              <Button onClick={handleSave} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template._id}>
            <CardHeader>
              <CardTitle className="text-lg">{template.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleUseTemplate(template._id)}>
                  <Copy className="w-4 h-4 mr-1" />
                  Use
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(template._id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
