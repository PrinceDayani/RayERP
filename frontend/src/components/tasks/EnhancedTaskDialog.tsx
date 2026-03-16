'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { getAllProjects } from '@/lib/api/projectsAPI';
import employeesAPI, { Employee } from '@/lib/api/employeesAPI';
import { tasksAPI, Task } from '@/lib/api/tasksAPI';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, X, Tag, Clock, Paperclip, CheckSquare, Users, 
  Link2, Calendar, AlertCircle, Play, Square
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
}

interface EnhancedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

export default function EnhancedTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  mode,
  onSuccess 
}: EnhancedTaskDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'individual' as 'individual' | 'project',
    assignmentType: 'assigned' as 'assigned' | 'self-assigned',
    project: '',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'todo' as 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked',
    dueDate: '',
    estimatedHours: ''
  });

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
    if (open) {
      fetchData();
      if (task && mode === 'edit') {
        populateFormFromTask(task);
      } else {
        resetForm();
      }
    }
  }, [open, task, mode]);

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

  const populateFormFromTask = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description,
      taskType: (task as any).taskType || 'project',
      assignmentType: (task as any).assignmentType || 'assigned',
      project: typeof task.project === 'object' ? task.project._id : task.project || '',
      assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours?.toString() || ''
    });

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
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      taskType: 'individual',
      assignmentType: 'assigned',
      project: '',
      assignedTo: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
      estimatedHours: ''
    });
    setTags([]);
    setNewTag({ name: '', color: '#3b82f6' });
    setChecklist([]);
    setNewChecklistItem('');
    setWatchers([]);
    setDependencies([]);
    setIsRecurring(false);
    setRecurrencePattern('');
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Task title is required', variant: 'destructive' });
      return;
    }

    if (formData.taskType === 'project' && !formData.project) {
      toast({ title: 'Error', description: 'Project is required for project tasks', variant: 'destructive' });
      return;
    }

    if (!formData.assignedTo) {
      toast({ title: 'Error', description: 'Please assign the task', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const taskData: any = {
        title: formData.title,
        description: formData.description,
        taskType: formData.taskType,
        assignmentType: formData.assignmentType,
        assignedTo: formData.assignedTo,
        assignedBy: user?._id || '',
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0,
        tags: tags,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined
      };

      if (formData.taskType === 'project') {
        taskData.project = formData.project;
      }

      if (mode === 'create') {
        const createdTask = await tasksAPI.create(taskData);
        
        // Add additional features after creation
        if (createdTask._id) {
          await Promise.all([
            ...checklist.map(item => tasksAPI.addChecklistItem(createdTask._id, item.text)),
            ...watchers.map(userId => tasksAPI.addWatcher(createdTask._id, userId)),
            ...dependencies.map(dep => tasksAPI.addDependency(createdTask._id, dep.taskId, dep.type))
          ]);
        }

        toast({ title: 'Success', description: 'Task created successfully' });
      } else {
        await tasksAPI.update(task!._id, { ...taskData, updatedBy: user?._id });
        toast({ title: 'Success', description: 'Task updated successfully' });
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to save task', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (!newTag.name.trim()) return;
    if (tags.some(t => t.name.toLowerCase() === newTag.name.toLowerCase())) {
      toast({ title: 'Error', description: 'Tag already exists', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Dependency already exists', variant: 'destructive' });
      return;
    }
    setDependencies([...dependencies, { taskId, type }]);
  };

  const removeDependency = (taskId: string) => {
    setDependencies(dependencies.filter(d => d.taskId !== taskId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Task' : 'Edit Task'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Task Type *</Label>
                  <Select 
                    value={formData.taskType} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, taskType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Task</SelectItem>
                      <SelectItem value="project">Project Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Assignment Type *</Label>
                  <Select 
                    value={formData.assignmentType} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, assignmentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">Assigned by Manager</SelectItem>
                      <SelectItem value="self-assigned">Self-Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>

                {formData.taskType === 'project' && (
                  <div className="col-span-2">
                    <Label>Project *</Label>
                    <Select 
                      value={formData.project} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))}
                    >
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
                )}

                <div>
                  <Label>Assigned To *</Label>
                  <Select 
                    value={formData.assignedTo} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                  >
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

                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
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
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    placeholder="0"
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
                    <Badge 
                      key={index} 
                      style={{ backgroundColor: tag.color }}
                      className="text-white"
                    >
                      {tag.name}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeTag(tag.name)}
                      />
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
                  <Checkbox
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                  <span className="text-sm">Enable recurring task</span>
                </div>
                {isRecurring && (
                  <Select 
                    value={recurrencePattern} 
                    onValueChange={setRecurrencePattern}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
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
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleChecklistItem(index)}
                      />
                      <span className={item.completed ? 'line-through text-gray-500' : ''}>
                        {item.text}
                      </span>
                      <X 
                        className="h-4 w-4 ml-auto cursor-pointer text-red-500" 
                        onClick={() => removeChecklistItem(index)}
                      />
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

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4" />
                  Task Dependencies
                </Label>
                <div className="space-y-2">
                  {dependencies.map((dep, index) => {
                    const depTask = allTasks.find(t => t._id === dep.taskId);
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1">{depTask?.title || 'Unknown Task'}</span>
                        <Badge variant="outline">{dep.type}</Badge>
                        <X 
                          className="h-4 w-4 cursor-pointer text-red-500" 
                          onClick={() => removeDependency(dep.taskId)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
