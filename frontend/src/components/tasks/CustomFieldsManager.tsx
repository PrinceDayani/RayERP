'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomFieldsManagerProps {
  taskId: string;
  customFields?: any[];
  onUpdate?: () => void;
}

export default function CustomFieldsManager({ taskId, customFields = [], onUpdate }: CustomFieldsManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState({ name: '', type: 'text', value: '' });

  const handleAdd = async () => {
    if (!newField.name.trim()) return;
    
    try {
      const updatedFields = [...customFields, {
        fieldName: newField.name,
        fieldType: newField.type,
        value: newField.value
      }];
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customFields: updatedFields })
      });
      
      setNewField({ name: '', type: 'text', value: '' });
      setAdding(false);
      onUpdate?.();
    } catch (error) {
      console.error('Add field error:', error);
    }
  };

  const handleRemove = async (index: number) => {
    try {
      const updatedFields = customFields.filter((_, i) => i !== index);
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customFields: updatedFields })
      });
      
      onUpdate?.();
    } catch (error) {
      console.error('Remove field error:', error);
    }
  };

  const handleUpdate = async (index: number, value: string) => {
    try {
      const updatedFields = [...customFields];
      updatedFields[index].value = value;
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customFields: updatedFields })
      });
      
      onUpdate?.();
    } catch (error) {
      console.error('Update field error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Fields */}
      {customFields.map((field, index) => (
        <div key={index} className="space-y-2 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{field.fieldName}</div>
            <Button variant="ghost" size="sm" onClick={() => handleRemove(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Input
            placeholder="Value"
            value={field.value || ''}
            onChange={(e) => handleUpdate(index, e.target.value)}
          />
        </div>
      ))}

      {/* Add New */}
      {adding ? (
        <div className="space-y-2 p-3 border rounded-lg">
          <Input
            placeholder="Field name"
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
          />
          <Select value={newField.type} onValueChange={(v) => setNewField({ ...newField, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="select">Select</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Value"
            value={newField.value}
            onChange={(e) => setNewField({ ...newField, value: e.target.value })}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </Button>
      )}
    </div>
  );
}
