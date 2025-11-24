export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface RevenueTrend {
  period: string;
  revenue: number;
  growth: number;
  forecast?: number;
}

export interface ProfitabilityMetric {
  metric: string;
  value: number;
  percentage: number;
  benchmark?: number;
}

export interface FinancialHealthScore {
  overall: number;
  liquidity: number;
  profitability: number;
  efficiency: number;
  leverage: number;
}
