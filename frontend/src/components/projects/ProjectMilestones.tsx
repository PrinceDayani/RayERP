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
import { Plus, CheckCircle, Clock, AlertCircle, Calendar, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Milestone {
  _id?: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedDate?: string;
}

/**
 * Milestones belong to a ProjectPhase, not to the project directly. The owning
 * phase persists the change through onUpdate.
 */
interface ProjectMilestonesProps {
  milestones: Milestone[];
  onUpdate: (milestones: Milestone[]) => void;
  readOnly?: boolean;
}

const STATUSES: Milestone['status'][] = ['pending', 'in-progress', 'completed', 'delayed'];

export const ProjectMilestones: React.FC<ProjectMilestonesProps> = ({
  milestones,
  onUpdate,
  readOnly = false
}) => {
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
  };

  const handleStatusChange = (index: number, status: Milestone['status']) => {
    onUpdate(milestones.map((m, i) => i === index
      ? { ...m, status, completedDate: status === 'completed' ? new Date().toISOString() : undefined }
      : m
    ));
  };

  const handleRemove = (index: number) => {
    onUpdate(milestones.filter((_, i) => i !== index));
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
          <CardTitle className="text-base">Milestones</CardTitle>
          {!readOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Milestone</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={newMilestone.dueDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddMilestone} className="w-full">Add Milestone</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">No milestones in this phase</p>
        ) : (
          <div className="space-y-2">
            {milestones.map((milestone, idx) => (
              <div key={milestone._id || idx} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {getStatusIcon(milestone.status)}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{milestone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {readOnly ? (
                    <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                      {milestone.status}
                    </Badge>
                  ) : (
                    <>
                      <Select
                        value={milestone.status}
                        onValueChange={(value) => handleStatusChange(idx, value as Milestone['status'])}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(idx)}
                        aria-label={`Remove milestone ${milestone.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
