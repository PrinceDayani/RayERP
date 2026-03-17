"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Clock, Play, Square, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TimeEntry {
  user: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
}

interface TaskTimeTrackingProps {
  taskId: string;
  timeEntries: TimeEntry[];
  estimatedHours?: number;
  activeTimer?: TimeEntry | null;
  onTimeUpdated?: () => void;
}

export function TaskTimeTracking({
  taskId,
  timeEntries,
  estimatedHours,
  activeTimer,
  onTimeUpdated,
}: TaskTimeTrackingProps) {
  const { user } = useAuth();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [description, setDescription] = useState("");
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const totalMinutes = timeEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const handleStartTimer = async () => {
    try {
      setStarting(true);
      await tasksAPI.startTimer(taskId, user?._id || "", description);
      toast({ title: "Success", description: "Timer started" });
      setDescription("");
      setShowStartDialog(false);
      onTimeUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to start timer", variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const handleStopTimer = async () => {
    try {
      setStopping(true);
      await tasksAPI.stopTimer(taskId, user?._id || "");
      toast({ title: "Success", description: "Timer stopped" });
      onTimeUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to stop timer", variant: "destructive" });
    } finally {
      setStopping(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTimer && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-700">Timer Running</p>
                  <p className="text-sm text-green-600">
                    Started: {new Date(activeTimer.startTime).toLocaleString()}
                  </p>
                  {activeTimer.description && (
                    <p className="text-sm text-green-600 mt-1">{activeTimer.description}</p>
                  )}
                </div>
                <Button variant="destructive" onClick={handleStopTimer} disabled={stopping}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          )}

          {!activeTimer && (
            <Button onClick={() => setShowStartDialog(true)} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Estimated</p>
              <p className="text-2xl font-bold">{estimatedHours || 0}h</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Logged</p>
              <p className="text-2xl font-bold">
                {totalHours}h {remainingMinutes}m
              </p>
            </div>
          </div>

          {timeEntries && timeEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Time Entries</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {timeEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {new Date(entry.startTime).toLocaleString()}
                      </p>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{entry.duration}m</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Timer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)} disabled={starting}>
              Cancel
            </Button>
            <Button onClick={handleStartTimer} disabled={starting}>
              {starting ? "Starting..." : "Start Timer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
