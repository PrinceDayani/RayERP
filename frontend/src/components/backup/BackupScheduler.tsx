'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trash2, Plus } from 'lucide-react';

interface Schedule {
  _id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  backupType: string;
  modules: string[];
  isActive: boolean;
  nextRun: string;
}

export default function BackupScheduler() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '02:00',
    backupType: 'full',
    modules: [] as string[],
    dayOfWeek: 0,
    dayOfMonth: 1
  });

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/backup/schedules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/backup/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchSchedules();
        setShowForm(false);
        setFormData({
          name: '',
          frequency: 'daily',
          time: '02:00',
          backupType: 'full',
          modules: [],
          dayOfWeek: 0,
          dayOfMonth: 1
        });
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/backup/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      
      if (response.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5" />
            Backup Scheduler
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-4 space-y-4">
              <Input
                placeholder="Schedule name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              
              <Select value={formData.backupType} onValueChange={(value) => setFormData({ ...formData, backupType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full System</SelectItem>
                  <SelectItem value="database">Database Only</SelectItem>
                  <SelectItem value="files">Files Only</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button onClick={createSchedule} size="sm">Create</Button>
                <Button onClick={() => setShowForm(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{schedule.name}</h4>
                  <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {schedule.frequency} at {schedule.time}
                  </span>
                  <span>{schedule.backupType}</span>
                  <span>Next: {new Date(schedule.nextRun).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                onClick={() => deleteSchedule(schedule._id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {schedules.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No scheduled backups</p>
              <p className="text-sm">Create your first backup schedule</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}