"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEEKDAYS, type ScheduleFields, type WeeklyOff } from "@/lib/api/organizationAPI";

type OffMode = "working" | "every" | "some";

function WeeklyOffEditor({ value, onChange, disabled }: { value: WeeklyOff[]; onChange: (v: WeeklyOff[]) => void; disabled?: boolean }) {
  const modeOf = (day: number): OffMode => {
    const off = value.find(o => o.day === day);
    return !off ? "working" : off.weeks.length ? "some" : "every";
  };

  const setMode = (day: number, mode: OffMode) => {
    const rest = value.filter(o => o.day !== day);
    if (mode === "working") onChange(rest);
    else onChange([...rest, { day, weeks: mode === "some" ? [2, 4] : [] }]);
  };

  const toggleWeek = (day: number, week: number) => {
    onChange(value.map(o => {
      if (o.day !== day) return o;
      const weeks = o.weeks.includes(week) ? o.weeks.filter(w => w !== week) : [...o.weeks, week].sort();
      return { ...o, weeks };
    }));
  };

  return (
    <div className="divide-y rounded-lg border">
      {WEEKDAYS.map((name, day) => {
        const mode = modeOf(day);
        const off = value.find(o => o.day === day);
        return (
          <div key={day} className="flex flex-wrap items-center gap-3 px-3 py-2">
            <span className="w-24 text-sm font-medium">{name}</span>
            <Select value={mode} onValueChange={v => setMode(day, v as OffMode)} disabled={disabled}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="working">Working day</SelectItem>
                <SelectItem value="every">Off every week</SelectItem>
                <SelectItem value="some">Off on some weeks</SelectItem>
              </SelectContent>
            </Select>
            {mode === "some" && off && (
              <div className="flex flex-wrap items-center gap-3">
                {[1, 2, 3, 4, 5].map(week => (
                  <label key={week} className="flex items-center gap-1.5 text-xs">
                    <Checkbox
                      checked={off.weeks.includes(week)}
                      disabled={disabled || (off.weeks.length === 1 && off.weeks.includes(week))}
                      onCheckedChange={() => toggleWeek(day, week)}
                    />
                    {["1st", "2nd", "3rd", "4th", "5th"][week - 1]}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const NUMBER_FIELDS: { key: "lateGraceMinutes" | "halfDayHours" | "fullDayHours" | "breakMinutes"; label: string; hint: string; step: number }[] = [
  { key: "lateGraceMinutes", label: "Late after (minutes)", hint: "Grace after start time before an arrival counts as late", step: 1 },
  { key: "halfDayHours", label: "Half day below (hours)", hint: "Worked hours under this mark the day as a half day", step: 0.5 },
  { key: "fullDayHours", label: "Full day (hours)", hint: "Expected hours for a full working day", step: 0.5 },
  { key: "breakMinutes", label: "Standard break (minutes)", hint: "Break included in the working day", step: 5 },
];

export function ScheduleForm({
  value,
  onChange,
  disabled,
  showName = true,
}: {
  value: ScheduleFields;
  onChange: (v: ScheduleFields) => void;
  disabled?: boolean;
  showName?: boolean;
}) {
  const set = <K extends keyof ScheduleFields>(key: K, v: ScheduleFields[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      {showName && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-name">Shift name</Label>
            <Input id="schedule-name" value={value.name} disabled={disabled} onChange={e => set("name", e.target.value)} placeholder="e.g. Site shift" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-description">Description</Label>
            <Input id="schedule-description" value={value.description || ""} disabled={disabled} onChange={e => set("description", e.target.value)} />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="schedule-start">Start time</Label>
          <Input id="schedule-start" type="time" value={value.startTime} disabled={disabled} onChange={e => set("startTime", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="schedule-end">End time</Label>
          <Input id="schedule-end" type="time" value={value.endTime} disabled={disabled} onChange={e => set("endTime", e.target.value)} />
        </div>
        {NUMBER_FIELDS.map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`schedule-${f.key}`}>{f.label}</Label>
            <Input
              id={`schedule-${f.key}`}
              type="number"
              min={0}
              step={f.step}
              value={value[f.key]}
              disabled={disabled}
              onChange={e => set(f.key, Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Weekly offs</Label>
        <WeeklyOffEditor value={value.weeklyOffs} onChange={v => set("weeklyOffs", v)} disabled={disabled} />
      </div>
    </div>
  );
}
