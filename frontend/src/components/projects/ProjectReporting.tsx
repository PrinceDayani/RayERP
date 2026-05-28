"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  FileText,
  Plus,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  IndianRupee,
  Eye,
  Check,
  X,
  Trash2
} from "lucide-react";
import { projectReportingAPI, type DailyReport, type FinancialEntry, type ProgressSummary, type ReportingStatus, type ReportingSchedule, type ReportTemplate, type TemplateFieldType } from "@/lib/api/projectReportingAPI";
import { format } from "date-fns";
import ReportDetailDialog from "./ReportDetailDialog";

interface ProjectReportingProps {
  projectId: string;
  projectBudget?: number;
  projectCurrency?: string;
}

export default function ProjectReporting({ projectId, projectBudget = 0, projectCurrency = "INR" }: ProjectReportingProps) {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [reportingStatus, setReportingStatus] = useState<ReportingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showFinancialDialog, setShowFinancialDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [schedule, setSchedule] = useState<ReportingSchedule | null>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progressRes, reportsRes, financialRes, statusRes, scheduleRes, summaryRes] = await Promise.allSettled([
        projectReportingAPI.getProgressSummary(projectId),
        projectReportingAPI.getProjectReports(projectId, { limit: 10 }),
        projectReportingAPI.getFinancialEntries(projectId, { limit: 10 }),
        projectReportingAPI.getReportingStatus(projectId),
        projectReportingAPI.getSchedule(projectId),
        projectReportingAPI.getFinancialSummary(projectId)
      ]);

      if (progressRes.status === 'fulfilled') setProgressSummary(progressRes.value?.data);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value?.data || []);
      if (financialRes.status === 'fulfilled') setFinancialEntries(financialRes.value?.data || []);
      if (statusRes.status === 'fulfilled') setReportingStatus(statusRes.value?.data);
      if (scheduleRes.status === 'fulfilled') setSchedule(scheduleRes.value?.data || null);
      if (summaryRes.status === 'fulfilled') setFinancialSummary(summaryRes.value?.data || null);
    } catch (error) {
      console.error("Error loading reporting data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Financial Progress</p>
                <p className="text-2xl font-bold">{progressSummary?.financial?.progress || 0}%</p>
              </div>
            </div>
            <Progress value={progressSummary?.financial?.progress || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(progressSummary?.financial?.totalSpent || 0)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              of {new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(progressSummary?.financial?.budget || projectBudget)} budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reports (7 days)</p>
                <p className="text-2xl font-bold">{progressSummary?.reporting?.reportsLast7Days || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                progressSummary?.healthScore === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
                progressSummary?.healthScore === 'at-risk' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                {progressSummary?.healthScore === 'healthy' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                 progressSummary?.healthScore === 'at-risk' ? <AlertTriangle className="h-5 w-5 text-yellow-600" /> :
                 <AlertTriangle className="h-5 w-5 text-red-600" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Health</p>
                <p className="text-lg font-bold capitalize">{progressSummary?.healthScore || 'N/A'}</p>
              </div>
            </div>
            {(progressSummary?.reporting?.unresolvedBlockers || 0) > 0 && (
              <p className="text-xs text-red-500 mt-2">{progressSummary?.reporting?.unresolvedBlockers} unresolved blockers</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Daily Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial Entries</TabsTrigger>
          <TabsTrigger value="compliance">Team Compliance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Budget</span>
                    <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(progressSummary?.financial?.budget || projectBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Spent</span>
                    <span className="font-medium text-red-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(progressSummary?.financial?.totalSpent || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Received</span>
                    <span className="font-medium text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(progressSummary?.financial?.totalReceived || 0)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Remaining</span>
                    <span className="font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(progressSummary?.financial?.remaining || 0)}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Budget Utilization</span>
                    <span>{progressSummary?.financial?.progress || 0}%</span>
                  </div>
                  <Progress value={progressSummary?.financial?.progress || 0} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Reports</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setActiveSubTab("reports")}>View All</Button>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No reports submitted yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 5).map(report => (
                      <div key={report._id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{report.reportedBy?.name}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(report.reportDate), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <Badge variant={report.status === 'acknowledged' ? 'default' : report.status === 'submitted' ? 'secondary' : 'outline'} className="text-xs">
                          {report.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Task vs Financial Progress Comparison */}
          {progressSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Financial Progress (Effective)</span>
                      <span className="font-bold">{progressSummary.financial?.progress || 0}%</span>
                    </div>
                    <Progress value={progressSummary.financial?.progress || 0} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">Based on payments made vs budget</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Task Progress</span>
                      <span className="font-bold">{progressSummary.tasks?.progress || 0}%</span>
                    </div>
                    <Progress value={progressSummary.tasks?.progress || 0} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">{progressSummary.tasks?.completed || 0} of {progressSummary.tasks?.total || 0} tasks completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Daily Reports Tab */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Daily Reports</h3>
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </div>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Reports Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start submitting daily reports to track project progress</p>
                <Button onClick={() => setShowReportDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <Card key={report._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedReport(report)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{report.reportedBy?.name}</p>
                            <Badge variant="outline" className="text-xs">{report.reportType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{format(new Date(report.reportDate), 'EEEE, dd MMM yyyy')}</p>
                          {report.activities.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {report.activities.slice(0, 3).map((act, i) => (
                                <p key={i} className="text-sm">• {act.description} <span className="text-muted-foreground">({act.hoursSpent}h)</span></p>
                              ))}
                              {report.activities.length > 3 && (
                                <p className="text-xs text-muted-foreground">+{report.activities.length - 3} more activities</p>
                              )}
                            </div>
                          )}
                          {report.blockers.length > 0 && (
                            <div className="mt-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-500">{report.blockers.filter(b => !b.isResolved).length} active blockers</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{report.totalHours}h</span>
                        <Badge variant={report.status === 'acknowledged' ? 'default' : report.status === 'submitted' ? 'secondary' : 'outline'}>
                          {report.status === 'acknowledged' && <Check className="h-3 w-3 mr-1" />}
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Financial Entries Tab */}
        <TabsContent value="financial" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Financial Entries</h3>
            <Button onClick={() => setShowFinancialDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Payment
            </Button>
          </div>

          {financialEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Financial Entries</h3>
                <p className="text-sm text-muted-foreground mb-4">Log payments and expenses to track financial progress</p>
                <Button onClick={() => setShowFinancialDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log First Payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {financialEntries.map(entry => (
                <Card key={entry._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          entry.entryType === 'payment-made' || entry.entryType === 'expense' 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <DollarSign className={`h-4 w-4 ${
                            entry.entryType === 'payment-made' || entry.entryType === 'expense' 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{entry.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</span>
                            {entry.vendorOrClient && <span className="text-xs text-muted-foreground">• {entry.vendorOrClient}</span>}
                            <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          entry.entryType === 'payment-made' || entry.entryType === 'expense' 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {entry.entryType === 'payment-made' || entry.entryType === 'expense' ? '-' : '+'}
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: entry.currency || projectCurrency, maximumFractionDigits: 0 }).format(entry.amount)}
                        </p>
                        <Badge variant={entry.status === 'approved' ? 'default' : entry.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs mt-1">
                          {entry.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Department-wise Financial Breakdown */}
          {financialSummary?.categoryBreakdown && financialSummary.categoryBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Entries</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">% of Budget</th>
                        <th className="py-2 px-3 font-medium text-muted-foreground w-32">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialSummary.categoryBreakdown.map((cat: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 px-3 capitalize font-medium">{cat.category}</td>
                          <td className="py-2.5 px-3 text-right">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(cat.total)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">{cat.count}</td>
                          <td className="py-2.5 px-3 text-right font-medium">{cat.percentage}%</td>
                          <td className="py-2.5 px-3">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2">
                        <td className="py-2.5 px-3 font-bold">Total</td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: projectCurrency, maximumFractionDigits: 0 }).format(financialSummary.totalSpent || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">{financialSummary.paymentsMadeCount + financialSummary.paymentsReceivedCount}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{financialSummary.financialProgress}%</td>
                        <td className="py-2.5 px-3">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${Math.min(financialSummary.financialProgress, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Button */}
          {financialEntries.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = projectReportingAPI.exportFinancialEntriesCSV(projectId);
                  window.open(url, '_blank');
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Team Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Reporting Compliance</h3>
            <Badge variant={
              (reportingStatus?.complianceRate || 0) >= 80 ? 'default' :
              (reportingStatus?.complianceRate || 0) >= 50 ? 'secondary' : 'destructive'
            }>
              {reportingStatus?.complianceRate || 0}% Compliance
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{reportingStatus?.totalMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{reportingStatus?.reported || 0}</p>
                <p className="text-xs text-muted-foreground">Reported Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-orange-600">{reportingStatus?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          {reportingStatus?.members && reportingStatus.members.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {reportingStatus.members.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.hasReported ? 'bg-green-100' : 'bg-orange-100'}`}>
                          {member.hasReported ? <Check className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{(member as any).user?.name}</p>
                          {member.report && (
                            <p className="text-xs text-muted-foreground">{member.report.totalHours}h logged • {member.report.activities?.length || 0} activities</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={member.hasReported ? 'default' : 'outline'}>
                        {member.hasReported ? 'Reported' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-sm text-muted-foreground">No team members assigned to this project yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reporting Schedule</h3>
          </div>
          <ReportingSchedulePanel projectId={projectId} schedule={schedule} onUpdate={loadData} />
        </TabsContent>
      </Tabs>

      {/* Submit Report Dialog */}
      <DailyReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        projectId={projectId}
        onSuccess={() => { loadData(); setShowReportDialog(false); }}
      />

      {/* Report Detail Dialog */}
      <ReportDetailDialog
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Log Financial Entry Dialog */}
      <FinancialEntryDialog
        open={showFinancialDialog}
        onOpenChange={setShowFinancialDialog}
        projectId={projectId}
        currency={projectCurrency}
        onSuccess={() => { loadData(); setShowFinancialDialog(false); }}
      />
    </div>
  );
}


// ==========================================
// Daily Report Dialog
// ==========================================

interface DailyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

function DailyReportDialog({ open, onOpenChange, projectId, onSuccess }: DailyReportDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    reportType: 'daily' as 'daily' | 'weekly' | 'milestone',
    activities: [{ description: '', category: 'other' as const, hoursSpent: 0 }],
    blockers: [] as { description: string; severity: 'low' | 'medium' | 'high' | 'critical' }[],
    nextSteps: [''],
    notes: '',
    financials: { paymentsProcessed: 0, invoicesReceived: 0, vendor: '', paymentReference: '' }
  });

  const addActivity = () => {
    setReportForm(prev => ({
      ...prev,
      activities: [...prev.activities, { description: '', category: 'other' as const, hoursSpent: 0 }]
    }));
  };

  const removeActivity = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const updateActivity = (index: number, field: string, value: any) => {
    setReportForm(prev => ({
      ...prev,
      activities: prev.activities.map((act, i) => i === index ? { ...act, [field]: value } : act)
    }));
  };

  const addBlocker = () => {
    setReportForm(prev => ({
      ...prev,
      blockers: [...prev.blockers, { description: '', severity: 'medium' as const }]
    }));
  };

  const removeBlocker = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      blockers: prev.blockers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!reportForm.activities.some(a => a.description.trim())) {
      toast({ title: "Please add at least one activity", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await projectReportingAPI.createReport(projectId, {
        reportDate: reportForm.reportDate,
        reportType: reportForm.reportType,
        activities: reportForm.activities.filter(a => a.description.trim()),
        blockers: reportForm.blockers.filter(b => b.description.trim()),
        nextSteps: reportForm.nextSteps.filter(s => s.trim()),
        notes: reportForm.notes,
        financials: reportForm.financials.paymentsProcessed > 0 || reportForm.financials.invoicesReceived > 0 ? reportForm.financials : undefined,
        status: 'submitted'
      } as any);

      toast({ title: "Report submitted successfully" });
      // Reset form
      setReportForm({
        reportDate: new Date().toISOString().split('T')[0],
        reportType: 'daily',
        activities: [{ description: '', category: 'other', hoursSpent: 0 }],
        blockers: [],
        nextSteps: [''],
        notes: '',
        financials: { paymentsProcessed: 0, invoicesReceived: 0, vendor: '', paymentReference: '' }
      });
      onSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to submit report";
      if (error?.response?.status === 409) {
        toast({ 
          title: "Report already exists for this date", 
          description: "You can update your existing report from the reports list.",
          variant: "destructive" 
        });
      } else {
        toast({ title: message, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Daily Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Date</Label>
              <Input
                type="date"
                value={reportForm.reportDate}
                onChange={(e) => setReportForm(prev => ({ ...prev, reportDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportForm.reportType} onValueChange={(v: any) => setReportForm(prev => ({ ...prev, reportType: v }))}>
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
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Activities *</Label>
              <Button type="button" size="sm" variant="outline" onClick={addActivity}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {reportForm.activities.map((activity, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="What did you work on?"
                    value={activity.description}
                    onChange={(e) => updateActivity(index, 'description', e.target.value)}
                    className="flex-1"
                  />
                  {reportForm.activities.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeActivity(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={activity.category} onValueChange={(v: any) => updateActivity(index, 'category', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={activity.hoursSpent || ''}
                      onChange={(e) => updateActivity(index, 'hoursSpent', parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                      min="0"
                      step="0.5"
                    />
                    <span className="text-xs text-muted-foreground">hrs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Blockers */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Blockers / Issues</Label>
              <Button type="button" size="sm" variant="outline" onClick={addBlocker}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {reportForm.blockers.map((blocker, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Describe the blocker..."
                  value={blocker.description}
                  onChange={(e) => {
                    const updated = [...reportForm.blockers];
                    updated[index] = { ...updated[index], description: e.target.value };
                    setReportForm(prev => ({ ...prev, blockers: updated }));
                  }}
                  className="flex-1"
                />
                <Select
                  value={blocker.severity}
                  onValueChange={(v: any) => {
                    const updated = [...reportForm.blockers];
                    updated[index] = { ...updated[index], severity: v };
                    setReportForm(prev => ({ ...prev, blockers: updated }));
                  }}
                >
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeBlocker(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            {reportForm.blockers.length === 0 && (
              <p className="text-xs text-muted-foreground">No blockers? Great! Skip this section.</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any additional context or notes..."
              value={reportForm.notes}
              onChange={(e) => setReportForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Financial Entry Dialog
// ==========================================

interface FinancialEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currency: string;
  onSuccess: () => void;
}

function FinancialEntryDialog({ open, onOpenChange, projectId, currency, onSuccess }: FinancialEntryDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    entryType: 'payment-made' as 'payment-made' | 'payment-received' | 'invoice-raised' | 'expense',
    amount: 0,
    description: '',
    vendorOrClient: '',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other' as 'material' | 'labor' | 'equipment' | 'subcontractor' | 'overhead' | 'other'
  });

  const handleSubmit = async () => {
    if (!form.description.trim() || form.amount <= 0) {
      toast({ title: "Please fill in description and amount", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await projectReportingAPI.createFinancialEntry(projectId, {
        entryType: form.entryType,
        amount: form.amount,
        currency,
        description: form.description,
        vendorOrClient: form.vendorOrClient || undefined,
        referenceNumber: form.referenceNumber || undefined,
        date: form.date,
        category: form.category
      } as any);

      toast({ title: "Financial entry logged successfully" });
      setForm({
        entryType: 'payment-made',
        amount: 0,
        description: '',
        vendorOrClient: '',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0],
        category: 'other'
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: error?.response?.data?.message || "Failed to log entry", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Financial Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Type *</Label>
              <Select value={form.entryType} onValueChange={(v: any) => setForm(prev => ({ ...prev, entryType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment-made">Payment Made</SelectItem>
                  <SelectItem value="payment-received">Payment Received</SelectItem>
                  <SelectItem value="invoice-raised">Invoice Raised</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v: any) => setForm(prev => ({ ...prev, category: v }))}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ({currency}) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.amount || ''}
                onChange={(e) => setForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Input
              placeholder="e.g., Paid vendor for cement delivery"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor / Client</Label>
              <Input
                placeholder="Name"
                value={form.vendorOrClient}
                onChange={(e) => setForm(prev => ({ ...prev, vendorOrClient: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Invoice/Receipt #"
                value={form.referenceNumber}
                onChange={(e) => setForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Logging..." : "Log Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Reporting Schedule Panel (Item #3)
// ==========================================

interface ReportingSchedulePanelProps {
  projectId: string;
  schedule: ReportingSchedule | null;
  onUpdate: () => void;
}

const ACTIVITY_CATEGORIES = ['construction', 'procurement', 'design', 'inspection', 'administrative', 'other'];

function ReportingSchedulePanel({ projectId, schedule, onUpdate }: ReportingSchedulePanelProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    frequency: schedule?.frequency || 'daily',
    dueTime: schedule?.dueTime || '18:00',
    dueDay: schedule?.dueDay ?? 5,
    reminderEnabled: schedule?.reminderEnabled ?? true,
    reminderBeforeMinutes: schedule?.reminderBeforeMinutes || 60,
    escalateOnMiss: schedule?.escalateOnMiss || false
  });

  const [templateEnabled, setTemplateEnabled] = useState<boolean>(!!schedule?.template);
  const [template, setTemplate] = useState<Omit<ReportTemplate, 'version'>>(() => ({
    sections: schedule?.template?.sections || [],
    customFields: schedule?.template?.customFields || [],
    requiredActivityCategories: schedule?.template?.requiredActivityCategories || [],
    requireBlockers: schedule?.template?.requireBlockers || false,
    requireNextSteps: schedule?.template?.requireNextSteps || false,
    requireFinancials: schedule?.template?.requireFinancials || false
  }));

  useEffect(() => {
    if (schedule) {
      setForm({
        frequency: schedule.frequency,
        dueTime: schedule.dueTime,
        dueDay: schedule.dueDay ?? 5,
        reminderEnabled: schedule.reminderEnabled,
        reminderBeforeMinutes: schedule.reminderBeforeMinutes,
        escalateOnMiss: schedule.escalateOnMiss
      });
      setTemplateEnabled(!!schedule.template);
      setTemplate({
        sections: schedule.template?.sections || [],
        customFields: schedule.template?.customFields || [],
        requiredActivityCategories: schedule.template?.requiredActivityCategories || [],
        requireBlockers: schedule.template?.requireBlockers || false,
        requireNextSteps: schedule.template?.requireNextSteps || false,
        requireFinancials: schedule.template?.requireFinancials || false
      });
    }
  }, [schedule]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = { ...form };
      payload.template = templateEnabled ? template : null;
      await projectReportingAPI.upsertSchedule(projectId, payload);
      toast({ title: "Reporting schedule saved" });
      onUpdate();
    } catch (error: any) {
      toast({ title: error?.response?.data?.message || "Failed to save schedule", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSaving(true);
      await projectReportingAPI.deactivateSchedule(projectId);
      toast({ title: "Reporting schedule deactivated" });
      onUpdate();
    } catch (error: any) {
      toast({ title: "Failed to deactivate", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Configure Reporting Schedule
        </CardTitle>
        <p className="text-sm text-muted-foreground">Set when team members are expected to submit their reports</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={(v: any) => setForm(prev => ({ ...prev, frequency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Time</Label>
            <Input
              type="time"
              value={form.dueTime}
              onChange={(e) => setForm(prev => ({ ...prev, dueTime: e.target.value }))}
            />
          </div>

          {(form.frequency === 'weekly' || form.frequency === 'bi-weekly') && (
            <div className="space-y-2">
              <Label>Due Day</Label>
              <Select value={form.dueDay.toString()} onValueChange={(v) => setForm(prev => ({ ...prev, dueDay: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={form.reminderEnabled}
              onChange={(e) => setForm(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
              className="rounded"
            />
            <div>
              <Label htmlFor="reminderEnabled" className="cursor-pointer text-sm">Send Reminders</Label>
              <p className="text-xs text-muted-foreground">Notify team members before report is due</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="escalateOnMiss"
              checked={form.escalateOnMiss}
              onChange={(e) => setForm(prev => ({ ...prev, escalateOnMiss: e.target.checked }))}
              className="rounded"
            />
            <div>
              <Label htmlFor="escalateOnMiss" className="cursor-pointer text-sm">Escalate on Miss</Label>
              <p className="text-xs text-muted-foreground">Notify manager when a report is missed</p>
            </div>
          </div>
        </div>

        {form.reminderEnabled && (
          <div className="space-y-2 max-w-xs">
            <Label>Remind Before (minutes)</Label>
            <Input
              type="number"
              value={form.reminderBeforeMinutes}
              onChange={(e) => setForm(prev => ({ ...prev, reminderBeforeMinutes: parseInt(e.target.value) || 60 }))}
              min="15"
              step="15"
            />
          </div>
        )}

        {/* Report Template editor */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Report Template</Label>
              <p className="text-xs text-muted-foreground">
                Shape each team-member's daily report. Empty = freeform (default).
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={templateEnabled}
                onChange={e => setTemplateEnabled(e.target.checked)}
                className="rounded"
              />
              Enable template
            </label>
          </div>

          {templateEnabled && (
            <div className="space-y-4 pt-2 border-t">
              {/* Sections */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Sections (checklist for activities)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setTemplate(t => ({
                      ...t,
                      sections: [...t.sections, { key: `section-${Date.now()}`, label: '', required: false }]
                    }))}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add section
                  </Button>
                </div>
                {template.sections.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">No sections yet.</p>
                )}
                {template.sections.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Label (e.g., Site Safety)"
                      value={s.label}
                      onChange={e => setTemplate(t => ({
                        ...t,
                        sections: t.sections.map((x, j) => j === i ? { ...x, label: e.target.value } : x)
                      }))}
                      className="flex-1 h-8 text-xs"
                    />
                    <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={s.required}
                        onChange={e => setTemplate(t => ({
                          ...t,
                          sections: t.sections.map((x, j) => j === i ? { ...x, required: e.target.checked } : x)
                        }))}
                      />
                      Required
                    </label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setTemplate(t => ({
                        ...t,
                        sections: t.sections.filter((_, j) => j !== i)
                      }))}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Custom fields */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Custom fields</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setTemplate(t => ({
                      ...t,
                      customFields: [...t.customFields, { key: `field-${Date.now()}`, label: '', type: 'text', required: false }]
                    }))}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add field
                  </Button>
                </div>
                {template.customFields.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">No custom fields yet.</p>
                )}
                {template.customFields.map((f, i) => (
                  <div key={i} className="border rounded p-2 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Label (e.g., Crew count)"
                        value={f.label}
                        onChange={e => setTemplate(t => ({
                          ...t,
                          customFields: t.customFields.map((x, j) => j === i ? { ...x, label: e.target.value, key: x.key || `field-${Date.now()}-${j}` } : x)
                        }))}
                        className="flex-1 h-8 text-xs"
                      />
                      <Select
                        value={f.type}
                        onValueChange={(v: TemplateFieldType) => setTemplate(t => ({
                          ...t,
                          customFields: t.customFields.map((x, j) => j === i ? { ...x, type: v, options: v === 'select' ? (x.options || ['Option 1']) : undefined } : x)
                        }))}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="photo">Photo URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={e => setTemplate(t => ({
                            ...t,
                            customFields: t.customFields.map((x, j) => j === i ? { ...x, required: e.target.checked } : x)
                          }))}
                        />
                        Required
                      </label>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setTemplate(t => ({
                          ...t,
                          customFields: t.customFields.filter((_, j) => j !== i)
                        }))}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    {f.type === 'select' && (
                      <Input
                        placeholder="Options, comma-separated (e.g. Sunny, Cloudy, Rainy)"
                        value={(f.options || []).join(', ')}
                        onChange={e => setTemplate(t => ({
                          ...t,
                          customFields: t.customFields.map((x, j) => j === i ? { ...x, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : x)
                        }))}
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Required activity categories */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Required activity categories</Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_CATEGORIES.map(cat => {
                    const active = template.requiredActivityCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTemplate(t => ({
                          ...t,
                          requiredActivityCategories: active
                            ? t.requiredActivityCategories.filter(c => c !== cat)
                            : [...t.requiredActivityCategories, cat]
                        }))}
                        className={`text-[10px] px-2 py-1 rounded capitalize border ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Required toggles */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={template.requireBlockers}
                    onChange={e => setTemplate(t => ({ ...t, requireBlockers: e.target.checked }))}
                  />
                  Require blockers
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={template.requireNextSteps}
                    onChange={e => setTemplate(t => ({ ...t, requireNextSteps: e.target.checked }))}
                  />
                  Require next steps
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={template.requireFinancials}
                    onChange={e => setTemplate(t => ({ ...t, requireFinancials: e.target.checked }))}
                  />
                  Require financials
                </label>
              </div>

              {schedule?.template && (
                <p className="text-[10px] text-muted-foreground">
                  Current saved version: v{schedule.template.version}. Existing reports keep their original shape via version snapshot.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : schedule ? "Update Schedule" : "Create Schedule"}
          </Button>
          {schedule && (
            <Button variant="outline" onClick={handleDeactivate} disabled={saving}>
              Deactivate
            </Button>
          )}
        </div>

        {schedule && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Current: Reports due <strong>{schedule.frequency}</strong> by <strong>{schedule.dueTime}</strong>
            {schedule.reminderEnabled && ` • Reminders ${schedule.reminderBeforeMinutes}min before`}
            {schedule.escalateOnMiss && ' • Escalation on miss'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
