'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, Edit, Clock } from 'lucide-react';
import TaskPriorityIndicator from './TaskPriorityIndicator';
import { cn } from '@/lib/utils';

interface MobileTaskCardProps {
  task: any;
  onStatusChange?: (taskId: string, status: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
}

export default function MobileTaskCard({ task, onStatusChange, onDelete, onEdit }: MobileTaskCardProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeAction, setSwipeAction] = useState<'complete' | 'delete' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const diff = touchStart - e.targetTouches[0].clientX;
    
    if (diff > 50) setSwipeAction('delete');
    else if (diff < -50) setSwipeAction('complete');
    else setSwipeAction(null);
  };

  const handleTouchEnd = () => {
    if (swipeAction === 'complete' && onStatusChange) {
      onStatusChange(task._id, 'completed');
    } else if (swipeAction === 'delete' && onDelete) {
      onDelete(task._id);
    }
    setSwipeAction(null);
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      {swipeAction && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-between px-4',
          swipeAction === 'complete' ? 'bg-green-500' : 'bg-red-500'
        )}>
          {swipeAction === 'complete' && (
            <div className="flex items-center gap-2 text-white">
              <Check className="w-5 h-5" />
              <span className="font-medium">Complete</span>
            </div>
          )}
          {swipeAction === 'delete' && (
            <div className="flex items-center gap-2 text-white ml-auto">
              <span className="font-medium">Delete</span>
              <Trash2 className="w-5 h-5" />
            </div>
          )}
        </div>
      )}

      {/* Card */}
      <Card
        className={cn(
          'p-4 transition-transform touch-pan-y',
          swipeAction === 'complete' && 'translate-x-20',
          swipeAction === 'delete' && '-translate-x-20'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg flex-1">{task.title}</h3>
            <TaskPriorityIndicator priority={task.priority} showLabel={false} />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{task.status}</Badge>
            {task.dueDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag: any, i: number) => (
                <Badge key={i} style={{ backgroundColor: tag.color }} className="text-white text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={() => onEdit?.(task._id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onStatusChange?.(task._id, 'completed')}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded"
            >
              <Check className="w-4 h-4" />
              Complete
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
