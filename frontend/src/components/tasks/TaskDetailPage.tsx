"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  Users, 
  Tag, 
  CheckSquare, 
  Paperclip, 
  MessageSquare, 
  Play, 
  Square as StopIcon,
  Download,
  Link2,
  AlertCircle,
  TrendingUp,
  FileText,
  Plus,
  X,
  Copy
} from "lucide-react";
import { TaskCloneDialog } from "./TaskCloneDialog";
import { TaskComments } from "./TaskComments";
import { TaskTags } from "./TaskTags";
import { TaskAttachments } from "./TaskAttachments";
import { TaskChecklist } from "./TaskChecklist";
import { TaskSubtasks } from "./TaskSubtasks";
import { TaskDependencies } from "./TaskDependencies";
import { TaskWatchers } from "./TaskWatchers";
import { TaskCustomFields } from "./TaskCustomFields";
import { TaskRecurring } from "./TaskRecurring";
import { TaskTimeTracking } from "./TaskTimeTracking";
import { TaskActivityTimeline } from "./TaskActivityTimeline";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface TaskDetailPageProps {
  taskId: string;
}

export default function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await tasksAPI.getById(taskId);
      setTask(data);
      setActiveTimer(data.timeEntries?.find((e: any) => !e.endTime) || null);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({ title: "Error", description: "Failed to load task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      await tasksAPI.startTimer(taskId, user?._id || "");
      toast({ title: "Success", description: "Timer started" });
      fetchTask();
    } catch (error) {
      toast({ title: "Error", description: "Failed to start timer", variant: "destructive" });
    }
  };

  const handleStopTimer = async () => {
    try {
      await tasksAPI.stopTimer(taskId, user?._id || "");
      toast({ title: "Success", description: "Timer stopped" });
      fetchTask();
    } catch (error) {
      toast({ title: "Error", description: "Failed to stop timer", variant: "destructive" });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setAddingComment(true);
      await tasksAPI.addComment(taskId, newComment, user?._id || "");
      setNewComment("");
      toast({ title: "Success", description: "Comment added" });
      fetchTask();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    } finally {
      setAddingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await tasksAPI.delete(taskId);
      toast({ title: "Success", description: "Task deleted" });
      router.back();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-green-500 text-white",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500 text-white";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      todo: "bg-gray-500",
      "in-progress": "bg-blue-500",
      review: "bg-purple-500",
      completed: "bg-green-500",
      blocked: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getTotalTimeLogged = () => {
    return task?.timeEntries?.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) || 0;
  };

  const getChecklistProgress = () => {
    if (!task?.checklist?.length) return 0;
    const completed = task.checklist.filter((c: any) => c.completed).length;
    return Math.round((completed / task.checklist.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Task not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold">{task.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  {task.taskType && (
                    <Badge variant="outline">{task.taskType === "individual" ? "Individual" : "Project"}</Badge>
                  )}
                  {task.assignmentType === "self-assigned" && (
                    <Badge variant="outline">Self-Assigned</Badge>
                  )}
                  {task.isRecurring && <Badge variant="outline">🔄 Recurring</Badge>}
                  {task.isTemplate && <Badge variant="outline">📋 Template</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {activeTimer ? (
                <Button variant="destructive" onClick={handleStopTimer}>
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              ) : (
                <Button variant="default" onClick={handleStartTimer}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push(`/dashboard/tasks/${taskId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => setShowCloneDialog(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Clone
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {task.description || "No description provided"}
                </p>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="comments">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments ({task.comments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="checklist">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Checklist ({task.checklist?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="time">
                  <Clock className="h-4 w-4 mr-2" />
                  Time
                </TabsTrigger>
                <TabsTrigger value="files">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Files ({task.attachments?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-4">
                <TaskComments taskId={taskId} comments={task.comments || []} onCommentAdded={fetchTask} />
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist">
                <TaskChecklist taskId={taskId} checklist={task.checklist || []} onChecklistUpdated={fetchTask} />
              </TabsContent>

              {/* Time Tab */}
              <TabsContent value="time">
                <TaskTimeTracking
                  taskId={taskId}
                  timeEntries={task.timeEntries || []}
                  estimatedHours={task.estimatedHours}
                  activeTimer={activeTimer}
                  onTimeUpdated={fetchTask}
                />
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files">
                <TaskAttachments taskId={taskId} attachments={task.attachments || []} onAttachmentsUpdated={fetchTask} />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <TaskActivityTimeline
                  taskId={taskId}
                  activities={task.activityLog || []}
                  onRefresh={fetchTask}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {task.assignedTo?.firstName?.[0]}{task.assignedTo?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                    </span>
                  </div>
                </div>

                {task.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                {task.project && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Project</p>
                    <span className="text-sm font-medium">
                      {typeof task.project === "object" ? task.project.name : task.project}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <TaskTags taskId={taskId} tags={task.tags || []} onTagsUpdated={fetchTask} />

            {/* Watchers */}
            <TaskWatchers taskId={taskId} watchers={task.watchers || []} onWatchersUpdated={fetchTask} />

            {/* Dependencies */}
            <TaskDependencies 
              taskId={taskId} 
              dependencies={task.dependencies || []} 
              projectId={task.project?._id}
              onDependenciesUpdated={fetchTask} 
            />

            {/* Subtasks */}
            <TaskSubtasks taskId={taskId} subtasks={task.subtasks || []} onSubtasksUpdated={fetchTask} />

            {/* Custom Fields */}
            <TaskCustomFields taskId={taskId} customFields={task.customFields || []} onCustomFieldsUpdated={fetchTask} />

            {/* Recurring */}
            <TaskRecurring 
              taskId={taskId} 
              isRecurring={task.isRecurring}
              recurrencePattern={task.recurrencePattern}
              nextRecurrence={task.nextRecurrence}
              onRecurringUpdated={fetchTask}
            />
          </div>
        </div>
      </div>

      {/* Clone Dialog */}
      <TaskCloneDialog
        taskId={taskId}
        taskTitle={task.title}
        open={showCloneDialog}
        onOpenChange={setShowCloneDialog}
        onCloned={fetchTask}
      />
    </div>
  );
}
