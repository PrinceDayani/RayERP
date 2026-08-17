"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, AlertTriangle, Save, ShieldCheck, Receipt } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import tendersAPI, {
  Tender, EligibilityCriterion, BidReadiness
} from "@/lib/api/tendersAPI";

interface TenderBiddingTabProps {
  tender: Tender;
  onChanged: () => void;
}

const ELIGIBILITY_STATUSES: EligibilityCriterion['ourStatus'][] =
  ['unverified', 'met', 'partial', 'not-met', 'not-applicable'];

const ELIGIBILITY_CATEGORIES: EligibilityCriterion['category'][] =
  ['technical', 'financial', 'legal', 'experience', 'other'];

const STATUS_COLOR: Record<EligibilityCriterion['ourStatus'], string> = {
  met: 'text-green-700',
  partial: 'text-amber-700',
  'not-met': 'text-red-700',
  'not-applicable': 'text-gray-500',
  unverified: 'text-blue-700'
};

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

export const TenderBiddingTab: React.FC<TenderBiddingTabProps> = ({ tender, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [readiness, setReadiness] = useState<BidReadiness | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityCriterion[]>(tender.eligibility || []);

  const [fee, setFee] = useState({
    amount: String(tender.tenderFee?.amount ?? ''),
    exempted: tender.tenderFee?.exempted ?? false,
    paid: tender.tenderFee?.paid ?? false,
    mode: tender.tenderFee?.mode || '',
    reference: tender.tenderFee?.reference || ''
  });

  const [emd, setEmd] = useState({
    amount: String(tender.emd?.amount ?? ''),
    mode: tender.emd?.mode || 'online',
    status: tender.emd?.status || 'pending',
    instrumentRef: tender.emd?.instrumentRef || '',
    issuingBank: tender.emd?.issuingBank || '',
    validTill: toDateInput(tender.emd?.validTill),
    exemptionReason: tender.emd?.exemptionReason || ''
  });

  const [bid, setBid] = useState({
    baseAmount: String(tender.ourBid?.financial?.baseAmount ?? ''),
    rebatePercentage: String(tender.ourBid?.financial?.rebatePercentage ?? ''),
    financialNotes: tender.ourBid?.financial?.notes || '',
    technicalNotes: tender.ourBid?.technical?.notes || '',
    validityDays: String(tender.ourBid?.validityDays ?? ''),
    acknowledgementRef: tender.ourBid?.acknowledgementRef || ''
  });

  const loadReadiness = useCallback(async () => {
    try {
      setReadiness(await tendersAPI.getReadiness(tender._id));
    } catch {
      setReadiness(null);
    }
  }, [tender._id]);

  useEffect(() => { loadReadiness(); }, [loadReadiness]);

  const withBusy = async (action: () => Promise<void>, successTitle: string) => {
    setBusy(true);
    try {
      await action();
      toast({ title: successTitle });
      await loadReadiness();
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

  const projectedFinal = (() => {
    const base = parseFloat(bid.baseAmount) || 0;
    const rebate = parseFloat(bid.rebatePercentage) || 0;
    return Math.round(base * (1 - rebate / 100) * 100) / 100;
  })();

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: tender.currency || 'INR', maximumFractionDigits: 0 })
      .format(value || 0);

  return (
    <div className="space-y-6">
      {/* Readiness */}
      {readiness && (
        <Card className={readiness.ready ? 'border-green-300' : 'border-amber-300'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {readiness.ready
                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {readiness.ready ? 'Ready to submit' : `${readiness.blockers.length} item(s) blocking submission`}
            </CardTitle>
            <CardDescription>
              {readiness.daysRemaining === null
                ? 'No submission deadline recorded'
                : readiness.overdue
                  ? `Deadline passed ${Math.abs(readiness.daysRemaining)} day(s) ago`
                  : `${readiness.daysRemaining} day(s) until the deadline`}
              {' · '}
              {readiness.eligibility.met}/{readiness.eligibility.mandatory} mandatory criteria met
            </CardDescription>
          </CardHeader>
          {readiness.blockers.length > 0 && (
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {readiness.blockers.map((blocker, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {blocker}
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Eligibility */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Eligibility Checklist</CardTitle>
              <CardDescription>Qualification requirements and where we stand</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEligibility([...eligibility, {
                criterion: '', category: 'technical', mandatory: true,
                ourStatus: 'unverified', evidenceDocuments: []
              }])}
            >
              <Plus className="h-4 w-4 mr-2" />Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {eligibility.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No criteria recorded. Add the requirements listed in the tender document.
            </p>
          ) : (
            eligibility.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start rounded-lg border p-3">
                <div className="md:col-span-5">
                  <Input
                    value={item.criterion}
                    placeholder="Criterion"
                    onChange={(e) => setEligibility(eligibility.map((c, i) =>
                      i === index ? { ...c, criterion: e.target.value } : c))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Select
                    value={item.category}
                    onValueChange={(value) => setEligibility(eligibility.map((c, i) =>
                      i === index ? { ...c, category: value as EligibilityCriterion['category'] } : c))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ELIGIBILITY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Select
                    value={item.ourStatus}
                    onValueChange={(value) => setEligibility(eligibility.map((c, i) =>
                      i === index ? { ...c, ourStatus: value as EligibilityCriterion['ourStatus'] } : c))}
                  >
                    <SelectTrigger className={STATUS_COLOR[item.ourStatus]}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ELIGIBILITY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-center gap-2 pt-2">
                  <Checkbox
                    checked={item.mandatory}
                    onCheckedChange={(checked) => setEligibility(eligibility.map((c, i) =>
                      i === index ? { ...c, mandatory: !!checked } : c))}
                  />
                  <span className="text-sm">Mandatory</span>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEligibility(eligibility.filter((_, i) => i !== index))}
                    aria-label="Remove criterion"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="md:col-span-12">
                  <Input
                    value={item.remarks || ''}
                    placeholder="Remarks / evidence reference"
                    onChange={(e) => setEligibility(eligibility.map((c, i) =>
                      i === index ? { ...c, remarks: e.target.value } : c))}
                  />
                </div>
              </div>
            ))
          )}
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => withBusy(
                async () => { await tendersAPI.updateEligibility(tender._id, eligibility); },
                "Eligibility saved"
              )}
            >
              <Save className="h-4 w-4 mr-2" />Save checklist
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tender fee */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />Tender Fee
            </CardTitle>
            <CardDescription>Non-refundable participation fee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                value={fee.amount}
                onChange={(e) => setFee({ ...fee, amount: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={fee.exempted}
                  onCheckedChange={(checked) => setFee({ ...fee, exempted: !!checked })}
                />
                Exempted
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={fee.paid}
                  onCheckedChange={(checked) => setFee({ ...fee, paid: !!checked })}
                />
                Paid
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mode</Label>
                <Select value={fee.mode} onValueChange={(value) => setFee({ ...fee, mode: value })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['online', 'dd', 'cheque', 'cash', 'other'].map(m =>
                      <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference</Label>
                <Input value={fee.reference} onChange={(e) => setFee({ ...fee, reference: e.target.value })} />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.recordTenderFee(tender._id, {
                    amount: parseFloat(fee.amount) || 0,
                    exempted: fee.exempted,
                    paid: fee.paid,
                    mode: (fee.mode || undefined) as any,
                    reference: fee.reference || undefined
                  });
                },
                "Tender fee saved"
              )}
            >
              Save fee
            </Button>
          </CardContent>
        </Card>

        {/* EMD */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />Earnest Money Deposit
                </CardTitle>
                <CardDescription>Refundable — forfeited on withdrawal</CardDescription>
              </div>
              <Badge variant={emd.status === 'submitted' ? 'default' : 'secondary'}>{emd.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0"
                  value={emd.amount}
                  onChange={(e) => setEmd({ ...emd, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={emd.mode} onValueChange={(value) => setEmd({ ...emd, mode: value as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['online', 'dd', 'bank-guarantee', 'fdr', 'exempted'].map(m =>
                      <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={emd.status} onValueChange={(value) => setEmd({ ...emd, status: value as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'submitted', 'returned', 'forfeited'].map(s =>
                      <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valid till</Label>
                <Input
                  type="date"
                  value={emd.validTill}
                  onChange={(e) => setEmd({ ...emd, validTill: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Instrument ref</Label>
                <Input value={emd.instrumentRef} onChange={(e) => setEmd({ ...emd, instrumentRef: e.target.value })} />
              </div>
              <div>
                <Label>Issuing bank</Label>
                <Input value={emd.issuingBank} onChange={(e) => setEmd({ ...emd, issuingBank: e.target.value })} />
              </div>
            </div>
            {emd.mode === 'exempted' && (
              <div>
                <Label>Exemption reason</Label>
                <Input
                  value={emd.exemptionReason}
                  onChange={(e) => setEmd({ ...emd, exemptionReason: e.target.value })}
                  placeholder="e.g. MSME / NSIC registration"
                />
              </div>
            )}
            <Button
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.recordEMD(tender._id, {
                    amount: parseFloat(emd.amount) || 0,
                    mode: emd.mode as any,
                    status: emd.status as any,
                    instrumentRef: emd.instrumentRef || undefined,
                    issuingBank: emd.issuingBank || undefined,
                    validTill: emd.validTill || undefined,
                    exemptionReason: emd.exemptionReason || undefined
                  });
                },
                "EMD saved"
              )}
            >
              Save EMD
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Our bid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Our Bid</CardTitle>
          <CardDescription>
            The final amount is the base amount less the rebate
            {tender.ourBid?.submittedAt && ` · submitted ${new Date(tender.ourBid.submittedAt).toLocaleString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Base amount</Label>
              <Input
                type="number"
                min="0"
                value={bid.baseAmount}
                onChange={(e) => setBid({ ...bid, baseAmount: e.target.value })}
              />
            </div>
            <div>
              <Label>Rebate %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={bid.rebatePercentage}
                onChange={(e) => setBid({ ...bid, rebatePercentage: e.target.value })}
              />
            </div>
            <div>
              <Label>Final amount</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 font-medium">
                {formatMoney(projectedFinal)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bid validity (days)</Label>
              <Input
                type="number"
                min="0"
                value={bid.validityDays}
                onChange={(e) => setBid({ ...bid, validityDays: e.target.value })}
              />
            </div>
            <div>
              <Label>Portal acknowledgement ref</Label>
              <Input
                value={bid.acknowledgementRef}
                onChange={(e) => setBid({ ...bid, acknowledgementRef: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Technical notes</Label>
              <Textarea
                rows={3}
                value={bid.technicalNotes}
                onChange={(e) => setBid({ ...bid, technicalNotes: e.target.value })}
              />
            </div>
            <div>
              <Label>Financial notes</Label>
              <Textarea
                rows={3}
                value={bid.financialNotes}
                onChange={(e) => setBid({ ...bid, financialNotes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={busy}
              onClick={() => withBusy(
                async () => {
                  await tendersAPI.saveOurBid(tender._id, {
                    technical: {
                      documents: tender.ourBid?.technical?.documents || [],
                      notes: bid.technicalNotes || undefined
                    },
                    financial: {
                      baseAmount: parseFloat(bid.baseAmount) || 0,
                      rebatePercentage: bid.rebatePercentage ? parseFloat(bid.rebatePercentage) : undefined,
                      finalAmount: projectedFinal,
                      documents: tender.ourBid?.financial?.documents || [],
                      notes: bid.financialNotes || undefined
                    },
                    validityDays: bid.validityDays ? parseInt(bid.validityDays, 10) : undefined,
                    acknowledgementRef: bid.acknowledgementRef || undefined
                  } as any);
                },
                "Bid saved"
              )}
            >
              <Save className="h-4 w-4 mr-2" />Save bid
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenderBiddingTab;
