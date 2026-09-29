"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { errorMessage, organizationAPI, type Holiday } from "@/lib/api/organizationAPI";
import { useCanManageOrganization } from "../_components/useCanManageOrganization";

type Draft = { id?: string; name: string; date: string; type: Holiday["type"]; description: string };

// Holiday dates are plain YYYY-MM-DD strings; format them without a timezone shift.
const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

const today = () => new Date().toLocaleDateString("en-CA");

export default function HolidaysPage() {
  const canManage = useCanManageOrganization();
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [copying, setCopying] = useState(false);

  const load = useCallback(async () => {
    setHolidays(null);
    try {
      setHolidays(await organizationAPI.listHolidays(year));
    } catch (error) {
      toast.error(errorMessage(error, "Could not load holidays"));
      setHolidays([]);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { id, ...fields } = draft;
      if (id) await organizationAPI.updateHoliday(id, fields);
      else await organizationAPI.createHoliday(fields);
      toast.success(id ? "Holiday updated" : "Holiday added");
      setDraft(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the holiday"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await organizationAPI.deleteHoliday(deleting._id);
      toast.success("Holiday removed");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove the holiday"));
    } finally {
      setDeleting(null);
    }
  };

  const copyToNextYear = async () => {
    setCopying(true);
    try {
      const { message } = await organizationAPI.copyHolidays(year, year + 1);
      toast.success(message);
      setYear(year + 1);
    } catch (error) {
      toast.error(errorMessage(error, "Could not copy holidays"));
    } finally {
      setCopying(false);
    }
  };

  const now = today();
  const publicCount = holidays?.filter(h => h.type === "public").length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Holiday calendar</CardTitle>
            <CardDescription>
              Public holidays are days off for everyone and are not charged as leave. Optional holidays are listed for reference.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous year" onClick={() => setYear(y => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-semibold tabular-nums">{year}</span>
            <Button variant="outline" size="icon" aria-label="Next year" onClick={() => setYear(y => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {canManage && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" disabled={copying || !holidays?.length} onClick={copyToNextYear}>
                  {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  Copy to {year + 1}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => setDraft({ name: "", date: `${year}-01-01`, type: "public", description: "" })}>
                  <Plus className="h-4 w-4" /> Add holiday
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!holidays ? (
          <Skeleton className="h-48 w-full" />
        ) : holidays.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No holidays on the calendar for {year}.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {publicCount} public · {holidays.length - publicCount} optional
            </p>
            <div className="divide-y rounded-lg border">
              {holidays.map(h => (
                <div key={h._id} className={`flex items-center gap-3 p-3 ${h.date < now ? "opacity-60" : ""}`}>
                  <span className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">{formatDay(h.date)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.name}</p>
                    {h.description && <p className="truncate text-xs text-muted-foreground">{h.description}</p>}
                  </div>
                  <Badge variant={h.type === "public" ? "default" : "outline"}>{h.type === "public" ? "Public" : "Optional"}</Badge>
                  {canManage && (
                    <div className="flex">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${h.name}`}
                        onClick={() => setDraft({ id: h._id, name: h.name, date: h.date, type: h.type, description: h.description || "" })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${h.name}`} onClick={() => setDeleting(h)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!draft} onOpenChange={open => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit holiday" : "Add holiday"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="holiday-name">Name</Label>
                <Input id="holiday-name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="holiday-date">Date</Label>
                <Input id="holiday-date" type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={draft.type} onValueChange={v => setDraft({ ...draft, type: v as Holiday["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (day off)</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="holiday-description">Note</Label>
                <Input id="holiday-description" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Leave requested from now on will count this date as a working day. Leaves already recorded keep their day counts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
