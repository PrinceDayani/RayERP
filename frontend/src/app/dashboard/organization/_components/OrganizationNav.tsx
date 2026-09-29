"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, Clock, LayoutGrid, MapPin, PlaneTakeoff } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/organization";

export const ORGANIZATION_SECTIONS = [
  { href: "", label: "Overview", icon: LayoutGrid },
  { href: "/profile", label: "Profile", icon: Building2 },
  { href: "/working-hours", label: "Working Hours & Shifts", icon: Clock },
  { href: "/holidays", label: "Holidays", icon: CalendarDays },
  { href: "/leave-policy", label: "Leave Policy", icon: PlaneTakeoff },
  { href: "/locations", label: "Locations", icon: MapPin },
];

export function OrganizationNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {ORGANIZATION_SECTIONS.map(({ href, label, icon: Icon }) => {
        const target = `${BASE}${href}`;
        const active = href === "" ? pathname === BASE : pathname.startsWith(target);
        return (
          <Link
            key={href}
            href={target}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-[#970E2C] text-[#970E2C]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
