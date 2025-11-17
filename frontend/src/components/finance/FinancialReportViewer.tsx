'use client';
import { useState, useEffect } from 'react';
import { financialReportsAPI } from '@/lib/api/financialReportsAPI';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function FinancialReportViewer() {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartData, setChartData] = useState<any>(null);
  const [variance, setVariance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });

  useEffect(() => {
    loadData();
  }, [chartType, dateRange]);

  const loadData = async () => {
    const token = localStorage.getItem('token') || '';
    const [chartRes, varianceRes] = await Promise.all([
      financialReportsAPI.getChartData(token, chartType, dateRange.start, dateRange.end),
      financialReportsAPI.getVarianceAnalysis(token, dateRange.start, dateRange.end, '2023-01-01')
    ]);
    if (chartRes.success) setChartData(chartRes.data);
    if (varianceRes.success) setVariance(varianceRes.data);
    setLoading(false);
  };

  const handleExport = async (format: string) => {
    const token = localStorage.getItem('token') || '';
    const res = await financialReportsAPI.exportReport(token, 'profit-loss', format, dateRange.start, dateRange.end);
    if (res.success) {
      alert(`Report exported as ${format}`);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value as any)} className="w-full border rounded px-3 py-2">
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
      </div>

      {variance && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Variance Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-2xl font-bold">${variance.current?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Previous Period</p>
              <p className="text-2xl font-bold">${variance.previous?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Variance</p>
              <p className={`text-2xl font-bold ${variance.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                {variance.trend === 'up' ? '↑' : '↓'} ${Math.abs(variance.variance)?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Variance %</p>
              <p className={`text-2xl font-bold ${variance.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                {variance.variancePercent}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
        {chartData && chartType === 'bar' && (
          <Bar data={{
            labels: chartData.labels || [],
            datasets: chartData.datasets || []
          }} options={{ responsive: true, maintainAspectRatio: true }} />
        )}
        {chartData && chartType === 'line' && (
          <Line data={{
            labels: chartData.labels || [],
            datasets: chartData.datasets || []
          }} options={{ responsive: true, maintainAspectRatio: true }} />
        )}
        {chartData && chartType === 'pie' && (
          <Pie data={{
            labels: chartData.labels || [],
            datasets: [{ data: chartData.data || [], backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] }]
          }} options={{ responsive: true, maintainAspectRatio: true }} />
        )}
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Drill Down</button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Compare Periods</button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Schedule Email</button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Save Custom Report</button>
        </div>
      </div>
    </div>
  );
}
