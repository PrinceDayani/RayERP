"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Plus, X, Users } from "lucide-react";

interface Watcher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface TaskWatchersProps {
  taskId: string;
  watchers: Watcher[];
  onWatchersUpdated?: () => void;
}

export function TaskWatchers({ taskId, watchers, onWatchersUpdated }: TaskWatchersProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      // Handle both array and object responses
      const employeeList = Array.isArray(data) ? data : (data.data || data.employees || []);
      setEmployees(employeeList);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
  };

  const availableEmployees = Array.isArray(employees) 
    ? employees.filter((emp) => !watchers?.some((w) => w._id === emp._id))
    : [];

  const handleAddWatcher = async () => {
    if (!selectedUserId) return;

    try {
      setLoading(true);
      await tasksAPI.addWatcher(taskId, selectedUserId);
      toast({ title: "Success", description: "Watcher added" });
      setSelectedUserId("");
      setShowAddDialog(false);
      onWatchersUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add watcher", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWatcher = async (userId: string) => {
    try {
      await tasksAPI.removeWatcher(taskId, userId);
      toast({ title: "Success", description: "Watcher removed" });
      onWatchersUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove watcher", variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Watchers ({watchers?.length || 0})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {watchers && watchers.length > 0 ? (
            <div className="space-y-2">
              {watchers.map((watcher) => (
                <div key={watcher._id} className="flex items-center justify-between p-2 border rounded-lg group">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {watcher.firstName?.[0]}
                        {watcher.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {watcher.firstName} {watcher.lastName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWatcher(watcher._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No watchers</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Watcher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Watchers will receive notifications about task updates
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddWatcher} disabled={loading || !selectedUserId}>
              {loading ? "Adding..." : "Add Watcher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
