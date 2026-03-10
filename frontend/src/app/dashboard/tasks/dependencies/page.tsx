'use client';

import { useState, useEffect } from 'react';
import { PageLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import tasksAPI from '@/lib/api/tasksAPI';
import TaskDependencyManager from '@/components/tasks/TaskDependencyManager';

export default function TaskDependenciesPage() {
  const [graph, setGraph] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    try {
      const data = await tasksAPI.getDependencyGraph();
      setGraph(data.graph || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader text="Loading task dependencies..." />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task Dependencies</h1>
        <p className="text-gray-600">View and manage task relationships</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {graph.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <Badge>{task.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TaskDependencyManager
                taskId={task.id}
                dependencies={task.dependencies || []}
                onUpdate={fetchGraph}
              />
            </CardContent>
          </Card>
        ))}

        {graph.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No tasks found. Create tasks with dependencies to see them here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
