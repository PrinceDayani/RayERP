"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Send, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'project' | 'task';
  itemName: string;
  itemId: string;
}

export function AccessRequestDialog({ 
  open, 
  onOpenChange, 
  itemType, 
  itemName, 
  itemId 
}: AccessRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for requesting access.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Access request sent",
        description: `Your request for ${itemType} "${itemName}" has been sent to the project manager.`,
      });
      
      onOpenChange(false);
      setReason("");
      setUrgency("medium");
    } catch (error) {
      toast({
        title: "Failed to send request",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Request Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Requesting access to <span className="font-medium">{itemType}</span>: 
              <span className="font-semibold"> "{itemName}"</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can wait</SelectItem>
                <SelectItem value="medium">Medium - Normal priority</SelectItem>
                <SelectItem value="high">High - Urgent</SelectItem>
                <SelectItem value="critical">Critical - Immediate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Access</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need access to this project/task..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Requests are typically reviewed within 24 hours</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}