'use client';

import { useState, useEffect } from 'react';
import { Save, X, Calendar, User, Flag, Clock, Repeat, Link2, CheckSquare, Paperclip, Tag as TagIcon, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import tasksAPI from '@/lib/api/tasksAPI';
import TimeTracker from './TimeTracker';
import AttachmentManager from './AttachmentManager';
import TagManager from './TagManager';
import SubtaskManager from './SubtaskManager';
import MentionComment from './MentionComment';
import CustomFieldsManager from './CustomFieldsManager';
import RecurringTaskSetup from './RecurringTaskSetup';
import TaskPriorityIndicator from './TaskPriorityIndicator';
import TaskDependencyManager from './TaskDependencyManager';

interface TaskEditorProps {
  taskId?: string;
  projectId?: string;
  onSave?: (task: any) => void;
  onCancel?: () => void;
}

export default function TaskEditor({ taskId, projectId, onSave, onCancel }: TaskEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    estimatedHours: 0,
    assignedTo: '',
    assignedBy: '',
    project: projectId || ''
  });

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const data = await tasksAPI.getById(taskId);
      setTask(data);
      setFormData({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: data.estimatedHours || 0,
        assignedTo: data.assignedTo?._id || '',
        assignedBy: data.assignedBy?._id || '',
        project: data.project?._id || projectId || ''
      });
    } catch (error) {
      console.error('Fetch task error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let savedTask;
      if (taskId) {
        const updateData = {
          title: formData.title,
          description: formData.description,
          status: formData.status as 'todo' | 'in-progress' | 'review' | 'completed',
          priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
          dueDate: formData.dueDate,
          estimatedHours: formData.estimatedHours,
          assignedTo: formData.assignedTo,
          assignedBy: formData.assignedBy,
          project: formData.project
        };
        savedTask = await tasksAPI.update(taskId, updateData);
      } else {
        savedTask = await tasksAPI.create(formData as any);
      }
      onSave?.(savedTask);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{taskId ? 'Edit Task' : 'Create Task'}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title *</label>
            <Input
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description *</label>
            <Textarea
              placeholder="Task description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
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
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
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
          </div>

          {/* Due Date & Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Calendar className="w-4 h-4 inline mr-2" />
                Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                <Clock className="w-4 h-4 inline mr-2" />
                Estimated Hours
              </label>
              <Input
                type="number"
                min="0"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Priority Indicator */}
          {formData.priority && (
            <div>
              <label className="text-sm font-medium mb-2 block">Priority Preview</label>
              <TaskPriorityIndicator priority={formData.priority as any} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Features (Only for existing tasks) */}
      {taskId && task && (
        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="time">
              <Clock className="w-4 h-4 mr-2" />
              Time
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Subtasks
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="w-4 h-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="tags">
              <TagIcon className="w-4 h-4 mr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Plus className="w-4 h-4 mr-2" />
              Custom
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <Repeat className="w-4 h-4 mr-2" />
              Recurring
            </TabsTrigger>
            <TabsTrigger value="dependencies">
              <Link2 className="w-4 h-4 mr-2" />
              Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time">
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeTracker
                  taskId={taskId}
                  userId={formData.assignedTo}
                  timeEntries={task.timeEntries}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subtasks">
            <Card>
              <CardHeader>
                <CardTitle>Subtasks & Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <SubtaskManager
                  taskId={taskId}
                  subtasks={task.subtasks}
                  checklist={task.checklist}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle>File Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentManager
                  taskId={taskId}
                  userId={formData.assignedTo}
                  attachments={task.attachments}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <Card>
              <CardHeader>
                <CardTitle>Tags & Labels</CardTitle>
              </CardHeader>
              <CardContent>
                <TagManager
                  taskId={taskId}
                  tags={task.tags}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comments & Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                <MentionComment
                  taskId={taskId}
                  userId={formData.assignedTo}
                  onCommentAdded={fetchTask}
                />
                {/* Existing Comments */}
                {task.comments?.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium">Previous Comments</h4>
                    {task.comments.map((comment: any, i: number) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium">{comment.user?.firstName} {comment.user?.lastName}</div>
                        <div className="text-sm text-muted-foreground mt-1">{comment.comment}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomFieldsManager
                  taskId={taskId}
                  customFields={task.customFields}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring">
            <Card>
              <CardHeader>
                <CardTitle>Recurring Task Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <RecurringTaskSetup
                  taskId={taskId}
                  isRecurring={task.isRecurring}
                  pattern={task.recurrencePattern}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies">
            <Card>
              <CardHeader>
                <CardTitle>Task Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskDependencyManager
                  taskId={taskId}
                  projectId={formData.project}
                  dependencies={task.dependencies}
                  onUpdate={fetchTask}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
