import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskSubtasks(taskId: string) {
  const [loading, setLoading] = useState(false);

  const addSubtask = async (data: { title: string; description: string; assignedTo: string; assignedBy: string }) => {
    try {
      setLoading(true);
      await tasksAPI.addSubtask(taskId, data);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add subtask", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      await tasksAPI.deleteSubtask(taskId, subtaskId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete subtask", variant: "destructive" });
      return false;
    }
  };

  const getProgress = async () => {
    try {
      const result = await tasksAPI.getSubtaskProgress(taskId);
      return result;
    } catch (error) {
      console.error("Failed to get subtask progress:", error);
      return null;
    }
  };

  return { addSubtask, deleteSubtask, getProgress, loading };
}
