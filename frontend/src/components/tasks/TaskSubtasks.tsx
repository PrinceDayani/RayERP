"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, ListTree } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Subtask {
  _id?: string;
  title: string;
  description?: string;
  status: string;
  assignedTo: string;
  assignedBy: string;
  completed: boolean;
}

interface TaskSubtasksProps {
  taskId: string;
  subtasks: Subtask[];
  onSubtasksUpdated?: () => void;
}

export function TaskSubtasks({ taskId, subtasks, onSubtasksUpdated }: TaskSubtasksProps) {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      // Handle both array and object responses
      const employeeList = Array.isArray(data) ? data : (data.data || data.employees || []);
      setEmployees(employeeList);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
  };

  const progress = subtasks?.length
    ? Math.round((subtasks.filter((s) => s.completed).length / subtasks.length) * 100)
    : 0;

  const handleAddSubtask = async () => {
    if (!formData.title.trim() || !formData.assignedTo) return;

    try {
      setLoading(true);
      await tasksAPI.addSubtask(taskId, {
        ...formData,
        assignedBy: user?._id || "",
      });
      toast({ title: "Success", description: "Subtask added" });
      setFormData({ title: "", description: "", assignedTo: "" });
      setShowAddDialog(false);
      onSubtasksUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add subtask", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm("Are you sure you want to delete this subtask?")) return;

    try {
      await tasksAPI.deleteSubtask(taskId, subtaskId);
      toast({ title: "Success", description: "Subtask deleted" });
      onSubtasksUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete subtask", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-500",
      "in-progress": "bg-blue-500",
      review: "bg-purple-500",
      completed: "bg-green-500",
      blocked: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTree className="h-4 w-4" />
              Subtasks ({subtasks?.length || 0})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subtasks && subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress: {progress}%</span>
                <span className="text-muted-foreground">
                  {subtasks.filter((s) => s.completed).length} / {subtasks.length}
                </span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {subtasks && subtasks.length > 0 ? (
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask._id} className="p-3 border rounded-lg group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{subtask.title}</p>
                      {subtask.description && (
                        <p className="text-sm text-muted-foreground mt-1">{subtask.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(subtask.status)}>{subtask.status}</Badge>
                        {subtask.completed && <Badge variant="outline">✓ Completed</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubtask(subtask._id!)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No subtasks</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subtask</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter subtask title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter subtask description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To *</Label>
              <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(employees) && employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddSubtask} disabled={loading || !formData.title.trim() || !formData.assignedTo}>
              {loading ? "Adding..." : "Add Subtask"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
