'use client';

import { useState } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

export default function EnhancedReportsPage() {
  const [reportType, setReportType] = useState('profit-loss');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/${reportType}?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      setReportData(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/financial-reports/export?reportType=${reportType}&format=${format}&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${Date.now()}.${format}`;
      a.click();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Enhanced Financial Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <select
            className="border rounded px-3 py-2"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="profit-loss">Profit & Loss</option>
            <option value="balance-sheet">Balance Sheet</option>
            <option value="cash-flow">Cash Flow</option>
          </select>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>

        {reportData && (
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Download size={18} /> Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        )}
      </div>

      {reportData && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {reportType === 'profit-loss' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">₹{reportData.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="text-green-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">₹{reportData.totalExpenses?.toLocaleString()}</p>
                    </div>
                    <TrendingDown className="text-red-600" size={32} />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Income</p>
                      <p className={`text-2xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{reportData.netIncome?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportType === 'profit-loss' && (
                    <>
                      <tr className="bg-green-50">
                        <td colSpan={3} className="px-6 py-2 font-bold">REVENUE</td>
                      </tr>
                      {reportData.revenue?.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="px-6 py-4 text-sm">{r.account}</td>
                          <td className="px-6 py-4 text-sm">{r.code}</td>
                          <td className="px-6 py-4 text-sm text-right">₹{r.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-red-50">
                        <td colSpan={3} className="px-6 py-2 font-bold">EXPENSES</td>
                      </tr>
                      {reportData.expenses?.map((e: any, i: number) => (
                        <tr key={i}>
                          <td className="px-6 py-4 text-sm">{e.account}</td>
                          <td className="px-6 py-4 text-sm">{e.code}</td>
                          <td className="px-6 py-4 text-sm text-right">₹{e.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
