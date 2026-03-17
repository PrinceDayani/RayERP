import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGanttChart } from '@/hooks/tasks/useGanttChart';
import { Calendar, Clock } from 'lucide-react';

interface ProjectGanttChartProps {
  projectId: string;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projectId }) => {
  const { ganttData, isLoading, updateGanttTask } = useGanttChart(projectId);
  const ganttRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ganttData || !ganttRef.current) return;

    // Simple Gantt visualization without external library
    // For production, install: npm install frappe-gantt
    // Then use: import Gantt from 'frappe-gantt';
    
    console.log('Gantt Data:', ganttData);
  }, [ganttData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ganttData || !ganttData.data || ganttData.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tasks available for Gantt chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gantt Chart</CardTitle>
          {ganttData.projectTimeline && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(ganttData.projectTimeline.start).toLocaleDateString()} - {new Date(ganttData.projectTimeline.end).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{ganttData.projectTimeline.duration} days</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Simplified Task List View */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground mb-4">
            <p>📊 Gantt Chart Visualization</p>
            <p className="text-xs mt-1">
              To enable interactive Gantt chart, install: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm install frappe-gantt</code>
            </p>
          </div>

          {ganttData.data.map((task: any) => (
            <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        task.status === 'completed' ? '#10b981' :
                        task.status === 'in-progress' ? '#3b82f6' :
                        task.status === 'blocked' ? '#ef4444' : '#6b7280'
                    }}
                  />
                  <span className="font-medium">{task.text}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{task.assignee}</span>
                  <span>•</span>
                  <span>{task.duration}h</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Start: {new Date(task.start_date).toLocaleDateString()}</span>
                <span>End: {new Date(task.end_date).toLocaleDateString()}</span>
                <span>Progress: {Math.round(task.progress * 100)}%</span>
              </div>
              {task.dependencies.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Dependencies: {task.dependencies.length} task(s)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Placeholder for actual Gantt chart */}
        <div ref={ganttRef} className="mt-6 min-h-[400px] border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center text-muted-foreground py-12">
            <p className="mb-2">Interactive Gantt Chart</p>
            <p className="text-sm">Install frappe-gantt library to enable drag-and-drop timeline visualization</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
