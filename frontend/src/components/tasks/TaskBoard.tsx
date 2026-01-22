'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, MessageSquare, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTaskContext } from '@/contexts/TaskContext';
import { Task } from '@/lib/api/tasksAPI';
import tasksAPI from '@/lib/api/tasksAPI';
import { getPriorityColor, isTaskOverdue, formatTaskDueDate, getTaskAssigneeName, getTaskProjectName } from '@/utils/tasks';

interface TaskBoardProps {
  onEditTask: (task: Task) => void;
  onCommentTask: (task: Task) => void;
}

export default function TaskBoard({ onEditTask, onCommentTask }: TaskBoardProps) {
  const router = useRouter();
  const { state, actions, computed } = useTaskContext();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask) {
      await updateTaskStatus(draggedTask, newStatus);
      setDraggedTask(null);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const originalTask = state.tasks.find(t => t._id === taskId);
    if (!originalTask || originalTask.status === newStatus) return;
    
    try {
      setUpdatingTasks(prev => new Set(prev).add(taskId));
      await tasksAPI.updateStatus(taskId, newStatus);
      actions.updateTaskLocal({ ...originalTask, status: newStatus as Task['status'] });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setUpdatingTasks(prev => new Set(prev).add(taskId));
      await actions.deleteTask(taskId);
    } catch (error: any) {
      console.error('Error deleting task:', error);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };



  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(computed.tasksByStatus).map(([status, statusTasks]) => (
        <Card 
          key={status}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          className="transition-colors"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
              {status.replace('-', ' ')}
              <Badge variant="secondary">{statusTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[200px]">
            {statusTasks.map((task, index) => (
              <Card 
                key={`${status}-${task._id}-${index}`} 
                draggable
                onDragStart={(e) => handleDragStart(e, task._id)}
                className={`p-4 hover:shadow-md transition-all cursor-move ${
                  updatingTasks.has(task._id) ? 'opacity-60 animate-pulse' : ''
                } ${draggedTask === task._id ? 'opacity-50 scale-95' : ''}`}
              >
                <div className="space-y-3">
                  {/* Header: Checkbox, Title, Priority */}
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={state.selectedTasks.includes(task._id)}
                      onCheckedChange={() => actions.toggleTaskSelection(task._id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight flex-1">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{task.description}</p>
                  )}
                  
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{formatTaskDueDate(task.dueDate)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{getTaskAssigneeName(task)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2">
                      <div className="w-3.5 h-3.5 rounded-sm bg-purple-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                      </div>
                      <span className="truncate">{getTaskProjectName(task)}</span>
                    </div>
                  </div>

                  {/* Stats & Overdue Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.estimatedHours || 0}h</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{task.comments?.length || 0}</span>
                      </div>
                    </div>
                    {task.dueDate && isTaskOverdue(task) && (
                      <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); onCommentTask(task); }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => updateTaskStatus(task._id, value)} value={task.status}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8 text-xs px-3"
                        onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
