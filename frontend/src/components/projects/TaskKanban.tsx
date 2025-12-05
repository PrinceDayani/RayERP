"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, User, Plus, MoreHorizontal } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: any;
  dueDate: string;
  order: number;
  column: string;
}

interface TaskKanbanProps {
  projectId: string;
  tasks: Task[];
  onTasksUpdate: (tasks: Task[]) => void;
  onTaskCreate: (columnId: string) => void;
  onTaskEdit: (task: Task) => void;
}

const TaskKanban: React.FC<TaskKanbanProps> = ({
  projectId,
  tasks,
  onTasksUpdate,
  onTaskCreate,
  onTaskEdit
}) => {
  const [columns] = useState([
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'completed', title: 'Completed', color: 'bg-green-100' }
  ]);

  const [tasksByColumn, setTasksByColumn] = useState<Record<string, Task[]>>({});
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    const grouped = tasks.reduce((acc, task) => {
      const column = task.column || task.status;
      if (!acc[column]) acc[column] = [];
      acc[column].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Sort tasks by order within each column
    Object.keys(grouped).forEach(column => {
      grouped[column].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    setTasksByColumn(grouped);
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedTask) return;

    const updatedTask = { ...draggedTask, column: targetColumn, status: targetColumn };
    const updatedTasks = tasks.map(t => t._id === draggedTask._id ? updatedTask : t);
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/tasks/${draggedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetColumn, column: targetColumn })
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      onTasksUpdate(updatedTasks);
      toast({ title: "Success", description: "Task moved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to move task", variant: "destructive" });
    }
    
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'critical': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <Card key={column.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                {column.title}
                <Badge variant="secondary" className="text-xs">
                  {tasksByColumn[column.id]?.length || 0}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTaskCreate(column.id)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent 
            className={`flex-1 pt-0 space-y-2 min-h-[200px] p-2 rounded-md transition-colors ${
              dragOverColumn === column.id ? 'bg-primary/10 border-2 border-primary border-dashed' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {(tasksByColumn[column.id] || []).map((task) => (
              <Card
                key={task._id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className={`cursor-move hover:shadow-md transition-shadow group ${
                  draggedTask?._id === task._id ? 'opacity-50' : ''
                }`}
                onClick={() => onTaskEdit(task)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-2 flex-1">
                      {task.title}
                    </h4>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    
                    {task.assignedTo && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {typeof task.assignedTo === 'object' 
                            ? getInitials(`${task.assignedTo.firstName} ${task.assignedTo.lastName}`)
                            : 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskKanban;