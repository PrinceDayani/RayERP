'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function AdvancedReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const reports = [
    { name: 'Profit & Loss Statement', description: 'Income and expenses summary', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { name: 'Balance Sheet', description: 'Assets, liabilities, and equity', icon: DollarSign, color: 'from-blue-500 to-blue-600' },
    { name: 'Cash Flow Statement', description: 'Cash inflows and outflows', icon: Activity, color: 'from-purple-500 to-purple-600' },
    { name: 'Income Statement', description: 'Detailed revenue analysis', icon: TrendingUp, color: 'from-cyan-500 to-cyan-600' },
    { name: 'Expense Report', description: 'Expense breakdown by category', icon: DollarSign, color: 'from-orange-500 to-orange-600' },
    { name: 'Ratio Analysis', description: 'Financial ratios and metrics', icon: Activity, color: 'from-pink-500 to-pink-600' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial reporting and analysis</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>From Date</Label>
              <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pl">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cf">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Profit & Loss Statement</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-2" />Excel</Button>
                  <Button size="sm"><Download className="w-4 h-4 mr-2" />PDF</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">Revenue</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between"><span>Sales Revenue</span><span className="font-semibold">₹5,00,000</span></div>
                    <div className="flex justify-between"><span>Service Revenue</span><span className="font-semibold">₹3,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Total Revenue</span><span>₹8,00,000</span></div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">Expenses</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between"><span>Cost of Goods Sold</span><span className="font-semibold">₹2,00,000</span></div>
                    <div className="flex justify-between"><span>Operating Expenses</span><span className="font-semibold">₹1,50,000</span></div>
                    <div className="flex justify-between"><span>Administrative Expenses</span><span className="font-semibold">₹1,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Total Expenses</span><span>₹4,50,000</span></div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between text-xl font-bold text-green-600">
                    <span>Net Profit</span><span>₹3,50,000</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Profit Margin: 43.75%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Balance Sheet</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-2" />Excel</Button>
                  <Button size="sm"><Download className="w-4 h-4 mr-2" />PDF</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Assets</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Current Assets</span><span className="font-semibold">₹10,00,000</span></div>
                    <div className="flex justify-between"><span>Fixed Assets</span><span className="font-semibold">₹15,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Total Assets</span><span>₹25,00,000</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Liabilities & Equity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Current Liabilities</span><span className="font-semibold">₹5,00,000</span></div>
                    <div className="flex justify-between"><span>Long-term Liabilities</span><span className="font-semibold">₹8,00,000</span></div>
                    <div className="flex justify-between"><span>Equity</span><span className="font-semibold">₹12,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₹25,00,000</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cf">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Cash Flow Statement</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><FileSpreadsheet className="w-4 h-4 mr-2" />Excel</Button>
                  <Button size="sm"><Download className="w-4 h-4 mr-2" />PDF</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">Operating Activities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between"><span>Cash from Operations</span><span className="font-semibold text-green-600">₹4,00,000</span></div>
                    <div className="flex justify-between"><span>Cash paid to Suppliers</span><span className="font-semibold text-red-600">-₹2,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Net Operating Cash</span><span>₹2,00,000</span></div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">Investing Activities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between"><span>Purchase of Assets</span><span className="font-semibold text-red-600">-₹5,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Net Investing Cash</span><span>-₹5,00,000</span></div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-2">Financing Activities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between"><span>Loan Received</span><span className="font-semibold text-green-600">₹8,00,000</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Net Financing Cash</span><span>₹8,00,000</span></div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between text-xl font-bold text-blue-600">
                    <span>Net Cash Flow</span><span>₹5,00,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-3 gap-4">
        {reports.map(report => {
          const Icon = report.icon;
          return (
            <Card key={report.name} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{report.name}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
