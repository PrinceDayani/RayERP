'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, tasksAPI } from '@/lib/api/tasksAPI';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import {
  Calendar, Clock, User, Tag, CheckSquare, Paperclip,
  Users, Link2, Play, Square, MessageSquare, Activity,
  Upload, Download, X, Plus, Edit
} from 'lucide-react';

interface TaskDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onRefresh?: () => void;
}

export default function TaskDetailView({
  open,
  onOpenChange,
  task,
  onEdit,
  onRefresh
}: TaskDetailViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (open && task) {
      fetchTimeline();
      checkTimerStatus();
    }
  }, [open, task]);

  const fetchTimeline = async () => {
    if (!task) return;
    try {
      const data = await tasksAPI.getTimeline(task._id);
      setTimeline(data);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const checkTimerStatus = () => {
    if (!task?.timeEntries) return;
    const activeEntry = task.timeEntries.find(
      e => e.user === user?._id && !e.endTime
    );
    setIsTimerRunning(!!activeEntry);
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    setLoading(true);
    try {
      await tasksAPI.addComment(task._id, newComment, user?._id || '');
      setNewComment('');
      toast({ title: 'Comment added' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!task) return;
    try {
      await tasksAPI.startTimer(task._id, user?._id || '');
      setIsTimerRunning(true);
      toast({ title: 'Timer started' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start timer', variant: 'destructive' });
    }
  };

  const handleStopTimer = async () => {
    if (!task) return;
    try {
      await tasksAPI.stopTimer(task._id, user?._id || '');
      setIsTimerRunning(false);
      toast({ title: 'Timer stopped' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to stop timer', variant: 'destructive' });
    }
  };

  const handleToggleChecklist = async (itemId: string, completed: boolean) => {
    if (!task) return;
    try {
      await tasksAPI.updateChecklistItem(task._id, itemId, completed, user?._id);
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update checklist', variant: 'destructive' });
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!task) return;
    try {
      await tasksAPI.removeAttachment(task._id, attachmentId);
      toast({ title: 'Attachment removed' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove attachment', variant: 'destructive' });
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!task) return;
    try {
      await tasksAPI.removeTag(task._id, tagName);
      toast({ title: 'Tag removed' });
      onRefresh?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove tag', variant: 'destructive' });
    }
  };

  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const checklistProgress = task.checklist && task.checklist.length > 0
    ? {
        completed: task.checklist.filter(item => item.completed).length,
        total: task.checklist.length,
        percentage: (task.checklist.filter(item => item.completed).length / task.checklist.length) * 100
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                {(task as any).taskType && (
                  <Badge variant="outline">
                    {(task as any).taskType === 'individual' ? 'Individual' : 'Project'}
                  </Badge>
                )}
                {(task as any).assignmentType === 'self-assigned' && (
                  <Badge variant="outline">Self-Assigned</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit?.(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">
              Comments
              {task.comments?.length > 0 && (
                <Badge variant="secondary" className="ml-2">{task.comments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="attachments">
              Files
              {task.attachments?.length > 0 && (
                <Badge variant="secondary" className="ml-2">{task.attachments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {task.description || 'No description provided'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned To
                  </h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {typeof task.assignedTo === 'object'
                          ? `${task.assignedTo.firstName[0]}${task.assignedTo.lastName[0]}`
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {typeof task.assignedTo === 'object'
                        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                        : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {task.dueDate && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </h4>
                    <p className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                )}

                {task.estimatedHours && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Estimated Hours
                    </h4>
                    <p className="text-sm">{task.estimatedHours}h</p>
                  </div>
                )}

                {task.actualHours && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Actual Hours
                    </h4>
                    <p className="text-sm">{task.actualHours}h</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => {
                      const tagObj = typeof tag === 'object' ? tag : { name: tag, color: '#3b82f6' };
                      return (
                        <Badge
                          key={index}
                          style={{ backgroundColor: tagObj.color }}
                          className="text-white"
                        >
                          {tagObj.name}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => handleRemoveTag(tagObj.name)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Watchers */}
              {task.watchers && task.watchers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Watchers ({task.watchers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.watchers.map((watcher, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {typeof watcher === 'object'
                              ? `${watcher.firstName[0]}${watcher.lastName[0]}`
                              : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {typeof watcher === 'object'
                            ? `${watcher.firstName} ${watcher.lastName}`
                            : 'User'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Dependencies ({task.dependencies.length})
                  </h4>
                  <div className="space-y-2">
                    {task.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1 text-sm">
                          {typeof dep.taskId === 'object' ? dep.taskId.title : 'Task'}
                        </span>
                        <Badge variant="outline" className="text-xs">{dep.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4 mt-4">
              <div className="space-y-3">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {comment.user.firstName[0]}{comment.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4 mt-4">
              {checklistProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {checklistProgress.completed} of {checklistProgress.total} completed
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(checklistProgress.percentage)}%
                    </span>
                  </div>
                  <Progress value={checklistProgress.percentage} />
                </div>
              )}

              <div className="space-y-2">
                {task.checklist && task.checklist.length > 0 ? (
                  task.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) =>
                          handleToggleChecklist(item._id, checked as boolean)
                        }
                      />
                      <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                        {item.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No checklist items
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4 mt-4">
              <div className="space-y-2">
                {task.attachments && task.attachments.length > 0 ? (
                  task.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">{attachment.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={attachment.url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAttachment(attachment._id || '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attachments
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="time" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Time Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    {task.actualHours || 0}h tracked of {task.estimatedHours || 0}h estimated
                  </p>
                </div>
                <Button
                  onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
                  variant={isTimerRunning ? 'destructive' : 'default'}
                >
                  {isTimerRunning ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Timer
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Timer
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Time Entries</h4>
                {task.timeEntries && task.timeEntries.length > 0 ? (
                  task.timeEntries.map((entry, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {new Date(entry.startTime).toLocaleString()}
                        </span>
                        <Badge variant="outline">{entry.duration} min</Badge>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No time entries
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <div className="space-y-3">
                {timeline.length > 0 ? (
                  timeline.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity className="h-4 w-4" />
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-px h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No activity yet
                  </p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
