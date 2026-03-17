"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Settings } from "lucide-react";

interface CustomField {
  _id?: string;
  fieldName: string;
  fieldType: "text" | "number" | "date" | "boolean" | "select";
  value: any;
  options?: string[];
}

interface TaskCustomFieldsProps {
  taskId: string;
  customFields: CustomField[];
  onCustomFieldsUpdated?: () => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Dropdown" },
];

export function TaskCustomFields({ taskId, customFields, onCustomFieldsUpdated }: TaskCustomFieldsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldType: "text" as CustomField["fieldType"],
    value: "",
    options: "",
  });

  const handleAddField = async () => {
    if (!formData.fieldName.trim()) return;

    try {
      setLoading(true);
      const field: any = {
        fieldName: formData.fieldName,
        fieldType: formData.fieldType,
        value: formData.value,
      };

      if (formData.fieldType === "select" && formData.options) {
        field.options = formData.options.split(",").map((o) => o.trim());
      }

      await tasksAPI.addCustomField(taskId, field);
      toast({ title: "Success", description: "Custom field added" });
      setFormData({ fieldName: "", fieldType: "text", value: "", options: "" });
      setShowAddDialog(false);
      onCustomFieldsUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add custom field", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveField = async (fieldName: string) => {
    try {
      await tasksAPI.removeCustomField(taskId, fieldName);
      toast({ title: "Success", description: "Custom field removed" });
      onCustomFieldsUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove custom field", variant: "destructive" });
    }
  };

  const renderFieldValue = (field: CustomField) => {
    switch (field.fieldType) {
      case "boolean":
        return field.value ? "Yes" : "No";
      case "date":
        return field.value ? new Date(field.value).toLocaleDateString() : "—";
      default:
        return field.value || "—";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Custom Fields
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customFields && customFields.length > 0 ? (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={field._id || index} className="p-3 border rounded-lg group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{field.fieldName}</p>
                      <p className="text-sm font-medium mt-1">{renderFieldValue(field)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.fieldName)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No custom fields</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name *</Label>
              <Input
                id="fieldName"
                value={formData.fieldName}
                onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                placeholder="Enter field name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type *</Label>
              <Select
                value={formData.fieldType}
                onValueChange={(value: any) => setFormData({ ...formData, fieldType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.fieldType === "select" && (
              <div className="space-y-2">
                <Label htmlFor="options">Options (comma-separated) *</Label>
                <Input
                  id="options"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {formData.fieldType === "boolean" ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="value"
                    checked={formData.value === "true"}
                    onCheckedChange={(checked) => setFormData({ ...formData, value: checked ? "true" : "false" })}
                  />
                  <label htmlFor="value" className="text-sm cursor-pointer">
                    Yes
                  </label>
                </div>
              ) : formData.fieldType === "date" ? (
                <Input
                  id="value"
                  type="date"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              ) : formData.fieldType === "number" ? (
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Enter number"
                />
              ) : formData.fieldType === "select" ? (
                <Select value={formData.value} onValueChange={(value) => setFormData({ ...formData, value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.options.split(",").map((opt, i) => (
                      <SelectItem key={i} value={opt.trim()}>
                        {opt.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Enter value"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddField} disabled={loading || !formData.fieldName.trim()}>
              {loading ? "Adding..." : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
