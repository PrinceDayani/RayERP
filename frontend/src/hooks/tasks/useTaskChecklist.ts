import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useTaskChecklist(taskId: string) {
  const [loading, setLoading] = useState(false);

  const addItem = async (text: string) => {
    try {
      setLoading(true);
      await tasksAPI.addChecklistItem(taskId, text);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: string, completed: boolean, completedBy?: string) => {
    try {
      await tasksAPI.updateChecklistItem(taskId, itemId, completed, completedBy);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
      return false;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await tasksAPI.deleteChecklistItem(taskId, itemId);
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
      return false;
    }
  };

  return { addItem, updateItem, deleteItem, loading };
}
