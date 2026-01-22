'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Download } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useTaskContext } from '@/contexts/TaskContext';
import { Task } from '@/lib/api/tasksAPI';
import TaskStats from '@/components/tasks/TaskStats';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDialogs from '@/components/tasks/TaskDialogs';
import { TieredAccessWrapper } from '@/components/common/TieredAccessWrapper';

export default function TaskManagementPage() {
  const { computed, state } = useTaskContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [commentingTask, setCommentingTask] = useState<Task | null>(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);









  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };



  const openCommentDialog = (task: Task) => {
    setCommentingTask(task);
    setIsCommentDialogOpen(true);
  };

  const exportTasks = () => {
    const csvContent = computed.filteredTasks.map(task => 
      `"${task.title}","${task.status}","${task.priority}","${(task.assignedTo as any)?.firstName || ''} ${(task.assignedTo as any)?.lastName || ''}","${task.project?.name || ''}","${task.dueDate || ''}"`
    ).join('\n');
    
    const blob = new Blob([`Title,Status,Priority,Assignee,Project,Due Date\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };











  const hasBasicViewItems = computed.filteredTasks.some((task: any) => task.isBasicView);
  const fullAccessCount = computed.filteredTasks.filter((task: any) => !task.isBasicView).length;
  const basicViewCount = computed.filteredTasks.filter((task: any) => task.isBasicView).length;

  if (state.loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Task Board Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, col) => (
            <div key={col} className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-8" />
                </CardContent>
              </Card>
              {[...Array(3)].map((_, row) => (
                <Card key={row}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Skeleton className="h-4 w-4" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <TieredAccessWrapper 
        title="Task Management" 
        hasBasicViewItems={hasBasicViewItems}
        showLegend={hasBasicViewItems}
        fullAccessCount={fullAccessCount}
        basicViewCount={basicViewCount}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Manage and track project tasks across all projects</p>
            </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTasks}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

          <TaskStats />

          <TaskFilters />

          <TaskBoard 
            onEditTask={openEditDialog}
            onCommentTask={openCommentDialog}
          />

          <TaskDialogs
            createDialog={{
              open: isCreateDialogOpen,
              onOpenChange: setIsCreateDialogOpen
            }}
            editDialog={{
              open: isEditDialogOpen,
              onOpenChange: setIsEditDialogOpen,
              task: editingTask
            }}
            commentDialog={{
              open: isCommentDialogOpen,
              onOpenChange: setIsCommentDialogOpen,
              task: commentingTask
            }}
          />
        </div>
      </TieredAccessWrapper>
    </div>
  );
}
