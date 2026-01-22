'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetForecastAPI, BudgetForecast } from '@/lib/api/budgetForecastAPI';
import GenerateForecastDialog from '@/components/budget/GenerateForecastDialog';
import ForecastChart from '@/components/budget/ForecastChart';
import ForecastHistoryPanel from '@/components/budget/ForecastHistoryPanel';
import { TrendingUp, Brain, BarChart3, Zap, ArrowLeft } from 'lucide-react';
import api from '@/lib/api/axios';
import Link from 'next/link';
import { SectionLoader } from '@/components/PageLoader';

export default function BudgetForecastsPage() {
  const params = useParams();
  const budgetId = params.id as string;
  const [budgetName, setBudgetName] = useState('');
  const [forecasts, setForecasts] = useState<BudgetForecast[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<BudgetForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (budgetId) {
      fetchBudgetAndForecasts();
    }
  }, [budgetId]);

  const fetchBudgetAndForecasts = async () => {
    setLoading(true);
    try {
      const [budgetRes, forecastsRes] = await Promise.all([
        api.get(`/budgets/${budgetId}`),
        budgetForecastAPI.getForecasts(budgetId)
      ]);
      setBudgetName(budgetRes.data.data.budgetName);
      setForecasts(forecastsRes.data || []);
      if (forecastsRes.data?.length > 0) {
        setSelectedForecast(forecastsRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/budgets/${budgetId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Forecasting: {budgetName}</h1>
          <p className="text-gray-600 mt-1">AI-powered budget forecasting with multiple algorithms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              ML Auto-Select
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">AI chooses best algorithm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Linear Regression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Simple trend-based</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              Seasonal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Accounts for patterns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              Exponential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Weighted recent data</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Forecast
        </Button>
      </div>

      {
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Visualization</CardTitle>
                <CardDescription>Interactive chart with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SectionLoader text="Loading forecasts..." />
                ) : selectedForecast ? (
                  <ForecastChart forecast={selectedForecast} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No forecast selected. Generate a forecast to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Forecast History</CardTitle>
                <CardDescription>Previous forecasts for this budget</CardDescription>
              </CardHeader>
              <CardContent>
                <ForecastHistoryPanel
                  forecasts={forecasts}
                  onSelectForecast={setSelectedForecast}
                  selectedForecastId={selectedForecast?._id}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      }

      <Card>
        <CardHeader>
          <CardTitle>How Forecasting Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                ML Auto-Select
              </div>
              <p className="text-sm text-gray-600">
                AI analyzes historical data and automatically selects the best algorithm
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Linear
              </div>
              <p className="text-sm text-gray-600">
                Best for steady, consistent growth patterns
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                Seasonal
              </div>
              <p className="text-sm text-gray-600">
                Ideal for budgets with recurring patterns
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-600" />
                Exponential
              </div>
              <p className="text-sm text-gray-600">
                Gives more weight to recent spending trends
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ 4 forecasting algorithms (Linear, Seasonal, Exponential, ML)</li>
              <li>✓ Confidence intervals with upper/lower bounds</li>
              <li>✓ 1-24 month forecast periods</li>
              <li>✓ Accuracy tracking with MAPE and RMSE</li>
              <li>✓ Historical data analysis</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <GenerateForecastDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchBudgetAndForecasts}
        budgetId={budgetId}
        budgetName={budgetName}
      />
    </div>
  );
}
