'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { budgetVarianceAPI, BudgetVariance } from '@/lib/api/budgetVarianceAPI';
import GenerateVarianceDialog from '@/components/budget/GenerateVarianceDialog';
import VarianceChart from '@/components/budget/VarianceChart';
import VarianceInsightsPanel from '@/components/budget/VarianceInsightsPanel';
import { TrendingDown, TrendingUp, Minus, FileText } from 'lucide-react';
import api from '@/lib/api/axios';

export default function BudgetVariancesPage() {
  const [budgetId, setBudgetId] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [variances, setVariances] = useState<BudgetVariance[]>([]);
  const [selectedVariance, setSelectedVariance] = useState<BudgetVariance | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchVariances = async () => {
    if (!budgetId) return;
    
    setLoading(true);
    try {
      const response = await budgetVarianceAPI.getVariances(budgetId);
      setVariances(response.data || []);
      if (response.data?.length > 0) {
        setSelectedVariance(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch variances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!budgetId.trim()) return;
    
    try {
      const response = await api.get(`/budgets/${budgetId}`);
      setBudgetName(response.data.data.budgetName);
      fetchVariances();
    } catch (err) {
      console.error('Budget not found:', err);
      setBudgetName('');
      setVariances([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'favorable': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'unfavorable': return <TrendingUp className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budget Variance Analysis</h1>
        <p className="text-gray-600 mt-1">Compare actual vs budgeted spending with AI insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              Favorable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Under budget spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              Unfavorable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Over budget spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Minus className="w-4 h-4 text-gray-600" />
              Neutral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">On target spending</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Budget</CardTitle>
          <CardDescription>Enter budget ID to view and generate variance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Budget ID"
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
            {budgetName && (
              <Button onClick={() => setDialogOpen(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            )}
          </div>
          {budgetName && (
            <div className="mt-3 text-sm">
              <span className="text-gray-600">Budget:</span>
              <span className="font-semibold ml-2">{budgetName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {budgetName && (
        <>
          {variances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variance Reports</CardTitle>
                <CardDescription>Select a report to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {variances.map((variance) => (
                    <div
                      key={variance._id}
                      onClick={() => setSelectedVariance(variance)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedVariance?._id === variance._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {new Date(variance.period.startDate).toLocaleDateString()} - {new Date(variance.period.endDate).toLocaleDateString()}
                        </span>
                        {getStatusIcon(variance.overallStatus)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Variance: ${Math.abs(variance.totalVariance).toLocaleString()} ({variance.totalVariancePercent.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedVariance && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Variance Analysis</CardTitle>
                    <CardDescription>Budgeted vs Actual comparison by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VarianceChart variance={selectedVariance} />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Insights & Recommendations</CardTitle>
                    <CardDescription>AI-generated analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VarianceInsightsPanel variance={selectedVariance} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How Variance Analysis Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">1. Select Period</div>
              <p className="text-sm text-gray-600">
                Choose start and end dates for analysis
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">2. Compare Data</div>
              <p className="text-sm text-gray-600">
                System compares actual vs budgeted amounts
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">3. Get Insights</div>
              <p className="text-sm text-gray-600">
                AI generates insights and recommendations
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Actual vs budgeted comparison</li>
              <li>✓ Favorable/Unfavorable/Neutral classification</li>
              <li>✓ AI-generated insights and recommendations</li>
              <li>✓ Trend analysis across periods</li>
              <li>✓ Category-level breakdown</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {budgetName && (
        <GenerateVarianceDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={fetchVariances}
          budgetId={budgetId}
          budgetName={budgetName}
        />
      )}
    </div>
  );
}
