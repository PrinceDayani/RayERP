"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Milestone {
  _id?: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedDate?: string;
}

interface ProjectMilestonesProps {
  projectId: string;
  milestones: Milestone[];
  onUpdate: (milestones: Milestone[]) => void;
}

export const ProjectMilestones: React.FC<ProjectMilestonesProps> = ({ projectId, milestones, onUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Milestone>({
    name: '', description: '', dueDate: '', status: 'pending'
  });

  const handleAddMilestone = () => {
    if (!newMilestone.name || !newMilestone.dueDate) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    onUpdate([...milestones, newMilestone]);
    setNewMilestone({ name: '', description: '', dueDate: '', status: 'pending' });
    setIsDialogOpen(false);
    toast({ title: "Milestone added successfully" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'delayed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Milestones</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Milestone</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newMilestone.description} onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})} />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone({...newMilestone, dueDate: e.target.value})} />
                </div>
                <Button onClick={handleAddMilestone} className="w-full">Add Milestone</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No milestones yet</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(milestone.status)}
                  <div>
                    <p className="font-medium">{milestone.name}</p>
                    <p className="text-sm text-muted-foreground">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>{milestone.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
