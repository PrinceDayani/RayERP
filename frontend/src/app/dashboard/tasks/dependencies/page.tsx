'use client';

import { useState, useEffect } from 'react';
import { PageLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, AlertCircle } from 'lucide-react';
import tasksAPI from '@/lib/api/tasksAPI';

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
              {task.dependencies?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Depends on:</p>
                  {task.dependencies.map((dep: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                      <Network className="w-4 h-4" />
                      <span>{dep.id?.title || 'Unknown'}</span>
                      <Badge variant="outline" className="text-xs">{dep.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No dependencies</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
