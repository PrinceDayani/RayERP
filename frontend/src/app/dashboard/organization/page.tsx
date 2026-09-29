"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Clock, MapPin, PlaneTakeoff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  describeWeeklyOffs, organizationAPI,
  type Holiday, type LeavePolicy, type OrganizationLocation, type OrganizationProfile, type ScheduleList
} from "@/lib/api/organizationAPI";

interface Overview {
  profile: OrganizationProfile | null;
  schedules: ScheduleList | null;
  holidays: Holiday[] | null;
  leave: LeavePolicy | null;
  locations: OrganizationLocation[] | null;
}

// Each section loads on its own so one failing request leaves the rest visible.
const settle = <T,>(p: Promise<T>) => p.catch(() => null);

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function Section({ title, href, icon: Icon, children }: { title: string; href: string; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-[#970E2C]" />
          {title}
        </CardTitle>
        <Link href={href} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm">{children}</CardContent>
    </Card>
  );
}

export default function OrganizationOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      settle(organizationAPI.getProfile()),
      settle(organizationAPI.listSchedules()),
      settle(Promise.all([organizationAPI.listHolidays(year), organizationAPI.listHolidays(year + 1)]).then(([a, b]) => [...a, ...b])),
      settle(organizationAPI.getLeavePolicy()),
      settle(organizationAPI.listLocations()),
    ]).then(([profile, schedules, holidays, leave, locations]) => setData({ profile, schedules, holidays, leave, locations }));
  }, []);

  if (!data) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>;

  const today = new Date().toLocaleDateString("en-CA");
  const upcoming = (data.holidays || []).filter(h => h.date >= today && h.type === "public").slice(0, 4);
  const general = data.schedules?.general;
  const shifts = data.schedules?.schedules.filter(s => !s.isDefault) || [];
  const unavailable = <p className="text-muted-foreground">Could not load.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Section title="Profile" href="/dashboard/organization/profile" icon={Building2}>
        {data.profile ? (
          <div className="flex items-center gap-3">
            {data.profile.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.profile.logo} alt="" className="h-12 w-12 rounded border object-contain" />
            )}
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-medium">{data.profile.companyName}</p>
              <p className="truncate text-xs text-muted-foreground">{data.profile.legalName || "Legal name not set"}</p>
              <p className="text-xs text-muted-foreground">
                FY from {data.profile.fiscalYearStart} · {data.profile.currency} · {data.profile.timezone}
              </p>
            </div>
          </div>
        ) : unavailable}
      </Section>

      <Section title="Working hours" href="/dashboard/organization/working-hours" icon={Clock}>
        {general ? (
          <div className="space-y-0.5">
            <p className="font-medium">{general.startTime}–{general.endTime}</p>
            <p className="text-xs text-muted-foreground">
              Late after {general.lateGraceMinutes} min · half day under {general.halfDayHours} h
            </p>
            <p className="text-xs text-muted-foreground">{describeWeeklyOffs(general.weeklyOffs)}</p>
            <p className="text-xs text-muted-foreground">
              {shifts.length} shift(s){general.source === "built-in" ? " · general timings not saved yet" : ""}
            </p>
          </div>
        ) : unavailable}
      </Section>

      <Section title="Upcoming holidays" href="/dashboard/organization/holidays" icon={CalendarDays}>
        {!data.holidays ? unavailable : upcoming.length === 0 ? (
          <p className="text-muted-foreground">None on the calendar.</p>
        ) : (
          <ul className="space-y-1">
            {upcoming.map(h => (
              <li key={h._id} className="flex justify-between gap-2">
                <span className="truncate">{h.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDay(h.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Leave policy" href="/dashboard/organization/leave-policy" icon={PlaneTakeoff}>
        {data.leave ? (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {data.leave.types.map(t => `${t.type} ${t.annualQuota}`).join(" · ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.leave.types.filter(t => t.carryForward).length} type(s) carry forward ·{" "}
              {data.leave.excludeNonWorkingDays ? "weekly offs & holidays not charged" : "all calendar days charged"}
            </p>
          </div>
        ) : unavailable}
      </Section>

      <Section title="Locations" href="/dashboard/organization/locations" icon={MapPin}>
        {data.locations ? (
          data.locations.length === 0 ? <p className="text-muted-foreground">No locations yet.</p> : (
            <ul className="space-y-1">
              {data.locations.slice(0, 4).map(l => (
                <li key={l._id} className="flex justify-between gap-2">
                  <span className="truncate">{l.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{l.employeeCount} staff</span>
                </li>
              ))}
            </ul>
          )
        ) : unavailable}
      </Section>
    </div>
  );
}
