"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Activity, Percent } from "lucide-react";
import { Budget } from "@/types/budget";

interface BudgetAnalyticsProps {
  budgets: Budget[];
}

export default function BudgetAnalytics({ budgets }: BudgetAnalyticsProps) {
  const totalBudget = budgets.reduce((sum, budget) => sum + (budget.totalBudget || 0), 0);
  const totalSpent = budgets.reduce((sum, budget) => 
    sum + (budget.categories || []).reduce((catSum, cat) => catSum + (cat.spentAmount || 0), 0), 0
  );
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalSpent;

  const categoryData = budgets.reduce((acc, budget) => {
    (budget.categories || []).forEach(category => {
      const existing = acc.find(item => item.type === category.type);
      if (existing) {
        existing.allocated += (category.allocatedAmount || 0);
        existing.spent += (category.spentAmount || 0);
      } else {
        acc.push({
          type: category.type,
          allocated: category.allocatedAmount || 0,
          spent: category.spentAmount || 0
        });
      }
    });
    return acc;
  }, [] as any[]).map(item => ({
    ...item,
    remaining: item.allocated - item.spent,
    utilization: item.allocated > 0 ? ((item.spent / item.allocated) * 100).toFixed(1) : 0
  }));

  const statINRata = [
    { name: 'Approved', value: budgets.filter(b => b.status === 'approved').length, color: '#10B981' },
    { name: 'Pending', value: budgets.filter(b => b.status === 'pending').length, color: '#F59E0B' },
    { name: 'Rejected', value: budgets.filter(b => b.status === 'rejected').length, color: '#EF4444' },
    { name: 'Draft', value: budgets.filter(b => b.status === 'draft').length, color: '#6B7280' }
  ];

  const overBudgetProjects = budgets.filter(budget => {
    const spent = (budget.categories || []).reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    return spent > (budget.totalBudget || 0);
  });

  const underBudgetProjects = budgets.filter(budget => {
    const spent = (budget.categories || []).reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    const utilization = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
    return utilization < 80 && budget.status === 'approved';
  });

  const atRiskProjects = budgets.filter(budget => {
    const spent = (budget.categories || []).reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    const utilization = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
    return utilization >= 90 && utilization <= 100;
  });

  const avgUtilization = budgets.length > 0 
    ? budgets.reduce((sum, budget) => {
        const spent = (budget.categories || []).reduce((s, cat) => s + (cat.spentAmount || 0), 0);
        return sum + (budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0);
      }, 0) / budgets.length
    : 0;

  const efficiencyScore = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{spentPercentage.toFixed(1)}% of total budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overBudgetProjects.length}</div>
            <p className="text-xs text-muted-foreground">Projects exceeding budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{((totalRemaining / totalBudget) * 100).toFixed(1)}% available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{atRiskProjects.length}</div>
            <p className="text-xs text-muted-foreground">90-100% utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under-utilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{underBudgetProjects.length}</div>
            <p className="text-xs text-muted-foreground">Below 80% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{efficiencyScore.toFixed(0)}/100</div>
            <p className="text-xs text-muted-foreground">Budget efficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'utilization') return [`${value}%`, 'Utilization'];
                    return [`₹${Number(value).toLocaleString()}`, name];
                  }} 
                />
                <Legend />
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
                  data={statINRata}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statINRata.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Utilization Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{category.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Over Budget Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overBudgetProjects.length > 0 ? (
              <div className="space-y-3">
                {overBudgetProjects.slice(0, 5).map((budget) => {
                  const spent = (budget.categories || []).reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
                  const overAmount = spent - (budget.totalBudget || 0);
                  const overPercentage = budget.totalBudget > 0 ? ((spent / budget.totalBudget) - 1) * 100 : 0;
                  
                  return (
                    <div key={budget._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{budget.projectName}</p>
                        <p className="text-sm text-gray-600">
                          Over by ₹{overAmount.toLocaleString()} ({overPercentage.toFixed(1)}%)
                        </p>
                      </div>
                      <Badge variant="destructive">Over Budget</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No projects over budget</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              At Risk Projects (90-100%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskProjects.length > 0 ? (
              <div className="space-y-3">
                {atRiskProjects.slice(0, 5).map((budget) => {
                  const spent = (budget.categories || []).reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
                  const utilization = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
                  const remaining = (budget.totalBudget || 0) - spent;
                  
                  return (
                    <div key={budget._id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">{budget.projectName}</p>
                        <p className="text-sm text-gray-600">
                          ₹{remaining.toLocaleString()} remaining ({utilization.toFixed(1)}%)
                        </p>
                      </div>
                      <Badge className="bg-orange-500">At Risk</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No projects at risk</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.slice(0, 10).map((budget) => {
              const spent = (budget.categories || []).reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
              const utilization = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
              
              return (
                <div key={budget._id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{budget.projectName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        ₹{spent.toLocaleString()} / ₹{budget.totalBudget.toLocaleString()}
                      </span>
                      <Badge 
                        variant={utilization > 100 ? "destructive" : utilization > 80 ? "default" : "secondary"}
                      >
                        {utilization.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(utilization, 100)} 
                    className={`h-2 ${utilization > 100 ? 'bg-red-100' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
