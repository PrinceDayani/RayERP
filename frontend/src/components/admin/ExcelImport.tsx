"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api";
import { FileSpreadsheetIcon, UploadIcon, EyeIcon, Loader2Icon } from "lucide-react";

interface ImportReport {
  dryRun: boolean;
  project: { name: string; action: "created" | "existing" | "would-create" };
  roadmapTasks: { created: number; skipped: number };
  dailyTasks: { created: number; skipped: number };
  announcements: { created: number; skipped: number };
  ownerMatches: Record<string, string>;
  unmatchedOwners: string[];
}

interface ImportResponse {
  success: boolean;
  data: ImportReport;
  message: string;
}

export function ExcelImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"dry-run" | "import" | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  const runImport = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? "dry-run" : "import");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<ImportResponse>(
        `/data-import/erp-workbook?dryRun=${dryRun}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setReport(res.data.data);
      toast({ title: dryRun ? "Dry run complete" : "Import complete", description: res.data.message });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      toast({ title: "Import failed", description: message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload the Ray Infrastructures ERP workbook (.xlsx). Rows from the
        &quot;Strategic Roadmap&quot;, &quot;Daily Tasks&quot; and &quot;Announcements&quot; sheets are
        imported as project tasks, individual tasks and broadcasts. Already-imported rows are
        skipped, so re-uploading an updated workbook only adds what is new. Run a dry run first
        to preview the result.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setReport(null);
          }}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
          {file ? file.name : "Choose .xlsx file"}
        </Button>
        <Button variant="secondary" disabled={!file || busy !== null} onClick={() => runImport(true)}>
          {busy === "dry-run" ? <Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : <EyeIcon className="h-4 w-4 mr-2" />}
          Dry run
        </Button>
        <Button disabled={!file || busy !== null} onClick={() => runImport(false)}>
          {busy === "import" ? <Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : <UploadIcon className="h-4 w-4 mr-2" />}
          Import
        </Button>
      </div>

      {report && (
        <div className="space-y-3">
          <Alert>
            <AlertTitle>
              {report.dryRun ? "Dry run — nothing was written" : "Import applied"}
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  Project &quot;{report.project.name}&quot;: <Badge variant="outline">{report.project.action}</Badge>
                </div>
                <div>Roadmap tasks: {report.roadmapTasks.created} new, {report.roadmapTasks.skipped} already present</div>
                <div>Daily tasks: {report.dailyTasks.created} new, {report.dailyTasks.skipped} already present</div>
                <div>Announcements: {report.announcements.created} new, {report.announcements.skipped} already present</div>
              </div>
            </AlertDescription>
          </Alert>

          {Object.keys(report.ownerMatches).length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-1">Owners matched to existing users:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {Object.entries(report.ownerMatches).map(([label, name]) => (
                  <li key={label}>{label} &rarr; {name}</li>
                ))}
              </ul>
            </div>
          )}

          {report.unmatchedOwners.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Owners without a matching user</AlertTitle>
              <AlertDescription>
                Tasks for these owners were assigned to you and tagged
                &quot;owner:&lt;label&gt;&quot; so they can be reassigned once the user exists:{" "}
                {report.unmatchedOwners.join(", ")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
