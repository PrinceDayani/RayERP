'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff } from 'lucide-react';
import { budgetAlertAPI, type BudgetAlert } from '@/lib/api/budgetAlertAPI';
import { BudgetAlertCard } from './BudgetAlertCard';
import { useToast } from '@/hooks/use-toast';

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unacknowledged');
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await budgetAlertAPI.getUnacknowledgedAlerts();
      setAlerts(response.alerts || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const unacknowledgedAlerts = alerts.filter((a) => !a.isAcknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.isAcknowledged);

  const alertsByType = {
    warning: alerts.filter((a) => a.alertType === 'warning' && !a.isAcknowledged),
    alert: alerts.filter((a) => a.alertType === 'alert' && !a.isAcknowledged),
    critical: alerts.filter((a) => a.alertType === 'critical' && !a.isAcknowledged),
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{unacknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Unacknowledged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500">{alertsByType.warning.length}</div>
            <p className="text-xs text-muted-foreground">Warnings (80%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{alertsByType.alert.length}</div>
            <p className="text-xs text-muted-foreground">Alerts (90%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{alertsByType.critical.length}</div>
            <p className="text-xs text-muted-foreground">Critical (100%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unacknowledged">
            <Bell className="h-4 w-4 mr-2" />
            Unacknowledged ({unacknowledgedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            <BellOff className="h-4 w-4 mr-2" />
            Acknowledged ({acknowledgedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unacknowledged" className="space-y-4 mt-4">
          {unacknowledgedAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Unacknowledged Alerts</h3>
                <p className="text-sm text-muted-foreground text-center">
                  All budget alerts have been acknowledged
                </p>
              </CardContent>
            </Card>
          ) : (
            unacknowledgedAlerts.map((alert) => (
              <BudgetAlertCard key={alert._id} alert={alert} onAcknowledge={fetchAlerts} />
            ))
          )}
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4 mt-4">
          {acknowledgedAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Acknowledged Alerts</h3>
                <p className="text-sm text-muted-foreground text-center">
                  No alerts have been acknowledged yet
                </p>
              </CardContent>
            </Card>
          ) : (
            acknowledgedAlerts.map((alert) => (
              <BudgetAlertCard key={alert._id} alert={alert} onAcknowledge={fetchAlerts} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                <p className="text-sm text-muted-foreground text-center">
                  No budget alerts have been generated
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <BudgetAlertCard key={alert._id} alert={alert} onAcknowledge={fetchAlerts} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
