'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ListTodo, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { useTaskContext } from '@/contexts/TaskContext';

export default function TaskStats() {
  const { computed } = useTaskContext();
  const { stats } = computed;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <ListTodo className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
            <div className="flex items-center gap-2">
              <Progress value={stats.completionRate} className="flex-1" />
              <span className="text-sm font-bold">{stats.completionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
