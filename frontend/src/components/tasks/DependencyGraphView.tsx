"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Network, AlertCircle, ArrowRight } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  status: string;
  dependencies?: Array<{
    task: string;
    type: string;
  }>;
}

interface DependencyGraphViewProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

export function DependencyGraphView({ tasks, onTaskClick }: DependencyGraphViewProps) {
  const graphData = useMemo(() => {
    if (!tasks.length) return { nodes: [], edges: [], levels: [] };

    const taskMap = new Map(tasks.map(t => [t._id, t]));
    const nodes = tasks.map(task => ({
      id: task._id,
      title: task.title,
      status: task.status,
      dependencies: task.dependencies || [],
    }));

    const edges = tasks.flatMap(task =>
      (task.dependencies || []).map(dep => ({
        from: dep.task,
        to: task._id,
        type: dep.type,
      }))
    );

    // Calculate levels (topological sort)
    const levels: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    tasks.forEach(task => {
      inDegree.set(task._id, task.dependencies?.length || 0);
    });

    while (visited.size < tasks.length) {
      const currentLevel = tasks
        .filter(t => !visited.has(t._id) && (inDegree.get(t._id) || 0) === 0)
        .map(t => t._id);

      if (currentLevel.length === 0) break;

      levels.push(currentLevel);
      currentLevel.forEach(id => {
        visited.add(id);
        edges
          .filter(e => e.from === id)
          .forEach(e => {
            inDegree.set(e.to, (inDegree.get(e.to) || 0) - 1);
          });
      });
    }

    return { nodes, edges, levels };
  }, [tasks]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-200 text-gray-700",
      "in-progress": "bg-blue-200 text-blue-700",
      review: "bg-purple-200 text-purple-700",
      completed: "bg-green-200 text-green-700",
      blocked: "bg-red-200 text-red-700",
    };
    return colors[status] || "bg-gray-200 text-gray-700";
  };

  const getDependencyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "finish-to-start": "FS",
      "start-to-start": "SS",
      "finish-to-finish": "FF",
      "start-to-finish": "SF",
    };
    return labels[type] || "FS";
  };

  if (!tasks.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No tasks available to display dependency graph</AlertDescription>
      </Alert>
    );
  }

  if (!graphData.edges.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No dependencies found. Tasks are independent.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Dependency Graph
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 overflow-x-auto pb-4">
          {graphData.levels.map((level, levelIndex) => (
            <div key={levelIndex} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0">
                  Level {levelIndex + 1}
                </Badge>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="flex flex-wrap gap-3">
                {level.map(taskId => {
                  const task = graphData.nodes.find(n => n.id === taskId);
                  if (!task) return null;

                  const outgoingEdges = graphData.edges.filter(e => e.from === taskId);

                  return (
                    <div key={taskId} className="space-y-2">
                      <div
                        className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                          task.status
                        )}`}
                        onClick={() => onTaskClick?.(taskId)}
                      >
                        <p className="font-medium text-sm max-w-[200px] truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.status}
                          </Badge>
                          {task.dependencies.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {task.dependencies.length} deps
                            </Badge>
                          )}
                        </div>
                      </div>

                      {outgoingEdges.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pl-2">
                          <ArrowRight className="h-3 w-3" />
                          <span>
                            {outgoingEdges.map(e => getDependencyTypeLabel(e.type)).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm">Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline">FS</Badge>
              <span className="text-muted-foreground">Finish-to-Start</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">SS</Badge>
              <span className="text-muted-foreground">Start-to-Start</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">FF</Badge>
              <span className="text-muted-foreground">Finish-to-Finish</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">SF</Badge>
              <span className="text-muted-foreground">Start-to-Finish</span>
            </div>
          </div>
        </div>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Tasks are organized by dependency levels. Click on any task to view details.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
