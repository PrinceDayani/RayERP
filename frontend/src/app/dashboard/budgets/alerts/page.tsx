'use client';

import { AlertsPanel } from '@/components/budget/AlertsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, XCircle, Clock } from 'lucide-react';

export default function BudgetAlertsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budget Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Monitor budget utilization and receive alerts at critical thresholds
        </p>
      </div>

      {/* Alert Thresholds Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">80%</div>
            <p className="text-xs text-muted-foreground">Budget utilization threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">90%</div>
            <p className="text-xs text-muted-foreground">Budget utilization threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Budget fully utilized</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Alert System</CardTitle>
          <CardDescription>Automated monitoring and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">Hourly Checks</h4>
                <p className="text-sm text-muted-foreground">
                  System automatically checks all budgets every hour for threshold breaches
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Escalating Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Notifications sent to department managers, directors, and finance team based on severity
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Daily Summaries</h4>
                <p className="text-sm text-muted-foreground">
                  Receive daily budget summary emails at 9:00 AM with all active alerts
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Panel */}
      <AlertsPanel />
    </div>
  );
}
