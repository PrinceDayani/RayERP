"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, Settings } from "lucide-react";

interface TaskRecurringProps {
  taskId: string;
  isRecurring?: boolean;
  recurrencePattern?: any;
  nextRecurrence?: Date;
  onRecurringUpdated?: () => void;
}

export function TaskRecurring({
  taskId,
  isRecurring,
  recurrencePattern,
  nextRecurrence,
  onRecurringUpdated,
}: TaskRecurringProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(isRecurring || false);
  const [pattern, setPattern] = useState({
    frequency: recurrencePattern?.frequency || "daily",
    interval: recurrencePattern?.interval || 1,
    endDate: recurrencePattern?.endDate || "",
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const patternString = `${pattern.frequency}:${pattern.interval}${
        pattern.endDate ? `:${pattern.endDate}` : ""
      }`;
      await tasksAPI.setRecurring(taskId, patternString, enabled);
      toast({ title: "Success", description: "Recurring settings updated" });
      setShowDialog(false);
      onRecurringUpdated?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update recurring settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getRecurrenceDescription = () => {
    if (!isRecurring || !recurrencePattern) return "Not recurring";

    const { frequency, interval } = recurrencePattern;
    const intervalText = interval > 1 ? `every ${interval}` : "every";

    switch (frequency) {
      case "daily":
        return `Repeats ${intervalText} day${interval > 1 ? "s" : ""}`;
      case "weekly":
        return `Repeats ${intervalText} week${interval > 1 ? "s" : ""}`;
      case "monthly":
        return `Repeats ${intervalText} month${interval > 1 ? "s" : ""}`;
      case "yearly":
        return `Repeats ${intervalText} year${interval > 1 ? "s" : ""}`;
      default:
        return "Custom recurrence";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recurring Task
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowDialog(true)}>
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={isRecurring ? "default" : "secondary"}>
              {isRecurring ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          {isRecurring && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Pattern</p>
                <p className="text-sm font-medium">{getRecurrenceDescription()}</p>
              </div>
              {nextRecurrence && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Occurrence</p>
                  <p className="text-sm font-medium">
                    {new Date(nextRecurrence).toLocaleDateString()}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Recurring Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enable Recurring</Label>
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={pattern.frequency}
                    onValueChange={(value) => setPattern({ ...pattern, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Repeat Every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      value={pattern.interval}
                      onChange={(e) => setPattern({ ...pattern, interval: parseInt(e.target.value) || 1 })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {pattern.frequency === "daily" && "day(s)"}
                      {pattern.frequency === "weekly" && "week(s)"}
                      {pattern.frequency === "monthly" && "month(s)"}
                      {pattern.frequency === "yearly" && "year(s)"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={pattern.endDate}
                    onChange={(e) => setPattern({ ...pattern, endDate: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
