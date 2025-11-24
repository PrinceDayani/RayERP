"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import tasksAPI, { type Task } from '@/lib/api/tasksAPI';
import Link from 'next/link';

export default function TaskSummary() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      const allTasks = await tasksAPI.getAll();
      // Filter tasks assigned to current user
      const myTasks = allTasks.filter((task: Task) => 
        task.assignedTo && 
        (typeof task.assignedTo === 'object' ? task.assignedTo._id === user?._id : task.assignedTo === user?._id)
      );
      setTasks(myTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'completed'
    ).length
  };

  const recentTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Tasks
          </div>
          <Link href="/dashboard/projects/my-tasks">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-600">{taskStats.todo}</div>
            <div className="text-xs text-gray-500">To Do</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-xs text-blue-500">In Progress</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-lg font-bold text-yellow-600">{taskStats.review}</div>
            <div className="text-xs text-yellow-500">Review</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-xs text-green-500">Completed</div>
          </div>
        </div>

        {/* Overdue Alert */}
        {taskStats.overdue > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">
              {taskStats.overdue} task{taskStats.overdue > 1 ? 's' : ''} overdue
            </span>
          </div>
        )}

        {/* Recent Tasks */}
        <div>
          <h4 className="text-sm font-medium mb-2">Upcoming Tasks</h4>
          {recentTasks.length > 0 ? (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      {typeof task.project === 'object' ? task.project.name : 'Unknown Project'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.dueDate && (
                      <div className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <Badge 
                      variant="secondary" 
                      className={
                        task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              No upcoming tasks
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
