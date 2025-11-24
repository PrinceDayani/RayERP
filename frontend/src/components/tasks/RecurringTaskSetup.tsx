'use client';

import { useState } from 'react';
import { Repeat, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface RecurringTaskSetupProps {
  taskId: string;
  isRecurring?: boolean;
  pattern?: string;
  onUpdate?: () => void;
}

export default function RecurringTaskSetup({ taskId, isRecurring = false, pattern = 'daily', onUpdate }: RecurringTaskSetupProps) {
  const [enabled, setEnabled] = useState(isRecurring);
  const [selectedPattern, setSelectedPattern] = useState(pattern);
  const [customDays, setCustomDays] = useState('7');

  const handleSave = async () => {
    try {
      const finalPattern = selectedPattern === 'custom' ? `custom:${customDays}` : selectedPattern;
      const tasksAPI = (await import('@/lib/api/tasksAPI')).default;
      await tasksAPI.setRecurring(taskId, finalPattern, enabled);
      onUpdate?.();
    } catch (error) {
      console.error('Recurring setup error:', error);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          <span className="font-medium">Recurring Task</span>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Repeat Pattern</label>
            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPattern === 'custom' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Every X Days</label>
              <Input
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Number of days"
              />
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Save Recurrence
          </Button>
        </div>
      )}
    </div>
  );
}
