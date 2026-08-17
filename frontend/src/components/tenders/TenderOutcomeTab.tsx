"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Trophy, FileSignature, Landmark, FolderPlus, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import tendersAPI, { Tender, CompetitorBid } from "@/lib/api/tendersAPI";

interface TenderOutcomeTabProps {
  tender: Tender;
  onChanged: () => void;
}

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

export const TenderOutcomeTab: React.FC<TenderOutcomeTabProps> = ({ tender, onChanged }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [competitors, setCompetitors] = useState<CompetitorBid[]>(tender.competitors || []);
  const [opening, setOpening] = useState({
    ourRank: String(tender.outcome?.ourRank ?? ''),
    l1Amount: String(tender.outcome?.l1Amount ?? ''),
    l1Bidder: tender.outcome?.l1Bidder || ''
  });

  const [loa, setLoa] = useState({
    number: tender.loa?.number || '',
    date: toDateInput(tender.loa?.date),
    awardedAmount: String(tender.loa?.awardedAmount ?? ''),
    acceptedOn: toDateInput(tender.loa?.acceptedOn)
  });

  const [agreement, setAgreement] = useState({
    number: tender.agreement?.number || '',
    signedOn: toDateInput(tender.agreement?.signedOn),
    commencementDate: toDateInput(tender.agreement?.commencementDate),
    completionDate: toDateInput(tender.agreement?.completionDate)
  });

  const [pbg, setPbg] = useState({
    amount: String(tender.performanceGuarantee?.amount ?? ''),
    percentage: String(tender.performanceGuarantee?.percentage ?? ''),
    mode: tender.performanceGuarantee?.mode || 'bank-guarantee',
    status: tender.performanceGuarantee?.status || 'pending',
    issuingBank: tender.performanceGuarantee?.issuingBank || '',
    instrumentRef: tender.performanceGuarantee?.instrumentRef || '',
    validTill: toDateInput(tender.performanceGuarantee?.validTill)
  });

  const withBusy = async (action: () => Promise<void>, successTitle: string) => {
    setBusy(true);
    try {
      await action();
      toast({ title: successTitle });
      onChanged();
    } catch (error: any) {
      toast({
        title: "Could not save",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConvert = async () => {
    setBusy(true);
    try {
      const result = await tendersAPI.convertToProject(tender._id);
      toast({ title: "Project created", description: "The won tender is now a project." });
      onChanged();
      if (result?.project?._id) {
        router.push(`/dashboard/projects/${result.project._id}`);
      }
    } catch (error: any) {
      toast({
        title: "Could not convert to project",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  };

  const formatMoney = (value?: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: tender.currency || 'INR', maximumFractionDigits: 0 })
      .format(value || 0);

  const linkedProject = typeof tender.project === 'object' && tender.project !== null ? tender.project : null;

  return (
    <div className="space-y-6">
      {/* Outcome summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />Outcome
            </CardTitle>
            <Badge variant={tender.outcome?.result === 'won' ? 'default' : 'secondary'}>
              {tender.outcome?.result || 'awaited'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Our bid</p>
            <p className="font-medium">{formatMoney(tender.ourBid?.financial?.finalAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Our rank</p>
            <p className="font-medium">{tender.outcome?.ourRank ? `L${tender.outcome.ourRank}` : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">L1 amount</p>
            <p className="font-medium">{tender.outcome?.l1Amount ? formatMoney(tender.outcome.l1Amount) : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">L1 bidder</p>
            <p className="font-medium truncate">{tender.outcome?.l1Bidder || '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Opening results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Opening Results</CardTitle>
              <CardDescription>Rival bids as revealed by the authority</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCompetitors([...competitors, { name: '' }])}
            >
              <Plus className="h-4 w-4 mr-2" />Add bidder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Our rank</Label>
              <Input
                type="number"
                min="1"
                value={opening.ourRank}
                onChange={(e) => setOpening({ ...opening, ourRank: e.target.value })}
              />
            </div>
            <div>
              <Label>L1 amount</Label>
              <Input
                type="number"
                min="0"
                value={opening.l1Amount}
                onChange={(e) => setOpening({ ...opening, l1Amount: e.target.value })}
              />
            </div>
            <div>
              <Label>L1 bidder</Label>
              <Input value={opening.l1Bidder} onChange={(e) => setOpening({ ...opening, l1Bidder: e.target.value })} />
            </div>
          </div>

          {competitors.length > 0 && (
            <div className="space-y-2">
              {competitors.map((competitor, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border p-3">
                  <div className="md:col-span-5">
                    <Input
                      placeholder="Bidder name"
                      value={competitor.name}
                      onChange={(e) => setCompetitors(competitors.map((c, i) =>
                        i === index ? { ...c, name: e.target.value } : c))}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      placeholder="Bid amount"
                      value={competitor.bidAmount ?? ''}
                      onChange={(e) => setCompetitors(competitors.map((c, i) =>
                        i === index ? { ...c, bidAmount: e.target.value ? Number(e.target.value) : undefined } : c))}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      placeholder="Rank"
                      value={competitor.rank ?? ''}
                      onChange={(e) => setCompetitors(competitors.map((c, i) =>
                        i === index ? { ...c, rank: e.target.value ? Number(e.target.value) : undefined } : c))}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCompetitors(competitors.filter((_, i) => i !== index))}
                      aria-label="Remove bidder"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.recordOpening(tender._id, {
                    competitors,
                    ourRank: opening.ourRank ? Number(opening.ourRank) : undefined,
                    l1Amount: opening.l1Amount ? Number(opening.l1Amount) : undefined,
                    l1Bidder: opening.l1Bidder || undefined
                  });
                },
                "Opening results saved"
              )}
            >
              Save opening results
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSignature className="h-4 w-4" />Letter of Award
            </CardTitle>
            <CardDescription>{tender.loa?.received ? 'Received' : 'Not received yet'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>LOA number</Label>
                <Input value={loa.number} onChange={(e) => setLoa({ ...loa, number: e.target.value })} />
              </div>
              <div>
                <Label>LOA date</Label>
                <Input type="date" value={loa.date} onChange={(e) => setLoa({ ...loa, date: e.target.value })} />
              </div>
              <div>
                <Label>Awarded amount</Label>
                <Input
                  type="number"
                  min="0"
                  value={loa.awardedAmount}
                  onChange={(e) => setLoa({ ...loa, awardedAmount: e.target.value })}
                />
              </div>
              <div>
                <Label>Accepted on</Label>
                <Input type="date" value={loa.acceptedOn} onChange={(e) => setLoa({ ...loa, acceptedOn: e.target.value })} />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.recordLOA(tender._id, {
                    number: loa.number || undefined,
                    date: loa.date || undefined,
                    awardedAmount: loa.awardedAmount ? Number(loa.awardedAmount) : undefined,
                    acceptedOn: loa.acceptedOn || undefined
                  });
                },
                "Letter of Award saved"
              )}
            >
              Save LOA
            </Button>
          </CardContent>
        </Card>

        {/* Agreement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSignature className="h-4 w-4" />Agreement
            </CardTitle>
            <CardDescription>Signed contract following the LOA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Agreement number</Label>
                <Input value={agreement.number} onChange={(e) => setAgreement({ ...agreement, number: e.target.value })} />
              </div>
              <div>
                <Label>Signed on</Label>
                <Input
                  type="date"
                  value={agreement.signedOn}
                  onChange={(e) => setAgreement({ ...agreement, signedOn: e.target.value })}
                />
              </div>
              <div>
                <Label>Commencement</Label>
                <Input
                  type="date"
                  value={agreement.commencementDate}
                  onChange={(e) => setAgreement({ ...agreement, commencementDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Completion</Label>
                <Input
                  type="date"
                  value={agreement.completionDate}
                  onChange={(e) => setAgreement({ ...agreement, completionDate: e.target.value })}
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={busy || !tender.loa?.received}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.recordAgreement(tender._id, {
                    number: agreement.number || undefined,
                    signedOn: agreement.signedOn || undefined,
                    commencementDate: agreement.commencementDate || undefined,
                    completionDate: agreement.completionDate || undefined
                  });
                },
                "Agreement saved"
              )}
            >
              {tender.loa?.received ? 'Save agreement' : 'Record the LOA first'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PBG */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4" />Performance Guarantee
              </CardTitle>
              <CardDescription>Leave the amount blank to derive it from the percentage</CardDescription>
            </div>
            <Badge variant="secondary">{pbg.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                value={pbg.amount}
                onChange={(e) => setPbg({ ...pbg, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={pbg.percentage}
                onChange={(e) => setPbg({ ...pbg, percentage: e.target.value })}
              />
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={pbg.mode} onValueChange={(value) => setPbg({ ...pbg, mode: value as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['bank-guarantee', 'dd', 'fdr', 'online', 'not-required'].map(m =>
                    <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={pbg.status} onValueChange={(value) => setPbg({ ...pbg, status: value as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'submitted', 'released', 'forfeited'].map(s =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issuing bank</Label>
              <Input value={pbg.issuingBank} onChange={(e) => setPbg({ ...pbg, issuingBank: e.target.value })} />
            </div>
            <div>
              <Label>Instrument ref</Label>
              <Input value={pbg.instrumentRef} onChange={(e) => setPbg({ ...pbg, instrumentRef: e.target.value })} />
            </div>
            <div>
              <Label>Valid till</Label>
              <Input type="date" value={pbg.validTill} onChange={(e) => setPbg({ ...pbg, validTill: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.recordPerformanceGuarantee(tender._id, {
                    amount: pbg.amount ? Number(pbg.amount) : undefined as any,
                    percentage: pbg.percentage ? Number(pbg.percentage) : undefined,
                    mode: pbg.mode as any,
                    status: pbg.status as any,
                    issuingBank: pbg.issuingBank || undefined,
                    instrumentRef: pbg.instrumentRef || undefined,
                    validTill: pbg.validTill || undefined
                  });
                },
                "Performance guarantee saved"
              )}
            >
              Save guarantee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Convert to project */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="h-4 w-4" />Execution
          </CardTitle>
          <CardDescription>
            {linkedProject
              ? 'This tender is already linked to a project.'
              : 'Turn the won tender into a project so the work can be planned in phases.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedProject ? (
            <Link href={`/dashboard/projects/${linkedProject._id}`}>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />Open {linkedProject.name}
              </Button>
            </Link>
          ) : (
            <Button
              disabled={busy || (tender.status !== 'won' && tender.status !== 'in-progress')}
              onClick={handleConvert}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              {tender.status === 'won' || tender.status === 'in-progress'
                ? 'Create project from this tender'
                : 'Available once the tender is won'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenderOutcomeTab;
