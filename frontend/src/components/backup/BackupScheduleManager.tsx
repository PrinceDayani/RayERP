'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  Database,
  FileText,
  HardDrive,
  Shield
} from 'lucide-react';

interface BackupSchedule {
  _id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  backupType: 'database' | 'files' | 'full' | 'incremental';
  modules: string[];
  isEncrypted: boolean;
  storageLocation: 'local' | 'cloud' | 'external';
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  retentionDays: number;
}

export default function BackupScheduleManager() {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '02:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
    backupType: 'full' as 'database' | 'files' | 'full' | 'incremental',
    modules: [] as string[],
    isEncrypted: false,
    storageLocation: 'local' as 'local' | 'cloud' | 'external',
    retentionDays: 30
  });

  const modules = [
    { id: 'hr', name: 'HR & Employees' },
    { id: 'projects', name: 'Projects & Tasks' },
    { id: 'finance', name: 'Finance & Accounting' },
    { id: 'contacts', name: 'Contacts & CRM' },
    { id: 'users', name: 'Users & Roles' },
    { id: 'system', name: 'System Settings' }
  ];

  const fetchSchedules = async () => {
    try {
      const api = (await import('@/lib/api/api')).default;
      const response = await api.get('/backup/schedules');
      setSchedules(response.data.schedules);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const api = (await import('@/lib/api/api')).default;
      
      // Calculate next run time
      const nextRun = calculateNextRun(formData.frequency, formData.time, formData.dayOfWeek, formData.dayOfMonth);
      
      const payload = {
        ...formData,
        nextRun
      };
      
      if (editingSchedule) {
        await api.put(`/backup/schedules/${editingSchedule._id}`, payload);
      } else {
        await api.post('/backup/schedules', payload);
      }

      toast({
        title: "Success",
        description: `Schedule ${editingSchedule ? 'updated' : 'created'} successfully`
      });
      setShowForm(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule",
        variant: "destructive"
      });
    }
  };

  const calculateNextRun = (frequency: string, time: string, dayOfWeek?: number, dayOfMonth?: number) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        const currentDay = nextRun.getDay();
        const daysUntilTarget = (dayOfWeek! - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case 'monthly':
        nextRun.setDate(dayOfMonth!);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun.toISOString();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      time: '02:00',
      dayOfWeek: 0,
      dayOfMonth: 1,
      backupType: 'full',
      modules: [],
      isEncrypted: false,
      storageLocation: 'local',
      retentionDays: 30
    });
  };

  const handleEdit = (schedule: BackupSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek || 0,
      dayOfMonth: schedule.dayOfMonth || 1,
      backupType: schedule.backupType,
      modules: schedule.modules,
      isEncrypted: schedule.isEncrypted,
      storageLocation: schedule.storageLocation,
      retentionDays: schedule.retentionDays
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const api = (await import('@/lib/api/api')).default;
      await api.delete(`/backup/schedules/${id}`);

      toast({
        title: "Success",
        description: "Schedule deleted successfully"
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      });
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const api = (await import('@/lib/api/api')).default;
      await api.put(`/backup/schedules/${id}`, { isActive: !isActive });

      toast({
        title: "Success",
        description: `Schedule ${!isActive ? 'activated' : 'deactivated'}`
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'files': return <FileText className="h-4 w-4" />;
      case 'full': return <HardDrive className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Backup Schedules</h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSchedule ? 'Edit' : 'Create'} Backup Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
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
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="backupType">Backup Type</Label>
                  <Select value={formData.backupType} onValueChange={(value: any) => setFormData({ ...formData, backupType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database Only</SelectItem>
                      <SelectItem value="files">Files Only</SelectItem>
                      <SelectItem value="full">Full System</SelectItem>
                      <SelectItem value="incremental">Incremental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="retention">Retention (Days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    min="1"
                    value={formData.retentionDays}
                    onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule._id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(schedule.backupType)}
                    <h4 className="font-semibold">{schedule.name}</h4>
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {schedule.isEncrypted && (
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Frequency:</span>
                      <br />
                      {schedule.frequency} at {schedule.time}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <br />
                      {schedule.backupType}
                    </div>
                    <div>
                      <span className="font-medium">Next Run:</span>
                      <br />
                      {new Date(schedule.nextRun).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Retention:</span>
                      <br />
                      {schedule.retentionDays} days
                    </div>
                  </div>
                  
                  {schedule.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {schedule.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSchedule(schedule._id, schedule.isActive)}
                  >
                    {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(schedule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(schedule._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {schedules.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No backup schedules found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Create your first schedule to automate backups</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}