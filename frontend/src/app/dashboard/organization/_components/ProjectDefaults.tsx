"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api/api";
import { withCsrf } from "@/lib/api/csrf";
import { errorMessage } from "@/lib/api/organizationAPI";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

type DefaultView = "grid" | "list" | "kanban";
type FileSharePermission = "project-members" | "department-members" | "all-users";

interface ProjectSettings {
  defaultView: DefaultView;
  autoAssignDepartments: boolean;
  requireApprovalForStatusChange: boolean;
  enableTaskDragDrop: boolean;
  fileSharePermissions: FileSharePermission;
}

const PROJECT_TOGGLES: Array<{ key: keyof Pick<ProjectSettings, "autoAssignDepartments" | "requireApprovalForStatusChange" | "enableTaskDragDrop">; label: string; hint: string }> = [
  { key: "autoAssignDepartments", label: "Auto-assign departments", hint: "Attach the owner's departments to new projects" },
  { key: "requireApprovalForStatusChange", label: "Approve status changes", hint: "Project status changes need a manager's approval" },
  { key: "enableTaskDragDrop", label: "Task drag and drop", hint: "Allow moving tasks between board columns" },
];

// Project defaults live on the /settings singleton behind settings.edit, so
// this card is shown only to holders of that permission.
export default function ProjectDefaults() {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  // The server replaces projectSettings wholesale, so fields this form does
  // not edit (defaultTaskColumns) are sent back as they were loaded.
  const [loaded, setLoaded] = useState<Record<string, unknown>>({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        const p = data?.projectSettings ?? {};
        setLoaded(p);
        setSettings({
          defaultView: p.defaultView ?? "grid",
          autoAssignDepartments: !!p.autoAssignDepartments,
          requireApprovalForStatusChange: !!p.requireApprovalForStatusChange,
          enableTaskDragDrop: p.enableTaskDragDrop !== false,
          fileSharePermissions: p.fileSharePermissions ?? "project-members",
        });
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const set = <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) =>
    setSettings(prev => prev && { ...prev, [key]: value });

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await withCsrf(headers => api.put("/settings", { projectSettings: { ...loaded, ...settings } }, { headers }));
      toast.success("Project defaults saved");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save project defaults"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Project defaults</CardTitle>
        <CardDescription>How new projects and their files behave across the organisation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadFailed ? (
          <p className="text-sm text-muted-foreground">Project defaults could not be loaded.</p>
        ) : !settings ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Default project view</Label>
                <Select value={settings.defaultView} onValueChange={v => set("defaultView", v as DefaultView)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Files can be shared with</Label>
                <Select value={settings.fileSharePermissions} onValueChange={v => set("fileSharePermissions", v as FileSharePermission)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project-members">Project members</SelectItem>
                    <SelectItem value="department-members">Department members</SelectItem>
                    <SelectItem value="all-users">All users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="divide-y rounded-lg border">
              {PROJECT_TOGGLES.map(toggle => (
                <div key={toggle.key} className="flex items-center justify-between gap-4 p-3">
                  <div>
                    <p className="text-sm font-medium">{toggle.label}</p>
                    <p className="text-xs text-muted-foreground">{toggle.hint}</p>
                  </div>
                  <Switch checked={settings[toggle.key]} onCheckedChange={checked => set(toggle.key, checked)} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save project defaults
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
