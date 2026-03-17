"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: any;
  project?: any;
  tags?: any[];
  createdAt: string;
  updatedAt: string;
}

interface TaskTimelineViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskTimelineView({ tasks, onTaskClick }: TaskTimelineViewProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    filterTasksByDate();
  }, [tasks, currentDate, viewMode]);

  const filterTasksByDate = () => {
    let startDate: Date;
    let endDate: Date;

    switch (viewMode) {
      case "day":
        startDate = new Date(currentDate);
        endDate = new Date(currentDate);
        break;
      case "week":
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
        break;
      case "month":
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
    }

    const filtered = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });

    setFilteredTasks(filtered);
  };

  const groupTasksByDate = () => {
    const grouped: Record<string, Task[]> = {};

    filteredTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(parseISO(task.dueDate), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });

    return grouped;
  };

  const getDateRange = () => {
    switch (viewMode) {
      case "day":
        return [currentDate];
      case "week":
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        });
      case "month":
        return eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        });
    }
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-500",
      "in-progress": "bg-blue-500",
      review: "bg-purple-500",
      completed: "bg-green-500",
      blocked: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const groupedTasks = groupTasksByDate();
  const dateRange = getDateRange();

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {dateRange.map((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const tasksForDate = groupedTasks[dateKey] || [];
          const isToday = isSameDay(date, new Date());

          return (
            <Card key={dateKey} className={isToday ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </h3>
                    {isToday && <Badge variant="default" className="mt-1">Today</Badge>}
                  </div>
                  <Badge variant="secondary">{tasksForDate.length} tasks</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {tasksForDate.length > 0 ? (
                  <div className="space-y-3">
                    {tasksForDate.map((task) => (
                      <Card
                        key={task._id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => onTaskClick?.(task)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {task.assignedTo && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>
                                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                                    </span>
                                  </div>
                                )}
                                {task.project && (
                                  <div className="flex items-center gap-1">
                                    <span>📁 {task.project.name}</span>
                                  </div>
                                )}
                              </div>
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.tags.map((tag: any, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      style={{ backgroundColor: tag.color, color: "white" }}
                                      className="text-xs"
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {task.assignedTo && (
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {task.assignedTo.firstName?.[0]}
                                  {task.assignedTo.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tasks scheduled for this day</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
