"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Gavel, Plus, Search, Trophy, ShieldCheck, CalendarClock, TrendingUp, ExternalLink
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import tendersAPI, { Tender, TenderDirection, TenderStats, PORTAL_LABELS } from "@/lib/api/tendersAPI";

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  identified: 'bg-slate-100 text-slate-700',
  'go-no-go': 'bg-purple-100 text-purple-700',
  preparing: 'bg-blue-100 text-blue-700',
  submitted: 'bg-indigo-100 text-indigo-700',
  'technical-opening': 'bg-cyan-100 text-cyan-700',
  'financial-opening': 'bg-teal-100 text-teal-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  dropped: 'bg-gray-200 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  'bid-submission': 'bg-indigo-100 text-indigo-700',
  evaluation: 'bg-cyan-100 text-cyan-700',
  negotiation: 'bg-amber-100 text-amber-800',
  awarded: 'bg-green-100 text-green-700',
  'work-order-issued': 'bg-emerald-100 text-emerald-700',
  'in-progress': 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-600',
  'no-bid': 'bg-gray-200 text-gray-600'
};

const BIDDING_STATUSES = [
  'identified', 'go-no-go', 'preparing', 'submitted',
  'technical-opening', 'financial-opening', 'won', 'lost', 'dropped', 'in-progress', 'completed'
];
const ISSUED_STATUSES = [
  'draft', 'published', 'bid-submission', 'evaluation', 'negotiation',
  'awarded', 'work-order-issued', 'in-progress', 'completed', 'no-bid'
];

export default function TendersPage() {
  const [direction, setDirection] = useState<TenderDirection>('bidding');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState<TenderStats | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, statistics] = await Promise.all([
        tendersAPI.list({
          direction,
          status: status === 'all' ? undefined : status,
          search: search.trim() || undefined,
          limit: 50
        }),
        tendersAPI.getStats({ direction })
      ]);
      setTenders(list.data || []);
      setStats(statistics);
    } catch (error: any) {
      toast({
        title: "Could not load tenders",
        description: error?.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [direction, status, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const formatMoney = (value: number, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

  const statuses = direction === 'bidding' ? BIDDING_STATUSES : ISSUED_STATUSES;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gavel className="h-7 w-7 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Tenders</h1>
            <p className="text-muted-foreground">
              Tenders we chase and tenders we issue
            </p>
          </div>
        </div>
        <Link href="/dashboard/tenders/create">
          <Button><Plus className="h-4 w-4 mr-2" />New Tender</Button>
        </Link>
      </div>

      <Tabs value={direction} onValueChange={(value) => { setDirection(value as TenderDirection); setStatus('all'); }}>
        <TabsList>
          <TabsTrigger value="bidding">We are bidding</TabsTrigger>
          <TabsTrigger value="issued">We are issuing</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          {direction === 'bidding' ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />Win rate
                  </CardDescription>
                  <CardTitle className="text-2xl">{stats.bidding.winRate}%</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {stats.bidding.won} won · {stats.bidding.lost} lost
                  </p>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />EMD lodged
                  </CardDescription>
                  <CardTitle className="text-2xl">{formatMoney(stats.bidding.emdLodgedAmount)}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    across {stats.bidding.emdLodgedCount} tender(s)
                  </p>
                </CardHeader>
              </Card>
              <Card className={stats.bidding.closingWithin7Days > 0 ? 'border-amber-300' : ''}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />Closing in 7 days
                  </CardDescription>
                  <CardTitle className="text-2xl">{stats.bidding.closingWithin7Days}</CardTitle>
                </CardHeader>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Estimated value</CardDescription>
                  <CardTitle className="text-2xl">{formatMoney(stats.totalEstimatedValue)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Awarded value</CardDescription>
                  <CardTitle className="text-2xl">{formatMoney(stats.totalAwardedValue)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />Savings
                  </CardDescription>
                  <CardTitle className="text-2xl">{stats.savingsPercentage}%</CardTitle>
                </CardHeader>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title, tender number, notice number, authority…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading tenders…</CardContent></Card>
      ) : tenders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Gavel className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No {direction === 'bidding' ? 'tenders being chased' : 'tenders issued'} yet.
            </p>
            <Link href="/dashboard/tenders/create">
              <Button><Plus className="h-4 w-4 mr-2" />Create one</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tenders.map(tender => (
            <Card key={tender._id} className="hover:border-muted-foreground/30 transition">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{tender.tenderNumber}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[tender.status] || 'bg-gray-100'}`}>
                        {tender.status}
                      </span>
                      <Badge variant="outline" className="text-xs">{tender.priority}</Badge>
                      {tender.portal && (
                        <Badge variant="secondary" className="text-xs">{PORTAL_LABELS[tender.portal]}</Badge>
                      )}
                    </div>
                    <CardTitle className="mt-1 text-base truncate">{tender.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {tender.direction === 'bidding' && tender.issuingAuthority?.name
                        ? tender.issuingAuthority.name
                        : tender.category}
                      {tender.tenderNoticeNumber ? ` · ${tender.tenderNoticeNumber}` : ''}
                    </CardDescription>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Est. {formatMoney(tender.estimatedValue, tender.currency)}</span>
                      {tender.submissionDeadline && (
                        <span>Closes {new Date(tender.submissionDeadline).toLocaleDateString()}</span>
                      )}
                      {tender.awardedAmount ? <span>Awarded {formatMoney(tender.awardedAmount, tender.currency)}</span> : null}
                    </div>
                  </div>
                  <Link href={`/dashboard/tenders/${tender._id}`}>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />Open
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
