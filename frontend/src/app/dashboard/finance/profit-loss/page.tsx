"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Download, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Target, Coins, Zap, Filter } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";
import { DrillDownModal } from "@/components/finance/DrillDownModal";
import { WaterfallChart } from "@/components/finance/WaterfallChart";
import { AIInsights } from "@/components/finance/AIInsights";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProfitLossPage = () => {
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [comparison, setComparison] = useState<any>(null);
  const [multiPeriod, setMultiPeriod] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [waterfallData, setWaterfallData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [ratios, setRatios] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any>(null);
  const [segment, setSegment] = useState('all');
  const [costCenter, setCostCenter] = useState('all');

  useEffect(() => {
    fetchProfitLossData();
  }, []);

  const fetchProfitLossData = async () => {
    setLoading(true);
    try {
      // Fetch main P&L with budget comparison
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/profit-loss?startDate=${startDate}&endDate=${endDate}&includeBudget=true&compareYoY=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const plData = await response.json();
      
      if (plData.success) {
        setProfitLossData(plData.data);
        
        // Set budget data if available
        if (plData.data.budget) {
          setBudgetData(plData.data.budget);
        }
        
        // Set comparison data if available
        if (plData.data.comparison) {
          setComparison({
            period1: {
              totalRevenue: plData.data.revenue.total,
              totalExpenses: plData.data.operatingExpenses.total,
              netIncome: plData.data.netIncome
            },
            period2: plData.data.comparison.previous,
            variance: plData.data.comparison.variance
          });
        }
        
        // Set ratios from main response
        setRatios({
          ebitda: plData.data.ebitda,
          ebitdaMargin: plData.data.margins.ebitda,
          ebit: plData.data.ebit,
          operatingMargin: plData.data.margins.operating,
          grossProfit: plData.data.grossProfit,
          grossMargin: plData.data.margins.gross,
          netIncome: plData.data.netIncome,
          netMargin: plData.data.margins.net
        });
      }
      
      // Fetch multi-period data
      const multiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/profit-loss/multi-period?startDate=${startDate}&endDate=${endDate}&periodType=monthly`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const multiData = await multiRes.json();
      if (multiData.success) setMultiPeriod(multiData.data.periods);
      
      // Fetch forecast data
      const forecastRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/forecast?months=3`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const forecastData = await forecastRes.json();
      if (forecastData.success) setForecast(forecastData.data);
      
    } catch (error) {
      console.error('Error fetching P&L:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPreviousYearDate = (date: string) => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };

  const drillDown = async (accountId: string, accountName: string, accountCode: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/account-transactions/${accountId}?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setDrillDownData({
          account: { name: accountName, code: accountCode },
          transactions: data.data.transactions
        });
        setDrillDownOpen(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const data = await reportingApi.exportReport('profit-loss', format, startDate, endDate);
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profit-loss-${startDate}-${endDate}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
              <p className="text-muted-foreground">Revenue, expenses, profitability with YoY comparison & forecasting</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
              <span>to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="dept">By Department</SelectItem>
                <SelectItem value="product">By Product</SelectItem>
                <SelectItem value="region">By Region</SelectItem>
              </SelectContent>
            </Select>
            <Select value={costCenter} onValueChange={setCostCenter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Cost Center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Centers</SelectItem>
                <SelectItem value="cc1">Cost Center 1</SelectItem>
                <SelectItem value="cc2">Cost Center 2</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchProfitLossData}>Refresh</Button>
            <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" />CSV</Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="comparison">YoY</TabsTrigger>
            <TabsTrigger value="multiperiod">Trend</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="ratios">Metrics</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {loading ? (
              <Card><CardContent className="p-6"><div className="text-center">Loading...</div></CardContent></Card>
            ) : profitLossData ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{profitLossData.revenue?.total?.toLocaleString()}</div>
                  {profitLossData.comparison && (
                    <div className="flex items-center text-sm mt-1">
                      {profitLossData.comparison.variance.revenue > 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                      <span className={profitLossData.comparison.variance.revenue > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(profitLossData.comparison.variance.revenue).toLocaleString()} vs last year
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">₹{profitLossData.operatingExpenses?.total?.toLocaleString()}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitLossData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{profitLossData.netIncome?.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">{profitLossData.margins?.gross?.toFixed(2)}% margin</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Operating Margin</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{profitLossData.margins?.operating?.toFixed(2)}%</div></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-green-600">Revenue</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {profitLossData.revenue?.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer" onClick={() => drillDown(item.accountId, item.account, item.code)}>
                      <span>{item.account} ({item.code})</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Revenue</span>
                    <span className="text-green-600">₹{profitLossData.revenue?.total?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-red-600">Expenses</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {profitLossData.operatingExpenses?.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer" onClick={() => drillDown(item.accountId, item.account, item.code)}>
                      <span>{item.account} ({item.code})</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Operating Expenses</span>
                    <span className="text-red-600">₹{profitLossData.operatingExpenses?.total?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            ) : <Card><CardContent className="p-6"><div className="text-center py-8"><TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Data</h3></div></CardContent></Card>}
          </TabsContent>

          <TabsContent value="comparison">
            {comparison && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader><CardTitle>Year-over-Year Comparison</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div><div className="text-sm text-muted-foreground">Metric</div></div>
                      <div><div className="text-sm text-muted-foreground">Current Period</div></div>
                      <div><div className="text-sm text-muted-foreground">Previous Period</div></div>
                      <div className="font-medium">Revenue</div>
                      <div className="font-bold text-green-600">₹{comparison.period1.totalRevenue?.toLocaleString()}</div>
                      <div>₹{comparison.period2.totalRevenue?.toLocaleString()}</div>
                      <div className="font-medium">Expenses</div>
                      <div className="font-bold text-red-600">₹{comparison.period1.totalExpenses?.toLocaleString()}</div>
                      <div>₹{comparison.period2.totalExpenses?.toLocaleString()}</div>
                      <div className="font-medium">Net Income</div>
                      <div className="font-bold">₹{comparison.period1.netIncome?.toLocaleString()}</div>
                      <div>₹{comparison.period2.netIncome?.toLocaleString()}</div>
                      <div className="font-medium">Variance</div>
                      <div className="font-bold text-blue-600">₹{comparison.variance.netIncome?.toLocaleString()}</div>
                      <div className="text-sm">{comparison.variance.revenuePercent?.toFixed(2)}% change</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="multiperiod">
            {multiPeriod && multiPeriod.length > 0 ? (
              <Card>
                <CardHeader><CardTitle>Period-over-Period Analysis</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-4 p-2 font-medium border-b">
                      <div>Period</div>
                      <div className="text-right">Revenue</div>
                      <div className="text-right">COGS</div>
                      <div className="text-right">Gross Profit</div>
                      <div className="text-right">Net Income</div>
                    </div>
                    {multiPeriod.map((period: any, i: number) => (
                      <div key={i} className="grid grid-cols-5 gap-4 p-2 hover:bg-muted rounded">
                        <div className="font-medium">{period.period}</div>
                        <div className="text-right text-green-600">₹{period.totalRevenue?.toLocaleString()}</div>
                        <div className="text-right text-orange-600">₹{period.totalCOGS?.toLocaleString()}</div>
                        <div className="text-right text-blue-600">₹{period.grossProfit?.toLocaleString()}</div>
                        <div className="text-right font-bold">₹{period.netIncome?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : <Card><CardContent className="p-6">No multi-period data available</CardContent></Card>}
          </TabsContent>

          <TabsContent value="budget">
            {budgetData ? (
              <Card>
                <CardHeader><CardTitle>Budget vs Actual Comparison</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded font-medium">
                      <div>Metric</div>
                      <div className="text-right">Actual</div>
                      <div className="text-right">Budget</div>
                      <div className="text-right">Variance</div>
                      <div className="text-right">%</div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-3 hover:bg-muted rounded">
                      <div className="font-medium">Revenue</div>
                      <div className="text-right text-green-600">₹{profitLossData?.revenue?.total?.toLocaleString()}</div>
                      <div className="text-right">₹{budgetData.revenue?.toLocaleString()}</div>
                      <div className={`text-right ${budgetData.variance?.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{budgetData.variance?.revenue?.toLocaleString()}
                      </div>
                      <div className={`text-right ${budgetData.variance?.revenuePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {budgetData.variance?.revenuePercent?.toFixed(1)}%
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-3 hover:bg-muted rounded">
                      <div className="font-medium">Expenses</div>
                      <div className="text-right text-red-600">₹{profitLossData?.operatingExpenses?.total?.toLocaleString()}</div>
                      <div className="text-right">₹{budgetData.expenses?.toLocaleString()}</div>
                      <div className={`text-right ${budgetData.variance?.expenses <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{budgetData.variance?.expenses?.toLocaleString()}
                      </div>
                      <div className="text-right">-</div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-3 bg-blue-50 rounded font-bold">
                      <div>Net Income</div>
                      <div className="text-right">₹{profitLossData?.netIncome?.toLocaleString()}</div>
                      <div className="text-right">₹{budgetData.netIncome?.toLocaleString()}</div>
                      <div className={`text-right ${budgetData.variance?.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{budgetData.variance?.netIncome?.toLocaleString()}
                      </div>
                      <div className={`text-right ${budgetData.variance?.netIncomePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {budgetData.variance?.netIncomePercent?.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : <Card><CardContent className="p-6">No budget data available. Set budgets to enable comparison.</CardContent></Card>}
          </TabsContent>

          <TabsContent value="ratios">
            {ratios ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Gross Profit</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">₹{ratios.grossProfit?.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-1">{ratios.grossMargin?.toFixed(2)}% margin</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">EBITDA</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">₹{ratios.ebitda?.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-1">{ratios.ebitdaMargin?.toFixed(2)}% margin</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">EBIT (Operating Profit)</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">₹{ratios.ebit?.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-1">{ratios.operatingMargin?.toFixed(2)}% margin</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Net Income (PAT)</CardTitle></CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${ratios.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{ratios.netIncome?.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ratios.netMargin?.toFixed(2)}% margin</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle>Financial Metrics Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-medium">Gross Margin</span>
                        <span className="text-lg font-bold text-blue-600">{ratios.grossMargin?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                        <span className="font-medium">EBITDA Margin</span>
                        <span className="text-lg font-bold text-purple-600">{ratios.ebitdaMargin?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                        <span className="font-medium">Operating Margin (EBIT)</span>
                        <span className="text-lg font-bold text-orange-600">{ratios.operatingMargin?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-medium">Net Profit Margin</span>
                        <span className="text-lg font-bold text-green-600">{ratios.netMargin?.toFixed(2)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : <Card><CardContent className="p-6">Loading metrics...</CardContent></Card>}
          </TabsContent>

          <TabsContent value="forecast">
            {forecast ? (
              <Card>
                <CardHeader><CardTitle>3-Month Forecast</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4 p-2 font-medium border-b">
                      <div>Month</div>
                      <div className="text-right">Revenue</div>
                      <div className="text-right">Expenses</div>
                      <div className="text-right">Net Income</div>
                    </div>
                    {forecast.forecast?.map((f: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 gap-4 p-3 bg-blue-50 rounded hover:bg-blue-100">
                        <div className="font-medium">Month {f.month}</div>
                        <div className="text-right text-green-600">₹{f.revenue?.toLocaleString()}</div>
                        <div className="text-right text-red-600">₹{f.expenses?.toLocaleString()}</div>
                        <div className="text-right font-bold">₹{f.netIncome?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Forecast is based on historical data with 5% growth rate assumption. 
                      Actual results may vary based on market conditions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : <Card><CardContent className="p-6">Loading forecast...</CardContent></Card>}
          </TabsContent>
        </Tabs>

        <DrillDownModal 
          open={drillDownOpen}
          onOpenChange={setDrillDownOpen}
          accountName={drillDownData?.account?.name || ''}
          accountCode={drillDownData?.account?.code || ''}
          transactions={drillDownData?.transactions || []}
        />
      </div>
  );
};

export default ProfitLossPage;
