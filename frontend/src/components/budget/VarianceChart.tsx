'use client';

import { BudgetVariance } from '@/lib/api/budgetVarianceAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface VarianceChartProps {
  variance: BudgetVariance;
}

export default function VarianceChart({ variance }: VarianceChartProps) {
  const chartData = variance.categoryVariances.map((cat) => ({
    category: cat.categoryName,
    budgeted: cat.budgeted,
    actual: cat.actual,
    variance: cat.variance,
    status: cat.status,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'favorable': return '#10b981';
      case 'unfavorable': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Budgeted</div>
          <div className="text-2xl font-bold">${variance.totalBudgeted.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Actual</div>
          <div className="text-2xl font-bold">${variance.totalActual.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Variance</div>
          <div className={`text-2xl font-bold ${variance.overallStatus === 'favorable' ? 'text-green-600' : variance.overallStatus === 'unfavorable' ? 'text-red-600' : 'text-gray-600'}`}>
            ${Math.abs(variance.totalVariance).toLocaleString()} ({variance.totalVariancePercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
          <Bar dataKey="actual" name="Actual">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 gap-2">
        {variance.categoryVariances.map((cat) => (
          <div key={cat.categoryName} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{cat.categoryName}</div>
              <div className="text-sm text-gray-600">
                Budgeted: ${cat.budgeted.toLocaleString()} | Actual: ${cat.actual.toLocaleString()}
              </div>
            </div>
            <div className={`text-right ${cat.status === 'favorable' ? 'text-green-600' : cat.status === 'unfavorable' ? 'text-red-600' : 'text-gray-600'}`}>
              <div className="font-semibold">${Math.abs(cat.variance).toLocaleString()}</div>
              <div className="text-sm">{cat.variancePercent.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
