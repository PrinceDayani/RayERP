"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api/api";
import { withCsrf } from "@/lib/api/csrf";
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

interface OrganizationForm {
  companyName: string;
  fiscalYearStart: string;
  currency: string;
  projectSettings: ProjectSettings;
}

const PROJECT_TOGGLES: Array<{ key: keyof Pick<ProjectSettings, "autoAssignDepartments" | "requireApprovalForStatusChange" | "enableTaskDragDrop">; label: string; hint: string }> = [
  { key: "autoAssignDepartments", label: "Auto-assign departments", hint: "Attach the owner's departments to new projects" },
  { key: "requireApprovalForStatusChange", label: "Approve status changes", hint: "Project status changes need a manager's approval" },
  { key: "enableTaskDragDrop", label: "Task drag and drop", hint: "Allow moving tasks between board columns" },
];

// Organisation-wide values from /api/settings. Only rendered for users holding
// settings.edit; the server enforces the same permission on every call.
export default function OrganizationSettings() {
  const [form, setForm] = useState<OrganizationForm | null>(null);
  // The server replaces projectSettings wholesale, so fields this form does
  // not edit (defaultTaskColumns) are sent back as they were loaded.
  const [loadedProjectSettings, setLoadedProjectSettings] = useState<Record<string, unknown>>({});
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        setLoadedProjectSettings(data?.projectSettings ?? {});
        setForm({
          companyName: data?.companyName ?? "",
          fiscalYearStart: data?.fiscalYearStart ?? "",
          currency: data?.currency ?? "",
          projectSettings: {
            defaultView: data?.projectSettings?.defaultView ?? "grid",
            autoAssignDepartments: !!data?.projectSettings?.autoAssignDepartments,
            requireApprovalForStatusChange: !!data?.projectSettings?.requireApprovalForStatusChange,
            enableTaskDragDrop: data?.projectSettings?.enableTaskDragDrop !== false,
            fileSharePermissions: data?.projectSettings?.fileSharePermissions ?? "project-members",
          },
        });
      })
      .catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed) {
    return <p className="text-sm text-muted-foreground">Organisation settings could not be loaded. Refresh to try again.</p>;
  }

  if (!form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const setProject = <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) =>
    setForm(prev => prev && { ...prev, projectSettings: { ...prev.projectSettings, [key]: value } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        companyName: form.companyName.trim(),
        fiscalYearStart: form.fiscalYearStart.trim(),
        currency: form.currency.trim().toUpperCase(),
        projectSettings: { ...loadedProjectSettings, ...form.projectSettings },
      };
      await withCsrf(headers => api.put("/settings", payload, { headers }));
      toast.success("Organisation settings saved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save organisation settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="org-company-name">Company name</Label>
          <Input
            id="org-company-name"
            value={form.companyName}
            onChange={e => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-fiscal-start">Fiscal year starts (DD-MM)</Label>
          <Input
            id="org-fiscal-start"
            value={form.fiscalYearStart}
            maxLength={5}
            onChange={e => setForm({ ...form, fiscalYearStart: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-currency">Base currency (ISO code)</Label>
          <Input
            id="org-currency"
            value={form.currency}
            maxLength={3}
            onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Project defaults</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Default project view</Label>
            <Select value={form.projectSettings.defaultView} onValueChange={v => setProject("defaultView", v as DefaultView)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Files can be shared with</Label>
            <Select value={form.projectSettings.fileSharePermissions} onValueChange={v => setProject("fileSharePermissions", v as FileSharePermission)}>
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
              <Switch
                checked={form.projectSettings[toggle.key]}
                onCheckedChange={checked => setProject(toggle.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
