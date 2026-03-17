"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Link2, AlertCircle, Network, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CriticalPathView } from "./CriticalPathView";
import { DependencyGraphView } from "./DependencyGraphView";

interface Dependency {
  _id?: string;
  taskId: { _id: string; title: string };
  type: string;
}

interface TaskDependenciesProps {
  taskId: string;
  dependencies: Dependency[];
  projectId?: string;
  onDependenciesUpdated?: () => void;
}

const DEPENDENCY_TYPES = [
  { value: "finish-to-start", label: "Finish to Start (FS)" },
  { value: "start-to-start", label: "Start to Start (SS)" },
  { value: "finish-to-finish", label: "Finish to Finish (FF)" },
  { value: "start-to-finish", label: "Start to Finish (SF)" },
];

export function TaskDependencies({ taskId, dependencies, projectId, onDependenciesUpdated }: TaskDependenciesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [formData, setFormData] = useState({
    dependsOn: "",
    type: "finish-to-start",
  });

  useEffect(() => {
    fetchAvailableTasks();
    checkBlocked();
  }, [taskId, projectId]);

  const fetchAvailableTasks = async () => {
    try {
      const tasks = await tasksAPI.getAll();
      setAvailableTasks(tasks.filter((t: any) => t._id !== taskId));
      setAllTasks(tasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const checkBlocked = async () => {
    try {
      const result = await tasksAPI.checkBlocked(taskId);
      setIsBlocked(result.isBlocked);
    } catch (error) {
      console.error("Failed to check blocked status:", error);
    }
  };

  const handleAddDependency = async () => {
    if (!formData.dependsOn) return;

    try {
      setLoading(true);
      await tasksAPI.addDependency(taskId, formData.dependsOn, formData.type);
      toast({ title: "Success", description: "Dependency added" });
      setFormData({ dependsOn: "", type: "finish-to-start" });
      setShowAddDialog(false);
      onDependenciesUpdated?.();
      checkBlocked();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add dependency", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      await tasksAPI.removeDependency(taskId, dependencyId);
      toast({ title: "Success", description: "Dependency removed" });
      onDependenciesUpdated?.();
      checkBlocked();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove dependency", variant: "destructive" });
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    return DEPENDENCY_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Dependencies
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">
                <Link2 className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="graph">
                <Network className="h-4 w-4 mr-2" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="critical">
                <TrendingUp className="h-4 w-4 mr-2" />
                Critical Path
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4 mt-4">
          {isBlocked && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                This task is blocked by incomplete dependencies
              </p>
            </div>
          )}

          {dependencies && dependencies.length > 0 ? (
            <div className="space-y-2">
              {dependencies.map((dep) => (
                <div key={dep._id} className="p-3 border rounded-lg group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {typeof dep.taskId === "object" ? dep.taskId.title : "Task"}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {getDependencyTypeLabel(dep.type)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDependency(dep._id!)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No dependencies</p>
          )}
            </TabsContent>

            <TabsContent value="graph" className="mt-4">
              <DependencyGraphView tasks={allTasks} />
            </TabsContent>

            <TabsContent value="critical" className="mt-4">
              <CriticalPathView tasks={allTasks} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task">Depends On Task *</Label>
              <Select value={formData.dependsOn} onValueChange={(value) => setFormData({ ...formData, dependsOn: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((task) => (
                    <SelectItem key={task._id} value={task._id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Dependency Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPENDENCY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddDependency} disabled={loading || !formData.dependsOn}>
              {loading ? "Adding..." : "Add Dependency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
