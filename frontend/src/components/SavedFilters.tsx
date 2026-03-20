import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    resourceType?: string;
    action?: string;
    status?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    userName?: string;
    projectName?: string;
  };
  createdAt: Date;
}

interface SavedFiltersProps {
  currentFilters: any;
  onApplyPreset: (filters: any) => void;
}

export const SavedFilters = ({ currentFilters, onApplyPreset }: SavedFiltersProps) => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('activityFilterPresets');
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({ title: 'Error', description: 'Please enter a preset name', variant: 'destructive' });
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: currentFilters,
      createdAt: new Date()
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('activityFilterPresets', JSON.stringify(updated));
    
    setPresetName('');
    setShowSaveDialog(false);
    toast({ title: 'Success', description: 'Filter preset saved' });
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('activityFilterPresets', JSON.stringify(updated));
    toast({ title: 'Deleted', description: 'Filter preset removed' });
  };

  const applyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters);
    toast({ title: 'Applied', description: `Loaded "${preset.name}" preset` });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Saved Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="gap-2"
        >
          <Save className="h-3 w-3" />
          Save Current
        </Button>
      </div>

      {showSaveDialog && (
        <div className="flex gap-2">
          <Input
            placeholder="Preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="h-8"
          />
          <Button size="sm" onClick={savePreset}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
        </div>
      )}

      <div className="space-y-2">
        {presets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved presets</p>
        ) : (
          presets.map(preset => (
            <div key={preset.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <button
                onClick={() => applyPreset(preset)}
                className="flex-1 text-left text-sm hover:text-primary"
              >
                <Star className="h-3 w-3 inline mr-2" />
                {preset.name}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePreset(preset.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
