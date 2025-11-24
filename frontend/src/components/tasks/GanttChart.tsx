'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GanttTask {
  id: string;
  title: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
  dependencies: string[];
}

interface GanttChartProps {
  projectId?: string;
}

export default function GanttChart({ projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [projectId]);

  const fetchTimeline = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/calendar/timeline?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });

      const data = await response.json();
      setTasks(data.timeline.map((t: any) => ({
        ...t,
        start: new Date(t.start),
        end: new Date(t.end)
      })));
    } catch (error) {
      console.error('Timeline error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading timeline...</div>;

  const minDate = tasks.length > 0 ? new Date(Math.min(...tasks.map(t => t.start.getTime()))) : new Date();
  const maxDate = tasks.length > 0 ? new Date(Math.max(...tasks.map(t => t.end.getTime()))) : new Date();
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

  const getPosition = (date: Date) => {
    return ((date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
  };

  const getWidth = (start: Date, end: Date) => {
    return ((end.getTime() - start.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
  };

  const statusColors: Record<string, string> = {
    'todo': 'bg-gray-400',
    'in-progress': 'bg-blue-500',
    'review': 'bg-purple-500',
    'completed': 'bg-green-500',
    'blocked': 'bg-red-500'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="flex border-b pb-2">
            <div className="w-48 font-medium">Task</div>
            <div className="flex-1 relative">
              <div className="flex justify-between text-xs text-muted-foreground">
                {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => {
                  const date = new Date(minDate.getTime() + i * (maxDate.getTime() - minDate.getTime()) / Math.min(totalDays, 30));
                  return (
                    <span key={i}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tasks */}
          {tasks.map(task => (
            <div key={task.id} className="flex items-center">
              <div className="w-48 text-sm truncate pr-4">{task.title}</div>
              <div className="flex-1 relative h-8">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-gray-200" />
                  ))}
                </div>
                
                {/* Task bar */}
                <div
                  className={`absolute h-6 rounded ${statusColors[task.status]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                  style={{
                    left: `${getPosition(task.start)}%`,
                    width: `${getWidth(task.start, task.end)}%`
                  }}
                  title={`${task.title} (${task.progress}%)`}
                >
                  {/* Progress */}
                  <div
                    className="h-full bg-white/30 rounded-l"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
