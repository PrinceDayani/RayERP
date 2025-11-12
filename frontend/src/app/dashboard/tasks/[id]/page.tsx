'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Tag, 
  AlertCircle,
  CheckSquare,
  Edit,
  MessageSquare
} from 'lucide-react';
import { tasksAPI, Task } from '@/lib/api/tasksAPI';
import { useAuth } from '@/contexts/AuthContext';

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

  const taskId = params.id as string;

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError('Task ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await tasksAPI.getById(taskId);
        // Handle different response formats
        const taskData = response.data || response;
        setTask(taskData);
      } catch (err: any) {
        console.error('Error fetching task:', err);
        if (err.response?.status === 404) {
          setError('Task not found');
        } else {
          setError('Failed to load task details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Task Details</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push(`/dashboard/tasks/${taskId}/edit`)}
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
        </div>
      </div>

      {/* Task Information */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
              </div>
            </div>
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{task.description}</p>
          </div>

          <Separator />

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project */}
            {task.project && (
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{task.project.name}</p>
                </div>
              </div>
            )}

            {/* Assigned To */}
            {task.assignedTo && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </p>
                </div>
              </div>
            )}

            {/* Assigned By */}
            {task.assignedBy && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned By</p>
                  <p className="font-medium">
                    {task.assignedBy.firstName} {task.assignedBy.lastName}
                  </p>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Hours</p>
                  <p className="font-medium">{task.estimatedHours}h</p>
                </div>
              </div>
            )}

            {/* Actual Hours */}
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

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      {task.comments && task.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({task.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.comments.map((comment, index) => (
                <div key={index} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {comment.user.firstName} {comment.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}