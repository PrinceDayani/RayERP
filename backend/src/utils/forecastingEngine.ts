interface HistoricalDataPoint {
  month: number;
  year: number;
  actualAmount: number;
}

interface ForecastResult {
  month: number;
  year: number;
  predictedAmount: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

// Linear regression forecasting
export const linearForecast = (
  historicalData: HistoricalDataPoint[],
  periods: number
): ForecastResult[] => {
  const n = historicalData.length;
  if (n < 2) throw new Error('Insufficient historical data');

  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => d.actualAmount);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictions: ForecastResult[] = [];
  const lastDate = historicalData[n - 1];

  for (let i = 1; i <= periods; i++) {
    const predictedAmount = slope * (n + i - 1) + intercept;
    const { month, year } = addMonths(lastDate.month, lastDate.year, i);
    
    predictions.push({
      month,
      year,
      predictedAmount: Math.max(0, predictedAmount),
      confidence: 75,
      lowerBound: Math.max(0, predictedAmount * 0.85),
      upperBound: predictedAmount * 1.15
    });
  }

  return predictions;
};

// Seasonal forecasting (accounts for monthly patterns)
export const seasonalForecast = (
  historicalData: HistoricalDataPoint[],
  periods: number
): ForecastResult[] => {
  if (historicalData.length < 12) throw new Error('Need at least 12 months of data');

  const monthlyAverages = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);

  historicalData.forEach(d => {
    monthlyAverages[d.month - 1] += d.actualAmount;
    monthlyCounts[d.month - 1]++;
  });

  for (let i = 0; i < 12; i++) {
    if (monthlyCounts[i] > 0) {
      monthlyAverages[i] /= monthlyCounts[i];
    }
  }

  const overallAvg = monthlyAverages.reduce((a, b) => a + b, 0) / 12;
  const seasonalIndices = monthlyAverages.map(avg => avg / overallAvg);

  const trend = calculateTrend(historicalData);
  const predictions: ForecastResult[] = [];
  const lastDate = historicalData[historicalData.length - 1];

  for (let i = 1; i <= periods; i++) {
    const { month, year } = addMonths(lastDate.month, lastDate.year, i);
    const baseAmount = overallAvg * (1 + trend * i);
    const predictedAmount = baseAmount * seasonalIndices[month - 1];

    predictions.push({
      month,
      year,
      predictedAmount: Math.max(0, predictedAmount),
      confidence: 80,
      lowerBound: Math.max(0, predictedAmount * 0.80),
      upperBound: predictedAmount * 1.20
    });
  }

  return predictions;
};

// Exponential smoothing forecasting
export const exponentialForecast = (
  historicalData: HistoricalDataPoint[],
  periods: number,
  alpha: number = 0.3
): ForecastResult[] => {
  if (historicalData.length < 3) throw new Error('Insufficient historical data');

  let smoothed = historicalData[0].actualAmount;
  historicalData.forEach(d => {
    smoothed = alpha * d.actualAmount + (1 - alpha) * smoothed;
  });

  const predictions: ForecastResult[] = [];
  const lastDate = historicalData[historicalData.length - 1];
  const volatility = calculateVolatility(historicalData);

  for (let i = 1; i <= periods; i++) {
    const { month, year } = addMonths(lastDate.month, lastDate.year, i);
    const confidence = Math.max(60, 90 - i * 2);

    predictions.push({
      month,
      year,
      predictedAmount: Math.max(0, smoothed),
      confidence,
      lowerBound: Math.max(0, smoothed * (1 - volatility)),
      upperBound: smoothed * (1 + volatility)
    });
  }

  return predictions;
};

// Helper: Calculate trend
const calculateTrend = (data: HistoricalDataPoint[]): number => {
  if (data.length < 2) return 0;
  const first = data.slice(0, Math.floor(data.length / 2));
  const second = data.slice(Math.floor(data.length / 2));
  const firstAvg = first.reduce((sum, d) => sum + d.actualAmount, 0) / first.length;
  const secondAvg = second.reduce((sum, d) => sum + d.actualAmount, 0) / second.length;
  return (secondAvg - firstAvg) / firstAvg;
};

// Helper: Calculate volatility
const calculateVolatility = (data: HistoricalDataPoint[]): number => {
  const amounts = data.map(d => d.actualAmount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / mean;
};

// Helper: Add months to date
const addMonths = (month: number, year: number, monthsToAdd: number) => {
  let newMonth = month + monthsToAdd;
  let newYear = year;
  
  while (newMonth > 12) {
    newMonth -= 12;
    newYear++;
  }
  
  return { month: newMonth, year: newYear };
};

// Get forecast by type
export const generateForecast = (
  historicalData: HistoricalDataPoint[],
  periods: number,
  type: 'linear' | 'seasonal' | 'exponential' | 'ml'
): ForecastResult[] => {
  switch (type) {
    case 'linear':
      return linearForecast(historicalData, periods);
    case 'seasonal':
      return seasonalForecast(historicalData, periods);
    case 'exponential':
      return exponentialForecast(historicalData, periods);
    case 'ml':
      return historicalData.length >= 12 
        ? seasonalForecast(historicalData, periods)
        : linearForecast(historicalData, periods);
    default:
      return linearForecast(historicalData, periods);
  }
};
