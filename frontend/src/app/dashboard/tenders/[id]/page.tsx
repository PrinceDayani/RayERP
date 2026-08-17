"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Pencil, ArrowRightCircle, Gavel, Building2, Globe, FileText, History, Plus
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import tendersAPI, {
  Tender, TenderStatus, TENDER_TRANSITIONS, PORTAL_LABELS
} from "@/lib/api/tendersAPI";
import TenderBiddingTab from "@/components/tenders/TenderBiddingTab";
import TenderOutcomeTab from "@/components/tenders/TenderOutcomeTab";

const STATUS_STYLES: Record<string, string> = {
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  awarded: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-200 text-gray-600',
  dropped: 'bg-gray-200 text-gray-600'
};

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params?.id as string;

  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [corrigendumOpen, setCorrigendumOpen] = useState(false);
  const [corrigendum, setCorrigendum] = useState({ number: '', summary: '', issuedOn: '', revisedSubmissionDeadline: '' });

  const load = useCallback(async () => {
    if (!tenderId) return;
    try {
      setTender(await tendersAPI.getById(tenderId));
    } catch (error: any) {
      toast({
        title: "Could not load tender",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => { load(); }, [load]);

  const handleTransition = async () => {
    if (!nextStatus || !tender) return;
    setBusy(true);
    try {
      await tendersAPI.transition(tender._id, nextStatus as TenderStatus, notes.trim() || undefined);
      toast({ title: `Moved to ${nextStatus}` });
      setTransitionOpen(false);
      setNextStatus('');
      setNotes('');
      await load();
    } catch (error: any) {
      toast({
        title: "Could not change status",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddCorrigendum = async () => {
    if (!tender) return;
    if (!corrigendum.number.trim() || !corrigendum.summary.trim()) {
      toast({ title: "Number and summary are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await tendersAPI.addCorrigendum(tender._id, {
        number: corrigendum.number.trim(),
        summary: corrigendum.summary.trim(),
        issuedOn: corrigendum.issuedOn || undefined,
        revisedSubmissionDeadline: corrigendum.revisedSubmissionDeadline || undefined
      });
      toast({ title: "Corrigendum recorded" });
      setCorrigendumOpen(false);
      setCorrigendum({ number: '', summary: '', issuedOn: '', revisedSubmissionDeadline: '' });
      await load();
    } catch (error: any) {
      toast({
        title: "Could not record corrigendum",
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

  if (!tender) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12 text-center text-muted-foreground">Tender not found.</CardContent></Card>
      </div>
    );
  }

  const isBidding = tender.direction === 'bidding';
  const allowedNext = TENDER_TRANSITIONS[tender.direction][tender.status] || [];

  const formatMoney = (value?: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: tender.currency || 'INR', maximumFractionDigits: 0 })
      .format(value || 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/dashboard/tenders">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{tender.tenderNumber}</span>
              <Badge variant={isBidding ? 'secondary' : 'outline'}>
                {isBidding ? 'We are bidding' : 'We are issuing'}
              </Badge>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[tender.status] || 'bg-blue-100 text-blue-700'}`}>
                {tender.status}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold truncate">{tender.title}</h1>
            {isBidding && tender.issuingAuthority?.name && (
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-4 w-4" />{tender.issuingAuthority.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tender.portalUrl && (
            <a href={tender.portalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Globe className="h-4 w-4 mr-2" />Portal</Button>
            </a>
          )}
          <Link href={`/dashboard/tenders/${tender._id}/edit`}>
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
          </Link>
          <Button size="sm" disabled={allowedNext.length === 0} onClick={() => setTransitionOpen(true)}>
            <ArrowRightCircle className="h-4 w-4 mr-2" />
            {allowedNext.length === 0 ? 'No further stage' : 'Advance stage'}
          </Button>
        </div>
      </div>

      {/* Key figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimated value</CardDescription>
            <CardTitle className="text-xl">{formatMoney(tender.estimatedValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{isBidding ? 'Our bid' : 'Awarded'}</CardDescription>
            <CardTitle className="text-xl">
              {formatMoney(isBidding ? tender.ourBid?.financial?.finalAmount : tender.awardedAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submission deadline</CardDescription>
            <CardTitle className="text-xl">
              {tender.submissionDeadline ? new Date(tender.submissionDeadline).toLocaleDateString() : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{isBidding ? 'EMD' : 'Bids received'}</CardDescription>
            <CardTitle className="text-xl">
              {isBidding ? formatMoney(tender.emd?.amount) : (tender.bids?.length ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue={isBidding ? 'bid' : 'overview'} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isBidding && <TabsTrigger value="bid">Bid Preparation</TabsTrigger>}
          {isBidding && <TabsTrigger value="outcome">Outcome & Award</TabsTrigger>}
          {!isBidding && <TabsTrigger value="bids">Bids</TabsTrigger>}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground">Type</p><p className="font-medium">{tender.type}</p></div>
              <div><p className="text-muted-foreground">Category</p><p className="font-medium">{tender.category}</p></div>
              <div><p className="text-muted-foreground">Priority</p><p className="font-medium">{tender.priority}</p></div>
              {tender.location && (
                <div><p className="text-muted-foreground">Location</p><p className="font-medium">{tender.location}</p></div>
              )}
              {tender.portal && (
                <div><p className="text-muted-foreground">Portal</p><p className="font-medium">{PORTAL_LABELS[tender.portal]}</p></div>
              )}
              {tender.portalTenderId && (
                <div><p className="text-muted-foreground">Portal ID</p><p className="font-medium">{tender.portalTenderId}</p></div>
              )}
              {tender.tenderNoticeNumber && (
                <div><p className="text-muted-foreground">Notice no.</p><p className="font-medium">{tender.tenderNoticeNumber}</p></div>
              )}
            </CardContent>
          </Card>

          {tender.scopeOfWork && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Scope of Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{tender.scopeOfWork}</p>
              </CardContent>
            </Card>
          )}

          {isBidding && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />Corrigenda
                    </CardTitle>
                    <CardDescription>Amendments published by the authority</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setCorrigendumOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!tender.corrigenda?.length ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">None recorded</p>
                ) : (
                  <div className="space-y-2">
                    {tender.corrigenda.map((item, index) => (
                      <div key={item._id || index} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{item.number}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.issuedOn).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{item.summary}</p>
                        {item.revisedSubmissionDeadline && (
                          <p className="mt-1 text-xs text-amber-700">
                            Deadline moved to {new Date(item.revisedSubmissionDeadline).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isBidding && (
          <TabsContent value="bid">
            <TenderBiddingTab tender={tender} onChanged={load} />
          </TabsContent>
        )}

        {isBidding && (
          <TabsContent value="outcome">
            <TenderOutcomeTab tender={tender} onChanged={load} />
          </TabsContent>
        )}

        {!isBidding && (
          <TabsContent value="bids">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gavel className="h-4 w-4" />Received Bids
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!tender.bids?.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No bids received yet</p>
                ) : (
                  <div className="space-y-2">
                    {tender.bids.map((bid: any, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{bid.bidderName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatMoney(bid.bidAmount)}
                            {bid.overallScore != null && ` · score ${bid.overallScore}`}
                          </p>
                        </div>
                        <Badge variant={bid.status === 'selected' ? 'default' : 'secondary'}>{bid.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tender.auditTrail?.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded</p>
              ) : (
                <div className="space-y-2">
                  {[...tender.auditTrail].reverse().map((entry, index) => (
                    <div key={index} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                        {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transition dialog */}
      <Dialog open={transitionOpen} onOpenChange={setTransitionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance tender stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Currently <strong>{tender.status}</strong>.</p>
            <div>
              <Label>Move to</Label>
              <Select value={nextStatus} onValueChange={setNextStatus}>
                <SelectTrigger><SelectValue placeholder="Select next stage" /></SelectTrigger>
                <SelectContent>
                  {allowedNext.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransitionOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={handleTransition} disabled={busy || !nextStatus}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Corrigendum dialog */}
      <Dialog open={corrigendumOpen} onOpenChange={setCorrigendumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Corrigendum</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Corrigendum number *</Label>
              <Input
                value={corrigendum.number}
                onChange={(e) => setCorrigendum({ ...corrigendum, number: e.target.value })}
              />
            </div>
            <div>
              <Label>Summary *</Label>
              <Textarea
                rows={3}
                value={corrigendum.summary}
                onChange={(e) => setCorrigendum({ ...corrigendum, summary: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Issued on</Label>
                <Input
                  type="date"
                  value={corrigendum.issuedOn}
                  onChange={(e) => setCorrigendum({ ...corrigendum, issuedOn: e.target.value })}
                />
              </div>
              <div>
                <Label>Revised deadline</Label>
                <Input
                  type="datetime-local"
                  value={corrigendum.revisedSubmissionDeadline}
                  onChange={(e) => setCorrigendum({ ...corrigendum, revisedSubmissionDeadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCorrigendumOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={handleAddCorrigendum} disabled={busy}>Record</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
