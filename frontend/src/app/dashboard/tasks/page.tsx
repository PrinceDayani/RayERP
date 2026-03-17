'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Download, LayoutGrid, Calendar, BarChart3, Search } from 'lucide-react';
import { useTaskContext } from '@/contexts/TaskContext';
import { Task } from '@/lib/api/tasksAPI';
import TaskStats from '@/components/tasks/TaskStats';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskDialogs from '@/components/tasks/TaskDialogs';
import { TieredAccessWrapper } from '@/components/common/TieredAccessWrapper';
import { TaskAdvancedSearch } from '@/components/tasks/TaskAdvancedSearch';
import { TaskTemplates } from '@/components/tasks/TaskTemplates';
import { TaskTimelineView } from '@/components/tasks/TaskTimelineView';
import { TaskGanttChart } from '@/components/tasks/TaskGanttChart';
import { DraggableTaskBoard } from '@/components/tasks/DraggableTaskBoard';
import { TaskCalendarExport } from '@/components/tasks/TaskCalendarExport';
import { TaskGoogleCalendarSync } from '@/components/tasks/TaskGoogleCalendarSync';
import { TaskStatsDashboard } from '@/components/tasks/TaskStatsDashboard';
import { TaskTypeSelector } from '@/components/tasks/TaskTypeSelector';
import { SavedSearchesManager } from '@/components/tasks/SavedSearchesManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TaskManagementPage() {
  const { computed, state, actions } = useTaskContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [commentingTask, setCommentingTask] = useState<Task | null>(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };
  
  const openViewDialog = (task: Task) => {
    setViewingTask(task);
    setIsViewDialogOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    openViewDialog(task);
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
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TieredAccessWrapper 
        title="Task Management" 
        hasBasicViewItems={hasBasicViewItems}
        showLegend={hasBasicViewItems}
        fullAccessCount={fullAccessCount}
        basicViewCount={basicViewCount}
      >
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary rounded-xl shadow-lg">
                  <LayoutGrid className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Task Management</h1>
                  <p className="text-sm text-muted-foreground">Organize and track your tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TaskTypeSelector onTaskCreated={() => window.location.reload()} />
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <TaskStats />

          {/* Toolbar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none text-sm"
                      value={state.filters.search}
                      onChange={(e) => actions.setFilters({ search: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SavedSearchesManager 
                    currentFilters={state.filters}
                    onApplySearch={(filters) => actions.setFilters(filters)}
                  />
                  <TaskAdvancedSearch onSearch={(filters) => console.log(filters)} />
                  <TaskTemplates />
                  <TaskCalendarExport />
                  <TaskGoogleCalendarSync />
                  <Button variant="outline" size="sm" onClick={exportTasks}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <TaskFilters />
          </Card>

          {/* Tabs & Content */}
          <Tabs defaultValue="board" className="w-full">
            <Card>
              <CardContent className="p-4">
                <TabsList className="w-full grid grid-cols-5 bg-muted">
                  <TabsTrigger value="board">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="kanban">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="gantt">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gantt
                  </TabsTrigger>
                  <TabsTrigger value="stats">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            <TabsContent value="board" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <TaskBoard onEditTask={openEditDialog} onCommentTask={openViewDialog} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kanban" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <DraggableTaskBoard 
                    tasks={computed.filteredTasks} 
                    onTaskClick={handleTaskClick} 
                    onTasksReordered={() => window.location.reload()} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <TaskTimelineView tasks={computed.filteredTasks} onTaskClick={handleTaskClick} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gantt" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <TaskGanttChart tasks={computed.filteredTasks} onTaskClick={handleTaskClick} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <TaskStatsDashboard tasks={computed.filteredTasks} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <TaskDialogs
          createDialog={{ open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen }}
          editDialog={{ open: isEditDialogOpen, onOpenChange: setIsEditDialogOpen, task: editingTask }}
          commentDialog={{ open: isCommentDialogOpen, onOpenChange: setIsCommentDialogOpen, task: commentingTask }}
          viewDialog={{ open: isViewDialogOpen, onOpenChange: setIsViewDialogOpen, task: viewingTask }}
        />
      </TieredAccessWrapper>
    </div>
  );
}
