"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createProjectTask } from '@/lib/api/projectsAPI';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
}

interface ProjectTaskCreatorProps {
  projectId: string;
  projectName: string;
  onTaskCreated: (task: any) => void;
}

export default function ProjectTaskCreator({ projectId, projectName, onTaskCreated }: ProjectTaskCreatorProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskData.title || !taskData.assignedTo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const newTaskData = {
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours ? parseFloat(taskData.estimatedHours) : 0,
        assignedBy: user?._id || '',
        status: 'todo' as const
      };

      const createdTask = await createProjectTask(projectId, newTaskData as any);
      
      onTaskCreated(createdTask);
      
      setIsOpen(false);
      setTaskData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: '',
        estimatedHours: ''
      });
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task for {projectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="assignedTo">Assign To *</Label>
            <Select onValueChange={(value) => setTaskData(prev => ({ ...prev, assignedTo: value }))} value={taskData.assignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee._id} value={employee._id}>
                    {`${employee.firstName} ${employee.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(value) => setTaskData(prev => ({ ...prev, priority: value }))} value={taskData.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estimatedHours">Est. Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                value={taskData.estimatedHours}
                onChange={(e) => setTaskData(prev => ({ ...prev, estimatedHours: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={taskData.dueDate}
              onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
