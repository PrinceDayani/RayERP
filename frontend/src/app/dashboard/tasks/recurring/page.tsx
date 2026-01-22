'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Edit, Trash2 } from 'lucide-react';
import tasksAPI from '@/lib/api/tasksAPI';
import { PageLoader } from '@/components/PageLoader';

export default function RecurringTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurringTasks();
  }, []);

  const fetchRecurringTasks = async () => {
    try {
      const allTasks = await tasksAPI.getAll();
      setTasks(allTasks.filter((t: any) => t.isRecurring));
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (taskId: string) => {
    if (!confirm('Disable recurring for this task?')) return;
    try {
      await tasksAPI.setRecurring(taskId, '', false);
      fetchRecurringTasks();
    } catch (error) {
      console.error('Disable error:', error);
    }
  };

  if (loading) return <PageLoader text="Loading recurring tasks..." />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recurring Tasks</h1>
        <p className="text-gray-600">Manage automated task creation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Repeat className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{task.description}</p>
              <div className="flex items-center gap-2">
                <Badge>{task.recurrencePattern}</Badge>
                <Badge variant="outline">{task.status}</Badge>
              </div>
              {task.nextRecurrence && (
                <p className="text-xs text-gray-500">
                  Next: {new Date(task.nextRecurrence).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/tasks/${task._id}/edit`)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDisable(task._id)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Disable
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No recurring tasks found. Enable recurring on any task to see it here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
