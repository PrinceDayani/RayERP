'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import tasksAPI from '@/lib/api/tasksAPI';

interface TimeTrackerProps {
  taskId: string;
  userId: string;
  timeEntries?: Array<{
    user: string;
    startTime: string;
    endTime?: string;
    duration: number;
    description?: string;
  }>;
  onUpdate?: () => void;
}

export default function TimeTracker({ taskId, userId, timeEntries = [], onUpdate }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');

  const activeEntry = timeEntries.find(e => e.user === userId && !e.endTime);

  useEffect(() => {
    if (activeEntry) {
      setIsRunning(true);
      const start = new Date(activeEntry.startTime).getTime();
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeEntry]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      await tasksAPI.startTimer(taskId, userId, description);
      setIsRunning(true);
      setDescription('');
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to start timer:', error);
      alert(error.response?.data?.message || 'Failed to start timer');
    }
  };

  const handleStop = async () => {
    try {
      await tasksAPI.stopTimer(taskId, userId);
      setIsRunning(false);
      setElapsed(0);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to stop timer:', error);
      alert(error.response?.data?.message || 'Failed to stop timer');
    }
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + e.duration / 60, 0).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRunning}
          />
        </div>
        <div className="text-2xl font-mono font-bold min-w-[120px]">
          {formatTime(elapsed)}
        </div>
        {!isRunning ? (
          <Button onClick={handleStart} size="sm">
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        ) : (
          <Button onClick={handleStop} variant="destructive" size="sm">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Total: {totalHours}h</span>
      </div>

      {timeEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Time Logs</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {timeEntries.map((entry, i) => (
              <div key={i} className="text-xs flex justify-between p-2 bg-muted rounded">
                <span>{entry.description || 'Working on task'}</span>
                <span className="font-mono">{(entry.duration / 60).toFixed(2)}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
