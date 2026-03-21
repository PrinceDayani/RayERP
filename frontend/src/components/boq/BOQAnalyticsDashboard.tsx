'use client';

import { useBOQAnalytics } from '@/hooks/useBOQAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BOQAnalyticsDashboardProps {
  boqId: string;
  currency: string;
}

export default function BOQAnalyticsDashboard({ boqId, currency }: BOQAnalyticsDashboardProps) {
  const { useCostForecast, useCategoryBreakdown, useVarianceAnalysis } = useBOQAnalytics();
  
  const { data: forecastData, isLoading: forecastLoading } = useCostForecast(boqId);
  const { data: categoryData, isLoading: categoryLoading } = useCategoryBreakdown(boqId);
  const { data: varianceData, isLoading: varianceLoading } = useVarianceAnalysis(boqId);

  if (forecastLoading || categoryLoading || varianceLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const forecast = forecastData?.forecast;
  const categories = categoryData?.breakdown || [];
  const variances = varianceData?.analysis || [];

  const overBudgetItems = variances.filter(v => v.status === 'over-budget').length;
  const underBudgetItems = variances.filter(v => v.status === 'under-budget').length;

  return (
    <div className="space-y-6">
      {forecast && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Est. Cost at Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(forecast.estimatedCostAtCompletion, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Variance: {formatCurrency(forecast.costVariance, currency)} ({forecast.costVariancePercentage.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Cost to Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(forecast.estimatedCostToComplete, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Remaining work estimate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Performance Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {forecast.performanceIndex.toFixed(2)}
                {forecast.performanceIndex >= 1 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {forecast.performanceIndex >= 1 ? 'On track' : 'Behind schedule'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{cat.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {cat.progress.toFixed(1)}% complete
                  </span>
                </div>
                <Progress value={cat.progress} />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Planned: </span>
                    <span className="font-medium">{formatCurrency(cat.plannedAmount, currency)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual: </span>
                    <span className="font-medium">{formatCurrency(cat.actualAmount, currency)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Variance: </span>
                    <span className={`font-medium ${cat.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(cat.variance, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Over Budget</span>
                </div>
                <span className="text-2xl font-bold">{overBudgetItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Under Budget</span>
                </div>
                <span className="text-2xl font-bold">{underBudgetItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">On Budget</span>
                </div>
                <span className="text-2xl font-bold">
                  {variances.length - overBudgetItems - underBudgetItems}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Variances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {variances
                .sort((a, b) => Math.abs(b.costVariancePercentage) - Math.abs(a.costVariancePercentage))
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {item.status === 'over-budget' && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{item.itemCode}</span>
                    </div>
                    <span className={item.costVariancePercentage > 0 ? 'text-red-600' : 'text-green-600'}>
                      {item.costVariancePercentage > 0 ? '+' : ''}
                      {item.costVariancePercentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
