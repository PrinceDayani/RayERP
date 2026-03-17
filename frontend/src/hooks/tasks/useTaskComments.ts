import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskComments(taskId: string) {
  const [loading, setLoading] = useState(false);

  const addComment = async (comment: string, userId: string) => {
    try {
      setLoading(true);
      await tasksAPI.addComment(taskId, comment, userId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addComment, loading };
}
