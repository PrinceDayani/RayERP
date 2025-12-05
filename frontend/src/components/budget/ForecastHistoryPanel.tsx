'use client';

import { BudgetForecast } from '@/lib/api/budgetForecastAPI';
import { TrendingUp, Calendar, Activity } from 'lucide-react';

interface ForecastHistoryPanelProps {
  forecasts: BudgetForecast[];
  onSelectForecast: (forecast: BudgetForecast) => void;
  selectedForecastId?: string;
}

export default function ForecastHistoryPanel({ forecasts, onSelectForecast, selectedForecastId }: ForecastHistoryPanelProps) {
  const algorithmLabels = {
    linear: 'Linear',
    seasonal: 'Seasonal',
    exponential: 'Exponential',
    ml: 'ML Auto',
  };

  const algorithmColors = {
    linear: 'bg-blue-100 text-blue-800',
    seasonal: 'bg-green-100 text-green-800',
    exponential: 'bg-purple-100 text-purple-800',
    ml: 'bg-orange-100 text-orange-800',
  };

  if (forecasts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No forecasts generated yet. Create your first forecast!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {forecasts.map((forecast) => (
        <div
          key={forecast._id}
          onClick={() => onSelectForecast(forecast)}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedForecastId === forecast._id
              ? 'border-blue-500 bg-blue-50'
              : 'hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className={`px-2 py-1 rounded text-xs font-medium ${algorithmColors[forecast.algorithm]}`}>
                {algorithmLabels[forecast.algorithm]}
              </span>
            </div>
            {forecast.accuracy && (
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                MAPE: {forecast.accuracy.mape.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Period:</span>
              <span className="font-medium">{forecast.forecastPeriod} months</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Predictions:</span>
              <span className="font-medium">{forecast.predictions.length}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Generated: {new Date(forecast.generatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
