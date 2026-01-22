import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap
} from 'lucide-react';
import { Budget } from '@/types/budget';
import { formatCurrency } from '@/utils/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BudgetAnalyticsProps {
  budgets: Budget[];
  displayCurrency?: string;
}

export const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({
  budgets,
  displayCurrency = 'INR'
}) => {
  // Calculate comprehensive analytics
  const totalBudget = budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => 
    sum + ((b.categories || []).reduce((s, c) => s + (c.spentAmount || 0), 0) || 0), 0
  );
  const remainingBudget = totalBudget - totalSpent;
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Project counts
  const overBudgetProjects = budgets.filter(b => {
    const spent = (b.categories || []).reduce((s, c) => s + (c.spentAmount || 0), 0);
    return spent > (b.totalBudget || 0);
  }).length;
  
  const atRiskProjects = budgets.filter(b => {
    const spent = (b.categories || []).reduce((s, c) => s + (c.spentAmount || 0), 0);
    const utilization = (b.totalBudget || 0) > 0 ? (spent / (b.totalBudget || 0)) * 100 : 0;
    return utilization >= 90 && utilization <= 100;
  }).length;
  
  const underUtilizedProjects = budgets.filter(b => {
    const spent = (b.categories || []).reduce((s, c) => s + (c.spentAmount || 0), 0);
    const utilization = (b.totalBudget || 0) > 0 ? (spent / (b.totalBudget || 0)) * 100 : 0;
    return utilization < 80;
  }).length;
  
  // Status distribution
  const statusStats = {
    approved: budgets.filter(b => b.status === 'approved').length,
    pending: budgets.filter(b => b.status === 'pending').length,
    rejected: budgets.filter(b => b.status === 'rejected').length,
    draft: budgets.filter(b => b.status === 'draft').length
  };
  
  // Category analysis
  const categoryStats = budgets.reduce((acc, budget) => {
    (budget.categories || []).forEach(cat => {
      if (!acc[cat.type]) {
        acc[cat.type] = { allocated: 0, spent: 0 };
      }
      acc[cat.type].allocated += cat.allocatedAmount || 0;
      acc[cat.type].spent += cat.spentAmount || 0;
    });
    return acc;
  }, {} as Record<string, { allocated: number; spent: number }>);
  
  const categoryData = Object.entries(categoryStats).map(([type, data]) => ({
    name: type,
    allocated: data.allocated,
    spent: data.spent,
    remaining: data.allocated - data.spent,
    utilization: data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0
  }));
  
  const statusData = Object.entries(statusStats).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    percentage: budgets.length > 0 ? (count / budgets.length) * 100 : 0
  }));
  
  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];
  
  const avgUtilization = budgets.length > 0 ? budgets.reduce((sum, b) => {
    const spent = (b.categories || []).reduce((s, c) => s + (c.spentAmount || 0), 0);
    const utilization = (b.totalBudget || 0) > 0 ? (spent / (b.totalBudget || 0)) * 100 : 0;
    return sum + utilization;
  }, 0) / budgets.length : 0;
  
  const efficiencyScore = Math.max(0, Math.min(100, 100 - Math.abs(avgUtilization - 85)));

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground">{utilizationRate.toFixed(1)}% of total budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingBudget, displayCurrency)}</div>
            <p className="text-xs text-muted-foreground">{(100 - utilizationRate).toFixed(1)}% available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(efficiencyScore)}/100</div>
            <p className="text-xs text-muted-foreground">Budget efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overBudgetProjects}</div>
            <p className="text-xs text-muted-foreground">Projects exceeding budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{atRiskProjects}</div>
            <p className="text-xs text-muted-foreground">90-100% utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under-utilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{underUtilizedProjects}</div>
            <p className="text-xs text-muted-foreground">Below 80% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value), displayCurrency)} />
                <Bar dataKey="allocated" fill="#3B82F6" name="Allocated" />
                <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                <Bar dataKey="remaining" fill="#10B981" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Utilization Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Category Utilization Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(category.spent, displayCurrency)} / {formatCurrency(category.allocated, displayCurrency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={category.utilization} className="flex-1" />
                  <span className="text-sm font-medium w-12">{category.utilization.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Utilization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => {
              const spent = (budget.categories || []).reduce((s, c) => s + (c.spentAmount || 0), 0);
              const utilization = (budget.totalBudget || 0) > 0 ? (spent / (budget.totalBudget || 0)) * 100 : 0;
              return (
                <div key={budget._id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{budget.projectName || budget.title}</h4>
                    <Badge variant={utilization > 100 ? 'destructive' : utilization > 90 ? 'secondary' : 'outline'}>
                      {utilization.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                    <div>
                      <p className="text-gray-600">Budget</p>
                      <p className="font-semibold">{formatCurrency(budget.totalBudget || 0, displayCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Spent</p>
                      <p className="font-semibold text-red-600">{formatCurrency(spent, displayCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining</p>
                      <p className="font-semibold text-green-600">{formatCurrency((budget.totalBudget || 0) - spent, displayCurrency)}</p>
                    </div>
                  </div>
                  <Progress value={Math.min(utilization, 100)} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetAnalytics;