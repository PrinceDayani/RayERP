interface VarianceData {
  category: string;
  budgeted: number;
  actual: number;
}

interface VarianceResult {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
}

// Calculate variance for a single item
export const calculateVariance = (budgeted: number, actual: number): VarianceResult => {
  const variance = actual - budgeted;
  const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;
  
  let status: 'favorable' | 'unfavorable' | 'neutral' = 'neutral';
  if (Math.abs(variancePercent) < 5) {
    status = 'neutral';
  } else if (variance < 0) {
    status = 'favorable'; // Under budget
  } else {
    status = 'unfavorable'; // Over budget
  }

  return {
    category: '',
    budgeted,
    actual,
    variance,
    variancePercent,
    status
  };
};

// Analyze multiple variance items
export const analyzeVariances = (items: VarianceData[]): VarianceResult[] => {
  return items.map(item => ({
    ...calculateVariance(item.budgeted, item.actual),
    category: item.category
  }));
};

// Generate insights from variance analysis
export const generateInsights = (
  totalVariance: number,
  totalVariancePercent: number,
  items: VarianceResult[]
): string[] => {
  const insights: string[] = [];

  // Overall variance insight
  if (Math.abs(totalVariancePercent) < 5) {
    insights.push('Budget performance is on track with minimal variance');
  } else if (totalVariance < 0) {
    insights.push(`Under budget by ${Math.abs(totalVariancePercent).toFixed(1)}% - favorable performance`);
  } else {
    insights.push(`Over budget by ${totalVariancePercent.toFixed(1)}% - requires attention`);
  }

  // Identify largest variances
  const sortedItems = [...items].sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent));
  const topVariances = sortedItems.slice(0, 3).filter(item => Math.abs(item.variancePercent) > 10);

  if (topVariances.length > 0) {
    topVariances.forEach(item => {
      const direction = item.variance > 0 ? 'over' : 'under';
      insights.push(`${item.category}: ${Math.abs(item.variancePercent).toFixed(1)}% ${direction} budget`);
    });
  }

  // Trend analysis
  const unfavorableCount = items.filter(i => i.status === 'unfavorable').length;
  const favorableCount = items.filter(i => i.status === 'favorable').length;

  if (unfavorableCount > items.length / 2) {
    insights.push('Majority of categories are over budget - review spending controls');
  } else if (favorableCount > items.length / 2) {
    insights.push('Majority of categories are under budget - consider reallocation opportunities');
  }

  return insights;
};

// Generate recommendations
export const generateRecommendations = (
  totalVariancePercent: number,
  items: VarianceResult[]
): string[] => {
  const recommendations: string[] = [];

  // Overall recommendations
  if (totalVariancePercent > 10) {
    recommendations.push('Implement stricter spending controls and approval processes');
    recommendations.push('Review budget allocation and adjust for next period');
  } else if (totalVariancePercent < -10) {
    recommendations.push('Consider reallocating unused budget to high-priority areas');
    recommendations.push('Review if budget targets are too conservative');
  }

  // Category-specific recommendations
  const criticalItems = items.filter(item => Math.abs(item.variancePercent) > 20);
  if (criticalItems.length > 0) {
    criticalItems.forEach(item => {
      if (item.variance > 0) {
        recommendations.push(`${item.category}: Investigate overspending and implement corrective actions`);
      } else {
        recommendations.push(`${item.category}: Assess if resources are underutilized`);
      }
    });
  }

  // General best practices
  if (recommendations.length === 0) {
    recommendations.push('Continue current budget management practices');
    recommendations.push('Monitor trends for early detection of variances');
  }

  return recommendations;
};

// Calculate overall status
export const calculateOverallStatus = (variancePercent: number): 'favorable' | 'unfavorable' | 'neutral' => {
  if (Math.abs(variancePercent) < 5) return 'neutral';
  return variancePercent < 0 ? 'favorable' : 'unfavorable';
};
