"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, organizationAPI, type LeavePolicy, type LeaveTypePolicy } from "@/lib/api/organizationAPI";
import { useCanManageOrganization } from "../_components/useCanManageOrganization";

const LABELS: Record<LeaveTypePolicy["type"], string> = {
  sick: "Sick leave",
  vacation: "Vacation / earned leave",
  personal: "Personal leave",
  maternity: "Maternity leave",
  paternity: "Paternity leave",
  emergency: "Emergency leave",
};

export default function LeavePolicyPage() {
  const canManage = useCanManageOrganization();
  const [policy, setPolicy] = useState<LeavePolicy | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    organizationAPI.getLeavePolicy().then(setPolicy).catch(error => toast.error(errorMessage(error, "Could not load leave policy")));
  }, []);

  if (!policy) return <Skeleton className="h-96 w-full" />;

  const setType = (type: LeaveTypePolicy["type"], patch: Partial<LeaveTypePolicy>) =>
    setPolicy(prev => prev && { ...prev, types: prev.types.map(t => (t.type === type ? { ...t, ...patch } : t)) });

  const save = async () => {
    setSaving(true);
    try {
      setPolicy(await organizationAPI.updateLeavePolicy({ types: policy.types, excludeNonWorkingDays: policy.excludeNonWorkingDays }));
      toast.success("Leave policy saved");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save leave policy"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Annual quotas</CardTitle>
          <CardDescription>
            Days each employee gets per calendar year. With carry-forward on, unused days from last year are added, up to the cap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Leave type</th>
                  <th className="px-3 py-2 font-medium">Days per year</th>
                  <th className="px-3 py-2 font-medium">Carry forward</th>
                  <th className="px-3 py-2 font-medium">Carry-forward cap (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {policy.types.map(t => (
                  <tr key={t.type}>
                    <td className="px-3 py-2 font-medium">{LABELS[t.type]}</td>
                    <td className="px-3 py-2">
                      <Input type="number" min={0} max={366} className="h-8 w-24" value={t.annualQuota} disabled={!canManage}
                        onChange={e => setType(t.type, { annualQuota: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2">
                      <Switch checked={t.carryForward} disabled={!canManage} onCheckedChange={v => setType(t.type, { carryForward: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" min={0} max={366} className="h-8 w-24" value={t.maxCarryForward}
                        disabled={!canManage || !t.carryForward}
                        onChange={e => setType(t.type, { maxCarryForward: Number(e.target.value) })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">Skip weekly offs and public holidays</p>
            <p className="text-xs text-muted-foreground">
              A leave spanning a weekend or holiday is charged only for the employee&apos;s working days, using their shift&apos;s weekly offs.
            </p>
          </div>
          <Switch
            checked={policy.excludeNonWorkingDays}
            disabled={!canManage}
            onCheckedChange={v => setPolicy({ ...policy, excludeNonWorkingDays: v })}
          />
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">Leaves already applied for keep their day counts.</p>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save leave policy
          </Button>
        </div>
      )}
    </div>
  );
}
