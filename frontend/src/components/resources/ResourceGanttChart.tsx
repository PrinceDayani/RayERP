'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface GanttTask {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  resources: Array<{
    employee: { _id: string; firstName: string; lastName: string };
    allocatedHours: number;
    role: string;
  }>;
  dependencies: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  project: { _id: string; name: string; color?: string };
}

interface ResourceGanttChartProps {
  tasks: GanttTask[];
  onTaskClick: (taskId: string) => void;
  onResourceClick: (employeeId: string) => void;
  onExport: () => void;
}

export default function ResourceGanttChart({ 
  tasks, 
  onTaskClick, 
  onResourceClick, 
  onExport 
}: ResourceGanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const projects = [...new Set(tasks.map(t => t.project._id))].map(id => 
    tasks.find(t => t.project._id === id)?.project
  ).filter(Boolean);

  const filteredTasks = selectedProject === 'all' 
    ? tasks 
    : tasks.filter(t => t.project._id === selectedProject);

  // Calculate date range
  const allDates = filteredTasks.flatMap(task => [
    new Date(task.startDate),
    new Date(task.endDate)
  ]);
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : addDays(new Date(), 30);

  // Generate time periods based on zoom level
  const getTimePeriods = () => {
    const periods = [];
    let current = new Date(minDate);
    
    while (current <= maxDate) {
      switch (zoomLevel) {
        case 'day':
          periods.push({
            date: new Date(current),
            label: format(current, 'dd'),
            fullLabel: format(current, 'MMM dd, yyyy')
          });
          current = addDays(current, 1);
          break;
        case 'week':
          const weekStart = startOfWeek(current, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
          periods.push({
            date: weekStart,
            label: format(weekStart, 'MMM dd'),
            fullLabel: `Week of ${format(weekStart, 'MMM dd, yyyy')}`
          });
          current = addDays(weekEnd, 1);
          break;
        case 'month':
          periods.push({
            date: new Date(current.getFullYear(), current.getMonth(), 1),
            label: format(current, 'MMM'),
            fullLabel: format(current, 'MMMM yyyy')
          });
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          break;
      }
    }
    return periods;
  };

  const timePeriods = getTimePeriods();
  const cellWidth = zoomLevel === 'day' ? 40 : zoomLevel === 'week' ? 80 : 120;

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    let startIndex = 0;
    let width = 0;

    switch (zoomLevel) {
      case 'day':
        startIndex = differenceInDays(taskStart, minDate);
        width = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
        break;
      case 'week':
        startIndex = Math.floor(differenceInDays(taskStart, minDate) / 7);
        width = Math.max(1, Math.ceil(differenceInDays(taskEnd, taskStart) / 7));
        break;
      case 'month':
        startIndex = (taskStart.getFullYear() - minDate.getFullYear()) * 12 + 
                    (taskStart.getMonth() - minDate.getMonth());
        width = Math.max(1, (taskEnd.getFullYear() - taskStart.getFullYear()) * 12 + 
                         (taskEnd.getMonth() - taskStart.getMonth()) + 1);
        break;
    }

    return {
      left: startIndex * cellWidth,
      width: width * cellWidth
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'not_started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resource Gantt Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project?._id} value={project?._id || ''}>
                    {project?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1 border rounded">
              <Button
                variant={zoomLevel === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setZoomLevel('day')}
              >
                Day
              </Button>
              <Button
                variant={zoomLevel === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setZoomLevel('week')}
              >
                Week
              </Button>
              <Button
                variant={zoomLevel === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setZoomLevel('month')}
              >
                Month
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex bg-muted/50 border-b">
            <div className="w-80 p-3 border-r font-medium">Task / Resources</div>
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="flex" style={{ width: timePeriods.length * cellWidth }}>
                {timePeriods.map((period, index) => (
                  <div
                    key={index}
                    className="border-r p-2 text-center text-sm font-medium"
                    style={{ width: cellWidth }}
                    title={period.fullLabel}
                  >
                    {period.label}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Tasks */}
          <ScrollArea className="max-h-[600px]">
            {filteredTasks.map((task) => {
              const position = getTaskPosition(task);
              
              return (
                <div key={task._id} className="border-b">
                  {/* Task Row */}
                  <div className="flex hover:bg-muted/30">
                    <div className="w-80 p-3 border-r">
                      <div className="flex items-center justify-between">
                        <div>
                          <div 
                            className="font-medium cursor-pointer hover:text-blue-600"
                            onClick={() => onTaskClick(task._id)}
                          >
                            {task.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.project.name}
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative p-2" style={{ width: timePeriods.length * cellWidth }}>
                      <div
                        className={`absolute top-2 h-6 rounded ${getStatusColor(task.status)} 
                                   opacity-80 cursor-pointer hover:opacity-100 transition-opacity`}
                        style={{
                          left: position.left,
                          width: position.width
                        }}
                        onClick={() => onTaskClick(task._id)}
                        title={`${task.name} (${format(new Date(task.startDate), 'MMM dd')} - ${format(new Date(task.endDate), 'MMM dd')})`}
                      >
                        <div className="h-full bg-white/20 rounded" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Resource Rows */}
                  {task.resources.map((resource, index) => (
                    <div key={index} className="flex hover:bg-muted/20 border-t border-dashed">
                      <div className="w-80 p-2 pl-8 border-r text-sm">
                        <div 
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => onResourceClick(resource.employee._id)}
                        >
                          {resource.employee.firstName} {resource.employee.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {resource.role} • {resource.allocatedHours}h/week
                        </div>
                      </div>
                      
                      <div className="flex-1 relative p-2" style={{ width: timePeriods.length * cellWidth }}>
                        <div
                          className="absolute top-2 h-4 bg-blue-200 border border-blue-300 rounded cursor-pointer"
                          style={{
                            left: position.left,
                            width: position.width
                          }}
                          onClick={() => onResourceClick(resource.employee._id)}
                          title={`${resource.employee.firstName} ${resource.employee.lastName} - ${resource.role}`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </ScrollArea>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>On Hold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span>Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
            <span>Resource Allocation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
