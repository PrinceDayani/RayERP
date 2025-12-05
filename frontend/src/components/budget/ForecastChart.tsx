'use client';

import { BudgetForecast } from '@/lib/api/budgetForecastAPI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface ForecastChartProps {
  forecast: BudgetForecast;
}

export default function ForecastChart({ forecast }: ForecastChartProps) {
  const chartData = forecast.predictions.map((pred) => ({
    period: `${pred.month}/${pred.year}`,
    predicted: pred.predictedAmount,
    lower: pred.confidenceInterval.lower,
    upper: pred.confidenceInterval.upper,
  }));

  const algorithmLabels = {
    linear: 'Linear Regression',
    seasonal: 'Seasonal',
    exponential: 'Exponential Smoothing',
    ml: 'ML Auto-Select',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Forecast Visualization</h3>
          <p className="text-sm text-gray-600">
            Algorithm: {algorithmLabels[forecast.algorithm]} | Period: {forecast.forecastPeriod} months
          </p>
        </div>
        {forecast.accuracy && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Accuracy</div>
            <div className="font-semibold">MAPE: {forecast.accuracy.mape.toFixed(2)}%</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelStyle={{ color: '#000' }}
          />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="upper"
            fill="#93c5fd"
            stroke="none"
            fillOpacity={0.3}
            name="Upper Bound"
          />
          <Area
            type="monotone"
            dataKey="lower"
            fill="#93c5fd"
            stroke="none"
            fillOpacity={0.3}
            name="Lower Bound"
          />
          
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ fill: '#2563eb', r: 4 }}
            name="Predicted Amount"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="border rounded p-3">
          <div className="text-gray-600">Avg Prediction</div>
          <div className="text-lg font-semibold">
            ${(chartData.reduce((sum, d) => sum + d.predicted, 0) / chartData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-gray-600">Min Prediction</div>
          <div className="text-lg font-semibold">
            ${Math.min(...chartData.map(d => d.predicted)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-gray-600">Max Prediction</div>
          <div className="text-lg font-semibold">
            ${Math.max(...chartData.map(d => d.predicted)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
}
