"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { TrendingUp, BarChart3, Users as UsersIcon, AlertTriangle, Coins, Activity, ArrowUpRight, ArrowDownRight, Brain, Zap, Target, Clock, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

interface FilteredAnalyticsProps {
  view: string;
  burndown: any;
  velocity: any;
  utilization: any;
  performance: any;
  risk: any;
  projectCurrency?: string;
}

export default function ProjectAnalyticsFiltered({ burndown, velocity, utilization, performance, risk, projectCurrency = 'INR' }: FilteredAnalyticsProps) {
  const { formatAmount } = useGlobalCurrency();
  
  // Advanced Analytics Calculations
  const advancedMetrics = useMemo(() => {
    // Completion Trend
    const completionRate = burndown?.totalTasks > 0 ? ((velocity?.totalCompleted || 0) / burndown.totalTasks) * 100 : 0;
    
    // Estimated Completion Date
    const remainingTasks = (burndown?.totalTasks || 0) - (velocity?.totalCompleted || 0);
    const avgVelocity = velocity?.avgVelocity || 0;
    const weeksToComplete = avgVelocity > 0 ? Math.ceil(remainingTasks / (avgVelocity / 40)) : 0; // Assuming 40 hrs/week
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + (weeksToComplete * 7));
    
    // Health Score (0-100)
    const cpiScore = Math.min((performance?.cpi || 0) * 50, 50);
    const spiScore = Math.min((performance?.spi || 0) * 30, 30);
    const riskScore = risk?.overallRisk === 'low' ? 20 : risk?.overallRisk === 'medium' ? 10 : 0;
    const healthScore = Math.round(cpiScore + spiScore + riskScore);
    
    // Productivity Index
    const productivityIndex = velocity?.avgVelocity > 0 ? Math.round((velocity.avgVelocity / 40) * 100) : 0;
    
    // Budget Efficiency
    const budgetEfficiency = performance?.plannedValue > 0 
      ? Math.round(((performance.earnedValue || 0) / performance.plannedValue) * 100) 
      : 0;
    
    // Team Performance Radar Data
    const radarData = [
      { metric: 'Cost', value: Math.min((performance?.cpi || 0) * 100, 100) },
      { metric: 'Schedule', value: Math.min((performance?.spi || 0) * 100, 100) },
      { metric: 'Quality', value: completionRate },
      { metric: 'Team', value: productivityIndex },
      { metric: 'Risk', value: risk?.overallRisk === 'low' ? 100 : risk?.overallRisk === 'medium' ? 60 : 30 }
    ];
    
    // Velocity Trend
    const velocityTrend = velocity?.velocityData?.length > 1 
      ? velocity.velocityData[velocity.velocityData.length - 1].velocity > velocity.velocityData[0].velocity 
        ? 'increasing' 
        : 'decreasing'
      : 'stable';
    
    return {
      completionRate,
      weeksToComplete,
      estimatedCompletion,
      healthScore,
      productivityIndex,
      budgetEfficiency,
      radarData,
      velocityTrend,
      remainingTasks
    };
  }, [burndown, velocity, performance, risk]);
  
  const renderPerformanceCards = () => (
    <div className="grid gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">CPI</span>
            {performance?.cpi >= 1 ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownRight className="h-3 w-3 text-red-600" />}
          </div>
          <div className={`text-2xl font-bold ${performance?.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {performance?.cpi || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{performance?.cpi >= 1 ? 'Under Budget' : 'Over Budget'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">SPI</span>
            {performance?.spi >= 1 ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownRight className="h-3 w-3 text-red-600" />}
          </div>
          <div className={`text-2xl font-bold ${performance?.spi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {performance?.spi || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{performance?.spi >= 1 ? 'On Schedule' : 'Behind'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Risk</span>
            <Badge variant={risk?.overallRisk === 'low' ? 'default' : 'destructive'} className="text-xs">
              {risk?.riskCount || 0}
            </Badge>
          </div>
          <div className={`text-2xl font-bold capitalize ${
            risk?.overallRisk === 'low' ? 'text-green-600' : 
            risk?.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {risk?.overallRisk || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{risk?.projectHealth || 'Unknown'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          <div className="text-2xl font-bold capitalize">{performance?.status || 'N/A'}</div>
          <p className="text-xs text-muted-foreground mt-1">Project Health</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderCharts = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Burndown Chart
            </div>
            <span className="text-xs text-muted-foreground">{burndown?.burndownData?.length || 0} points</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {burndown?.burndownData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={burndown.burndownData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" name="Ideal" dot={false} />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="url(#colorActual)" name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Team Velocity
            </div>
            <span className="text-xs text-muted-foreground">Avg: {velocity?.avgVelocity?.toFixed(1) || 0} hrs/wk</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {velocity?.velocityData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={velocity.velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="velocity" fill="#10b981" name="Hours" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderResources = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Resource Utilization
          </div>
          <span className="text-xs text-muted-foreground">{utilization?.utilizationData?.length || 0} members</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {utilization?.utilizationData?.length > 0 ? (
            utilization.utilizationData.map((u: any, i: number) => {
              const completionRate = u.completionRate?.toFixed(0) || 0;
              return (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold">
                        {u.user?.firstName?.[0]}{u.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.user?.firstName} {u.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.completedTasks}/{u.totalTasks} tasks • {u.actualHours}/{u.estimatedHours} hrs
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${
                      completionRate >= 80 ? 'text-green-600' : 
                      completionRate >= 50 ? 'text-blue-600' : 'text-orange-600'
                    }`}>{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-1.5" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No team members assigned</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRisks = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </div>
          <Badge variant={risk?.risks?.length > 0 ? 'destructive' : 'default'}>
            {risk?.risks?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {risk?.risks?.map((r: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border-l-2 ${
              r.severity === 'critical' ? 'border-red-600 bg-red-50 dark:bg-red-950' :
              r.severity === 'high' ? 'border-orange-600 bg-orange-50 dark:bg-orange-950' :
              r.severity === 'medium' ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
              'border-blue-600 bg-blue-50 dark:bg-blue-950'
            }`}>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{r.message}</p>
                  <Badge variant="outline" className="text-xs">{r.type}</Badge>
                </div>
                <Badge variant={r.severity === 'critical' || r.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                  {r.severity}
                </Badge>
              </div>
            </div>
          ))}
          {risk?.risks?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-green-600 font-medium">✓ No risks identified</p>
              <p className="text-xs text-muted-foreground mt-1">Project is on track</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAdvancedInsights = () => (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Health Score</span>
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            advancedMetrics.healthScore >= 80 ? 'text-green-600' : 
            advancedMetrics.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {advancedMetrics.healthScore}/100
          </div>
          <Progress value={advancedMetrics.healthScore} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Productivity</span>
          </div>
          <div className="text-2xl font-bold">{advancedMetrics.productivityIndex}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {advancedMetrics.velocityTrend === 'increasing' ? '↗ Increasing' : 
             advancedMetrics.velocityTrend === 'decreasing' ? '↘ Decreasing' : '→ Stable'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Completion</span>
          </div>
          <div className="text-2xl font-bold">{advancedMetrics.completionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">{advancedMetrics.remainingTasks} tasks left</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-muted-foreground">Est. Completion</span>
          </div>
          <div className="text-lg font-bold">
            {advancedMetrics.weeksToComplete > 0 ? `${advancedMetrics.weeksToComplete}w` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {advancedMetrics.estimatedCompletion.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderPerformanceRadar = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Performance Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={advancedMetrics.radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="metric" fontSize={11} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
            <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
  
  const renderPredictiveAnalytics = () => {
    const forecastData = velocity?.velocityData?.map((v: any, i: number) => ({
      week: v.week,
      actual: v.velocity,
      forecast: velocity.avgVelocity * (1 + (i * 0.02)) // Simple trend forecast
    })) || [];
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Velocity Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="5 5" name="Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No forecast data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderActionableInsights = () => {
    const insights = [];
    
    if (performance?.cpi < 1) {
      insights.push({ type: 'warning', message: 'Project is over budget. Review cost allocations.', icon: Coins });
    }
    if (performance?.spi < 1) {
      insights.push({ type: 'warning', message: 'Project is behind schedule. Consider resource reallocation.', icon: Clock });
    }
    if (advancedMetrics.productivityIndex < 70) {
      insights.push({ type: 'info', message: 'Team productivity is below target. Review workload distribution.', icon: UsersIcon });
    }
    if (risk?.risks?.length > 3) {
      insights.push({ type: 'danger', message: `${risk.risks.length} risks identified. Immediate attention required.`, icon: AlertTriangle });
    }
    if (advancedMetrics.healthScore >= 80) {
      insights.push({ type: 'success', message: 'Project health is excellent. Maintain current momentum.', icon: Target });
    }
    if (advancedMetrics.velocityTrend === 'decreasing') {
      insights.push({ type: 'warning', message: 'Velocity is declining. Investigate blockers.', icon: TrendingDown });
    }
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.length > 0 ? insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className={`p-3 rounded-lg border-l-2 ${
                  insight.type === 'success' ? 'border-green-600 bg-green-50 dark:bg-green-950' :
                  insight.type === 'warning' ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
                  insight.type === 'danger' ? 'border-red-600 bg-red-50 dark:bg-red-950' :
                  'border-blue-600 bg-blue-50 dark:bg-blue-950'
                }`}>
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5" />
                    <p className="text-sm">{insight.message}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">No insights available</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Advanced Insights */}
      {renderAdvancedInsights()}
      
      {/* Key Performance Indicators */}
      {renderPerformanceCards()}
      
      {/* Financial Overview */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Planned</span>
            </div>
            <div className="text-2xl font-bold">{formatAmount(performance?.plannedValue || 0, projectCurrency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Earned</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatAmount(performance?.earnedValue || 0, projectCurrency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Actual</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{formatAmount(performance?.actualCost || 0, projectCurrency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {performance?.costVariance >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
              <span className="text-sm text-muted-foreground">Variance</span>
            </div>
            <div className={`text-2xl font-bold ${performance?.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(performance?.costVariance || 0, projectCurrency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {renderCharts()}
      
      {/* Advanced Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {renderPerformanceRadar()}
        {renderPredictiveAnalytics()}
      </div>
      
      {/* AI Insights */}
      {renderActionableInsights()}
      
      {/* Resources & Risks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {renderResources()}
        {renderRisks()}
      </div>
    </div>
  );
}
