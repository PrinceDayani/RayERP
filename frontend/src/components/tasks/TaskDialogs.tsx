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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { getAllProjects } from '@/lib/api/projectsAPI';
import employeesAPI, { Employee } from '@/lib/api/employeesAPI';
import { tasksAPI, Task } from '@/lib/api/tasksAPI';
import { Plus, X, Tag, CheckSquare, Users, Link2, Square } from 'lucide-react';

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
    taskType: 'individual' as 'individual' | 'project',
    assignmentType: 'assigned' as 'assigned' | 'self-assigned',
    project: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedHours: ''
  });
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  // Feature states
  const [tags, setTags] = useState<{ name: string; color: string }[]>([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });
  const [checklist, setChecklist] = useState<{ text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [watchers, setWatchers] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<{ taskId: string; type: string }[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editDialog.task) {
      const task = editDialog.task;
      setFormData({
        title: task.title,
        description: task.description,
        taskType: (task as any).taskType || 'project',
        assignmentType: (task as any).assignmentType || 'assigned',
        project: typeof task.project === 'object' ? task.project._id : task.project || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours?.toString() || ''
      });
      setSelectedAssignees([
        typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo
      ]);
      
      if (task.tags && Array.isArray(task.tags)) {
        setTags(task.tags.map(t => typeof t === 'object' ? t : { name: t, color: '#3b82f6' }));
      }
      if (task.checklist) {
        setChecklist(task.checklist.map(c => ({ text: c.text, completed: c.completed })));
      }
      if (task.watchers) {
        setWatchers(task.watchers.map(w => typeof w === 'object' ? w._id : w));
      }
      if (task.dependencies) {
        setDependencies(task.dependencies.map(d => ({
          taskId: typeof d.taskId === 'object' ? d.taskId._id : d.taskId,
          type: d.type
        })));
      }
      setIsRecurring(task.isRecurring || false);
      setRecurrencePattern(task.recurrencePattern || '');
    }
  }, [editDialog.task]);

  const fetchData = async () => {
    try {
      const [projectsData, employeesData, tasksData] = await Promise.all([
        getAllProjects(),
        employeesAPI.getAll(),
        tasksAPI.getAll()
      ]);
      setProjects(projectsData || []);
      setEmployees(employeesData || []);
      setAllTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      taskType: 'individual',
      assignmentType: 'assigned',
      project: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      estimatedHours: ''
    });
    setSelectedAssignees([]);
    setNewComment('');
    setTags([]);
    setNewTag({ name: '', color: '#3b82f6' });
    setChecklist([]);
    setNewChecklistItem('');
    setWatchers([]);
    setDependencies([]);
    setIsRecurring(false);
    setRecurrencePattern('');
  };

  const toggleAssignee = (employeeId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };
  
  const addTag = () => {
    if (!newTag.name.trim()) return;
    if (tags.some(t => t.name.toLowerCase() === newTag.name.toLowerCase())) {
      alert('Tag already exists');
      return;
    }
    setTags([...tags, { ...newTag }]);
    setNewTag({ name: '', color: '#3b82f6' });
  };

  const removeTag = (name: string) => {
    setTags(tags.filter(t => t.name !== name));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, { text: newChecklistItem, completed: false }]);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setChecklist(updated);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const toggleWatcher = (userId: string) => {
    setWatchers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const addDependency = (taskId: string, type: string) => {
    if (dependencies.some(d => d.taskId === taskId)) {
      alert('Dependency already exists');
      return;
    }
    setDependencies([...dependencies, { taskId, type }]);
  };

  const removeDependency = (taskId: string) => {
    setDependencies(dependencies.filter(d => d.taskId !== taskId));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Task title is required');
      return;
    }
    
    if (formData.taskType === 'project' && !formData.project) {
      alert('Project is required for project tasks');
      return;
    }
    
    if (selectedAssignees.length === 0) {
      alert('Please assign the task');
      return;
    }

    setLoading(true);
    try {
      const taskData: any = {
        title: formData.title,
        description: formData.description,
        taskType: formData.taskType,
        assignmentType: formData.assignmentType,
        assignedTo: selectedAssignees[0],
        assignedBy: user?._id || '',
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0,
        tags: tags,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined
      };
      
      if (formData.taskType === 'project') {
        taskData.project = formData.project;
      }
      
      const createdTask = await tasksAPI.create(taskData);
      
      // Add additional features
      if (createdTask._id) {
        await Promise.all([
          ...checklist.map(item => tasksAPI.addChecklistItem(createdTask._id, item.text)),
          ...watchers.map(userId => tasksAPI.addWatcher(createdTask._id, userId)),
          ...dependencies.map(dep => tasksAPI.addDependency(createdTask._id, dep.taskId, dep.type))
        ]);
      }
      
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
      await tasksAPI.addComment(commentDialog.task._id, newComment, user._id);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 pr-4">
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Task Type *</Label>
                    <Select value={formData.taskType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, taskType: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Task</SelectItem>
                        <SelectItem value="project">Project Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Assignment Type *</Label>
                    <Select value={formData.assignmentType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, assignmentType: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assigned">Assigned by Manager</SelectItem>
                        <SelectItem value="self-assigned">Self-Assigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
            
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  {formData.taskType === 'project' && (
                    <div className="col-span-2">
                      <Label htmlFor="project">Project *</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))} value={formData.project}>
                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
            
                  <div className="col-span-2">
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
            
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))} value={formData.priority}>
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
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))} value={formData.status}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
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
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag.name}
                      onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tag name"
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={newTag.color}
                      onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                      className="w-20"
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} style={{ backgroundColor: tag.color }} className="text-white">
                        {tag.name}
                        <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag.name)} />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Square className="h-4 w-4" />
                    Recurring Task
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(checked as boolean)} />
                    <span className="text-sm">Enable recurring task</span>
                  </div>
                  {isRecurring && (
                    <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                      <SelectTrigger><SelectValue placeholder="Select pattern" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="checklist" className="space-y-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4" />
                    Checklist Items
                  </Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add checklist item"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    />
                    <Button type="button" onClick={addChecklistItem} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Checkbox checked={item.completed} onCheckedChange={() => toggleChecklistItem(index)} />
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>{item.text}</span>
                        <X className="h-4 w-4 ml-auto cursor-pointer text-red-500" onClick={() => removeChecklistItem(index)} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="team" className="space-y-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    Watchers
                  </Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {employees.map((employee) => (
                      <div key={employee._id} className="flex items-center gap-2 p-2 border rounded">
                        <Checkbox
                          checked={watchers.includes(employee._id)}
                          onCheckedChange={() => toggleWatcher(employee._id)}
                        />
                        <span>{`${employee.firstName} ${employee.lastName}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => createDialog.onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
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
