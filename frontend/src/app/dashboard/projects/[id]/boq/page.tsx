'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBOQsByProject } from '@/hooks/useBOQ';
import { useBOQAnalytics } from '@/hooks/useBOQAnalytics';
import { IBOQ } from '@/types/boq';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BOQList from '@/components/boq/BOQList';
import BOQItemsTable from '@/components/boq/BOQItemsTable';
import { Plus, TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

export default function ProjectBOQPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { formatAmount } = useGlobalCurrency();
  const [selectedBOQ, setSelectedBOQ] = useState<IBOQ | null>(null);

  const { data: boqsData } = useBOQsByProject(projectId, { status: 'active' });
  const activeBOQ = boqsData?.boqs?.[0];

  const { useCostForecast, useCategoryBreakdown, useVarianceAnalysis } = useBOQAnalytics();
  const { data: forecastData } = useCostForecast(activeBOQ?._id || '');
  const { data: categoryData } = useCategoryBreakdown(activeBOQ?._id || '');
  const { data: varianceData } = useVarianceAnalysis(activeBOQ?._id || '');

  const handleCreateBOQ = () => {
    router.push(`/dashboard/projects/${projectId}/boq/create`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bill of Quantities (BOQ)</h1>
          <p className="text-muted-foreground">Manage project BOQ and track progress</p>
        </div>
        <Button onClick={handleCreateBOQ}>
          <Plus className="h-4 w-4 mr-2" />
          Create BOQ
        </Button>
      </div>

      {activeBOQ && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Planned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(activeBOQ.totalPlannedAmount, activeBOQ.currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(activeBOQ.totalActualAmount, activeBOQ.currency)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBOQ.overallProgress.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBOQ.items.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {forecastData && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost at Completion</p>
                <p className="text-2xl font-bold">
                  {formatAmount(forecastData.forecast.estimatedCostAtCompletion, activeBOQ?.currency || 'USD')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost to Complete</p>
                <p className="text-2xl font-bold">
                  {formatAmount(forecastData.forecast.estimatedCostToComplete, activeBOQ?.currency || 'USD')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance Index</p>
                <p className="text-2xl font-bold">{forecastData.forecast.performanceIndex.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All BOQs</TabsTrigger>
          {activeBOQ && <TabsTrigger value="active">Active BOQ</TabsTrigger>}
          {categoryData && <TabsTrigger value="categories">Categories</TabsTrigger>}
          {varianceData && <TabsTrigger value="variance">Variance Analysis</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <BOQList projectId={projectId} onSelectBOQ={setSelectedBOQ} />
        </TabsContent>

        {activeBOQ && (
          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>BOQ Items - Version {activeBOQ.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <BOQItemsTable
                  boqId={activeBOQ._id}
                  items={activeBOQ.items}
                  currency={activeBOQ.currency}
                  readonly={activeBOQ.status === 'closed'}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {categoryData && (
          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryData.breakdown.map((cat) => (
                <Card key={cat.category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{cat.category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Items:</span>
                      <span className="font-medium">{cat.itemCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Planned:</span>
                      <span className="font-medium">
                        {formatAmount(cat.plannedAmount, activeBOQ?.currency || 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Actual:</span>
                      <span className="font-medium">
                        {formatAmount(cat.actualAmount, activeBOQ?.currency || 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Variance:</span>
                      <span className={`font-medium ${cat.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatAmount(cat.variance, activeBOQ?.currency || 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span className="font-medium">{cat.progress.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {varianceData && (
          <TabsContent value="variance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {varianceData.analysis.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{item.itemCode}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'under-budget' ? 'bg-green-100 text-green-800' :
                          item.status === 'on-budget' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Qty Variance</p>
                          <p className="font-medium">{item.quantityVariance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Qty Variance %</p>
                          <p className="font-medium">{item.quantityVariancePercentage.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost Variance</p>
                          <p className="font-medium">
                            {formatAmount(item.costVariance, activeBOQ?.currency || 'USD')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost Variance %</p>
                          <p className="font-medium">{item.costVariancePercentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
