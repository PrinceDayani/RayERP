"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Calendar, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export function TaskGoogleCalendarSync() {
  const [showDialog, setShowDialog] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    // Check if Google Calendar is connected (from localStorage or API)
    const token = localStorage.getItem("google_calendar_token");
    if (token) {
      setIsConnected(true);
      setAccessToken(token);
      loadCalendars(token);
    }
  };

  const loadCalendars = async (token: string) => {
    // Mock calendars - in production, fetch from Google Calendar API
    setCalendars([
      { id: "primary", summary: "Primary Calendar", primary: true },
      { id: "work", summary: "Work Calendar" },
      { id: "personal", summary: "Personal Calendar" },
    ]);
  };

  const handleConnect = () => {
    // In production, this would initiate OAuth flow
    // For now, simulate connection
    const mockToken = "mock_google_token_" + Date.now();
    localStorage.setItem("google_calendar_token", mockToken);
    setAccessToken(mockToken);
    setIsConnected(true);
    loadCalendars(mockToken);
    toast({ 
      title: "Success", 
      description: "Connected to Google Calendar" 
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem("google_calendar_token");
    setIsConnected(false);
    setAccessToken("");
    setCalendars([]);
    setSelectedCalendar("");
    toast({ 
      title: "Success", 
      description: "Disconnected from Google Calendar" 
    });
  };

  const handleSync = async () => {
    if (!selectedCalendar) {
      toast({ 
        title: "Error", 
        description: "Please select a calendar", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setSyncing(true);
      await tasksAPI.syncGoogleCalendar(accessToken, selectedCalendar);
      toast({ 
        title: "Success", 
        description: "Tasks synced to Google Calendar" 
      });
      setShowDialog(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to sync with Google Calendar", 
        variant: "destructive" 
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Button 
        variant={isConnected ? "default" : "outline"} 
        onClick={() => setShowDialog(true)}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {isConnected ? "Google Calendar" : "Connect Google Calendar"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar Sync
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Connection Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Not Connected</span>
                      </>
                    )}
                  </div>
                  {isConnected ? (
                    <Button variant="outline" size="sm" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleConnect}>
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {isConnected && (
              <>
                {/* Calendar Selection */}
                <div className="space-y-2">
                  <Label htmlFor="calendar">Select Calendar</Label>
                  <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>
                          {cal.summary}
                          {cal.primary && <Badge variant="secondary" className="ml-2">Primary</Badge>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Sync */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSync">Auto Sync</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync tasks when they change
                    </p>
                  </div>
                  <Switch
                    id="autoSync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                {/* Sync Info */}
                <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                  <p className="font-medium">What gets synced:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Task title and description</li>
                    <li>Due dates and times</li>
                    <li>Task status updates</li>
                    <li>Reminders (1 day before)</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {isConnected && (
              <Button onClick={handleSync} disabled={syncing || !selectedCalendar}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
