"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: string;
  priority?: string;
  assignees?: string[];
}

interface GanttChartProps {
  tasks: GanttTask[];
  title?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, title = "Project Timeline" }) => {
  const { timelineStart, timelineEnd, totalDays, monthHeaders } = useMemo(() => {
    if (!tasks.length) {
      const now = new Date();
      return {
        timelineStart: startOfMonth(now),
        timelineEnd: endOfMonth(now),
        totalDays: 30,
        monthHeaders: []
      };
    }

    const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    const start = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    const end = endOfMonth(new Date(Math.max(...dates.map(d => d.getTime()))));
    const days = differenceInDays(end, start) + 1;
    
    const months: { name: string; days: number }[] = [];
    let currentDate = start;
    while (currentDate <= end) {
      const monthEnd = endOfMonth(currentDate);
      const daysInView = differenceInDays(monthEnd > end ? end : monthEnd, currentDate) + 1;
      months.push({
        name: format(currentDate, "MMM yyyy"),
        days: daysInView
      });
      currentDate = addDays(monthEnd, 1);
    }

    return { timelineStart: start, timelineEnd: end, totalDays: days, monthHeaders: months };
  }, [tasks]);

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const startOffset = differenceInDays(taskStart, timelineStart);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-500',
      'in-progress': 'bg-blue-500',
      'pending': 'bg-yellow-500',
      'blocked': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (!tasks.length) {
    return (
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tasks to display in timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Month Headers */}
            <div className="flex border-b border-border mb-2">
              <div className="w-48 flex-shrink-0" />
              <div className="flex-1 flex">
                {monthHeaders.map((month, idx) => (
                  <div
                    key={idx}
                    className="text-center font-semibold text-sm py-2 border-l border-border"
                    style={{ width: `${(month.days / totalDays) * 100}%` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="space-y-2">
              {tasks.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div key={task.id} className="flex items-center group">
                    {/* Task Name */}
                    <div className="w-48 flex-shrink-0 pr-4">
                      <div className="text-sm font-medium truncate">{task.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                        {task.priority && (
                          <Badge variant="secondary" className="text-xs">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-12 bg-muted/30 rounded">
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded ${getStatusColor(task.status)} transition-all group-hover:h-10`}
                        style={position}
                      >
                        <div className="relative h-full">
                          {/* Progress Bar */}
                          <div
                            className="absolute inset-0 bg-white/30 rounded"
                            style={{ width: `${task.progress}%` }}
                          />
                          {/* Task Info Tooltip */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white px-2 truncate">
                              {task.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Blocked</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
