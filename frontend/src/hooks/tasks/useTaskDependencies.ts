import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskDependencies(taskId: string) {
  const [loading, setLoading] = useState(false);

  const addDependency = async (dependsOn: string, type: string) => {
    try {
      setLoading(true);
      await tasksAPI.addDependency(taskId, dependsOn, type);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add dependency", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeDependency = async (dependencyId: string) => {
    try {
      await tasksAPI.removeDependency(taskId, dependencyId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove dependency", variant: "destructive" });
      return false;
    }
  };

  const checkBlocked = async () => {
    try {
      const result = await tasksAPI.checkBlocked(taskId);
      return result.isBlocked;
    } catch (error) {
      console.error("Failed to check blocked status:", error);
      return false;
    }
  };

  const getDependencyGraph = async (projectId?: string) => {
    try {
      const result = await tasksAPI.getDependencyGraph(projectId);
      return result;
    } catch (error) {
      console.error("Failed to get dependency graph:", error);
      return null;
    }
  };

  const getCriticalPath = async (projectId: string) => {
    try {
      const result = await tasksAPI.getCriticalPath(projectId);
      return result;
    } catch (error) {
      console.error("Failed to get critical path:", error);
      return null;
    }
  };

  return { addDependency, removeDependency, checkBlocked, getDependencyGraph, getCriticalPath, loading };
}
