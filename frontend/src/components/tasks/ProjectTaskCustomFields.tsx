import React, { useState } from 'react';
import { Plus, X, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  value: any;
  options?: string[];
}

interface ProjectTaskCustomFieldsProps {
  taskId: string;
  customFields: CustomField[];
  onAdd: (field: CustomField) => Promise<void>;
  onUpdate: (fieldName: string, value: any) => Promise<void>;
  onRemove: (fieldName: string) => Promise<void>;
  readOnly?: boolean;
}

export const ProjectTaskCustomFields: React.FC<ProjectTaskCustomFieldsProps> = ({
  taskId,
  customFields,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newField, setNewField] = useState<CustomField>({
    fieldName: '',
    fieldType: 'text',
    value: '',
    options: []
  });
  const [editValue, setEditValue] = useState<any>('');

  const handleAddField = async () => {
    if (!newField.fieldName.trim()) return;
    
    try {
      await onAdd(newField);
      setNewField({ fieldName: '', fieldType: 'text', value: '', options: [] });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding custom field:', error);
    }
  };

  const handleUpdateField = async (fieldName: string) => {
    try {
      await onUpdate(fieldName, editValue);
      setEditingField(null);
    } catch (error) {
      console.error('Error updating custom field:', error);
    }
  };

  const renderFieldValue = (field: CustomField) => {
    if (editingField === field.fieldName) {
      return (
        <div className="flex items-center gap-2">
          {field.fieldType === 'select' ? (
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.fieldType === 'date' ? (
            <Input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1"
            />
          ) : field.fieldType === 'number' ? (
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1"
            />
          ) : (
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1"
            />
          )}
          <Button size="sm" onClick={() => handleUpdateField(field.fieldName)}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm">{field.value || 'Not set'}</span>
        {!readOnly && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditValue(field.value);
                setEditingField(field.fieldName);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(field.fieldName)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Custom Fields</CardTitle>
          {!readOnly && !isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {customFields.map((field) => (
          <div key={field.fieldName} className="space-y-2">
            <Label className="font-medium">{field.fieldName}</Label>
            {renderFieldValue(field)}
          </div>
        ))}

        {isAdding && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label>Field Name</Label>
              <Input
                value={newField.fieldName}
                onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                placeholder="e.g., Sprint, Environment"
              />
            </div>
            <div>
              <Label>Field Type</Label>
              <Select
                value={newField.fieldType}
                onValueChange={(value: any) => setNewField({ ...newField, fieldType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="multiselect">Multi-Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newField.fieldType === 'select' || newField.fieldType === 'multiselect') && (
              <div>
                <Label>Options (comma-separated)</Label>
                <Input
                  placeholder="Option 1, Option 2, Option 3"
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      options: e.target.value.split(',').map((s) => s.trim())
                    })
                  }
                />
              </div>
            )}
            <div>
              <Label>Initial Value</Label>
              {newField.fieldType === 'select' ? (
                <Select
                  value={newField.value}
                  onValueChange={(value) => setNewField({ ...newField, value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {newField.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : newField.fieldType === 'date' ? (
                <Input
                  type="date"
                  value={newField.value}
                  onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                />
              ) : newField.fieldType === 'number' ? (
                <Input
                  type="number"
                  value={newField.value}
                  onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                />
              ) : (
                <Input
                  value={newField.value}
                  onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                  placeholder="Enter value"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddField}>Add Field</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {customFields.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom fields added yet
          </p>
        )}
      </CardContent>
    </Card>
  );
};
