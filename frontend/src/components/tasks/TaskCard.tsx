"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Edit, Eye, Trash2 } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo?: { firstName: string; lastName: string };
}

interface TaskCardProps {
  task: Task;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function TaskCard({ task, onView, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold line-clamp-1">{task.title}</h3>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>

        <div className="space-y-2 mb-4">
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
              </div>
            )}
          </div>
        </div>

        {(onView || onEdit || onDelete) && (
          <div className="flex gap-2">
            {onView && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onView(task._id)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(task._id)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(task._id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
