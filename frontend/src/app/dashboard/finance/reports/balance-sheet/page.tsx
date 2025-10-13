'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar, Printer } from 'lucide-react';

export default function BalanceSheetPage() {
  const [period, setPeriod] = useState('2024-Q1');
  
  const balanceSheetData = {
    assets: {
      current: [
        { name: 'Cash and Cash Equivalents', amount: 25000 },
        { name: 'Accounts Receivable', amount: 15000 },
        { name: 'Inventory', amount: 8000 },
        { name: 'Prepaid Expenses', amount: 2000 }
      ],
      nonCurrent: [
        { name: 'Property, Plant & Equipment', amount: 50000 },
        { name: 'Accumulated Depreciation', amount: -10000 },
        { name: 'Intangible Assets', amount: 5000 }
      ]
    },
    liabilities: {
      current: [
        { name: 'Accounts Payable', amount: 8000 },
        { name: 'Accrued Expenses', amount: 3000 },
        { name: 'Short-term Debt', amount: 5000 }
      ],
      nonCurrent: [
        { name: 'Long-term Debt', amount: 20000 },
        { name: 'Deferred Tax Liability', amount: 2000 }
      ]
    },
    equity: [
      { name: 'Share Capital', amount: 30000 },
      { name: 'Retained Earnings', amount: 27000 }
    ]
  };

  const totalCurrentAssets = balanceSheetData.assets.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentAssets = balanceSheetData.assets.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
  
  const totalCurrentLiabilities = balanceSheetData.liabilities.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentLiabilities = balanceSheetData.liabilities.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
  
  const totalEquity = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600 mt-1">Statement of financial position</p>
        </div>
        <div className="flex space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-Q1">2024 Q1</SelectItem>
              <SelectItem value="2024-Q2">2024 Q2</SelectItem>
              <SelectItem value="2024-Q3">2024 Q3</SelectItem>
              <SelectItem value="2024-Q4">2024 Q4</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-green-700">ASSETS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Assets</h3>
              <div className="space-y-1">
                {balanceSheetData.assets.current.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.name}</span>
                    <span className="font-mono">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Current Assets</span>
                  <span className="font-mono">${totalCurrentAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Non-Current Assets</h3>
              <div className="space-y-1">
                {balanceSheetData.assets.nonCurrent.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.name}</span>
                    <span className="font-mono">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Non-Current Assets</span>
                  <span className="font-mono">${totalNonCurrentAssets.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg border-t-2 pt-2 text-green-700">
              <span>TOTAL ASSETS</span>
              <span className="font-mono">${totalAssets.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-700">LIABILITIES & EQUITY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Liabilities</h3>
              <div className="space-y-1">
                {balanceSheetData.liabilities.current.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.name}</span>
                    <span className="font-mono">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Current Liabilities</span>
                  <span className="font-mono">${totalCurrentLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Non-Current Liabilities</h3>
              <div className="space-y-1">
                {balanceSheetData.liabilities.nonCurrent.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.name}</span>
                    <span className="font-mono">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Non-Current Liabilities</span>
                  <span className="font-mono">${totalNonCurrentLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total Liabilities</span>
              <span className="font-mono">${totalLiabilities.toLocaleString()}</span>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Equity</h3>
              <div className="space-y-1">
                {balanceSheetData.equity.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="pl-4">{item.name}</span>
                    <span className="font-mono">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total Equity</span>
                  <span className="font-mono">${totalEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg border-t-2 pt-2 text-red-700">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span className="font-mono">${(totalLiabilities + totalEquity).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}