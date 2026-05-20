"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  FileText, Plus, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Users, Calendar, Send, Eye, Trash2, Check, X
} from "lucide-react";
import { projectReportingAPI, DailyReport, FinancialEntry, ProgressSummary } from "@/lib/api/projectReportingAPI";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProjectReportingTabProps {
  projectId: string;
}

export default function ProjectReportingTab({ projectId }: ProjectReportingTabProps) {
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  // Report form
  const [reportForm, setReportForm] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    reportType: "daily" as "daily" | "weekly" | "milestone",
    activities: [{ description: "", category: "other" as string, hoursSpent: 0 }],
    blockers: [] as { description: string; severity: string }[],
    nextSteps: [""],
    notes: ""
  });

  // Financial entry form
  const [financialForm, setFinancialForm] = useState({
    entryType: "payment-made" as string,
    amount: 0,
    description: "",
    vendorOrClient: "",
    referenceNumber: "",
    date: new Date().toISOString().split("T")[0],
    category: "other" as string
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsRes, entriesRes, progressRes] = await Promise.all([
        projectReportingAPI.getProjectReports(projectId, { limit: 20 }).catch(() => ({ data: [] })),
        projectReportingAPI.getFinancialEntries(projectId, { limit: 20 }).catch(() => ({ data: [] })),
        projectReportingAPI.getProgressSummary(projectId).catch(() => ({ data: null }))
      ]);
      setReports(reportsRes.data || []);
      setFinancialEntries(entriesRes.data || []);
      setProgressSummary(progressRes.data || null);
    } catch (error) {
      console.error("Failed to fetch reporting data:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitReport = async () => {
    if (!reportForm.activities[0]?.description) {
      toast.error("At least one activity is required");
      return;
    }
    setSubmitting(true);
    try {
      await projectReportingAPI.createReport(projectId, {
        reportDate: reportForm.reportDate,
        reportType: reportForm.reportType,
        activities: reportForm.activities.filter(a => a.description),
        blockers: reportForm.blockers.filter(b => b.description),
        nextSteps: reportForm.nextSteps.filter(Boolean),
        notes: reportForm.notes || undefined,
        status: "submitted"
      } as any);
      toast.success("Report submitted successfully");
      setShowReportDialog(false);
      setReportForm({
        reportDate: new Date().toISOString().split("T")[0],
        reportType: "daily",
        activities: [{ description: "", category: "other", hoursSpent: 0 }],
        blockers: [],
        nextSteps: [""],
        notes: ""
      });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFinancial = async () => {
    if (!financialForm.amount || !financialForm.description) {
      toast.error("Amount and description are required");
      return;
    }
    setSubmitting(true);
    try {
      await projectReportingAPI.createFinancialEntry(projectId, financialForm as any);
      toast.success("Financial entry created");
      setShowFinancialDialog(false);
      setFinancialForm({
        entryType: "payment-made", amount: 0, description: "",
        vendorOrClient: "", referenceNumber: "",
        date: new Date().toISOString().split("T")[0], category: "other"
      });
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedReports.length === 0) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/reports/bulk-acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`
        },
        body: JSON.stringify({ reportIds: selectedReports })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.data.acknowledged} reports acknowledged`);
        setSelectedReports([]);
        fetchData();
      }
    } catch { toast.error("Failed to bulk acknowledge"); }
  };

  const handleBulkApprove = async () => {
    if (selectedEntries.length === 0) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/financial-entries/bulk-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`
        },
        body: JSON.stringify({ entryIds: selectedEntries })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.data.approved} entries approved`);
        setSelectedEntries([]);
        fetchData();
      }
    } catch { toast.error("Failed to bulk approve"); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted": return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case "acknowledged": return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {progressSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold">{progressSummary.effectiveProgress}%</p>
              <p className="text-xs text-muted-foreground">Overall Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-2xl font-bold">{progressSummary.reporting?.reportsLast7Days || 0}</p>
              <p className="text-xs text-muted-foreground">Reports (7 days)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold">{progressSummary.reporting?.unresolvedBlockers || 0}</p>
              <p className="text-xs text-muted-foreground">Open Blockers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Badge className={
                progressSummary.healthScore === "healthy" ? "bg-green-100 text-green-800" :
                progressSummary.healthScore === "at-risk" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }>
                {progressSummary.healthScore}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">Health Score</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="reports">Daily Reports</TabsTrigger>
            <TabsTrigger value="financial">Financial Entries</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {activeTab === "reports" && (
              <>
                {selectedReports.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleBulkAcknowledge}>
                    <Check className="h-3 w-3 mr-1" /> Acknowledge ({selectedReports.length})
                  </Button>
                )}
                <Button size="sm" onClick={() => setShowReportDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Submit Report
                </Button>
              </>
            )}
            {activeTab === "financial" && (
              <>
                {selectedEntries.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleBulkApprove}>
                    <Check className="h-3 w-3 mr-1" /> Approve ({selectedEntries.length})
                  </Button>
                )}
                <Button size="sm" onClick={() => setShowFinancialDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Entry
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          {reports.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No reports submitted yet</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowReportDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Submit First Report
              </Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {reports.map(report => (
                <Card key={report._id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedReports.includes(report._id)}
                        onCheckedChange={(checked) => {
                          setSelectedReports(prev =>
                            checked ? [...prev, report._id] : prev.filter(id => id !== report._id)
                          );
                        }}
                        disabled={report.status === "acknowledged"}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {report.reportedBy?.firstName} {report.reportedBy?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(report.reportDate), "MMM dd, yyyy")}
                            </span>
                            <Badge variant="outline" className="text-xs">{report.reportType}</Badge>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{report.activities?.length || 0} activities</span>
                          <span>{report.totalHours || 0}h logged</span>
                          {report.blockers?.length > 0 && (
                            <span className="text-amber-600">{report.blockers.length} blockers</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-4">
          {financialEntries.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No financial entries yet</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowFinancialDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add First Entry
              </Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {financialEntries.map(entry => (
                <Card key={entry._id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedEntries.includes(entry._id)}
                        onCheckedChange={(checked) => {
                          setSelectedEntries(prev =>
                            checked ? [...prev, entry._id] : prev.filter(id => id !== entry._id)
                          );
                        }}
                        disabled={entry.status !== "pending"}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{entry.description}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">{entry.entryType}</Badge>
                              <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.date), "MMM dd")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {entry.currency} {entry.amount.toLocaleString()}
                            </p>
                            {getStatusBadge(entry.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Daily Report</DialogTitle>
            <DialogDescription>Record your activities, blockers, and next steps</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={reportForm.reportDate}
                  onChange={e => setReportForm(f => ({ ...f, reportDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={reportForm.reportType} onValueChange={v => setReportForm(f => ({ ...f, reportType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Activities */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-medium">Activities</Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
                  onClick={() => setReportForm(f => ({ ...f, activities: [...f.activities, { description: "", category: "other", hoursSpent: 0 }] }))}>
                  + Add
                </Button>
              </div>
              {reportForm.activities.map((activity, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="What did you work on?" className="flex-1" value={activity.description}
                    onChange={e => {
                      const acts = [...reportForm.activities];
                      acts[i] = { ...acts[i], description: e.target.value };
                      setReportForm(f => ({ ...f, activities: acts }));
                    }} />
                  <Input type="number" placeholder="Hrs" className="w-16" value={activity.hoursSpent || ""}
                    onChange={e => {
                      const acts = [...reportForm.activities];
                      acts[i] = { ...acts[i], hoursSpent: parseFloat(e.target.value) || 0 };
                      setReportForm(f => ({ ...f, activities: acts }));
                    }} />
                  <Select value={activity.category} onValueChange={v => {
                    const acts = [...reportForm.activities];
                    acts[i] = { ...acts[i], category: v };
                    setReportForm(f => ({ ...f, activities: acts }));
                  }}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="administrative">Admin</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Blockers */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-medium">Blockers (optional)</Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
                  onClick={() => setReportForm(f => ({ ...f, blockers: [...f.blockers, { description: "", severity: "medium" }] }))}>
                  + Add
                </Button>
              </div>
              {reportForm.blockers.map((blocker, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Describe the blocker" className="flex-1" value={blocker.description}
                    onChange={e => {
                      const bl = [...reportForm.blockers];
                      bl[i] = { ...bl[i], description: e.target.value };
                      setReportForm(f => ({ ...f, blockers: bl }));
                    }} />
                  <Select value={blocker.severity} onValueChange={v => {
                    const bl = [...reportForm.blockers];
                    bl[i] = { ...bl[i], severity: v };
                    setReportForm(f => ({ ...f, blockers: bl }));
                  }}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea placeholder="Any additional notes..." value={reportForm.notes}
                onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitReport} disabled={submitting}>
              <Send className="h-4 w-4 mr-1" /> {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial Entry Dialog */}
      <Dialog open={showFinancialDialog} onOpenChange={setShowFinancialDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Financial Entry</DialogTitle>
            <DialogDescription>Record a payment, expense, or invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={financialForm.entryType} onValueChange={v => setFinancialForm(f => ({ ...f, entryType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment-made">Payment Made</SelectItem>
                    <SelectItem value="payment-received">Payment Received</SelectItem>
                    <SelectItem value="invoice-raised">Invoice Raised</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={financialForm.category} onValueChange={v => setFinancialForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="overhead">Overhead</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Amount *</Label>
              <Input type="number" placeholder="0" value={financialForm.amount || ""}
                onChange={e => setFinancialForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label className="text-xs">Description *</Label>
              <Input placeholder="e.g., Cement purchase from ABC Suppliers"
                value={financialForm.description}
                onChange={e => setFinancialForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Vendor/Client</Label>
                <Input placeholder="Name" value={financialForm.vendorOrClient}
                  onChange={e => setFinancialForm(f => ({ ...f, vendorOrClient: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Reference #</Label>
                <Input placeholder="INV-001" value={financialForm.referenceNumber}
                  onChange={e => setFinancialForm(f => ({ ...f, referenceNumber: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={financialForm.date}
                onChange={e => setFinancialForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinancialDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitFinancial} disabled={submitting}>
              {submitting ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
