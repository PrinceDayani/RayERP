import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskClone() {
  const [loading, setLoading] = useState(false);

  const cloneTask = async (taskId: string) => {
    try {
      setLoading(true);
      const result = await tasksAPI.clone(taskId);
      toast({ title: "Success", description: "Task cloned successfully" });
      return result;
    } catch (error) {
      toast({ title: "Error", description: "Failed to clone task", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { cloneTask, loading };
}
