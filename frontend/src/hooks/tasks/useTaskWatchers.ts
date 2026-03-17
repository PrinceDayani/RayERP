import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskWatchers(taskId: string) {
  const [loading, setLoading] = useState(false);

  const addWatcher = async (userId: string) => {
    try {
      setLoading(true);
      await tasksAPI.addWatcher(taskId, userId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add watcher", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeWatcher = async (userId: string) => {
    try {
      await tasksAPI.removeWatcher(taskId, userId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove watcher", variant: "destructive" });
      return false;
    }
  };

  return { addWatcher, removeWatcher, loading };
}
