//path: frontend/src/components/projects/TaskManagement.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Edit, Trash2, Clock, User, AlertCircle, CheckCircle, PlayCircle, PauseCircle, ListTodo, Eye } from "lucide-react";
import { tasksAPI, Task } from "@/lib/api/tasksAPI";
import { projectsAPI } from "@/lib/api/projectsAPI";
import { getAllEmployees } from "@/lib/api/index";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TaskManagementProps {
  projectId?: string;
  showProjectTasks?: boolean;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ projectId, showProjectTasks = false }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    assignedTo: "",
    dueDate: undefined as Date | undefined,
    estimatedHours: 0,
    tags: [] as string[]
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [projectId]);

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

  const fetchEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (!taskForm.assignedTo) {
      toast({
        title: "Error",
        description: "Please assign the task to someone",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo,
        assignedBy: user?._id || '',
        project: projectId || '',
        dueDate: taskForm.dueDate?.toISOString(),
        estimatedHours: taskForm.estimatedHours,
      };

      await tasksAPI.create(taskData);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (!taskForm.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        assignedTo: taskForm.assignedTo,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate?.toISOString(),
        estimatedHours: taskForm.estimatedHours,
        updatedBy: user?._id || '',
      };

      await tasksAPI.update(selectedTask._id, taskData);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await tasksAPI.delete(taskId);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
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

  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignedTo: "",
      dueDate: undefined,
      estimatedHours: 0,
      tags: []
    });
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      estimatedHours: task.estimatedHours || 0,
      tags: Array.isArray(task.tags) && task.tags.length > 0 && typeof task.tags[0] === 'object' 
        ? task.tags.map((t: any) => t.name) 
        : (task.tags || [])
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (task: Task) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  const getAssignedUserName = (task: Task) => {
    if (typeof task.assignedTo === 'object' && task.assignedTo) {
      return `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;
    }
    const assignedToId = typeof task.assignedTo === 'string' ? task.assignedTo : (task.assignedTo as any)?._id;
    const employee = employees.find(emp => emp._id === assignedToId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unassigned';
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
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map((status) => {
          const statusTasks = tasks.filter(task => task.status === status);
          
          return (
            <div key={status} className="space-y-4">
              <Card className={`border-t-4 ${getStatusBorderColor(status)}`}>
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
                  <Card key={task._id} className="hover:shadow-md transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
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
                              {format(new Date(task.dueDate), "MMM dd")}
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
                      {format(new Date(task.dueDate), "MMM dd, yyyy")}
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter task title"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Select value={taskForm.status} onValueChange={(value: Task["status"]) => setTaskForm({ ...taskForm, status: value })}>
                  <SelectTrigger className="col-span-3">
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(value: Task["priority"]) => setTaskForm({ ...taskForm, priority: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Assigned To</Label>
                <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {`${employee.firstName} ${employee.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskForm.dueDate ? format(taskForm.dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskForm.dueDate}
                      onSelect={(date) => setTaskForm({ ...taskForm, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimatedHours" className="text-right">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={taskForm.estimatedHours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask}>Save Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "kanban" ? "default" : "outline"} 
            onClick={() => setViewMode("kanban")}
            size="sm"
          >
            Kanban View
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            onClick={() => setViewMode("list")}
            size="sm"
          >
            List View
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanView 
          tasks={tasks} 
          onStatusChange={handleStatusChange}
          onEditTask={openEditDialog}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <ListView 
          tasks={tasks} 
          onStatusChange={handleStatusChange}
          onEditTask={openEditDialog}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">Title</Label>
              <Input
                id="edit-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="col-span-3"
                placeholder="Enter task title"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Description</Label>
              <Textarea
                id="edit-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="col-span-3"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select value={taskForm.status} onValueChange={(value: Task["status"]) => setTaskForm({ ...taskForm, status: value })}>
                <SelectTrigger className="col-span-3">
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Priority</Label>
              <Select value={taskForm.priority} onValueChange={(value: Task["priority"]) => setTaskForm({ ...taskForm, priority: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Assigned To</Label>
              <Select value={taskForm.assignedTo} onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {`${employee.firstName} ${employee.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskForm.dueDate ? format(taskForm.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={taskForm.dueDate}
                    onSelect={(date) => setTaskForm({ ...taskForm, dueDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-estimatedHours" className="text-right">Estimated Hours</Label>
              <Input
                id="edit-estimatedHours"
                type="number"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseInt(e.target.value) || 0 })}
                className="col-span-3"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTask}>Save Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Title:</Label>
                <div className="col-span-3">{selectedTask.title}</div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-medium">Description:</Label>
                <div className="col-span-3">{selectedTask.description || 'No description'}</div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status:</Label>
                <div className="col-span-3">
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {getStatusTitle(selectedTask.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Priority:</Label>
                <div className="col-span-3">
                  <Badge variant="outline" className={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Assigned To:</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {getAssignedUserName(selectedTask)}
                </div>
              </div>

              {selectedTask.dueDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Due Date:</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(selectedTask.dueDate), "PPP")}
                  </div>
                </div>
              )}

              {selectedTask.estimatedHours && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Estimated Hours:</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedTask.estimatedHours} hours
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created:</Label>
                <div className="col-span-3">
                  {new Date(selectedTask.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagement;
