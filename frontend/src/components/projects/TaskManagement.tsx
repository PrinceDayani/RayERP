//path: frontend/src/components/projects/TaskManagement.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Edit, Trash2, Clock, User, CheckCircle, PlayCircle, PauseCircle, ListTodo, Eye, Download, Calendar as CalendarViewIcon, GripVertical } from "lucide-react";
import { tasksAPI, Task } from "@/lib/api/tasksAPI";
import { projectsAPI } from "@/lib/api/projectsAPI";
import employeesAPI from "@/lib/api/employeesAPI";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import TaskDialogs from "@/components/tasks/TaskDialogs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectTaskFilters from "./ProjectTaskFilters";
import BulkActionsToolbar from "./BulkActionsToolbar";
import TaskCalendarView from "./TaskCalendarView";
import GanttChart from "@/components/tasks/GanttChart";
import { TaskAnalyticsDashboard } from "@/components/tasks/TaskAnalyticsDashboard";
import { exportFilteredTasks } from "@/utils/exportTasks";
import { AssignmentTypeIndicator } from "@/components/tasks/AssignmentTypeIndicator";

interface TaskManagementProps {
  projectId?: string;
  showProjectTasks?: boolean;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ projectId, showProjectTasks = false }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "calendar" | "gantt" | "analytics">("kanban");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    taskType: 'all',
    assignmentType: 'all',
    overdue: false
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [projectId]);

  const fetchEmployees = async () => {
    try {
      const data = await employeesAPI.getAll();
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = projectId 
        ? await projectsAPI.getTasks(projectId)
        : await tasksAPI.getAll();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const userId = user?._id || '';
      await tasksAPI.updateStatus(taskId, newStatus, userId);
      toast({
        title: "Success",
        description: "Task status updated",
      });
      fetchTasks();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (task: Task) => {
    // Navigate to full page instead of dialog
    router.push(`/dashboard/tasks/${task._id}`);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await tasksAPI.bulkUpdate(selectedTasks, { status });
      toast({ title: "Success", description: `${selectedTasks.length} tasks updated` });
      setSelectedTasks([]);
      fetchTasks();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update tasks", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.length} tasks?`)) return;
    try {
      await Promise.all(selectedTasks.map(id => tasksAPI.delete(id)));
      toast({ title: "Success", description: `${selectedTasks.length} tasks deleted` });
      setSelectedTasks([]);
      fetchTasks();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete tasks", variant: "destructive" });
    }
  };

  const handleBulkAssign = async (userId: string) => {
    try {
      await tasksAPI.bulkUpdate(selectedTasks, { assignedTo: userId });
      toast({ title: "Success", description: `${selectedTasks.length} tasks assigned` });
      setSelectedTasks([]);
      fetchTasks();
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign tasks", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    exportFilteredTasks(filteredTasks, filters);
    toast({ title: "Success", description: "Tasks exported to CSV" });
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assignee && filters.assignee !== 'all') {
      const assigneeId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
      if (assigneeId !== filters.assignee) return false;
    }
    if (filters.taskType && filters.taskType !== 'all' && (task as any).taskType !== filters.taskType) return false;
    if (filters.assignmentType && filters.assignmentType !== 'all' && (task as any).assignmentType !== filters.assignmentType) return false;
    if (filters.overdue) {
      if (!task.dueDate || task.status === 'completed') return false;
      if (new Date(task.dueDate) >= new Date()) return false;
    }
    return true;
  });

  const getAssignedUserName = (task: Task) => {
    if (typeof task.assignedTo === 'object' && task.assignedTo) {
      return `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
    }
    return 'Unassigned';
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case 'todo': return <ListTodo className="h-4 w-4" />;
      case 'in-progress': return <PlayCircle className="h-4 w-4" />;
      case 'review': return <PauseCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <ListTodo className="h-4 w-4" />;
    }
  };

  const getStatusTitle = (status: Task["status"]) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'review': return 'Review';
      case 'completed': return 'Completed';
      default: return 'To Do';
    }
  };

  const getStatusBorderColor = (status: Task["status"]) => {
    switch (status) {
      case 'todo': return 'border-t-gray-500';
      case 'in-progress': return 'border-t-blue-500';
      case 'review': return 'border-t-yellow-500';
      case 'completed': return 'border-t-green-500';
      default: return 'border-t-gray-500';
    }
  };

  const KanbanView = ({ tasks, onStatusChange, onEditTask, onDeleteTask }: {
    tasks: Task[];
    onStatusChange: (taskId: string, status: Task["status"]) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
  }) => {
    const statuses: Task["status"][] = ['todo', 'in-progress', 'review', 'completed'];
    
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTask(taskId);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
      setDraggedTask(null);
      setDraggedOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (status: string) => {
      setDraggedOverColumn(status);
    };

    const handleDragLeave = () => {
      setDraggedOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: Task["status"]) => {
      e.preventDefault();
      if (draggedTask) {
        const task = tasks.find(t => t._id === draggedTask);
        if (task && task.status !== newStatus) {
          await onStatusChange(draggedTask, newStatus);
        }
      }
      setDraggedTask(null);
      setDraggedOverColumn(null);
    };
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map((status) => {
          const statusTasks = tasks.filter(task => task.status === status);
          const isDraggedOver = draggedOverColumn === status;
          
          return (
            <div 
              key={status} 
              className="space-y-4"
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <Card className={`border-t-4 ${getStatusBorderColor(status)} ${isDraggedOver ? 'border-primary border-2' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getStatusIcon(status)}
                    {getStatusTitle(status)}
                    <Badge variant="secondary" className="ml-auto">
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <div className="space-y-3 min-h-[400px]">
                {statusTasks.map((task) => (
                  <Card 
                    key={task._id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onDragEnd={handleDragEnd}
                    className={`hover:shadow-md transition-all duration-200 cursor-move ${
                      draggedTask === task._id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <Checkbox
                              checked={selectedTasks.includes(task._id)}
                              onCheckedChange={() => toggleTaskSelection(task._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm leading-tight cursor-pointer" onClick={() => openViewDialog(task)}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <AssignmentTypeIndicator
                                  assignmentType={(task as any).assignmentType}
                                  taskType={(task as any).taskType}
                                  size="sm"
                                  showText={false}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {task.status !== 'completed' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                onClick={() => onStatusChange(task._id, 'completed')}
                                title="Mark as Complete"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => openViewDialog(task)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => onEditTask(task)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => onDeleteTask(task._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {task.estimatedHours && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimatedHours}h
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-20">{getAssignedUserName(task)}</span>
                          </div>
                        </div>
                        
                        <Select 
                          value={task.status} 
                          onValueChange={(value: Task["status"]) => onStatusChange(task._id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ListView = ({ tasks, onStatusChange, onEditTask, onDeleteTask }: {
    tasks: Task[];
    onStatusChange: (taskId: string, status: Task["status"]) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
  }) => (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  <Badge className={getStatusColor(task.status)}>
                    {getStatusTitle(task.status)}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-3">{task.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.estimatedHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {task.estimatedHours}h estimated
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {getAssignedUserName(task)}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {task.status !== 'completed' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 hover:text-green-800 border-green-200 hover:border-green-300"
                    onClick={() => onStatusChange(task._id, 'completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
                
                <Select value={task.status} onValueChange={(value: Task["status"]) => onStatusChange(task._id, value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={() => openViewDialog(task)}>
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" size="sm" onClick={() => onEditTask(task)}>
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" size="sm" onClick={() => onDeleteTask(task._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-muted-foreground">Manage and track project tasks</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "kanban" ? "default" : "outline"} 
            onClick={() => setViewMode("kanban")}
            size="sm"
          >
            Kanban
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            onClick={() => setViewMode("list")}
            size="sm"
          >
            List
          </Button>
          <Button 
            variant={viewMode === "calendar" ? "default" : "outline"} 
            onClick={() => setViewMode("calendar")}
            size="sm"
          >
            <CalendarViewIcon className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button 
            variant={viewMode === "gantt" ? "default" : "outline"} 
            onClick={() => setViewMode("gantt")}
            size="sm"
          >
            Gantt
          </Button>
          <Button 
            variant={viewMode === "analytics" ? "default" : "outline"} 
            onClick={() => setViewMode("analytics")}
            size="sm"
          >
            Analytics
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <ProjectTaskFilters
        filters={filters}
        onFilterChange={setFilters}
        employees={employees}
      />

      {viewMode === "kanban" ? (
        <KanbanView 
          tasks={filteredTasks} 
          onStatusChange={handleStatusChange}
          onEditTask={openEditDialog}
          onDeleteTask={(taskId) => {
            if (confirm("Are you sure you want to delete this task?")) {
              tasksAPI.delete(taskId).then(() => {
                toast({ title: "Success", description: "Task deleted successfully" });
                fetchTasks();
              }).catch(() => {
                toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
              });
            }
          }}
        />
      ) : viewMode === "calendar" ? (
        <TaskCalendarView
          tasks={filteredTasks}
          onTaskClick={openViewDialog}
        />
      ) : viewMode === "gantt" ? (
        <GanttChart projectId={projectId} />
      ) : viewMode === "analytics" ? (
        <TaskAnalyticsDashboard projectId={projectId} />
      ) : (
        <ListView 
          tasks={filteredTasks} 
          onStatusChange={handleStatusChange}
          onEditTask={openEditDialog}
          onDeleteTask={(taskId) => {
            if (confirm("Are you sure you want to delete this task?")) {
              tasksAPI.delete(taskId).then(() => {
                toast({ title: "Success", description: "Task deleted successfully" });
                fetchTasks();
              }).catch(() => {
                toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
              });
            }
          }}
        />
      )}

      <BulkActionsToolbar
        selectedTasks={selectedTasks}
        onClearSelection={() => setSelectedTasks([])}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkAssign={handleBulkAssign}
        employees={employees}
      />

      <TaskDialogs
        createDialog={{
          open: isCreateDialogOpen,
          onOpenChange: (open) => {
            setIsCreateDialogOpen(open);
            if (!open) fetchTasks();
          }
        }}
        editDialog={{
          open: isEditDialogOpen,
          onOpenChange: (open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setSelectedTask(null);
              fetchTasks();
            }
          },
          task: selectedTask
        }}
        commentDialog={{
          open: false,
          onOpenChange: () => {},
          task: null
        }}
      />
    </div>
  );
};

export default TaskManagement;
