"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Copy } from "lucide-react";

interface TaskCloneDialogProps {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloned?: () => void;
}

export function TaskCloneDialog({ taskId, taskTitle, open, onOpenChange, onCloned }: TaskCloneDialogProps) {
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState(`${taskTitle} (Copy)`);
  const [includeComments, setIncludeComments] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [includeSubtasks, setIncludeSubtasks] = useState(false);

  const handleClone = async () => {
    try {
      setLoading(true);
      await tasksAPI.clone(taskId);
      toast({ title: "Success", description: "Task cloned successfully" });
      onOpenChange(false);
      onCloned?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to clone task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Clone Task
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">New Task Title</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new task title"
            />
          </div>
          <div className="space-y-3">
            <Label>Include in Clone:</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="checklist"
                checked={includeChecklist}
                onCheckedChange={(checked) => setIncludeChecklist(checked as boolean)}
              />
              <label htmlFor="checklist" className="text-sm cursor-pointer">
                Checklist items
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attachments"
                checked={includeAttachments}
                onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
              />
              <label htmlFor="attachments" className="text-sm cursor-pointer">
                Attachments
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="subtasks"
                checked={includeSubtasks}
                onCheckedChange={(checked) => setIncludeSubtasks(checked as boolean)}
              />
              <label htmlFor="subtasks" className="text-sm cursor-pointer">
                Subtasks
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comments"
                checked={includeComments}
                onCheckedChange={(checked) => setIncludeComments(checked as boolean)}
              />
              <label htmlFor="comments" className="text-sm cursor-pointer">
                Comments
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={loading || !newTitle.trim()}>
            {loading ? "Cloning..." : "Clone Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
