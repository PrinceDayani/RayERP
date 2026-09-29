"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import departmentApi from "@/lib/api/hr/departments";
import { employeesAPI } from "@/lib/api/hr/employeesAPI";
import { errorMessage, organizationAPI, type WorkSchedule } from "@/lib/api/organizationAPI";

interface Named { _id: string; name: string }
interface Person { _id: string; employeeId: string; firstName: string; lastName?: string }

const fullName = (p: Person) => [p.firstName, p.lastName].filter(Boolean).join(" ");

// List endpoints answer either with a bare array or wrapped in data / departments / employees.
const listFrom = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const wrapped = payload as { data?: T[]; departments?: T[]; employees?: T[] } | null;
  return wrapped?.data ?? wrapped?.departments ?? wrapped?.employees ?? [];
};

export function AssignmentsDialog({
  schedule,
  onClose,
  onSaved,
}: {
  schedule: WorkSchedule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [departments, setDepartments] = useState<Named[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectedPeople, setSelectedPeople] = useState<Map<string, Person>>(new Map());
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schedule) return;
    setLoading(true);
    setSearch("");
    setResults([]);
    Promise.all([departmentApi.getAll(), organizationAPI.getAssignments(schedule._id)])
      .then(([deptRes, assigned]) => {
        setDepartments(listFrom<Named>(deptRes.data).map(d => ({ _id: d._id, name: d.name })));
        setSelectedDepts(new Set(assigned.departments.map(d => d._id)));
        setSelectedPeople(new Map(assigned.employees.map(e => [e._id, e])));
      })
      .catch(error => toast.error(errorMessage(error, "Could not load assignments")))
      .finally(() => setLoading(false));
  }, [schedule]);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      employeesAPI.getAll({ search: term, limit: 20 })
        .then(res => setResults(listFrom<Person>(res)))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleDept = (id: string) =>
    setSelectedDepts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const togglePerson = (p: Person) =>
    setSelectedPeople(prev => {
      const next = new Map(prev);
      if (next.has(p._id)) next.delete(p._id); else next.set(p._id, p);
      return next;
    });

  const save = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      await organizationAPI.setAssignments(schedule._id, [...selectedDepts], [...selectedPeople.keys()]);
      toast.success("Assignments saved");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save assignments"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!schedule} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Who follows “{schedule?.name}”</DialogTitle>
          <DialogDescription>
            An employee&apos;s own shift wins over their department&apos;s; anyone without either follows the general timings.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Departments ({selectedDepts.size})</p>
              <ScrollArea className="h-72 rounded-md border">
                <div className="divide-y">
                  {departments.length === 0 && <p className="p-3 text-sm text-muted-foreground">No departments</p>}
                  {departments.map(d => (
                    <label key={d._id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                      <Checkbox checked={selectedDepts.has(d._id)} onCheckedChange={() => toggleDept(d._id)} />
                      {d.name}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Employees ({selectedPeople.size})</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees to add…" className="pl-8" />
              </div>
              <ScrollArea className="h-60 rounded-md border">
                <div className="divide-y">
                  {results.map(p => (
                    <label key={p._id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                      <Checkbox checked={selectedPeople.has(p._id)} onCheckedChange={() => togglePerson(p)} />
                      <span className="truncate">{fullName(p)}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{p.employeeId}</span>
                    </label>
                  ))}
                  {results.length === 0 && (
                    <div className="flex flex-wrap gap-1.5 p-3">
                      {selectedPeople.size === 0 && <p className="text-sm text-muted-foreground">Type at least two letters to search.</p>}
                      {[...selectedPeople.values()].map(p => (
                        <Badge key={p._id} variant="secondary" className="gap-1">
                          {fullName(p)}
                          <button type="button" onClick={() => togglePerson(p)} aria-label={`Remove ${fullName(p)}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
