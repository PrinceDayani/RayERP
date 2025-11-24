'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { getAllProjects } from '@/lib/api/projectsAPI';
import employeesAPI, { Employee } from '@/lib/api/employeesAPI';
import { Task } from '@/lib/api/tasksAPI';

interface Project {
  _id: string;
  name: string;
}

interface TaskDialogsProps {
  createDialog: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
  editDialog: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
  };
  commentDialog: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
  };
}

export default function TaskDialogs({ createDialog, editDialog, commentDialog }: TaskDialogsProps) {
  const { user } = useAuth();
  const { actions } = useTaskContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: ''
  });
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editDialog.task) {
      setFormData({
        title: editDialog.task.title,
        description: editDialog.task.description,
        project: typeof editDialog.task.project === 'object' ? editDialog.task.project._id : editDialog.task.project,
        priority: editDialog.task.priority,
        dueDate: editDialog.task.dueDate ? new Date(editDialog.task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: editDialog.task.estimatedHours?.toString() || ''
      });
      setSelectedAssignees([
        typeof editDialog.task.assignedTo === 'object' ? editDialog.task.assignedTo._id : editDialog.task.assignedTo
      ]);
    }
  }, [editDialog.task]);

  const fetchData = async () => {
    try {
      const [projectsData, employeesData] = await Promise.all([
        getAllProjects(),
        employeesAPI.getAll()
      ]);
      setProjects(projectsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project: '',
      priority: 'medium',
      dueDate: '',
      estimatedHours: ''
    });
    setSelectedAssignees([]);
    setNewComment('');
  };

  const toggleAssignee = (employeeId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project || selectedAssignees.length === 0 || !formData.title) {
      alert('Please fill in all required fields and select at least one assignee');
      return;
    }

    setLoading(true);
    try {
      await actions.createTask({
        title: formData.title,
        description: formData.description,
        project: formData.project,
        assignedTo: selectedAssignees[0],
        assignedBy: user?._id || '',
        priority: formData.priority,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0
      });
      
      createDialog.onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog.task) return;

    setLoading(true);
    try {
      await actions.updateTask(editDialog.task._id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0
      });

      editDialog.onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentDialog.task || !newComment.trim() || !user?._id) return;

    setLoading(true);
    try {
      // This would need to be implemented in the task API
      // await tasksAPI.addComment(commentDialog.task._id, newComment, user._id);
      
      setNewComment('');
      commentDialog.onOpenChange(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Create Task Dialog */}
      <Dialog open={createDialog.open} onOpenChange={createDialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
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
            
            <div>
              <Label htmlFor="project">Project *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))} value={formData.project}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Assign To (Select Multiple) *</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <div key={employee._id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedAssignees.includes(employee._id)}
                        onCheckedChange={() => toggleAssignee(employee._id)}
                      />
                      <label className="text-sm cursor-pointer" onClick={() => toggleAssignee(employee._id)}>
                        {`${employee.firstName} ${employee.lastName}`}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No employees available</p>
                )}
              </div>
              {selectedAssignees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedAssignees.map(id => {
                    const emp = employees.find(e => e._id === id);
                    return emp ? (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {`${emp.firstName} ${emp.lastName}`}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))} value={formData.priority}>
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
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => createDialog.onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialog.open} onOpenChange={editDialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTask} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))} value={formData.priority}>
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
                <Label htmlFor="edit-estimatedHours">Est. Hours</Label>
                <Input
                  id="edit-estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => editDialog.onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialog.open} onOpenChange={commentDialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {commentDialog.task && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium text-sm">{commentDialog.task.title}</p>
                <p className="text-xs text-gray-600 mt-1">{commentDialog.task.description}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="comment">Your Comment</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                placeholder="Write your comment here..."
              />
            </div>
            
            {commentDialog.task?.comments && commentDialog.task.comments.length > 0 && (
              <div>
                <Label className="text-xs text-gray-600">Previous Comments ({commentDialog.task.comments.length})</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {commentDialog.task.comments.slice(-3).reverse().map((comment: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                      <p className="font-medium">{comment.user?.firstName || 'User'} {comment.user?.lastName || ''}</p>
                      <p className="text-gray-600">{comment.comment || comment.text}</p>
                      <p className="text-gray-400 text-xs mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => commentDialog.onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                {loading ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}