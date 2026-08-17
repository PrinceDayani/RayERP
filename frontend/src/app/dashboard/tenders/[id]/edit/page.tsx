"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import TenderForm, { buildInitialValues, toTenderPayload, TenderFormValues } from "@/components/tenders/TenderForm";
import tendersAPI from "@/lib/api/tendersAPI";

export default function EditTenderPage() {
  const router = useRouter();
  const params = useParams();
  const tenderId = params?.id as string;

  const [values, setValues] = useState<TenderFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tenderId) return;
    tendersAPI.getById(tenderId)
      .then(tender => setValues(buildInitialValues(tender)))
      .catch((error: any) => {
        toast({
          title: "Could not load tender",
          description: error?.response?.data?.message || error.message,
          variant: "destructive"
        });
      })
      .finally(() => setLoading(false));
  }, [tenderId]);

  const handleSubmit = async () => {
    if (!values) return;
    if (!values.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // direction is immutable server-side; omit it from the update
      const { direction, ...payload } = toTenderPayload(values) as any;
      await tendersAPI.update(tenderId, payload);
      toast({ title: "Tender updated" });
      router.push(`/dashboard/tenders/${tenderId}`);
    } catch (error: any) {
      toast({
        title: "Could not update tender",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent></Card>
      </div>
    );
  }

  if (!values) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12 text-center text-muted-foreground">Tender not found.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/tenders/${tenderId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Tender</h1>
      </div>

      <TenderForm values={values} onChange={setValues} lockDirection />

      <div className="flex justify-end gap-2">
        <Link href={`/dashboard/tenders/${tenderId}`}>
          <Button variant="outline" disabled={busy}>Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={busy}>
          <Save className="h-4 w-4 mr-2" />Save changes
        </Button>
      </div>
    </div>
  );
}
