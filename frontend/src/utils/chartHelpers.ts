export const chartColors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  success: '#22c55e',
  muted: '#6b7280'
};

export const generateChartConfig = (data: any[], xKey: string, yKey: string) => ({
  data,
  xAxis: { dataKey: xKey },
  yAxis: { dataKey: yKey },
  colors: [chartColors.primary, chartColors.secondary, chartColors.accent]
});

export const formatChartTooltip = (value: number, name: string) => {
  if (name.includes('amount') || name.includes('cost') || name.includes('revenue')) {
    return [`₹${value.toLocaleString()}`, name];
  }
  if (name.includes('percentage') || name.includes('rate')) {
    return [`${value}%`, name];
  }
  return [value.toLocaleString(), name];
};