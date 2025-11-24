'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface SubtaskManagerProps {
  taskId: string;
  subtasks?: any[];
  checklist?: any[];
  onUpdate?: () => void;
}

export default function SubtaskManager({ taskId, subtasks = [], checklist = [], onUpdate }: SubtaskManagerProps) {
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddChecklist = async () => {
    if (!newItem.trim()) return;
    
    try {
      const tasksAPI = (await import('@/lib/api/tasksAPI')).default;
      await tasksAPI.addChecklistItem(taskId, newItem.trim());
      setNewItem('');
      onUpdate?.();
    } catch (error) {
      console.error('Add checklist error:', error);
    }
  };

  const handleToggleChecklist = async (itemId: string, completed: boolean) => {
    try {
      const tasksAPI = (await import('@/lib/api/tasksAPI')).default;
      await tasksAPI.updateChecklistItem(taskId, itemId, !completed);
      onUpdate?.();
    } catch (error) {
      console.error('Toggle checklist error:', error);
    }
  };

  const handleDeleteChecklist = async (itemId: string) => {
    try {
      const tasksAPI = (await import('@/lib/api/tasksAPI')).default;
      await tasksAPI.deleteChecklistItem(taskId, itemId);
      onUpdate?.();
    } catch (error) {
      console.error('Delete checklist error:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('Delete this subtask?')) return;
    try {
      const tasksAPI = (await import('@/lib/api/tasksAPI')).default;
      await tasksAPI.delete(subtaskId);
      onUpdate?.();
    } catch (error) {
      console.error('Delete subtask error:', error);
    }
  };

  const completedCount = checklist.filter(c => c.completed).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      {checklist.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{completedCount}/{checklist.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <div key={item._id} className="flex items-center gap-3 p-2 hover:bg-muted rounded group">
            <button onClick={() => handleToggleChecklist(item._id, item.completed)}>
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <span className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
              {item.text}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100"
              onClick={() => handleDeleteChecklist(item._id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New */}
      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
        />
        <Button size="sm" onClick={handleAddChecklist}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Subtasks ({subtasks.length})</h4>
          <div className="space-y-1">
            {subtasks.map((sub: any) => (
              <div key={sub._id} className="flex items-center justify-between text-sm p-2 bg-muted rounded group">
                <span>{sub.title}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteSubtask(sub._id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
