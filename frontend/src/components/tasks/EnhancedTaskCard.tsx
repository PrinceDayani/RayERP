'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Task, tasksAPI } from '@/lib/api/tasksAPI';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import {
  Calendar, Clock, User, Tag, CheckSquare, Paperclip,
  Users, Link2, Play, Square, Edit, Trash2, Eye,
  CheckCircle, AlertCircle, MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onView?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  compact?: boolean;
}

export default function EnhancedTaskCard({
  task,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  compact = false
}: EnhancedTaskCardProps) {
  const { user } = useAuth();
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getTaskTypeIcon = () => {
    const taskType = (task as any).taskType;
    if (taskType === 'individual') {
      return <User className="h-3 w-3" />;
    }
    return <Users className="h-3 w-3" />;
  };

  const getAssignmentTypeBadge = () => {
    const assignmentType = (task as any).assignmentType;
    if (assignmentType === 'self-assigned') {
      return <Badge variant="outline" className="text-xs">Self</Badge>;
    }
    return null;
  };

  const handleStartTimer = async () => {
    try {
      await tasksAPI.startTimer(task._id, user?._id || '');
      setIsTimerRunning(true);
      toast({ title: 'Timer started' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start timer', variant: 'destructive' });
    }
  };

  const handleStopTimer = async () => {
    try {
      await tasksAPI.stopTimer(task._id, user?._id || '');
      setIsTimerRunning(false);
      toast({ title: 'Timer stopped' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to stop timer', variant: 'destructive' });
    }
  };

  const handleQuickComplete = async () => {
    try {
      await tasksAPI.updateStatus(task._id, 'completed', user?._id);
      onStatusChange?.(task._id, 'completed');
      toast({ title: 'Task completed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getChecklistProgress = () => {
    if (!task.checklist || task.checklist.length === 0) return null;
    const completed = task.checklist.filter(item => item.completed).length;
    const total = task.checklist.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  };

  const checklistProgress = getChecklistProgress();

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(task)}>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {getTaskTypeIcon()}
                <h4 className="font-medium text-sm truncate">{task.title}</h4>
              </div>
              <div className="flex items-center gap-1">
                {getAssignmentTypeBadge()}
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              {task.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.estimatedHours}h
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getTaskTypeIcon()}
              <h4 className="font-medium text-sm leading-tight truncate">{task.title}</h4>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(task)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {task.status !== 'completed' && (
                  <DropdownMenuItem onClick={handleQuickComplete}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete?.(task._id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${getStatusColor(task.status)}`}>
              {task.status}
            </Badge>
            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
            {getAssignmentTypeBadge()}
            {(task as any).isRecurring && (
              <Badge variant="outline" className="text-xs">
                <Square className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {task.tags.slice(0, 3).map((tag, index) => {
                const tagObj = typeof tag === 'object' ? tag : { name: tag, color: '#3b82f6' };
                return (
                  <Badge 
                    key={index} 
                    style={{ backgroundColor: tagObj.color }}
                    className="text-white text-xs"
                  >
                    {tagObj.name}
                  </Badge>
                );
              })}
              {task.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{task.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Checklist Progress */}
          {checklistProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  <span>{checklistProgress.completed}/{checklistProgress.total}</span>
                </div>
                <span className="text-muted-foreground">{Math.round(checklistProgress.percentage)}%</span>
              </div>
              <Progress value={checklistProgress.percentage} className="h-1" />
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            {task.estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedHours}h / {task.actualHours || 0}h
              </div>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {task.attachments.length}
              </div>
            )}
            {task.watchers && task.watchers.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {task.watchers.length}
              </div>
            )}
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {task.dependencies.length}
              </div>
            )}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {task.comments.length}
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {typeof task.assignedTo === 'object' 
                    ? `${task.assignedTo.firstName[0]}${task.assignedTo.lastName[0]}`
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">
                {typeof task.assignedTo === 'object'
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : 'Unassigned'}
              </span>
            </div>

            {/* Timer Button */}
            {task.status === 'in-progress' && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
              >
                {isTimerRunning ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
