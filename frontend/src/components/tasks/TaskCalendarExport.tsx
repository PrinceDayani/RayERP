"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Download, Calendar } from "lucide-react";

interface TaskCalendarExportProps {
  selectedTaskIds?: string[];
}

export function TaskCalendarExport({ selectedTaskIds }: TaskCalendarExportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState({
    includeDescription: true,
    includeReminders: true,
    includeAttachments: false,
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Call API to export iCalendar
      const blob = await tasksAPI.exportICalendar(selectedTaskIds);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ 
        title: "Success", 
        description: "Calendar file exported successfully" 
      });
      setShowDialog(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to export calendar", 
        variant: "destructive" 
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <Calendar className="h-4 w-4 mr-2" />
        Export to Calendar
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export to iCalendar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Export {selectedTaskIds?.length ? `${selectedTaskIds.length} selected tasks` : "all tasks"} to an iCalendar (.ics) file that can be imported into any calendar application.
            </p>
            
            <div className="space-y-3">
              <Label>Export Options:</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="description"
                  checked={options.includeDescription}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeDescription: checked as boolean })
                  }
                />
                <label htmlFor="description" className="text-sm cursor-pointer">
                  Include task descriptions
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminders"
                  checked={options.includeReminders}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeReminders: checked as boolean })
                  }
                />
                <label htmlFor="reminders" className="text-sm cursor-pointer">
                  Include reminders (1 day before due date)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attachments"
                  checked={options.includeAttachments}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeAttachments: checked as boolean })
                  }
                />
                <label htmlFor="attachments" className="text-sm cursor-pointer">
                  Include attachment links
                </label>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Compatible with:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Google Calendar</li>
                <li>Apple Calendar</li>
                <li>Microsoft Outlook</li>
                <li>Any iCalendar-compatible application</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export Calendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
