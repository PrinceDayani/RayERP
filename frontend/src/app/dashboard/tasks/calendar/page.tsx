'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/PageLoader';
import tasksAPI from '@/lib/api/tasksAPI';

export default function TaskCalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  useEffect(() => {
    tasksAPI.getAll()
      .then((data: any) => setTasks(Array.isArray(data) ? data : data.tasks || []))
      .catch((err: any) => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Loading calendar..." />;

  // Build a map of dateString -> tasks
  const tasksByDate: Record<string, any[]> = {};
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = new Date(task.dueDate).toDateString();
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  }

  const selectedKey = selected?.toDateString();
  const selectedTasks = selectedKey ? (tasksByDate[selectedKey] || []) : [];

  // Days that have tasks (for dot indicators)
  const dueDates = Object.keys(tasksByDate).map(k => new Date(k));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task Calendar</h1>
        <p className="text-gray-600">View tasks by due date</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="w-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              {selected ? selected.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tasks due on this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedTasks.map((task: any) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                    onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.project?.name && (
                        <p className="text-xs text-muted-foreground">{task.project.name}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{task.status}</Badge>
                      <Badge variant="outline">{task.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
