"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, CheckCircle, UserPlus } from "lucide-react";
import { useState } from "react";

interface BulkActionsToolbarProps {
  selectedTasks: string[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkDelete: () => void;
  onBulkAssign: (userId: string) => void;
  employees: Array<{ _id: string; firstName: string; lastName: string }>;
}

export default function BulkActionsToolbar({
  selectedTasks,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkAssign,
  employees
}: BulkActionsToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");

  if (selectedTasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white text-primary">
            {selectedTasks.length} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        {/* Bulk Status Update */}
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={(value) => {
            setSelectedStatus(value);
            onBulkStatusUpdate(value);
            setSelectedStatus("");
          }}>
            <SelectTrigger className="w-40 bg-white text-primary">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Assign */}
        <div className="flex items-center gap-2">
          <Select value={selectedAssignee} onValueChange={(value) => {
            setSelectedAssignee(value);
            onBulkAssign(value);
            setSelectedAssignee("");
          }}>
            <SelectTrigger className="w-40 bg-white text-primary">
              <SelectValue placeholder="Assign To" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Delete */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
