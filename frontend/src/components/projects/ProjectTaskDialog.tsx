"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Tag, CheckSquare, Users, Clock, Paperclip, Settings, Link2, MessageSquare, Upload, Play, Square as StopIcon, Download, FileText } from 'lucide-react';
import employeesAPI, { Employee } from '@/lib/api/employeesAPI';
import { tasksAPI } from '@/lib/api/tasksAPI';

interface ProjectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
  projectId: string;
  onSave: (taskData: any) => Promise<void>;
}

export default function ProjectTaskDialog({ open, onOpenChange, task, projectId, onSave }: ProjectTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    assignmentType: 'assigned' as 'assigned' | 'self-assigned',
    assignedTo: '',
    blockedBy: '',
    parentTask: ''
  });

  const [tags, setTags] = useState<{ name: string; color: string }[]>([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });
  const [checklist, setChecklist] = useState<{ text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [watchers, setWatchers] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newCustomField, setNewCustomField] = useState({ fieldName: '', fieldType: 'text', value: '' });
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [newDependency, setNewDependency] = useState({ taskId: '', type: 'finish-to-start' });
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchTasks();
    }
  }, [open]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours?.toString() || '',
        assignmentType: task.assignmentType || 'assigned',
        assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo || '',
        blockedBy: task.blockedBy || '',
        parentTask: typeof task.parentTask === 'object' ? task.parentTask._id : task.parentTask || ''
      });
      setTags(task.tags || []);
      setChecklist(task.checklist || []);
      setWatchers(task.watchers?.map((w: any) => typeof w === 'object' ? w._id : w) || []);
      setComments(task.comments || []);
      setTimeEntries(task.timeEntries || []);
      setActiveTimer(task.timeEntries?.find((e: any) => !e.endTime) || null);
      setAttachments(task.attachments || []);
      setCustomFields(task.customFields || []);
      setDependencies(task.dependencies || []);
      setSubtasks(task.subtasks || []);
      setIsRecurring(task.isRecurring || false);
      setRecurrencePattern(task.recurrencePattern || '');
      setIsTemplate(task.isTemplate || false);
      setTemplateName(task.templateName || '');
    } else {
      resetForm();
    }
  }, [task]);

  const fetchEmployees = async () => {
    try {
      const data = await employeesAPI.getAll();
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await tasksAPI.getAll();
      setAllTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      estimatedHours: '',
      assignmentType: 'assigned',
      assignedTo: '',
      blockedBy: '',
      parentTask: ''
    });
    setTags([]);
    setNewTag({ name: '', color: '#3b82f6' });
    setChecklist([]);
    setNewChecklistItem('');
    setWatchers([]);
    setComments([]);
    setNewComment('');
    setTimeEntries([]);
    setActiveTimer(null);
    setAttachments([]);
    setCustomFields([]);
    setNewCustomField({ fieldName: '', fieldType: 'text', value: '' });
    setDependencies([]);
    setNewDependency({ taskId: '', type: 'finish-to-start' });
    setSubtasks([]);
    setIsRecurring(false);
    setRecurrencePattern('');
    setIsTemplate(false);
    setTemplateName('');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const taskData: any = {
        ...formData,
        taskType: 'project',
        project: projectId,
        tags,
        checklist,
        watchers,
        customFields,
        dependencies,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        isTemplate,
        templateName: isTemplate ? templateName : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0,
        parentTask: formData.parentTask || undefined,
        blockedBy: formData.blockedBy || undefined
      };
      
      await onSave(taskData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (!newTag.name.trim()) return;
    if (tags.some(t => t.name.toLowerCase() === newTag.name.toLowerCase())) return;
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?._id) return;
    try {
      await tasksAPI.addComment(task._id, newComment, formData.assignedTo);
      setComments([...comments, { comment: newComment, createdAt: new Date(), user: { firstName: 'You' } }]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleStartTimer = async () => {
    if (!task?._id) return;
    try {
      await tasksAPI.startTimer(task._id, formData.assignedTo);
      const newEntry = { startTime: new Date(), endTime: null, duration: 0, user: formData.assignedTo };
      setTimeEntries([...timeEntries, newEntry]);
      setActiveTimer(newEntry);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStopTimer = async () => {
    if (!task?._id || !activeTimer) return;
    try {
      await tasksAPI.stopTimer(task._id, formData.assignedTo);
      setActiveTimer(null);
      // Refresh time entries
      const updatedTask = await tasksAPI.getById(task._id);
      setTimeEntries(updatedTask.timeEntries || []);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !task?._id) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await tasksAPI.uploadAttachment(task._id, formData);
      // Refresh attachments
      const updatedTask = await tasksAPI.getById(task._id);
      setAttachments(updatedTask.attachments || []);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task?._id) return;
    try {
      await tasksAPI.deleteAttachment(task._id, attachmentId);
      setAttachments(attachments.filter(a => a._id !== attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const addCustomField = () => {
    if (!newCustomField.fieldName.trim()) return;
    setCustomFields([...customFields, { ...newCustomField }]);
    setNewCustomField({ fieldName: '', fieldType: 'text', value: '' });
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const addDependency = () => {
    if (!newDependency.taskId) return;
    if (dependencies.some(d => d.taskId === newDependency.taskId)) return;
    setDependencies([...dependencies, { ...newDependency }]);
    setNewDependency({ taskId: '', type: 'finish-to-start' });
  };

  const removeDependency = (taskId: string) => {
    setDependencies(dependencies.filter(d => d.taskId !== taskId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Assignment Type</Label>
                <Select value={formData.assignmentType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, assignmentType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned by Manager</SelectItem>
                    <SelectItem value="self-assigned">Self-Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign To</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  />
                </div>
              </div>

              <div>
                <Label>Parent Task (Optional)</Label>
                <Select value={formData.parentTask} onValueChange={(value) => setFormData(prev => ({ ...prev, parentTask: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select parent task" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {allTasks.filter(t => t._id !== task?._id && t.project === projectId).map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'blocked' && (
                <div>
                  <Label>Blocked By (Reason)</Label>
                  <Input
                    value={formData.blockedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, blockedBy: e.target.value }))}
                    placeholder="Reason for blocking"
                  />
                </div>
              )}
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
                  <Settings className="h-4 w-4" />
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

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Template
                </Label>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox checked={isTemplate} onCheckedChange={(checked) => setIsTemplate(checked as boolean)} />
                  <span className="text-sm">Save as template</span>
                </div>
                {isTemplate && (
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name"
                  />
                )}
              </div>

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

            <TabsContent value="time" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Time Tracking
                </Label>
                {task && (
                  <div className="space-y-3">
                    {activeTimer ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700">Timer Running</span>
                          <Button size="sm" variant="destructive" onClick={handleStopTimer}>
                            <StopIcon className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Started: {new Date(activeTimer.startTime).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <Button onClick={handleStartTimer} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </Button>
                    )}
                    
                    {timeEntries.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Time Entries</Label>
                        {timeEntries.map((entry: any, index: number) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="flex justify-between text-sm">
                              <span>{new Date(entry.startTime).toLocaleString()}</span>
                              <span className="font-medium">{entry.duration}m</span>
                            </div>
                            {entry.description && (
                              <p className="text-xs text-gray-600 mt-1">{entry.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!task && (
                  <p className="text-sm text-gray-500">Save task first to enable time tracking</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </Label>
                {task ? (
                  <div className="space-y-3">
                    <div>
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="cursor-pointer"
                      />
                      {uploadingFile && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                    </div>
                    
                    {attachments.length > 0 ? (
                      <div className="space-y-2">
                        {attachments.map((file: any, index: number) => (
                          <div key={index} className="p-3 border rounded flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{file.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => window.open(file.url, '_blank')}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteAttachment(file._id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No attachments</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Save task first to upload files</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </Label>
                {task ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        className="flex-1"
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {comments.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {comments.map((comment: any, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <p className="font-medium">{comment.user?.firstName || 'User'}</p>
                            <p className="text-gray-600">{comment.comment}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No comments yet</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Save task first to add comments</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4" />
                  Custom Fields
                </Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={newCustomField.fieldName}
                      onChange={(e) => setNewCustomField(prev => ({ ...prev, fieldName: e.target.value }))}
                      placeholder="Field name"
                    />
                    <Select value={newCustomField.fieldType} onValueChange={(value) => setNewCustomField(prev => ({ ...prev, fieldType: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addCustomField} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {customFields.length > 0 && (
                    <div className="space-y-2">
                      {customFields.map((field: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{field.fieldName}</p>
                            <p className="text-xs text-gray-500">{field.fieldType}</p>
                          </div>
                          <X className="h-4 w-4 cursor-pointer text-red-500" onClick={() => removeCustomField(index)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4" />
                  Dependencies
                </Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={newDependency.taskId} onValueChange={(value) => setNewDependency(prev => ({ ...prev, taskId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                      <SelectContent>
                        {allTasks.filter(t => t._id !== task?._id && t.project === projectId).map((t) => (
                          <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Select value={newDependency.type} onValueChange={(value) => setNewDependency(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="finish-to-start">Finish-to-Start</SelectItem>
                          <SelectItem value="start-to-start">Start-to-Start</SelectItem>
                          <SelectItem value="finish-to-finish">Finish-to-Finish</SelectItem>
                          <SelectItem value="start-to-finish">Start-to-Finish</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addDependency} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {dependencies.length > 0 && (
                    <div className="space-y-2">
                      {dependencies.map((dep: any, index: number) => {
                        const depTask = allTasks.find(t => t._id === dep.taskId);
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{depTask?.title || 'Unknown Task'}</p>
                              <p className="text-xs text-gray-500">{dep.type}</p>
                            </div>
                            <X className="h-4 w-4 cursor-pointer text-red-500" onClick={() => removeDependency(dep.taskId)} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4" />
                  Subtasks ({subtasks.length})
                </Label>
                {subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {subtasks.map((subtask: any, index: number) => (
                      <div key={index} className="p-2 border rounded">
                        <p className="text-sm font-medium">{typeof subtask === 'object' ? subtask.title : 'Subtask'}</p>
                        <p className="text-xs text-gray-500">{typeof subtask === 'object' ? subtask.status : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No subtasks</p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
