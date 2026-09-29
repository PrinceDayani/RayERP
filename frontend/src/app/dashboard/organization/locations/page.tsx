"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  errorMessage, organizationAPI,
  type LocationInput, type LocationType, type OrganizationAddress, type OrganizationLocation
} from "@/lib/api/organizationAPI";
import { useCanManageOrganization } from "../_components/useCanManageOrganization";

const TYPE_LABELS: Record<LocationType, string> = {
  "head-office": "Head office",
  branch: "Branch",
  site: "Site",
  warehouse: "Warehouse",
};

const ADDRESS_FIELDS: { key: keyof OrganizationAddress; label: string; wide?: boolean }[] = [
  { key: "line1", label: "Address line 1", wide: true },
  { key: "line2", label: "Address line 2", wide: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "postalCode", label: "Postal code" },
  { key: "country", label: "Country" },
];

const emptyLocation = (): LocationInput => ({ name: "", code: "", type: "branch", address: {}, phone: "", email: "", active: true });

const oneLine = (a: Partial<OrganizationAddress>) => [a.line1, a.city, a.state].filter(Boolean).join(", ");

export default function LocationsPage() {
  const canManage = useCanManageOrganization();
  const [locations, setLocations] = useState<OrganizationLocation[] | null>(null);
  const [draft, setDraft] = useState<{ id?: string; fields: LocationInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<OrganizationLocation | null>(null);

  const load = useCallback(async () => {
    try {
      setLocations(await organizationAPI.listLocations());
    } catch (error) {
      toast.error(errorMessage(error, "Could not load locations"));
      setLocations([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      if (draft.id) await organizationAPI.updateLocation(draft.id, draft.fields);
      else await organizationAPI.createLocation(draft.fields);
      toast.success(draft.id ? "Location updated" : "Location added");
      setDraft(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the location"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await organizationAPI.deleteLocation(deleting._id);
      toast.success("Location deleted");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete the location"));
    } finally {
      setDeleting(null);
    }
  };

  const setField = <K extends keyof LocationInput>(key: K, value: LocationInput[K]) =>
    setDraft(prev => prev && { ...prev, fields: { ...prev.fields, [key]: value } });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Offices, branches & sites</CardTitle>
            <CardDescription>Where employees are posted. Renaming a location updates the employees posted there.</CardDescription>
          </div>
          {canManage && (
            <Button size="sm" className="gap-1.5" onClick={() => setDraft({ fields: emptyLocation() })}>
              <Plus className="h-4 w-4" /> Add location
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!locations ? (
          <Skeleton className="h-48 w-full" />
        ) : locations.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No locations yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {locations.map(l => (
              <div key={l._id} className={`rounded-lg border p-3 ${l.active ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#970E2C]" />
                      <span className="truncate font-medium">{l.name}</span>
                      {l.code && <span className="text-xs text-muted-foreground">{l.code}</span>}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{oneLine(l.address) || "No address"}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{TYPE_LABELS[l.type]}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {l.employeeCount} employee(s){l.active ? "" : " · inactive"}
                  </span>
                  {canManage && (
                    <div className="flex">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${l.name}`}
                        onClick={() => setDraft({ id: l._id, fields: { name: l.name, code: l.code || "", type: l.type, address: { ...l.address }, phone: l.phone || "", email: l.email || "", active: l.active } })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${l.name}`} onClick={() => setDeleting(l)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!draft} onOpenChange={open => !open && setDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit location" : "Add location"}</DialogTitle>
            <DialogDescription>Employees pick their posting from active locations.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loc-name">Name</Label>
                <Input id="loc-name" value={draft.fields.name} onChange={e => setField("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-code">Code</Label>
                  <Input id="loc-code" value={draft.fields.code || ""} onChange={e => setField("code", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={draft.fields.type} onValueChange={v => setField("type", v as LocationType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {ADDRESS_FIELDS.map(({ key, label, wide }) => (
                <div key={key} className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={`loc-${key}`}>{label}</Label>
                  <Input id={`loc-${key}`} value={draft.fields.address[key] || ""}
                    onChange={e => setField("address", { ...draft.fields.address, [key]: e.target.value })} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label htmlFor="loc-phone">Phone</Label>
                <Input id="loc-phone" value={draft.fields.phone || ""} onChange={e => setField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-email">Email</Label>
                <Input id="loc-email" value={draft.fields.email || ""} onChange={e => setField("email", e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Switch checked={draft.fields.active} onCheckedChange={v => setField("active", v)} />
                Active
              </label>
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
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              A location with employees posted to it cannot be deleted; mark it inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
