import React, { useState } from 'react';
import { Plus, X, GitBranch, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectTaskDependencies } from '@/hooks/tasks/useProjectTaskDependencies';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectTaskDependenciesProps {
  taskId: string;
  projectId: string;
  availableTasks?: Array<{ _id: string; title: string }>;
  currentDependencies?: Array<{ _id: string; taskId: { _id: string; title: string }; type: string }>;
}

export const ProjectTaskDependencies: React.FC<ProjectTaskDependenciesProps> = ({
  taskId,
  projectId,
  availableTasks = [],
  currentDependencies = []
}) => {
  const {
    dependencyGraph,
    criticalPath,
    blockedInfo,
    addDependency,
    removeDependency,
    isAddingDependency,
    isRemovingDependency
  } = useProjectTaskDependencies(taskId, projectId);

  const [selectedTask, setSelectedTask] = useState('');
  const [dependencyType, setDependencyType] = useState('finish-to-start');

  const handleAddDependency = async () => {
    if (!selectedTask) return;
    
    try {
      await addDependency({ taskId, dependsOn: selectedTask, type: dependencyType });
      setSelectedTask('');
    } catch (error) {
      console.error('Error adding dependency:', error);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      await removeDependency({ taskId, dependencyId });
    } catch (error) {
      console.error('Error removing dependency:', error);
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'finish-to-start': 'Finish to Start',
      'start-to-start': 'Start to Start',
      'finish-to-finish': 'Finish to Finish',
      'start-to-finish': 'Start to Finish'
    };
    return labels[type] || type;
  };

  const getDependencyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'finish-to-start': 'bg-blue-100 text-blue-800',
      'start-to-start': 'bg-green-100 text-green-800',
      'finish-to-finish': 'bg-purple-100 text-purple-800',
      'start-to-finish': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Tabs defaultValue="dependencies" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        <TabsTrigger value="graph">Dependency Graph</TabsTrigger>
        <TabsTrigger value="critical-path">Critical Path</TabsTrigger>
      </TabsList>

      {/* Dependencies Tab */}
      <TabsContent value="dependencies">
        <Card>
          <CardHeader>
            <CardTitle>Task Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Blocked Warning */}
            {blockedInfo?.isBlocked && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Task is Blocked</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This task is blocked by {blockedInfo.blockedBy.length} incomplete task(s)
                  </p>
                </div>
              </div>
            )}

            {/* Add Dependency */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-medium">Add Dependency</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks
                        .filter(t => t._id !== taskId && !currentDependencies.some(d => d.taskId._id === t._id))
                        .map((task) => (
                          <SelectItem key={task._id} value={task._id}>
                            {task.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={dependencyType} onValueChange={setDependencyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finish-to-start">Finish to Start</SelectItem>
                      <SelectItem value="start-to-start">Start to Start</SelectItem>
                      <SelectItem value="finish-to-finish">Finish to Finish</SelectItem>
                      <SelectItem value="start-to-finish">Start to Finish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddDependency}
                disabled={!selectedTask || isAddingDependency}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAddingDependency ? 'Adding...' : 'Add Dependency'}
              </Button>
            </div>

            {/* Current Dependencies */}
            <div className="space-y-2">
              <h3 className="font-medium">Current Dependencies</h3>
              {currentDependencies.length > 0 ? (
                <div className="space-y-2">
                  {currentDependencies.map((dep) => (
                    <div
                      key={dep._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{dep.taskId.title}</p>
                          <Badge className={getDependencyTypeColor(dep.type)} variant="secondary">
                            {getDependencyTypeLabel(dep.type)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveDependency(dep.taskId._id)}
                        disabled={isRemovingDependency}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No dependencies added yet
                </p>
              )}
            </div>

            {/* Blocking Tasks */}
            {blockedInfo?.blockedBy && blockedInfo.blockedBy.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-yellow-700 dark:text-yellow-400">Blocking Tasks</h3>
                <div className="space-y-2">
                  {blockedInfo.blockedBy.map((blockingTask: any) => (
                    <div
                      key={blockingTask.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{blockingTask.title}</p>
                        <p className="text-sm text-muted-foreground">Status: {blockingTask.status}</p>
                      </div>
                      <Badge variant="outline" className="text-yellow-700">
                        {getDependencyTypeLabel(blockingTask.type)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Dependency Graph Tab */}
      <TabsContent value="graph">
        <Card>
          <CardHeader>
            <CardTitle>Dependency Graph</CardTitle>
          </CardHeader>
          <CardContent>
            {dependencyGraph?.graph && dependencyGraph.graph.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Showing {dependencyGraph.graph.length} tasks with dependencies
                </p>
                <div className="space-y-3">
                  {dependencyGraph.graph.map((node: any) => (
                    <div key={node.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{node.title}</h4>
                        <Badge>{node.status}</Badge>
                      </div>
                      {node.dependencies.length > 0 && (
                        <div className="ml-4 mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">Depends on:</p>
                          {node.dependencies.map((dep: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <GitBranch className="h-3 w-3" />
                              <span>Task (Type: {dep.type})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">
                No dependency graph available
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Critical Path Tab */}
      <TabsContent value="critical-path">
        <Card>
          <CardHeader>
            <CardTitle>Critical Path Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {criticalPath?.criticalPath && criticalPath.criticalPath.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Total Duration</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {criticalPath.totalDuration} hours
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Critical Path Tasks</h4>
                  {criticalPath.criticalPath.map((task: any, index: number) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.duration} hours</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">
                No critical path data available
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
