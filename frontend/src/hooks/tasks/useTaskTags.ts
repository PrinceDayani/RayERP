import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskTags(taskId: string) {
  const [loading, setLoading] = useState(false);

  const addTag = async (name: string, color: string) => {
    try {
      setLoading(true);
      await tasksAPI.addTag(taskId, name, color);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add tag", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (name: string) => {
    try {
      setLoading(true);
      await tasksAPI.removeTag(taskId, name);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove tag", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addTag, removeTag, loading };
}
