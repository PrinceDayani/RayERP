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
import { Plus, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Risk {
  _id?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation?: string;
  status: 'identified' | 'mitigated' | 'resolved';
}

interface ProjectRisksProps {
  projectId: string;
  risks: Risk[];
  onUpdate: (risks: Risk[]) => void;
}

export const ProjectRisks: React.FC<ProjectRisksProps> = ({ projectId, risks, onUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRisk, setNewRisk] = useState<Risk>({
    title: '', description: '', severity: 'medium', probability: 'medium', status: 'identified'
  });

  const handleAddRisk = () => {
    if (!newRisk.title || !newRisk.description) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    onUpdate([...risks, newRisk]);
    setNewRisk({ title: '', description: '', severity: 'medium', probability: 'medium', status: 'identified' });
    setIsDialogOpen(false);
    toast({ title: "Risk added successfully" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'mitigated': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Risk Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Risk</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Risk</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={newRisk.title} onChange={(e) => setNewRisk({...newRisk, title: e.target.value})} />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea value={newRisk.description} onChange={(e) => setNewRisk({...newRisk, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Severity</Label>
                    <Select value={newRisk.severity} onValueChange={(v: any) => setNewRisk({...newRisk, severity: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Probability</Label>
                    <Select value={newRisk.probability} onValueChange={(v: any) => setNewRisk({...newRisk, probability: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Mitigation Plan</Label>
                  <Textarea value={newRisk.mitigation} onChange={(e) => setNewRisk({...newRisk, mitigation: e.target.value})} />
                </div>
                <Button onClick={handleAddRisk} className="w-full">Add Risk</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No risks identified</p>
        ) : (
          <div className="space-y-3">
            {risks.map((risk, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(risk.status)}
                    <h4 className="font-medium">{risk.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(risk.severity)}>{risk.severity}</Badge>
                    <Badge variant="outline">{risk.probability} prob</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{risk.description}</p>
                {risk.mitigation && (
                  <div className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded">
                    <span className="font-medium">Mitigation: </span>{risk.mitigation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
