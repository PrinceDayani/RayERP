//path : frontend/src/components/analytics/DateRangePicker.tsx
"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Preset date ranges
  const handlePresetChange = (preset: string) => {
    const today = new Date();
    
    switch(preset) {
      case "last7":
        onChange({
          from: addDays(today, -7),
          to: today
        });
        break;
      case "last30":
        onChange({
          from: addDays(today, -30),
          to: today
        });
        break;
      case "last90":
        onChange({
          from: addDays(today, -90),
          to: today
        });
        break;
      case "thisMonth": {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        onChange({
          from: firstDayOfMonth,
          to: today
        });
        break;
      }
      case "lastMonth": {
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        onChange({
          from: firstDayOfLastMonth,
          to: lastDayOfLastMonth
        });
        break;
      }
      case "thisYear": {
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        onChange({
          from: firstDayOfYear,
          to: today
        });
        break;
      }
    }
  };

  return (
    <div className="grid gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 border-b">
            <Select
              onValueChange={handlePresetChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preset period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last90">Last 90 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
                <SelectItem value="thisYear">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={(range) => {
              onChange(range || { from: new Date(), to: new Date() });
              if (range?.from && range?.to) {
                setIsOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}