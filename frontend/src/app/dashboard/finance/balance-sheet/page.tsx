"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Calendar } from "lucide-react";
import { reportingApi } from "@/lib/api/finance/reportingApi";

const BalanceSheetPage = () => {
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchBalanceSheetData();
  }, []);

  const fetchBalanceSheetData = async () => {
    setLoading(true);
    try {
      const response = await reportingApi.getBalanceSheet(asOfDate);
      if (response.success) {
        setBalanceSheetData(response.data);
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const data = await reportingApi.exportReport('balance-sheet', format, undefined, asOfDate);
      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance-sheet-${asOfDate}.csv`;
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
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Balance Sheet</h1>
              <p className="text-muted-foreground">Company assets, liabilities, and equity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={fetchBalanceSheetData}>Refresh</Button>
            <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading balance sheet data...</div>
            </CardContent>
          </Card>
        ) : balanceSheetData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {balanceSheetData.assets?.map((asset: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{asset.account} ({asset.code})</span>
                    <span className="font-medium">${asset.amount.toLocaleString()}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Assets</span>
                  <span className="text-green-600">${balanceSheetData.totalAssets?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Liabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {balanceSheetData.liabilities?.map((liability: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{liability.account} ({liability.code})</span>
                    <span className="font-medium">${liability.amount.toLocaleString()}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Liabilities</span>
                  <span className="text-red-600">${balanceSheetData.totalLiabilities?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {balanceSheetData.equity?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.account} ({item.code})</span>
                    <span className="font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Equity</span>
                  <span className="text-blue-600">${balanceSheetData.totalEquity?.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Liab. + Equity</span>
                  <span>${(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)) < 0.01 ? 
                    "✓ Balance sheet balances" : "⚠ Balance sheet does not balance"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  No balance sheet data found for the selected date
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default BalanceSheetPage;