"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FileText, AlertTriangle, CheckCircle, Clock, Target } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Instruction {
  _id?: string;
  title: string;
  content: string;
  type: 'general' | 'task' | 'milestone' | 'safety' | 'quality';
  priority: 'low' | 'medium' | 'high';
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectInstructionsProps {
  projectId: string;
  instructions: Instruction[];
  onInstructionsUpdate: (instructions: Instruction[]) => void;
  canEdit?: boolean;
}

const ProjectInstructions: React.FC<ProjectInstructionsProps> = ({
  projectId,
  instructions,
  onInstructionsUpdate,
  canEdit = true
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [formData, setFormData] = useState<Instruction>({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium'
    });
    setEditingInstruction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const url = editingInstruction 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/instructions/${editingInstruction._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/instructions`;
      
      const method = editingInstruction ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save instruction');
      }

      const result = await response.json();
      
      if (editingInstruction) {
        const updatedInstructions = instructions.map(inst => 
          inst._id === editingInstruction._id ? result.instruction : inst
        );
        onInstructionsUpdate(updatedInstructions);
        toast({
          title: "Success",
          description: "Instruction updated successfully"
        });
      } else {
        onInstructionsUpdate([...instructions, result.instruction]);
        toast({
          title: "Success",
          description: "Instruction added successfully"
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving instruction:', error);
      toast({
        title: "Error",
        description: "Failed to save instruction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (instruction: Instruction) => {
    setEditingInstruction(instruction);
    setFormData({
      title: instruction.title,
      content: instruction.content,
      type: instruction.type,
      priority: instruction.priority
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (instructionId: string) => {
    if (!confirm('Are you sure you want to delete this instruction?')) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/instructions/${instructionId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete instruction');
      }

      const updatedInstructions = instructions.filter(inst => inst._id !== instructionId);
      onInstructionsUpdate(updatedInstructions);
      
      toast({
        title: "Success",
        description: "Instruction deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting instruction:', error);
      toast({
        title: "Error",
        description: "Failed to delete instruction",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'general': FileText,
      'task': CheckCircle,
      'milestone': Target,
      'safety': AlertTriangle,
      'quality': Clock
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'general': 'bg-blue-100 text-blue-700',
      'task': 'bg-green-100 text-green-700',
      'milestone': 'bg-purple-100 text-purple-700',
      'safety': 'bg-red-100 text-red-700',
      'quality': 'bg-yellow-100 text-yellow-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const filteredInstructions = instructions.filter(instruction => 
    filter === 'all' || instruction.type === filter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Project Instructions</h3>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Instruction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInstruction ? 'Edit Instruction' : 'Add New Instruction'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter instruction title"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter detailed instruction content"
                    rows={6}
                    required
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingInstruction ? 'Update' : 'Add')} Instruction
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filteredInstructions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Instructions</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? 'No instructions have been added to this project yet.'
                : `No ${filter} instructions found.`
              }
            </p>
            {canEdit && filter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Instruction
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInstructions.map((instruction) => (
            <Card key={instruction._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getTypeIcon(instruction.type)}
                    <CardTitle className="text-base line-clamp-1">
                      {instruction.title}
                    </CardTitle>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(instruction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(instruction._id!)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className={getTypeColor(instruction.type)}>
                    {instruction.type}
                  </Badge>
                  <Badge className={getPriorityColor(instruction.priority)}>
                    {instruction.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {instruction.content}
                </p>
                {instruction.createdAt && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                    Created {new Date(instruction.createdAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectInstructions;