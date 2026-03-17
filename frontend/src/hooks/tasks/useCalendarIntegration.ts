import { useState } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";

export function useCalendarIntegration() {
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const exportToICalendar = async (taskIds?: string[]) => {
    try {
      setExporting(true);
      const blob = await tasksAPI.exportICalendar(taskIds);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Calendar exported successfully" });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to export calendar", variant: "destructive" });
      return false;
    } finally {
      setExporting(false);
    }
  };

  const syncWithGoogleCalendar = async (accessToken: string, calendarId: string) => {
    try {
      setSyncing(true);
      await tasksAPI.syncGoogleCalendar(accessToken, calendarId);
      toast({ title: "Success", description: "Synced with Google Calendar" });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to sync with Google Calendar", variant: "destructive" });
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const getCalendarView = async (startDate: string, endDate: string) => {
    try {
      const data = await tasksAPI.getCalendarView(startDate, endDate);
      return data;
    } catch (error) {
      console.error("Failed to get calendar view:", error);
      return null;
    }
  };

  const getTimelineView = async (projectId?: string) => {
    try {
      const data = await tasksAPI.getTimelineView(projectId);
      return data;
    } catch (error) {
      console.error("Failed to get timeline view:", error);
      return null;
    }
  };

  return {
    exportToICalendar,
    syncWithGoogleCalendar,
    getCalendarView,
    getTimelineView,
    exporting,
    syncing,
  };
}
