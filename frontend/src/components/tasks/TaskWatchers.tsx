"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { tasksAPI } from "@/lib/api/tasksAPI";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/use-toast";
import { Plus, X, Users } from "lucide-react";

// watchers[] references User, which carries `name`.
// See Documentation/identity-map.md.
interface Watcher {
  _id: string;
  name: string;
  email?: string;
}

interface TaskWatchersProps {
  taskId: string;
  watchers: Watcher[];
  onWatchersUpdated?: () => void;
}

export function TaskWatchers({ taskId, watchers, onWatchersUpdated }: TaskWatchersProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [users, setUsers] = useState<Watcher[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Watchers are Users, not Employees. This previously fetched employees over a
  // relative URL that resolved to the Next.js server rather than the API, so the
  // list was always empty - and had it succeeded it would have written Employee
  // ids into a User reference.
  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      const list = Array.isArray(data) ? data : data?.users ?? data?.data ?? [];
      setUsers(list);
    } catch {
      // Listing users requires the users.view permission.
      setUsers([]);
    }
  };

  const availableUsers = users.filter(
    (candidate) => !watchers?.some((w) => w._id === candidate._id)
  );

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
                        {(watcher.name || '')
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {watcher.name}
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
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((candidate) => (
                    <SelectItem key={candidate._id} value={candidate._id}>
                      {candidate.name}
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
