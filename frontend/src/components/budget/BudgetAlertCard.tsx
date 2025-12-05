'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { budgetAlertAPI, type BudgetAlert } from '@/lib/api/budgetAlertAPI';
import { useToast } from '@/hooks/use-toast';

interface BudgetAlertCardProps {
  alert: BudgetAlert;
  onAcknowledge?: () => void;
}

export function BudgetAlertCard({ alert, onAcknowledge }: BudgetAlertCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAcknowledge = async () => {
    try {
      setLoading(true);
      await budgetAlertAPI.acknowledgeAlert(alert._id);
      toast({
        title: 'Success',
        description: 'Alert acknowledged successfully',
      });
      onAcknowledge?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to acknowledge alert',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = () => {
    switch (alert.alertType) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.alertType) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'alert':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      default:
        return '';
    }
  };

  const getBadgeVariant = () => {
    switch (alert.alertType) {
      case 'warning':
        return 'secondary';
      case 'alert':
        return 'default';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`${getAlertColor()} ${alert.isAcknowledged ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getAlertIcon()}
            <div>
              <CardTitle className="text-lg">{alert.budget.budgetName}</CardTitle>
              <CardDescription className="mt-1">{alert.message}</CardDescription>
            </div>
          </div>
          <Badge variant={getBadgeVariant()}>
            {alert.alertType.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Utilization Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Budget Utilization</span>
              <span className="text-sm font-bold">{alert.currentUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={alert.currentUtilization} className="h-2" />
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              <span>Threshold: {alert.threshold}%</span>
              <span>
                ${alert.budget.allocatedAmount.toLocaleString()} / $
                {alert.budget.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status */}
          {alert.isAcknowledged ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                Acknowledged by {alert.acknowledgedBy?.name} on{' '}
                {new Date(alert.acknowledgedAt!).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <Button onClick={handleAcknowledge} disabled={loading} className="w-full">
              {loading ? 'Acknowledging...' : 'Acknowledge Alert'}
            </Button>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            Created {new Date(alert.createdAt).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
