'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

interface GroupSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  groups: any[];
  onGroupCreated?: () => void;
  placeholder?: string;
  className?: string;
}

export function GroupSelector({ value, onValueChange, groups, onGroupCreated, placeholder = "Select group", className }: GroupSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'assets',
    description: ''
  });

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/account-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        onValueChange(data.data._id);
        setShowDialog(false);
        setFormData({ code: '', name: '', type: 'assets', description: '' });
        onGroupCreated?.();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {groups.map((grp) => (
              <SelectItem key={grp._id} value={grp._id}>
                {grp.code} - {grp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="icon" variant="outline" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="e.g., GRP001" required />
            </div>
            <div>
              <Label>Group Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Current Assets" required />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="liabilities">Liabilities</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional description" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="button" onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
