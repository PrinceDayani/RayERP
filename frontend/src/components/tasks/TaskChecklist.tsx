"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ChecklistItem {
  _id?: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

interface TaskChecklistProps {
  taskId: string;
  checklist: ChecklistItem[];
  onChecklistUpdated?: () => void;
}

export function TaskChecklist({ taskId, checklist, onChecklistUpdated }: TaskChecklistProps) {
  const { user } = useAuth();
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);

  const progress = checklist?.length
    ? Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100)
    : 0;

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    try {
      setAdding(true);
      await tasksAPI.addChecklistItem(taskId, newItemText);
      setNewItemText("");
      toast({ title: "Success", description: "Checklist item added" });
      onChecklistUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      await tasksAPI.updateChecklistItem(taskId, itemId, completed, user?._id);
      onChecklistUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await tasksAPI.deleteChecklistItem(taskId, itemId);
      toast({ title: "Success", description: "Item deleted" });
      onChecklistUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          Checklist ({checklist?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {checklist && checklist.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress: {progress}%</span>
              <span className="text-muted-foreground">
                {checklist.filter((i) => i.completed).length} / {checklist.length}
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add checklist item..."
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          />
          <Button onClick={handleAddItem} disabled={adding || !newItemText.trim()} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {checklist && checklist.length > 0 ? (
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item._id} className="flex items-center gap-3 p-3 border rounded-lg group">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={(checked) => handleToggleItem(item._id!, checked as boolean)}
                />
                <span className={`flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                  {item.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(item._id!)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No checklist items</p>
        )}
      </CardContent>
    </Card>
  );
}
