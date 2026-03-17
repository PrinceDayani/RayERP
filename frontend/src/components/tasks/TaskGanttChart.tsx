"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, ZoomIn, ZoomOut } from "lucide-react";
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  estimatedHours?: number;
  assignedTo?: any;
  project?: any;
}

interface TaskGanttChartProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskGanttChart({ tasks, onTaskClick }: TaskGanttChartProps) {
  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const getTaskDuration = (task: Task): number => {
    if (!task.dueDate) return 1;
    const start = parseISO(task.createdAt);
    const end = parseISO(task.dueDate);
    const days = differenceInDays(end, start);
    return Math.max(days, 1);
  };

  const getTaskStartDate = (task: Task): Date => {
    return parseISO(task.createdAt);
  };

  const getTaskEndDate = (task: Task): Date => {
    return task.dueDate ? parseISO(task.dueDate) : addDays(parseISO(task.createdAt), 1);
  };

  const getDateRange = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getTaskPosition = (task: Task, dateRange: Date[]) => {
    const taskStart = getTaskStartDate(task);
    const taskEnd = getTaskEndDate(task);
    const rangeStart = dateRange[0];
    const rangeEnd = dateRange[dateRange.length - 1];

    const startOffset = Math.max(0, differenceInDays(taskStart, rangeStart));
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    const totalDays = dateRange.length;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-400",
      "in-progress": "bg-blue-500",
      review: "bg-purple-500",
      completed: "bg-green-500",
      blocked: "bg-red-500",
    };
    return colors[status] || "bg-gray-400";
  };

  const getPriorityBorder = (priority: string) => {
    const borders: Record<string, string> = {
      critical: "border-l-4 border-red-600",
      high: "border-l-4 border-orange-500",
      medium: "border-l-4 border-yellow-500",
      low: "border-l-4 border-green-500",
    };
    return borders[priority] || "border-l-4 border-gray-400";
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const dateRange = getDateRange();
  const visibleTasks = tasks.filter((task) => {
    const taskStart = getTaskStartDate(task);
    const taskEnd = getTaskEndDate(task);
    const rangeStart = dateRange[0];
    const rangeEnd = dateRange[dateRange.length - 1];
    return taskEnd >= rangeStart && taskStart <= rangeEnd;
  });

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gantt Chart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={zoom} onValueChange={(value: any) => setZoom(value)}>
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

      {/* Gantt Chart */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto" ref={containerRef}>
            {/* Timeline Header */}
            <div className="flex border-b bg-muted/50 sticky top-0 z-10">
              <div className="w-64 flex-shrink-0 p-3 border-r font-semibold">
                Task
              </div>
              <div className="flex-1 flex">
                {dateRange.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 min-w-[40px] p-2 text-center text-xs border-r"
                  >
                    <div className="font-semibold">{format(date, "d")}</div>
                    <div className="text-muted-foreground">{format(date, "EEE")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            <div className="relative">
              {visibleTasks.length > 0 ? (
                visibleTasks.map((task, index) => {
                  const position = getTaskPosition(task, dateRange);
                  return (
                    <div
                      key={task._id}
                      className="flex border-b hover:bg-muted/50 transition-colors"
                    >
                      {/* Task Info */}
                      <div className="w-64 flex-shrink-0 p-3 border-r">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {task.status}
                              </Badge>
                              {task.assignedTo && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {task.assignedTo.firstName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Bar */}
                      <div className="flex-1 relative p-3">
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-8 rounded ${getStatusColor(
                            task.status
                          )} ${getPriorityBorder(
                            task.priority
                          )} cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2`}
                          style={position}
                          onClick={() => onTaskClick?.(task)}
                        >
                          <span className="text-xs text-white font-medium truncate">
                            {task.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks to display</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="font-semibold">Status:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span>To Do</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span>Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
