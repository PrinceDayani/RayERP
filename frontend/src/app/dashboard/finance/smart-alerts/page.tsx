'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Bell, Zap, TrendingUp, Coins, Calendar, Settings } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Alert {
  id: string;
  type: 'Fraud Detection' | 'Duplicate Entry' | 'Budget Overrun' | 'Cash Flow' | 'Compliance' | 'Anomaly';
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  status: 'Active' | 'Resolved' | 'Dismissed';
  amount?: number;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  threshold?: string;
}

export default function SmartAlertsPage() {
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'Fraud Detection',
      title: 'Suspicious Transaction Pattern',
      description: 'Multiple high-value transactions detected from same vendor in short timeframe',
      severity: 'High',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'Active',
      amount: 150000
    },
    {
      id: '2',
      type: 'Duplicate Entry',
      title: 'Potential Duplicate Invoice',
      description: 'Invoice INV-2024-001 appears to be similar to previously processed invoice',
      severity: 'Medium',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'Active',
      amount: 25000
    },
    {
      id: '3',
      type: 'Budget Overrun',
      title: 'Marketing Budget Exceeded',
      description: 'Marketing department has exceeded 90% of allocated budget',
      severity: 'High',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'Active'
    }
  ]);

  const [alertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'Fraud Detection',
      description: 'Detect suspicious transaction patterns and anomalies',
      enabled: true,
      category: 'Security',
      threshold: 'Amount > ₹1,00,000'
    },
    {
      id: '2',
      name: 'Duplicate Detection',
      description: 'Identify potential duplicate entries and transactions',
      enabled: true,
      category: 'Data Quality'
    },
    {
      id: '3',
      name: 'Budget Monitoring',
      description: 'Alert when budgets exceed defined thresholds',
      enabled: true,
      category: 'Budget Control',
      threshold: '80% of budget'
    },
    {
      id: '4',
      name: 'Cash Flow Alerts',
      description: 'Monitor cash flow and liquidity positions',
      enabled: false,
      category: 'Cash Management'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fraud Detection': return AlertTriangle;
      case 'Duplicate Entry': return Bell;
      case 'Budget Overrun': return Coins;
      case 'Cash Flow': return TrendingUp;
      case 'Compliance': return Settings;
      default: return Zap;
    }
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'Active');
  const highSeverityAlerts = alerts.filter(alert => alert.severity === 'High');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Alerts & AI Detection"
        description="AI-powered fraud detection, duplicate identification, and anomaly monitoring"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Smart Alerts' }
        ]}
        actions={
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configure Rules
          </Button>
        }
      />

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{highSeverityAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fraud Detected</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rules Active</p>
                <p className="text-2xl font-bold">{alertRules.filter(rule => rule.enabled).length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <div className="space-y-4">
            {alerts.map((alert) => {
              const IconComponent = getTypeIcon(alert.type);
              return (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">{alert.type}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                            {alert.amount && (
                              <span className="flex items-center gap-1">
                                <Coins className="w-4 h-4" />
                                ₹{alert.amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                        <Button size="sm">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant="outline">{rule.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{rule.description}</p>
                      {rule.threshold && (
                        <p className="text-xs text-muted-foreground">Threshold: {rule.threshold}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.enabled} />
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Alert Analytics</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and trends will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Fraud Detection</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duplicate Detection</span>
                    <span className="font-bold text-green-600">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Anomaly Detection</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>False Positives</span>
                    <span className="font-bold text-yellow-600">3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Duplicate Payment Detected</h3>
                    <p className="text-sm text-muted-foreground">Resolved by Finance Team</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                    <p className="text-sm text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Budget Threshold Alert</h3>
                    <p className="text-sm text-muted-foreground">Dismissed by Department Head</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-gray-100 text-gray-700">Dismissed</Badge>
                    <p className="text-sm text-muted-foreground mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
