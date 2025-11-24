'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Coins, AlertTriangle, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL  || process.env.BACKEND_URL;

export default function ProjectFinancialPage() {
  const params = useParams();
  const projectId = params.id;
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [budgetActual, setBudgetActual] = useState<any>(null);
  const [profitability, setProfitability] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, [projectId]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${API_URL}/api/project-ledger/${projectId}/financial-dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDashboard(data);
      setBudgetActual(data.budgetActual);
      setProfitability(data.profitability);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateActuals = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/project-ledger/${projectId}/recalculate-actuals`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (error) {
      console.error('Error recalculating:', error);
    }
  };

  const calculateProfitability = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/project-ledger/${projectId}/calculate-profitability`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (error) {
      console.error('Error calculating:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Project Financial Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={recalculateActuals} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
          <Button onClick={calculateProfitability}>
            Calculate Profitability
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.summary?.budgetUtilization?.toFixed(1)}%
            </div>
            <div className={`text-sm ${dashboard?.summary?.budgetUtilization > 90 ? 'text-red-600' : 'text-green-600'}`}>
              {dashboard?.summary?.budgetUtilization > 90 ? 'Over Budget' : 'On Track'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.summary?.profitMargin?.toFixed(1)}%
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Net Margin
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.summary?.roi?.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Return on Investment</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(dashboard?.summary?.variance || 0).toLocaleString()}
            </div>
            <div className={`flex items-center text-sm ${dashboard?.summary?.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboard?.summary?.variance >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {dashboard?.summary?.variance >= 0 ? 'Favorable' : 'Unfavorable'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList>
          <TabsTrigger value="budget">Budget vs Actual</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
          {budgetActual?.alerts && budgetActual.alerts.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Budget Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetActual.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className="mb-2 p-2 bg-yellow-50 rounded">
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm text-gray-600">
                      Threshold: {alert.threshold}% | Current: {alert.current.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Budgeted Revenue</div>
                    <div className="text-xl font-bold">${budgetActual?.budgetedRevenue?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Actual Revenue</div>
                    <div className="text-xl font-bold text-green-600">${budgetActual?.actualRevenue?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Variance</div>
                    <div className={`text-xl font-bold ${(budgetActual?.actualRevenue - budgetActual?.budgetedRevenue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs((budgetActual?.actualRevenue || 0) - (budgetActual?.budgetedRevenue || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Budgeted Cost</div>
                    <div className="text-xl font-bold">${budgetActual?.budgetedCost?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Actual Cost</div>
                    <div className="text-xl font-bold text-red-600">${budgetActual?.actualCost?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Utilization</div>
                    <div className="text-xl font-bold">{budgetActual?.utilizationPercent?.toFixed(1) || 0}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Budgeted Profit</div>
                    <div className="text-xl font-bold">${budgetActual?.budgetedProfit?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Actual Profit</div>
                    <div className="text-xl font-bold text-blue-600">${budgetActual?.actualProfit?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Variance %</div>
                    <div className={`text-xl font-bold ${budgetActual?.variancePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budgetActual?.variancePercent?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-bold text-green-600">${profitability?.revenue?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct Costs</span>
                  <span className="font-bold text-red-600">${profitability?.directCosts?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Indirect Costs</span>
                  <span className="font-bold text-orange-600">${profitability?.indirectCosts?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Total Costs</span>
                  <span className="font-bold">${profitability?.totalCosts?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profitability Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Profit</span>
                  <span className="font-bold">${profitability?.grossProfit?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Margin</span>
                  <span className="font-bold text-blue-600">{profitability?.grossMargin?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Profit</span>
                  <span className="font-bold text-green-600">${profitability?.netProfit?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Margin</span>
                  <span className="font-bold text-green-600">{profitability?.netMargin?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">ROI</span>
                  <span className="font-bold text-purple-600">{profitability?.roi?.toFixed(1) || 0}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Break-Even Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-sm text-gray-600">Break-Even Point</div>
                <div className="text-3xl font-bold text-blue-600">
                  ${profitability?.breakEvenPoint?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Revenue needed to cover all costs
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {profitability?.profitTrend && profitability.profitTrend.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 p-2 font-bold border-b-2">
                    <div>Month</div>
                    <div>Revenue</div>
                    <div>Cost</div>
                    <div>Profit</div>
                    <div>Margin</div>
                  </div>
                  {profitability.profitTrend.map((point: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-5 gap-4 p-2 border-b">
                      <div className="font-medium">{point.month}</div>
                      <div className="text-green-600">${point.revenue.toLocaleString()}</div>
                      <div className="text-red-600">${point.cost.toLocaleString()}</div>
                      <div className="font-bold">${point.profit.toLocaleString()}</div>
                      <div className={point.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {point.margin.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No trend data available. Calculate profitability to see trends.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
