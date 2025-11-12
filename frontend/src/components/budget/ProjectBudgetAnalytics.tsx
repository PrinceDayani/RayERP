"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Calendar, Percent, Activity, Zap, Clock, Award } from "lucide-react";
import { Budget } from "@/types/budget";

interface ProjectBudgetAnalyticsProps {
  budget: Budget;
  project: any;
}

export default function ProjectBudgetAnalytics({ budget, project }: ProjectBudgetAnalyticsProps) {
  const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const totalAllocated = budget.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  const utilization = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;
  const remaining = budget.totalBudget - totalSpent;
  const daysElapsed = Math.max(1, Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const burnRate = totalSpent / daysElapsed;
  const daysRemaining = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const projectedSpend = totalSpent + (burnRate * daysRemaining);
  const variance = budget.totalBudget - projectedSpend;
  const costPerDay = totalSpent / daysElapsed;
  const totalDays = Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const timeProgress = (daysElapsed / totalDays) * 100;
  const costEfficiency = timeProgress > 0 ? ((utilization / timeProgress) * 100).toFixed(0) : 100;
  const roi = budget.totalBudget > 0 ? (((budget.totalBudget - totalSpent) / budget.totalBudget) * 100).toFixed(1) : 0;
  const savingsRate = remaining / Math.max(1, daysRemaining);
  
  const performanceScore = Math.max(0, Math.min(100, 
    (variance >= 0 ? 30 : 0) + 
    (utilization < 90 ? 30 : utilization < 100 ? 20 : 0) + 
    (Number(costEfficiency) >= 90 ? 40 : Number(costEfficiency) >= 70 ? 20 : 0)
  ));

  const trendData = budget.categories.map((cat, idx) => ({
    week: `W${idx + 1}`,
    spent: cat.spentAmount,
    projected: (cat.spentAmount / daysElapsed) * totalDays
  }));

  const radarData = budget.categories.map(cat => ({
    category: cat.name,
    utilization: cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0,
    fullMark: 100
  }));

  const categoryData = budget.categories.map(cat => ({
    name: cat.name,
    allocated: cat.allocatedAmount,
    spent: cat.spentAmount,
    remaining: cat.allocatedAmount - cat.spentAmount,
    utilization: cat.allocatedAmount > 0 ? ((cat.spentAmount / cat.allocatedAmount) * 100).toFixed(1) : 0
  }));

  const spendingTrend = budget.categories.map(cat => ({
    category: cat.name,
    value: cat.spentAmount
  }));

  const statusColors = {
    healthy: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444'
  };

  const getHealthStatus = () => {
    if (utilization < 80) return { status: 'healthy', color: statusColors.healthy, label: 'Healthy' };
    if (utilization < 95) return { status: 'warning', color: statusColors.warning, label: 'Warning' };
    return { status: 'critical', color: statusColors.critical, label: 'Critical' };
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            <Activity className="h-4 w-4" style={{ color: health.color }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: health.color }}>{health.label}</div>
            <p className="text-xs text-muted-foreground">{utilization.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{burnRate.toFixed(0)}/day</div>
            <p className="text-xs text-muted-foreground">Average daily spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{projectedSpend.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              {variance >= 0 ? `₹${variance.toFixed(0)} under` : `₹${Math.abs(variance).toFixed(0)} over`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Left</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysRemaining}</div>
            <p className="text-xs text-muted-foreground">Until project end</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore}/100</div>
            <p className="text-xs text-muted-foreground">Budget score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              {Number(costEfficiency) >= 100 ? 'Ahead of schedule' : 'Behind schedule'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">{daysElapsed} of {totalDays} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Potential</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roi}%</div>
            <p className="text-xs text-muted-foreground">Budget savings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{costPerDay.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Average per day</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="allocated" fill="#3B82F6" name="Allocated" />
                <Bar dataKey="spent" fill="#EF4444" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingTrend}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, value }) => `${category}: ₹${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {spendingTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Utilization Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Utilization %" dataKey="utilization" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Trend vs Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="spent" stroke="#EF4444" name="Actual Spent" strokeWidth={2} />
                <Line type="monotone" dataKey="projected" stroke="#3B82F6" strokeDasharray="5 5" name="Projected" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Time Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Budget Utilization</span>
                <span className="font-semibold">{utilization.toFixed(1)}%</span>
              </div>
              <Progress value={utilization} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Time Progress</span>
                <span className="font-semibold">{timeProgress.toFixed(1)}%</span>
              </div>
              <Progress value={timeProgress} className="h-3" />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Analysis</p>
              <p className="text-xs text-muted-foreground">
                {utilization < timeProgress 
                  ? `Budget is being used slower than time (${(timeProgress - utilization).toFixed(1)}% difference). Good pacing.`
                  : utilization > timeProgress
                  ? `Budget is being used faster than time (${(utilization - timeProgress).toFixed(1)}% difference). Monitor closely.`
                  : 'Budget and time are perfectly aligned.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{costEfficiency}%</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">ROI</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{roi}%</p>
            </div>
            <div className="text-center p-3 bg-purple-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Performance</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{performanceScore}</p>
            </div>
            <div className="text-center p-3 bg-orange-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Burn Rate</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{burnRate.toFixed(0)}</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Variance</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{Math.abs(variance).toFixed(0)}</p>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Days Left</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{daysRemaining}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ₹{category.spent.toLocaleString()} / ₹{category.allocated.toLocaleString()}
                    </span>
                    <Badge 
                      variant={Number(category.utilization) > 100 ? "destructive" : Number(category.utilization) > 80 ? "default" : "secondary"}
                    >
                      {category.utilization}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={Math.min(Number(category.utilization), 100)} 
                  className={`h-2 ${Number(category.utilization) > 100 ? 'bg-red-100' : ''}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Remaining: ₹{category.remaining.toLocaleString()}</span>
                  <span>{category.remaining >= 0 ? 'Within budget' : 'Over budget'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {utilization > 90 && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="font-medium text-red-600 dark:text-red-400">High Utilization</p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">Budget is {utilization.toFixed(1)}% utilized</p>
                </div>
              )}
              {variance < 0 && (
                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="font-medium text-orange-600 dark:text-orange-400">Projected Overspend</p>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/80">Expected to exceed by ₹{Math.abs(variance).toFixed(0)}</p>
                </div>
              )}
              {categoryData.some(c => Number(c.utilization) > 100) && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="font-medium text-red-600 dark:text-red-400">Category Over Budget</p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">
                    {categoryData.filter(c => Number(c.utilization) > 100).map(c => c.name).join(', ')} exceeded allocation
                  </p>
                </div>
              )}
              {utilization < 50 && daysRemaining < 30 && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Low Utilization</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Only {utilization.toFixed(1)}% used with {daysRemaining} days left</p>
                </div>
              )}
              {utilization < 90 && variance >= 0 && categoryData.every(c => Number(c.utilization) <= 100) && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="font-medium text-green-600 dark:text-green-400">On Track</p>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">Budget is healthy and within limits</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {burnRate * daysRemaining > remaining && (
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">Reduce Spending</p>
                  <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                    Current burn rate will exceed budget. Reduce daily spend to ₹{(remaining / daysRemaining).toFixed(0)}
                  </p>
                </div>
              )}
              {categoryData.some(c => Number(c.utilization) > 90) && (
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <p className="font-medium text-orange-600 dark:text-orange-400">Reallocate Funds</p>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
                    Consider reallocating from under-utilized categories
                  </p>
                </div>
              )}
              {utilization < 50 && daysRemaining < 60 && (
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Accelerate Spending</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    Budget utilization is low. Consider accelerating planned activities
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Total Budget</span>
                </div>
                <span className="text-lg font-bold">₹{budget.totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <span className="text-lg font-bold">₹{totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Remaining</span>
                </div>
                <span className="text-lg font-bold">₹{remaining.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                <span className="text-sm font-medium">Days Elapsed</span>
                <span className="text-lg font-bold">{daysElapsed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                <span className="text-sm font-medium">Days Remaining</span>
                <span className="text-lg font-bold">{daysRemaining}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg">
                <span className="text-sm font-medium">Total Duration</span>
                <span className="text-lg font-bold">{totalDays} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-indigo-500/10 rounded-lg">
                <span className="text-sm font-medium">Cost/Day</span>
                <span className="text-lg font-bold">₹{costPerDay.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-pink-500/10 rounded-lg">
                <span className="text-sm font-medium">Projected Total</span>
                <span className="text-lg font-bold">₹{projectedSpend.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-teal-500/10 rounded-lg">
                <span className="text-sm font-medium">Savings Rate</span>
                <span className="text-lg font-bold">₹{savingsRate.toFixed(0)}/day</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
