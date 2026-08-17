"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import TenderForm, { buildInitialValues, toTenderPayload, TenderFormValues } from "@/components/tenders/TenderForm";
import tendersAPI from "@/lib/api/tendersAPI";

export default function CreateTenderPage() {
  const router = useRouter();
  const [values, setValues] = useState<TenderFormValues>(buildInitialValues(null, 'bidding'));
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (values.direction === 'bidding' && !values.authorityName.trim()) {
      toast({ title: "Issuing authority name is required", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const tender = await tendersAPI.create(toTenderPayload(values));
      toast({ title: "Tender created" });
      router.push(`/dashboard/tenders/${tender._id}`);
    } catch (error: any) {
      toast({
        title: "Could not create tender",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tenders">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Tender</h1>
          <p className="text-muted-foreground">Record a tender we are bidding on, or one we are issuing</p>
        </div>
      </div>

      <TenderForm values={values} onChange={setValues} />

      <div className="flex justify-end gap-2">
        <Link href="/dashboard/tenders">
          <Button variant="outline" disabled={busy}>Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={busy}>
          <Save className="h-4 w-4 mr-2" />Create tender
        </Button>
      </div>
    </div>
  );
}
