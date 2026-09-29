"use client";

import { Building2 } from "lucide-react";
import { OrganizationNav } from "./_components/OrganizationNav";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-responsive space-y-4 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#970E2C]/10 p-2">
          <Building2 className="h-5 w-5 text-[#970E2C]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Organization</h1>
          <p className="text-sm text-muted-foreground">Company details, working hours, holidays, leave rules and locations</p>
        </div>
      </div>
      <OrganizationNav />
      {children}
    </div>
  );
}
