"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BulkOperationsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkOperations({ selectedIds, onClearSelection, onRefresh }: BulkOperationsProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateField, setUpdateField] = useState<string>("");
  const [updateValue, setUpdateValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/bulk/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: data.message });
        onClearSelection();
        onRefresh();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete departments", variant: "destructive" });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!updateField || !updateValue) {
      toast({ title: "Error", description: "Please select field and value", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/bulk/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds, updates: { [updateField]: updateValue } })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: data.message });
        onClearSelection();
        onRefresh();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update departments", variant: "destructive" });
    } finally {
      setLoading(false);
      setShowUpdateDialog(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-4 flex items-center gap-4 z-50 border">
        <span className="text-sm font-medium">{selectedIds.length} selected</span>
        <Button size="sm" variant="outline" onClick={() => setShowUpdateDialog(true)}>
          <Edit className="w-4 h-4 mr-2" /> Update
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.length} Departments?</DialogTitle>
          </DialogHeader>
          <p>This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {selectedIds.length} Departments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={updateField} onValueChange={setUpdateField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            {updateField === "status" && (
              <Select value={updateValue} onValueChange={setUpdateValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
