'use client';

import { BudgetVariance } from '@/lib/api/budgetVarianceAPI';
import { Lightbulb, AlertTriangle } from 'lucide-react';

interface VarianceInsightsPanelProps {
  variance: BudgetVariance;
}

export default function VarianceInsightsPanel({ variance }: VarianceInsightsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold">AI Insights</h3>
        </div>
        {variance.insights.length > 0 ? (
          <ul className="space-y-2">
            {variance.insights.map((insight, index) => (
              <li key={index} className="text-sm text-gray-700 flex gap-2">
                <span className="text-blue-600">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No insights available</p>
        )}
      </div>

      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">Recommendations</h3>
        </div>
        {variance.recommendations.length > 0 ? (
          <ul className="space-y-2">
            {variance.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-700 flex gap-2">
                <span className="text-orange-600">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No recommendations available</p>
        )}
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-2">Report Details</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Period:</span>
            <span className="font-medium">
              {new Date(variance.period.startDate).toLocaleDateString()} - {new Date(variance.period.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Generated:</span>
            <span className="font-medium">{new Date(variance.generatedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Overall Status:</span>
            <span className={`font-medium ${variance.overallStatus === 'favorable' ? 'text-green-600' : variance.overallStatus === 'unfavorable' ? 'text-red-600' : 'text-gray-600'}`}>
              {variance.overallStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
