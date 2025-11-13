"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Download, Calendar } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";

const CashFlowPage = () => {
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  const fetchCashFlowData = async () => {
    setLoading(true);
    try {
      const response = await reportingApi.getCashFlow(startDate, endDate);
      if (response.success) {
        setCashFlowData(response.data);
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const data = await reportingApi.exportReport('cash-flow', format, startDate, endDate);
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cash-flow-${startDate}-${endDate}.csv`;
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
            <DollarSign className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
              <p className="text-muted-foreground">Track company cash inflows and outflows by activity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
              <span>to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={fetchCashFlowData}>Refresh</Button>
            <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading cash flow data...</div>
            </CardContent>
          </Card>
        ) : cashFlowData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Opening Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${cashFlowData.openingBalance?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${
                    cashFlowData.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cashFlowData.netCashFlow > 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                    ${cashFlowData.netCashFlow?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Closing Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${cashFlowData.closingBalance?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Operating Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cash Inflows</span>
                    <span className="font-medium text-green-600">
                      +${cashFlowData.operatingActivities?.inflows?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Outflows</span>
                    <span className="font-medium text-red-600">
                      -${cashFlowData.operatingActivities?.outflows?.toLocaleString()}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Net Operating</span>
                    <span className={cashFlowData.operatingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlowData.operatingActivities?.net?.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Investing Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cash Inflows</span>
                    <span className="font-medium text-green-600">
                      +${cashFlowData.investingActivities?.inflows?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Outflows</span>
                    <span className="font-medium text-red-600">
                      -${cashFlowData.investingActivities?.outflows?.toLocaleString()}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Net Investing</span>
                    <span className={cashFlowData.investingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlowData.investingActivities?.net?.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-600">Financing Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cash Inflows</span>
                    <span className="font-medium text-green-600">
                      +${cashFlowData.financingActivities?.inflows?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Outflows</span>
                    <span className="font-medium text-red-600">
                      -${cashFlowData.financingActivities?.outflows?.toLocaleString()}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Net Financing</span>
                    <span className={cashFlowData.financingActivities?.net > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlowData.financingActivities?.net?.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  No cash flow data found for the selected period
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default CashFlowPage;