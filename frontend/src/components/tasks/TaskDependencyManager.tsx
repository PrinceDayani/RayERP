'use client';

import { useState, useEffect } from 'react';
import { Link2, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import tasksAPI from '@/lib/api/tasksAPI';

interface TaskDependencyManagerProps {
  taskId: string;
  projectId?: string;
  dependencies?: any[];
  onUpdate?: () => void;
}

export default function TaskDependencyManager({ taskId, projectId, dependencies = [], onUpdate }: TaskDependencyManagerProps) {
  const [adding, setAdding] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [dependencyType, setDependencyType] = useState('finish-to-start');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedBy, setBlockedBy] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableTasks();
    checkBlocked();
  }, [taskId, projectId]);

  const fetchAvailableTasks = async () => {
    try {
      const filters = projectId ? { project: projectId } : {};
      const result = await tasksAPI.search(filters);
      setAvailableTasks(result.tasks?.filter((t: any) => t._id !== taskId) || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    }
  };

  const checkBlocked = async () => {
    try {
      const result = await tasksAPI.checkBlocked(taskId);
      setIsBlocked(result.isBlocked);
      setBlockedBy(result.blockedBy || []);
    } catch (error) {
      console.error('Check blocked error:', error);
    }
  };

  const handleAdd = async () => {
    if (!selectedTask) return;
    
    try {
      await tasksAPI.addDependency(taskId, selectedTask, dependencyType);
      setSelectedTask('');
      setAdding(false);
      onUpdate?.();
      checkBlocked();
    } catch (error) {
      console.error('Add dependency error:', error);
      alert('Failed to add dependency. Check for circular dependencies.');
    }
  };

  const handleRemove = async (depId: string) => {
    try {
      await tasksAPI.removeDependency(taskId, depId);
      onUpdate?.();
      checkBlocked();
    } catch (error) {
      console.error('Remove dependency error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {isBlocked && blockedBy.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This task is blocked by {blockedBy.length} incomplete {blockedBy.length === 1 ? 'task' : 'tasks'}
          </AlertDescription>
        </Alert>
      )}

      {/* Existing Dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Dependencies ({dependencies.length})</h4>
          {dependencies.map((dep) => (
            <div key={dep._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium">{dep.taskId?.title || 'Unknown Task'}</div>
                <Badge variant="outline" className="text-xs mt-1">{dep.type}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRemove(dep.taskId?._id || dep.taskId)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New */}
      {adding ? (
        <div className="space-y-3 p-3 border rounded-lg">
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger>
              <SelectValue placeholder="Select task" />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task._id} value={task._id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dependencyType} onValueChange={setDependencyType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finish-to-start">Finish to Start</SelectItem>
              <SelectItem value="start-to-start">Start to Start</SelectItem>
              <SelectItem value="finish-to-finish">Finish to Finish</SelectItem>
              <SelectItem value="start-to-finish">Start to Finish</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!selectedTask}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Dependency
        </Button>
      )}

      {blockedBy.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2 text-red-600">Blocked By:</h4>
          <div className="space-y-1">
            {blockedBy.map((task: any) => (
              <div key={task.id} className="text-sm p-2 bg-red-50 rounded flex items-center justify-between">
                <span>{task.title}</span>
                <Badge variant="outline">{task.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
