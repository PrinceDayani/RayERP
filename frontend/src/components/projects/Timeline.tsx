import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  estimatedHours?: number;
}

interface TimelineProps {
  tasks: Task[];
}

const Timeline: React.FC<TimelineProps> = ({ tasks }) => {
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Timeline</h3>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        {sortedTasks.map((task, index) => (
          <div key={task._id} className="relative flex items-start gap-4 pb-6">
            <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full">
              {getStatusIcon(task.status)}
            </div>
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.estimatedHours && (
                        <span className="text-xs text-muted-foreground">
                          {task.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
