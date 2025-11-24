"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useUserAssignments } from '@/hooks/useUserAssignments';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  projectName: string;
}

export function AssignedTaskList() {
  const { user } = useAuth();
  const { assignments, loading } = useUserAssignments();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user || loading) return;

    const taskAssignments = assignments.filter(a => a.resourceType === 'task');
    
    const fetchTasks = async () => {
      try {
        const taskPromises = taskAssignments.map(async (assignment) => {
          const response = await fetch(`/api/tasks/${assignment.resourceId}`);
          return response.json();
        });
        
        const taskData = await Promise.all(taskPromises);
        setTasks(taskData);
      } catch (error) {
        console.error('Failed to fetch assigned tasks:', error);
      }
    };

    if (taskAssignments.length > 0) {
      fetchTasks();
    }
  }, [user, assignments, loading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No tasks assigned to you</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(task.status)}
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.projectName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getPriorityColor(task.priority) as any}>
                  {task.priority}
                </Badge>
                <Badge variant="outline">
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
