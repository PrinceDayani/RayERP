'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetReportAPI, BudgetReport } from '@/lib/api/budgetReportAPI';
import GenerateReportDialog from '@/components/budget/GenerateReportDialog';
import { FileText, Download, Trash2, FileSpreadsheet, FileJson } from 'lucide-react';
import { SectionLoader } from '@/components/PageLoader';

export default function BudgetReportsPage() {
  const [reports, setReports] = useState<BudgetReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        budgetReportAPI.getReports(),
        budgetReportAPI.getStatistics(),
      ]);
      setReports(reportsRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string, fileName: string) => {
    try {
      const blob = await budgetReportAPI.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Delete this report?')) return;
    try {
      await budgetReportAPI.deleteReport(reportId);
      fetchReports();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-600" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'csv': return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
      case 'json': return <FileJson className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Reports & Export</h1>
          <p className="text-gray-600 mt-1">Generate and download budget reports in multiple formats</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">PDF Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byFormat?.pdf || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Excel Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byFormat?.excel || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>Download or delete your reports (auto-expire in 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SectionLoader text="Loading reports..." />
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report._id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {getFormatIcon(report.format)}
                    <div>
                      <div className="font-medium">{report.reportType.toUpperCase()} Report</div>
                      <div className="text-sm text-gray-600">
                        {report.format.toUpperCase()} • {(report.fileSize / 1024).toFixed(2)} KB • 
                        Generated {new Date(report.generatedAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(report.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(report._id, `budget-report.${report.format}`)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(report._id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reports generated yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Types & Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Report Types</h4>
              <ul className="text-sm space-y-1">
                <li>• Summary - Overview of all budgets</li>
                <li>• Detailed - Complete budget breakdown</li>
                <li>• Variance - Actual vs budgeted</li>
                <li>• Forecast - Future projections</li>
                <li>• Comparison - Multi-period comparison</li>
                <li>• Custom - Customized reports</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Export Formats</h4>
              <ul className="text-sm space-y-1">
                <li>• PDF - Printable documents</li>
                <li>• Excel - Spreadsheet analysis</li>
                <li>• CSV - Data import/export</li>
                <li>• JSON - API integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <GenerateReportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchReports}
      />
    </div>
  );
}
