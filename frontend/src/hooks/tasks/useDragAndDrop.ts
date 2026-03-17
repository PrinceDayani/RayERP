import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [draggedOverTarget, setDraggedOverTarget] = useState<string | null>(null);

  const handleDragStart = (item: any) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverTarget(null);
  };

  const handleDragEnter = (targetId: string) => {
    setDraggedOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDraggedOverTarget(null);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      return true;
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update task", 
        variant: "destructive" 
      });
      return false;
    }
  };

  const reorderTasks = async (taskIds: string[], updates: any) => {
    try {
      await tasksAPI.bulkUpdate(taskIds, updates);
      return true;
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to reorder tasks", 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    draggedItem,
    draggedOverTarget,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
    updateTaskStatus,
    reorderTasks,
  };
}
