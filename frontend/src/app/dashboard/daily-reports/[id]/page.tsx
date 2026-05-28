"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Check,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { projectReportingAPI, type DailyReport } from "@/lib/api/projectReportingAPI";
import { reportCache } from "@/lib/reportingCache";

const isLikelyUrl = (s: string) => /^https?:\/\//i.test(s);

const renderCustomFieldValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "string" && isLikelyUrl(value)) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
        {value}
      </a>
    );
  }
  return String(value);
};

export default function DailyReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reportId = params?.id as string;

  // Instant first paint from cache when available.
  const cached = reportCache.get(reportId);
  const [report, setReport] = useState<DailyReport | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!reportId) return;
    setRefreshing(true);
    try {
      const res = await projectReportingAPI.getReport(reportId);
      setReport(res.data);
      reportCache.set(res.data);
      setError(null);
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "Failed to load report";
      // Only surface as page-level error if we have nothing to render.
      if (!report) setError(message);
      else toast({ title: "Refresh failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportId, report]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAcknowledge = async () => {
    if (!report) return;
    setActionBusy("acknowledge");
    try {
      const res = await projectReportingAPI.acknowledgeReportGlobal(report._id);
      setReport(res.data);
      reportCache.set(res.data);
      toast({ title: "Report acknowledged" });
    } catch (e: any) {
      toast({
        title: "Could not acknowledge",
        description: e?.response?.data?.message || "Try again",
        variant: "destructive"
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    setActionBusy("delete");
    try {
      await projectReportingAPI.deleteReportGlobal(report._id);
      reportCache.invalidate(report._id);
      toast({ title: "Report deleted" });
      router.push("/dashboard/daily-reports");
    } catch (e: any) {
      toast({
        title: "Could not delete",
        description: e?.response?.data?.message || "Try again",
        variant: "destructive"
      });
      setActionBusy(null);
    }
  };

  const handleResolveBlocker = async (blockerId: string) => {
    if (!report) return;
    setActionBusy(`blocker:${blockerId}`);
    try {
      const res = await projectReportingAPI.resolveBlockerGlobal(report._id, blockerId);
      setReport(res.data);
      reportCache.set(res.data);
      toast({ title: "Blocker resolved" });
    } catch (e: any) {
      toast({
        title: "Could not resolve",
        description: e?.response?.data?.message || "Try again",
        variant: "destructive"
      });
    } finally {
      setActionBusy(null);
    }
  };

  if (loading && !report) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Link href="/dashboard/daily-reports" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to daily reports
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) return null;

  const projectName = typeof report.project === "object" && report.project !== null ? report.project.name : null;
  const projectId = typeof report.project === "object" && report.project !== null ? report.project._id : (report.project as string);

  const isAuthor = user?._id === report.reportedBy?._id;
  const canEdit = isAuthor && report.status !== "acknowledged";
  const canDelete = isAuthor && report.status === "draft";
  const canAcknowledge = report.status === "submitted"; // server gates by manager/owner/admin

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/daily-reports"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to daily reports
          </Link>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 flex-wrap">
            <FileText className="h-5 w-5" />
            Report — {format(new Date(report.reportDate), "EEEE, dd MMM yyyy")}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
            {projectName && projectId && (
              <Link href={`/dashboard/projects/${projectId}`} className="hover:text-foreground underline-offset-2 hover:underline">
                {projectName}
              </Link>
            )}
            <span>·</span>
            <Badge variant="outline" className="text-xs capitalize">{report.reportType}</Badge>
            <Badge
              variant={
                report.status === "acknowledged" ? "default" :
                report.status === "submitted" ? "secondary" : "outline"
              }
              className="capitalize"
            >
              {report.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          {canAcknowledge && (
            <Button size="sm" onClick={handleAcknowledge} disabled={actionBusy === "acknowledge"}>
              <Check className="h-4 w-4 mr-1" /> Acknowledge
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/daily-reports/${report._id}/edit`}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Only drafts can be deleted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={actionBusy === "delete"}>
                    Delete report
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Reporter */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{report.reportedBy?.name}</p>
              <p className="text-xs text-muted-foreground">
                {report.reportType} report · {report.totalHours}h total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities */}
      {report.activities.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm mb-2">Activities ({report.activities.length})</h2>
          <div className="space-y-2">
            {report.activities.map((act, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <p className="text-sm">{act.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{act.category}</Badge>
                    <span className="text-xs text-muted-foreground">{act.hoursSpent}h</span>
                    {act.quantityCompleted && (
                      <span className="text-xs text-muted-foreground">· {act.quantityCompleted}</span>
                    )}
                  </div>
                  {act.attachments && act.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {act.attachments.map((att, j) => (
                        <a
                          key={j}
                          href={att}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline truncate max-w-[200px]"
                        >
                          attachment {j + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Blockers */}
      {report.blockers.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Blockers ({report.blockers.length})
          </h2>
          <div className="space-y-2">
            {report.blockers.map((blocker: any) => (
              <Card key={blocker._id} className={blocker.isResolved ? "" : "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/10"}>
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm">{blocker.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={blocker.isResolved ? "default" : "destructive"} className="text-xs">
                        {blocker.isResolved ? "Resolved" : blocker.severity}
                      </Badge>
                      {blocker.resolvedBy && (
                        <span className="text-xs text-muted-foreground">
                          by {blocker.resolvedBy.name}
                          {blocker.resolvedAt && ` on ${format(new Date(blocker.resolvedAt), "dd MMM yyyy")}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {!blocker.isResolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveBlocker(blocker._id)}
                      disabled={actionBusy === `blocker:${blocker._id}`}
                    >
                      <Check className="h-4 w-4 mr-1" /> Resolve
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Financials */}
      {report.financials && (report.financials.paymentsProcessed > 0 || report.financials.invoicesReceived > 0) && (
        <section>
          <h2 className="font-semibold text-sm mb-2">Financial Activity</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Payments Processed</p>
              <p className="font-bold text-lg">{report.financials.paymentsProcessed}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Invoices Received</p>
              <p className="font-bold text-lg">{report.financials.invoicesReceived}</p>
            </CardContent></Card>
            {(report.financials.vendor || report.financials.paymentReference) && (
              <Card className="col-span-2"><CardContent className="p-3">
                {report.financials.vendor && (
                  <p className="text-xs text-muted-foreground">Vendor: {report.financials.vendor}</p>
                )}
                {report.financials.paymentReference && (
                  <p className="text-xs text-muted-foreground">Ref: {report.financials.paymentReference}</p>
                )}
              </CardContent></Card>
            )}
          </div>
        </section>
      )}

      {/* Custom fields */}
      {report.customFieldValues && Object.keys(report.customFieldValues).length > 0 && (
        <section>
          <h2 className="font-semibold text-sm mb-2">
            Template Fields
            {report.templateVersion !== undefined && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">(template v{report.templateVersion})</span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(report.customFieldValues).map(([key, value]) => (
              <Card key={key}><CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{key}</p>
                <div className="text-sm break-words">{renderCustomFieldValue(value)}</div>
              </CardContent></Card>
            ))}
          </div>
        </section>
      )}

      {/* Next steps */}
      {report.nextSteps.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm mb-2">Next Steps</h2>
          <ul className="space-y-1">
            {report.nextSteps.map((step, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">→</span> {step}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Notes */}
      {report.notes && (
        <section>
          <h2 className="font-semibold text-sm mb-2">Notes</h2>
          <Card><CardContent className="p-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.notes}</p>
          </CardContent></Card>
        </section>
      )}

      {/* Acknowledgment trail */}
      {report.acknowledgedBy && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-xs text-muted-foreground">
            Acknowledged by {report.acknowledgedBy.name}
            {report.acknowledgedAt && ` on ${format(new Date(report.acknowledgedAt), "dd MMM yyyy, HH:mm")}`}
          </p>
        </div>
      )}
    </div>
  );
}
