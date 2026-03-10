'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Tag,
  AlertCircle,
  CheckSquare,
  Edit,
  MessageSquare,
  Paperclip,
  Timer,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Link2,
} from 'lucide-react';
import TimeTracker from '@/components/tasks/TimeTracker';
import AttachmentManager from '@/components/tasks/AttachmentManager';
import TagManager from '@/components/tasks/TagManager';
import SubtaskManager from '@/components/tasks/SubtaskManager';
import TaskDependencyManager from '@/components/tasks/TaskDependencyManager';
import { tasksAPI, Task } from '@/lib/api/tasksAPI';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_OPTIONS = ['todo', 'in-progress', 'review', 'completed', 'blocked'] as const;

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'todo':
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [watcherLoading, setWatcherLoading] = useState(false);

  const taskId = params.id as string;

  useEffect(() => {
    if (user?._id) setEmployeeId(user._id);
  }, [user]);

  const refreshTask = async () => {
    try {
      const response = await tasksAPI.getById(taskId);
      setTask(response.data || response);
    } catch (err) {
      console.error('Error refreshing task:', err);
    }
  };

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) { setError('Task ID is missing'); setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const response = await tasksAPI.getById(taskId);
        setTask(response.data || response);
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Task not found' : 'Failed to load task details');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  const handleStatusChange = async (status: string) => {
    if (!task) return;
    setStatusUpdating(true);
    try {
      await tasksAPI.updateStatus(taskId, status, employeeId);
      setTask(prev => prev ? { ...prev, status: status as Task['status'] } : prev);
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !employeeId) return;
    setCommentLoading(true);
    try {
      await tasksAPI.addComment(taskId, newComment.trim(), employeeId);
      setNewComment('');
      await refreshTask();
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleClone = async () => {
    if (!confirm('Clone this task?')) return;
    try {
      const cloned = await tasksAPI.clone(taskId);
      const clonedId = cloned.data?._id || cloned._id;
      if (clonedId) router.push(`/dashboard/tasks/${clonedId}`);
    } catch (err) {
      console.error('Clone error:', err);
      alert('Failed to clone task');
    }
  };

  const handleToggleWatcher = async () => {
    if (!employeeId || !task) return;
    const isWatching = task.watchers?.some(w => w._id === employeeId);
    setWatcherLoading(true);
    try {
      if (isWatching) {
        await tasksAPI.removeWatcher(taskId, employeeId);
      } else {
        await tasksAPI.addWatcher(taskId, employeeId);
      }
      await refreshTask();
    } catch (err) {
      console.error('Watcher error:', err);
    } finally {
      setWatcherLoading(false);
    }
  };

  if (loading) return <PageLoader text="Loading task details..." />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Task not found</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/dashboard/tasks')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const isWatching = task.watchers?.some(w => w._id === employeeId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <h1 className="text-2xl font-bold">Task Details</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleToggleWatcher} variant="outline" size="sm" disabled={watcherLoading}>
            {isWatching ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {isWatching ? 'Unwatch' : 'Watch'}
          </Button>
          <Button onClick={handleClone} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />Clone
          </Button>
          <Button onClick={() => router.push(`/dashboard/tasks/${taskId}/edit`)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />Edit Task
          </Button>
          <Button
            onClick={async () => {
              if (confirm('Are you sure you want to delete this task?')) {
                try {
                  await tasksAPI.delete(taskId);
                  router.push('/dashboard/tasks');
                } catch (err) {
                  alert('Failed to delete task');
                }
              }
            }}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />Delete Task
          </Button>
        </div>
      </div>

      {/* Task Information */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                <Badge className={getPriorityColor(task.priority)}>{task.priority} priority</Badge>
              </div>
            </div>
            {/* Quick status change */}
            <Select value={task.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{task.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {task.project && (
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{task.project.name}</p>
                </div>
              </div>
            )}
            {task.assignedTo && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{task.assignedTo.firstName} {task.assignedTo.lastName}</p>
                </div>
              </div>
            )}
            {task.assignedBy && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned By</p>
                  <p className="font-medium">{task.assignedBy.firstName} {task.assignedBy.lastName}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
            {task.estimatedHours && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Hours</p>
                  <p className="font-medium">{task.estimatedHours}h</p>
                </div>
              </div>
            )}
            {task.actualHours && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Actual Hours</p>
                  <p className="font-medium">{task.actualHours}h</p>
                </div>
              </div>
            )}
          </div>

          {/* Watchers */}
          {task.watchers && task.watchers.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Watchers ({task.watchers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {task.watchers.map(w => (
                    <Badge key={w._id} variant="secondary">{w.firstName} {w.lastName}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Checklist & Subtasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Checklist & Subtasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubtaskManager
            taskId={taskId}
            subtasks={task.subtasks || []}
            checklist={task.checklist || []}
            onUpdate={refreshTask}
          />
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskDependencyManager
            taskId={taskId}
            projectId={task.project?._id}
            dependencies={task.dependencies || []}
            onUpdate={refreshTask}
          />
        </CardContent>
      </Card>

      {/* Time Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeTracker
            taskId={taskId}
            userId={employeeId}
            timeEntries={task.timeEntries}
            onUpdate={refreshTask}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagManager
            taskId={taskId}
            tags={Array.isArray(task.tags) && task.tags.length > 0 && typeof task.tags[0] === 'string'
              ? (task.tags as string[]).map((t: string) => ({ name: t, color: '#3B82F6' }))
              : (task.tags as any)}
            onUpdate={refreshTask}
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentManager
            taskId={taskId}
            userId={employeeId}
            attachments={task.attachments}
            onUpdate={refreshTask}
          />
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments {task.comments?.length > 0 && `(${task.comments.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.comments && task.comments.length > 0 && (
            <div className="space-y-4">
              {task.comments.map((comment, index) => (
                <div key={index} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{comment.user.firstName} {comment.user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={commentLoading || !newComment.trim()}
            >
              {commentLoading ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center pb-4">
        Created: {new Date(task.createdAt).toLocaleString()} | Updated: {new Date(task.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
