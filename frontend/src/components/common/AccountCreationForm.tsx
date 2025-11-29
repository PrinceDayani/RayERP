'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Save } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'switch';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  section?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface FormSection {
  id: string;
  label: string;
  fields: FormField[];
}

interface AccountCreationFormProps {
  sections: FormSection[];
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  loading?: boolean;
}

export default function AccountCreationForm({ sections, onSubmit, initialData, loading }: AccountCreationFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (name: string, value: any) => {
    const keys = name.split('.');
    if (keys.length > 1) {
      setFormData((prev: any) => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const getValue = (name: string) => {
    const keys = name.split('.');
    return keys.length > 1 ? formData[keys[0]]?.[keys[1]] : formData[name];
  };

  const renderField = (field: FormField) => {
    const value = getValue(field.name) ?? '';

    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
          />
        );
      case 'switch':
        return (
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleChange(field.name, checked)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            required={field.required}
          />
        );
      default:
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue={sections[0]?.id} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>{section.label}</TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && '*'}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => setFormData(initialData || {})}>
          Reset
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
        </Button>
      </div>
    </form>
  );
}
