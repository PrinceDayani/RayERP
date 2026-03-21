'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMilestoneBilling } from '@/hooks/useMilestoneBilling';
import { IMilestoneBilling } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MilestoneBillingList from '@/components/billing/MilestoneBillingList';
import { Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

export default function ProjectBillingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { formatAmount } = useGlobalCurrency();
  const [selectedBilling, setSelectedBilling] = useState<IMilestoneBilling | null>(null);

  const { useBillingsByProject, useBillingAnalytics } = useMilestoneBilling();
  const { data: billingsData } = useBillingsByProject(projectId);
  const { data: analyticsData } = useBillingAnalytics(projectId);

  const handleCreateBilling = () => {
    router.push(`/dashboard/projects/${projectId}/billing/create`);
  };

  const analytics = analyticsData?.analytics;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Milestone Billing</h1>
          <p className="text-muted-foreground">Manage project billing and payments</p>
        </div>
        <Button onClick={handleCreateBilling}>
          <Plus className="h-4 w-4 mr-2" />
          Create Billing
        </Button>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(analytics.totalContractValue, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(analytics.totalBilled, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(analytics.totalPaid, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(analytics.totalOutstanding, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(analytics.totalRetention, 'USD')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics.billingsByStatus.draft}</p>
                <p className="text-sm text-muted-foreground">Draft</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics.billingsByStatus.pendingApproval}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics.billingsByStatus.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{analytics.billingsByStatus.invoiced}</p>
                <p className="text-sm text-muted-foreground">Invoiced</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.billingsByStatus.paid}</p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{analytics.billingsByStatus.cancelled}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Billings</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <MilestoneBillingList projectId={projectId} onSelectBilling={setSelectedBilling} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <MilestoneBillingList 
            projectId={projectId} 
            onSelectBilling={setSelectedBilling}
          />
        </TabsContent>

        <TabsContent value="invoiced" className="space-y-4">
          <MilestoneBillingList 
            projectId={projectId} 
            onSelectBilling={setSelectedBilling}
          />
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <MilestoneBillingList 
            projectId={projectId} 
            onSelectBilling={setSelectedBilling}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
