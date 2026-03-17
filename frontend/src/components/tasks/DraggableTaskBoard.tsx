"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MessageSquare, Paperclip, GripVertical } from "lucide-react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: any;
  project?: any;
  tags?: any[];
  comments?: any[];
  attachments?: any[];
}

interface DraggableTaskBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTasksReordered?: () => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-gray-500" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-500" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
  { id: "blocked", title: "Blocked", color: "bg-red-500" },
];

export function DraggableTaskBoard({ tasks, onTaskClick, onTasksReordered }: DraggableTaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (columnId: string) => {
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      return;
    }

    try {
      await tasksAPI.updateStatus(draggedTask._id, newStatus);
      toast({ 
        title: "Success", 
        description: `Task moved to ${COLUMNS.find(c => c.id === newStatus)?.title}` 
      });
      onTasksReordered?.();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update task status", 
        variant: "destructive" 
      });
    } finally {
      setDraggedTask(null);
      setDraggedOverColumn(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "border-l-4 border-red-500",
      high: "border-l-4 border-orange-500",
      medium: "border-l-4 border-yellow-500",
      low: "border-l-4 border-green-500",
    };
    return colors[priority] || "border-l-4 border-gray-500";
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const isOverdue = d < now;
    return (
      <span className={isOverdue ? "text-red-500" : "text-muted-foreground"}>
        {d.toLocaleDateString()}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {COLUMNS.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        const isDraggedOver = draggedOverColumn === column.id;

        return (
          <div
            key={column.id}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <Card className={isDraggedOver ? "border-primary border-2" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    {column.title}
                  </div>
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Task Cards */}
            <div className="space-y-3 mt-3 flex-1">
              {columnTasks.map((task) => (
                <Card
                  key={task._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move hover:shadow-lg transition-shadow ${getPriorityColor(
                    task.priority
                  )} ${draggedTask?._id === task._id ? "opacity-50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h4
                          className="font-medium text-sm mb-2 cursor-pointer hover:text-primary"
                          onClick={() => onTaskClick?.(task)}
                        >
                          {task.title}
                        </h4>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.slice(0, 3).map((tag: any, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                style={{ backgroundColor: tag.color, color: "white" }}
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {task.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </div>
                          )}
                          {task.comments && task.comments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {task.comments.length}
                            </div>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {task.attachments.length}
                            </div>
                          )}
                        </div>

                        {/* Assignee & Priority */}
                        <div className="flex items-center justify-between">
                          {task.assignedTo && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {task.assignedTo.firstName?.[0]}
                                  {task.assignedTo.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {task.assignedTo.firstName}
                              </span>
                            </div>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              task.priority === "critical"
                                ? "border-red-500 text-red-500"
                                : task.priority === "high"
                                ? "border-orange-500 text-orange-500"
                                : task.priority === "medium"
                                ? "border-yellow-500 text-yellow-500"
                                : "border-green-500 text-green-500"
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {columnTasks.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    Drop tasks here
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
