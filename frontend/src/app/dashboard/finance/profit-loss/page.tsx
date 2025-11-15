"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Download, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Target, DollarSign } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";

const ProfitLossPage = () => {
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [comparison, setComparison] = useState<any>(null);
  const [multiPeriod, setMultiPeriod] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    fetchProfitLossData();
  }, []);

  const fetchProfitLossData = async () => {
    setLoading(true);
    try {
      const response = await reportingApi.getProfitLoss(startDate, endDate);
      if (response.success) setProfitLossData(response.data);
      
      const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/comparative?reportType=profit-loss&period1Start=${startDate}&period1End=${endDate}&period2Start=${getPreviousYearDate(startDate)}&period2End=${getPreviousYearDate(endDate)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const compData = await compRes.json();
      if (compData.success) setComparison(compData.data);
      
      const multiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/multi-period?startDate=${startDate}&endDate=${endDate}&periodType=monthly`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const multiData = await multiRes.json();
      if (multiData.success) setMultiPeriod(multiData.data);
      
      const forecastRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/forecast?months=3`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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

  const drillDown = async (accountId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/account-transactions/${accountId}?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Transactions for ${data.data.account.name}: ${data.data.transactions.length} entries`);
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
            <Button onClick={fetchProfitLossData}>Refresh</Button>
            <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" />CSV</Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="current">Current Period</TabsTrigger>
            <TabsTrigger value="comparison">YoY Comparison</TabsTrigger>
            <TabsTrigger value="multiperiod">Multi-Period</TabsTrigger>
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
                  <div className="text-2xl font-bold text-green-600">₹{profitLossData.totalRevenue?.toLocaleString()}</div>
                  {profitLossData.comparison && (
                    <div className="flex items-center text-sm mt-1">
                      {profitLossData.comparison.variance > 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                      <span className={profitLossData.comparison.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(profitLossData.comparison.variance).toLocaleString()} vs last year
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">₹{profitLossData.totalExpenses?.toLocaleString()}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitLossData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{profitLossData.netIncome?.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">{profitLossData.grossMargin?.toFixed(2)}% margin</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Operating Margin</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{profitLossData.operatingMargin?.toFixed(2)}%</div></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-green-600">Revenue</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {profitLossData.revenue?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer" onClick={() => drillDown(item.accountId)}>
                      <span>{item.account} ({item.code})</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Revenue</span>
                    <span className="text-green-600">₹{profitLossData.totalRevenue?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-red-600">Expenses</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {profitLossData.expenses?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer" onClick={() => drillDown(item.accountId)}>
                      <span>{item.account} ({item.code})</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Expenses</span>
                    <span className="text-red-600">₹{profitLossData.totalExpenses?.toLocaleString()}</span>
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
            {multiPeriod && (
              <Card>
                <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {multiPeriod.map((period: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 gap-4 p-2 hover:bg-muted rounded">
                        <div className="font-medium">{new Date(period.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                        <div className="text-green-600">₹{period.totalRevenue?.toLocaleString()}</div>
                        <div className="text-red-600">₹{period.totalExpenses?.toLocaleString()}</div>
                        <div className="font-bold">₹{period.netIncome?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="forecast">
            {forecast && (
              <Card>
                <CardHeader><CardTitle>3-Month Forecast</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {forecast.forecast?.map((f: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 gap-4 p-2 bg-blue-50 rounded">
                        <div className="font-medium">Month {f.month}</div>
                        <div className="text-green-600">₹{f.revenue?.toLocaleString()}</div>
                        <div className="text-red-600">₹{f.expenses?.toLocaleString()}</div>
                        <div className="font-bold">₹{f.netIncome?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default ProfitLossPage;