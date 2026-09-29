"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  describeWeeklyOffs, errorMessage, organizationAPI,
  type ScheduleFields, type ScheduleList, type WorkSchedule
} from "@/lib/api/organizationAPI";
import { ScheduleForm } from "../_components/ScheduleForm";
import { AssignmentsDialog } from "../_components/AssignmentsDialog";
import { useCanManageOrganization } from "../_components/useCanManageOrganization";

const fieldsOf = (s: ScheduleFields): ScheduleFields => ({
  name: s.name,
  description: s.description || "",
  startTime: s.startTime,
  endTime: s.endTime,
  lateGraceMinutes: s.lateGraceMinutes,
  halfDayHours: s.halfDayHours,
  fullDayHours: s.fullDayHours,
  breakMinutes: s.breakMinutes,
  weeklyOffs: s.weeklyOffs.map(o => ({ day: o.day, weeks: [...o.weeks] })),
});

export default function WorkingHoursPage() {
  const canManage = useCanManageOrganization();
  const [list, setList] = useState<ScheduleList | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [general, setGeneral] = useState<ScheduleFields | null>(null);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [editing, setEditing] = useState<{ id?: string; fields: ScheduleFields } | null>(null);
  const [savingShift, setSavingShift] = useState(false);
  const [assigning, setAssigning] = useState<WorkSchedule | null>(null);
  const [deleting, setDeleting] = useState<WorkSchedule | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await organizationAPI.listSchedules();
      setList(data);
      setGeneral(fieldsOf(data.general));
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loadFailed) return <p className="text-sm text-muted-foreground">Working hours could not be loaded. Refresh to try again.</p>;
  if (!list || !general) return <Skeleton className="h-96 w-full" />;

  const shifts = list.schedules.filter(s => !s.isDefault);

  const saveGeneral = async () => {
    setSavingGeneral(true);
    try {
      const { name: _name, description: _description, ...timings } = general;
      await organizationAPI.saveGeneralTimings(timings);
      toast.success("General timings saved");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save general timings"));
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveShift = async () => {
    if (!editing) return;
    setSavingShift(true);
    try {
      if (editing.id) await organizationAPI.updateSchedule(editing.id, editing.fields);
      else await organizationAPI.createSchedule(editing.fields);
      toast.success(editing.id ? "Shift updated" : "Shift created");
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the shift"));
    } finally {
      setSavingShift(false);
    }
  };

  const toggleActive = async (shift: WorkSchedule) => {
    try {
      await organizationAPI.updateSchedule(shift._id, { active: !shift.active });
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not change the shift"));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await organizationAPI.deleteSchedule(deleting._id);
      toast.success("Shift deleted");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete the shift"));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">General timings</CardTitle>
              <CardDescription>Apply to everyone who has no department or personal shift.</CardDescription>
            </div>
            {list.general.source === "built-in" && (
              <Badge variant="outline">Using standard defaults until saved</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScheduleForm value={general} onChange={setGeneral} disabled={!canManage} showName={false} />
          {canManage && (
            <div className="flex justify-end">
              <Button onClick={saveGeneral} disabled={savingGeneral} className="gap-2">
                {savingGeneral && <Loader2 className="h-4 w-4 animate-spin" />}
                Save general timings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Shifts</CardTitle>
              <CardDescription>
                Different timings for departments or individual employees. Order of precedence: employee, then department, then general.
              </CardDescription>
            </div>
            {canManage && (
              <Button size="sm" className="gap-1.5" onClick={() => setEditing({ fields: { ...fieldsOf(list.general), name: "", description: "" } })}>
                <Plus className="h-4 w-4" /> New shift
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No shifts yet. Everyone follows the general timings.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {shifts.map(shift => (
                <div key={shift._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{shift.name}</span>
                      {!shift.active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shift.startTime}–{shift.endTime} · late after {shift.lateGraceMinutes} min · half day under {shift.halfDayHours} h · {describeWeeklyOffs(shift.weeklyOffs)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {shift.departmentCount} department(s) · {shift.employeeCount} employee(s)
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setAssigning(shift)}>
                        <Users className="h-4 w-4" /> Assign
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(shift)}>
                        {shift.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${shift.name}`} onClick={() => setEditing({ id: shift._id, fields: fieldsOf(shift) })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${shift.name}`} onClick={() => setDeleting(shift)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Changes apply to attendance recorded from now on; existing records keep the status they were given.
      </p>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit shift" : "New shift"}</DialogTitle>
            <DialogDescription>Timings and weekly offs for everyone assigned to this shift.</DialogDescription>
          </DialogHeader>
          {editing && <ScheduleForm value={editing.fields} onChange={fields => setEditing({ ...editing, fields })} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveShift} disabled={savingShift} className="gap-2">
              {savingShift && <Loader2 className="h-4 w-4 animate-spin" />}
              Save shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignmentsDialog schedule={assigning} onClose={() => setAssigning(null)} onSaved={load} />

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.departmentCount || 0} department(s) and {deleting?.employeeCount || 0} employee(s) on this shift will fall back to their department&apos;s or the general timings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete shift</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
