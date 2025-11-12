'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Send } from 'lucide-react';
import { broadcastAPI } from '@/lib/api/broadcastAPI';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/api';

interface BroadcastDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function BroadcastDialog({ open, onClose }: BroadcastDialogProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'department' | 'webapp'>('department');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isRoot = (user as any)?.role?.name?.toLowerCase() === 'root';
  const isAdmin = ['root', 'super_admin', 'admin'].includes((user as any)?.role?.name?.toLowerCase());

  useEffect(() => {
    if (open && isAdmin) {
      loadDepartments();
    }
  }, [open, isAdmin]);

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    if (type === 'department' && !departmentId) return;

    try {
      setLoading(true);
      await broadcastAPI.sendBroadcast(content, type, type === 'department' ? departmentId : undefined);
      setContent('');
      setDepartmentId('');
      onClose();
    } catch (error) {
      console.error('Failed to send broadcast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Broadcast Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Broadcast Type</label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                {isRoot && <SelectItem value="webapp">Entire WebApp</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {type === 'department' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select Department</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Type your broadcast message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={loading || !content.trim() || (type === 'department' && !departmentId)}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Broadcast
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
