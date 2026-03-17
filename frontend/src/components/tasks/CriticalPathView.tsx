"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, AlertCircle, Clock } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  estimatedHours?: number;
  dependencies?: Array<{
    task: string;
    type: string;
  }>;
  status: string;
}

interface CriticalPathViewProps {
  tasks: Task[];
}

export function CriticalPathView({ tasks }: CriticalPathViewProps) {
  const criticalPath = useMemo(() => {
    if (!tasks.length) return [];

    // Build dependency graph
    const taskMap = new Map(tasks.map(t => [t._id, t]));
    const durations = new Map(tasks.map(t => [t._id, t.estimatedHours || 1]));
    const graph = new Map<string, string[]>();

    tasks.forEach(task => {
      const deps = task.dependencies?.map(d => d.task) || [];
      graph.set(task._id, deps);
    });

    // Calculate earliest start times
    const earliestStart = new Map<string, number>();
    const visited = new Set<string>();

    const calculateEarliest = (taskId: string): number => {
      if (visited.has(taskId)) return earliestStart.get(taskId) || 0;
      visited.add(taskId);

      const deps = graph.get(taskId) || [];
      let maxEnd = 0;

      deps.forEach(depId => {
        const depStart = calculateEarliest(depId);
        const depDuration = durations.get(depId) || 1;
        maxEnd = Math.max(maxEnd, depStart + depDuration);
      });

      earliestStart.set(taskId, maxEnd);
      return maxEnd;
    };

    tasks.forEach(task => calculateEarliest(task._id));

    // Calculate latest start times (backward pass)
    const latestStart = new Map<string, number>();
    const projectEnd = Math.max(...Array.from(earliestStart.values()).map((start, i) => 
      start + (durations.get(tasks[i]._id) || 1)
    ));

    const reverseDeps = new Map<string, string[]>();
    graph.forEach((deps, taskId) => {
      deps.forEach(depId => {
        if (!reverseDeps.has(depId)) reverseDeps.set(depId, []);
        reverseDeps.get(depId)!.push(taskId);
      });
    });

    const calculateLatest = (taskId: string): number => {
      const successors = reverseDeps.get(taskId) || [];
      if (successors.length === 0) {
        const duration = durations.get(taskId) || 1;
        return projectEnd - duration;
      }

      let minStart = Infinity;
      successors.forEach(succId => {
        const succLatest = calculateLatest(succId);
        minStart = Math.min(minStart, succLatest);
      });

      const duration = durations.get(taskId) || 1;
      const latest = minStart - duration;
      latestStart.set(taskId, latest);
      return latest;
    };

    tasks.forEach(task => calculateLatest(task._id));

    // Find critical path (tasks with zero slack)
    const critical = tasks.filter(task => {
      const earliest = earliestStart.get(task._id) || 0;
      const latest = latestStart.get(task._id) || 0;
      return Math.abs(earliest - latest) < 0.01; // Float comparison
    });

    return critical.map(task => ({
      ...task,
      earliestStart: earliestStart.get(task._id) || 0,
      latestStart: latestStart.get(task._id) || 0,
      slack: (latestStart.get(task._id) || 0) - (earliestStart.get(task._id) || 0),
    }));
  }, [tasks]);

  const totalDuration = useMemo(() => {
    return criticalPath.reduce((sum, task) => sum + (task.estimatedHours || 1), 0);
  }, [criticalPath]);

  if (!tasks.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No tasks available to calculate critical path</AlertDescription>
      </Alert>
    );
  }

  if (!criticalPath.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No critical path found. Tasks may not have dependencies.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-red-500" />
          Critical Path Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Clock className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-sm text-red-600 font-medium">Total Critical Path Duration</p>
            <p className="text-2xl font-bold text-red-700">{totalDuration} hours</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Critical Tasks ({criticalPath.length})</h4>
          <p className="text-xs text-muted-foreground">
            These tasks directly impact project completion time. Any delay will delay the entire project.
          </p>
          <div className="space-y-2">
            {criticalPath.map((task, index) => (
              <div key={task._id} className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                <Badge variant="destructive" className="shrink-0">
                  {index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {task.estimatedHours || 1}h
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Slack: {task.slack.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Critical path tasks have zero slack time. Focus on these tasks to ensure on-time project delivery.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
