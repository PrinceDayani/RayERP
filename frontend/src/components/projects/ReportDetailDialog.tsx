"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import type { DailyReport } from "@/lib/api/projectReportingAPI";

interface ReportDetailDialogProps {
  report: DailyReport | null;
  onClose: () => void;
}

const isLikelyUrl = (s: string) => /^https?:\/\//i.test(s);

const renderCustomFieldValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (typeof value === "string" && isLikelyUrl(value)) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
        {value}
      </a>
    );
  }
  return String(value);
};

export default function ReportDetailDialog({ report, onClose }: ReportDetailDialogProps) {
  if (!report) return null;

  const projectName =
    typeof report.project === "object" && report.project !== null
      ? report.project.name
      : null;

  return (
    <Dialog open={!!report} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report — {format(new Date(report.reportDate), "EEEE, dd MMM yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Reporter Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{report.reportedBy?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {report.reportType} report • {report.totalHours}h total
                  {projectName && <> • {projectName}</>}
                </p>
              </div>
            </div>
            <Badge
              variant={
                report.status === "acknowledged" ? "default" :
                report.status === "submitted" ? "secondary" : "outline"
              }
            >
              {report.status}
            </Badge>
          </div>

          {/* Activities */}
          {report.activities.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Activities ({report.activities.length})</h4>
              <div className="space-y-2">
                {report.activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm">{act.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{act.category}</Badge>
                        <span className="text-xs text-muted-foreground">{act.hoursSpent}h</span>
                        {act.quantityCompleted && (
                          <span className="text-xs text-muted-foreground">• {act.quantityCompleted}</span>
                        )}
                      </div>
                      {act.attachments && act.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {act.attachments.map((att, j) => (
                            <a
                              key={j}
                              href={att}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline truncate max-w-[160px]"
                            >
                              attachment {j + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockers */}
          {report.blockers.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Blockers ({report.blockers.length})
              </h4>
              <div className="space-y-2">
                {report.blockers.map((blocker, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-950/20"
                  >
                    <div>
                      <p className="text-sm">{blocker.description}</p>
                      <Badge variant={blocker.isResolved ? "default" : "destructive"} className="text-xs mt-1">
                        {blocker.isResolved ? "Resolved" : blocker.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financials */}
          {report.financials &&
            (report.financials.paymentsProcessed > 0 || report.financials.invoicesReceived > 0) && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Financial Activity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Payments Processed</p>
                    <p className="font-bold">{report.financials.paymentsProcessed}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Invoices Received</p>
                    <p className="font-bold">{report.financials.invoicesReceived}</p>
                  </div>
                  {report.financials.vendor && (
                    <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                      <p className="text-xs text-muted-foreground">Vendor: {report.financials.vendor}</p>
                      {report.financials.paymentReference && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {report.financials.paymentReference}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Custom template fields */}
          {report.customFieldValues && Object.keys(report.customFieldValues).length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                Template Fields
                {report.templateVersion !== undefined && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (template v{report.templateVersion})
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(report.customFieldValues).map(([key, value]) => {
                  const display = renderCustomFieldValue(value);
                  return (
                    <div key={key} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <div className="text-sm break-words">{display}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {report.nextSteps.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Next Steps</h4>
              <ul className="space-y-1">
                {report.nextSteps.map((step, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground">→</span> {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                {report.notes}
              </p>
            </div>
          )}

          {/* Acknowledgment */}
          {report.acknowledgedBy && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">
                Acknowledged by {report.acknowledgedBy.name}
                {report.acknowledgedAt &&
                  ` on ${format(new Date(report.acknowledgedAt), "dd MMM yyyy, HH:mm")}`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
