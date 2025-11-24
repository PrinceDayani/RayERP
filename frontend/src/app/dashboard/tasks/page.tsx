'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useTaskContext } from '@/contexts/TaskContext';
import { Task } from '@/lib/api/tasksAPI';
import TaskStats from '@/components/tasks/TaskStats';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDialogs from '@/components/tasks/TaskDialogs';

export default function TaskManagementPage() {
  const { computed } = useTaskContext();
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
      `"${task.title}","${task.status}","${task.priority}","${task.assignee?.name || ''}","${task.project?.name || ''}","${task.dueDate || ''}"`
    ).join('\n');
    
    const blob = new Blob([`Title,Status,Priority,Assignee,Project,Due Date\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };











  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
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
  );
}
