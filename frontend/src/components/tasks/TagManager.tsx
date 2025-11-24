'use client';

import { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import tasksAPI from '@/lib/api/tasksAPI';

interface TagManagerProps {
  taskId: string;
  tags?: { name: string; color: string }[];
  onUpdate?: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#ec4899'
];

export default function TagManager({ taskId, tags = [], onUpdate }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleAdd = async () => {
    if (!newTag.trim()) return;
    
    try {
      await tasksAPI.addTag(taskId, newTag.trim(), selectedColor);
      setNewTag('');
      setIsAdding(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to add tag:', error);
      alert(error.response?.data?.message || 'Failed to add tag');
    }
  };

  const handleRemove = async (name: string) => {
    try {
      await tasksAPI.removeTag(taskId, name);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to remove tag:', error);
      alert(error.response?.data?.message || 'Failed to remove tag');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge 
            key={tag.name} 
            style={{ backgroundColor: tag.color }}
            className="text-white"
          >
            {tag.name}
            <button
              onClick={() => handleRemove(tag.name)}
              className="ml-2 hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        {!isAdding && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Tag
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="space-y-2 p-3 border rounded-lg">
          <Input
            placeholder="Tag name"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
