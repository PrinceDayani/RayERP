"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { format } from "date-fns";
import ReportDetailDialog from "@/components/projects/ReportDetailDialog";
import {
  projectReportingAPI,
  type DailyReport,
  type ReportsMatrix,
  type ReportsFeedSummary,
  type ReportsFeedFilters
} from "@/lib/api/projectReportingAPI";

type StatusFilter = "all" | "draft" | "submitted" | "acknowledged";

const PAGE_LIMIT = 20;

export default function DailyReportsDashboardPage() {
  const [summary, setSummary] = useState<ReportsFeedSummary | null>(null);
  const [matrix, setMatrix] = useState<ReportsMatrix | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hasBlockersFilter, setHasBlockersFilter] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(1);

  const buildFilters = useCallback((): ReportsFeedFilters => {
    const f: ReportsFeedFilters = { page, limit: PAGE_LIMIT };
    if (projectFilter !== "all") f.projectIds = [projectFilter];
    if (memberFilter !== "all") f.userIds = [memberFilter];
    if (statusFilter !== "all") f.status = statusFilter;
    if (hasBlockersFilter) f.hasBlockers = true;
    if (fromDate) f.from = new Date(fromDate).toISOString();
    if (toDate) {
      const t = new Date(toDate);
      t.setHours(23, 59, 59, 999);
      f.to = t.toISOString();
    }
    return f;
  }, [projectFilter, memberFilter, statusFilter, hasBlockersFilter, fromDate, toDate, page]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await projectReportingAPI.getReportsFeedSummary();
      setSummary(res.data);
    } catch (e) {
      console.error("Failed to load summary:", e);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchMatrix = useCallback(async () => {
    setLoadingMatrix(true);
    try {
      const res = await projectReportingAPI.getReportsMatrix({});
      setMatrix(res.data);
    } catch (e) {
      console.error("Failed to load matrix:", e);
    } finally {
      setLoadingMatrix(false);
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const res = await projectReportingAPI.getReportsFeed(buildFilters());
      setReports(res.data || []);
      setPagination({
        total: res.pagination?.total || 0,
        page: res.pagination?.page || 1,
        pages: res.pagination?.pages || 0
      });
    } catch (e) {
      console.error("Failed to load feed:", e);
      setReports([]);
    } finally {
      setLoadingFeed(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    fetchSummary();
    fetchMatrix();
  }, [fetchSummary, fetchMatrix]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Reset to page 1 when any filter (other than page itself) changes
  useEffect(() => {
    setPage(1);
  }, [projectFilter, memberFilter, statusFilter, hasBlockersFilter, fromDate, toDate]);

  const projectOptions = matrix?.projects || [];
  const memberOptions = matrix?.members || [];

  const dateColumns = useMemo(() => {
    if (!matrix) return [];
    const cols: string[] = [];
    const from = new Date(matrix.range.from);
    const to = new Date(matrix.range.to);
    const cursor = new Date(from);
    while (cursor <= to) {
      cols.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    return cols;
  }, [matrix]);

  const clearFilters = () => {
    setProjectFilter("all");
    setMemberFilter("all");
    setStatusFilter("all");
    setHasBlockersFilter(false);
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilter =
    projectFilter !== "all" ||
    memberFilter !== "all" ||
    statusFilter !== "all" ||
    hasBlockersFilter ||
    !!fromDate ||
    !!toDate;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Reports</h1>
        <p className="text-sm text-muted-foreground">
          Cross-project monitoring — every report from projects you have access to.
        </p>
      </div>

      {/* Headline cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          label="Reports today"
          value={summary?.reportsToday ?? 0}
          loading={loadingSummary}
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            setFromDate(today);
            setToDate(today);
          }}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5 text-amber-600" />}
          label="Pending acknowledgments"
          value={summary?.pendingAcknowledgments ?? 0}
          loading={loadingSummary}
          onClick={() => setStatusFilter("submitted")}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          label="Open blockers"
          value={summary?.openBlockers ?? 0}
          loading={loadingSummary}
          onClick={() => setHasBlockersFilter(true)}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          label="7-day compliance"
          value={`${summary?.complianceLast7d ?? 0}%`}
          loading={loadingSummary}
        />
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="matrix">Matrix (14 days)</TabsTrigger>
        </TabsList>

        {/* Feed */}
        <TabsContent value="feed" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Project</Label>
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger><SelectValue placeholder="All projects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      {projectOptions.map(p => (
                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Member</Label>
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger><SelectValue placeholder="All members" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All members</SelectItem>
                      {memberOptions.map(m => (
                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>

                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasBlockersFilter}
                      onChange={e => setHasBlockersFilter(e.target.checked)}
                      className="rounded"
                    />
                    Has blockers
                  </label>
                </div>
              </div>

              {hasActiveFilter && (
                <div className="flex justify-end mt-3">
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    <X className="h-3 w-3 mr-1" /> Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feed list */}
          {loadingFeed ? (
            <div className="space-y-2">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No reports match these filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {reports.map(report => (
                <FeedRow
                  key={report._id}
                  report={report}
                  onClick={() => setViewingReport(report)}
                />
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} • {pagination.total} reports
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Matrix */}
        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reporting matrix — last 14 days</CardTitle>
              <p className="text-xs text-muted-foreground">
                Rows: team members. Columns: dates. Cell shows hours logged when reported.
              </p>
            </CardHeader>
            <CardContent>
              {loadingMatrix ? (
                <Skeleton className="h-64" />
              ) : !matrix || matrix.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reporting activity in the last 14 days for projects you can access.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 sticky left-0 bg-background z-10">Member</th>
                        {dateColumns.map(d => {
                          const day = new Date(d);
                          return (
                            <th key={d} className="text-center py-2 px-1 font-medium text-muted-foreground whitespace-nowrap">
                              <div>{format(day, "EEE")}</div>
                              <div className="text-[10px]">{format(day, "MMM d")}</div>
                            </th>
                          );
                        })}
                        <th className="text-right py-2 px-2 whitespace-nowrap">Total h</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.members.map(member => {
                        let totalHours = 0;
                        return (
                          <tr key={member._id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 px-2 sticky left-0 bg-background z-10 font-medium whitespace-nowrap">
                              {member.name}
                            </td>
                            {dateColumns.map(d => {
                              // Sum across all projects this member reported on for this date
                              let dayHours = 0;
                              let reported = false;
                              for (const proj of matrix.projects) {
                                const cell = matrix.cells[`${member._id}__${proj._id}__${d}`];
                                if (cell?.hasReported) {
                                  dayHours += cell.hours || 0;
                                  reported = true;
                                }
                              }
                              totalHours += dayHours;
                              return (
                                <td key={d} className="text-center py-1 px-1">
                                  {reported ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px] font-medium">
                                      {dayHours}h
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-right py-2 px-2 font-semibold whitespace-nowrap">{totalHours}h</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReportDetailDialog
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
}

// ==========================================
// Sub-components
// ==========================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading?: boolean;
  onClick?: () => void;
}

function MetricCard({ icon, label, value, loading, onClick }: MetricCardProps) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover:border-primary/40 transition-colors" : ""}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FeedRowProps {
  report: DailyReport;
  onClick: () => void;
}

function FeedRow({ report, onClick }: FeedRowProps) {
  const projectName =
    typeof report.project === "object" && report.project !== null
      ? report.project.name
      : "—";

  const statusColor =
    report.status === "acknowledged"
      ? "default"
      : report.status === "submitted"
      ? "secondary"
      : "outline";

  return (
    <Card
      className="hover:shadow-sm hover:border-primary/40 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{report.reportedBy?.name}</span>
              <Badge variant="outline" className="text-xs">{projectName}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{report.reportType}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(report.reportDate), "EEE, dd MMM yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{report.activities?.length || 0} activities</span>
              <span>{report.totalHours || 0}h logged</span>
              {report.blockers && report.blockers.length > 0 && (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {report.blockers.filter(b => !b.isResolved).length || report.blockers.length} blockers
                </span>
              )}
              {report.notes && (
                <span className="truncate max-w-[300px] italic">"{report.notes}"</span>
              )}
            </div>
          </div>
          <Badge variant={statusColor} className="text-xs capitalize">{report.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
