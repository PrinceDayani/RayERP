"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { FileText, Plus, Trash2 } from "lucide-react";

interface Template {
  _id: string;
  name: string;
  description: string;
  taskData: any;
  createdAt: Date;
}

interface TaskTemplatesProps {
  onTemplateSelected?: (template: Template) => void;
}

export function TaskTemplates({ onTemplateSelected }: TaskTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await tasksAPI.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      await tasksAPI.createFromTemplate(templateId);
      toast({ title: "Success", description: "Task created from template" });
      setShowDialog(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task from template", variant: "destructive" });
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <FileText className="h-4 w-4 mr-2" />
        Use Template
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Templates</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {templates.length > 0 ? (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template._id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <Badge variant="outline" className="mt-2">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template._id)}
                          disabled={loading}
                        >
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No templates available</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
