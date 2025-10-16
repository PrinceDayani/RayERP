"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import { Budget } from "@/types/budget";

interface BudgetAnalyticsProps {
  budgets: Budget[];
}

export default function BudgetAnalytics({ budgets }: BudgetAnalyticsProps) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.totalBudget, 0);
  const totalSpent = budgets.reduce((sum, budget) => 
    sum + budget.categories.reduce((catSum, cat) => catSum + cat.spentAmount, 0), 0
  );
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const categoryData = budgets.reduce((acc, budget) => {
    budget.categories.forEach(category => {
      const existing = acc.find(item => item.type === category.type);
      if (existing) {
        existing.allocated += category.allocatedAmount;
        existing.spent += category.spentAmount;
      } else {
        acc.push({
          type: category.type,
          allocated: category.allocatedAmount,
          spent: category.spentAmount
        });
      }
    });
    return acc;
  }, [] as any[]);

  const statusData = [
    { name: 'Approved', value: budgets.filter(b => b.status === 'approved').length, color: '#10B981' },
    { name: 'Pending', value: budgets.filter(b => b.status === 'pending').length, color: '#F59E0B' },
    { name: 'Rejected', value: budgets.filter(b => b.status === 'rejected').length, color: '#EF4444' },
    { name: 'Draft', value: budgets.filter(b => b.status === 'draft').length, color: '#6B7280' }
  ];

  const overBudgetProjects = budgets.filter(budget => {
    const spent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    return spent > budget.totalBudget;
  });

  const underBudgetProjects = budgets.filter(budget => {
    const spent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const utilization = budget.totalBudget > 0 ? (spent / budget.totalBudget) * 100 : 0;
    return utilization < 80 && budget.status === 'approved';
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Under-utilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{underBudgetProjects.length}</div>
            <p className="text-xs text-muted-foreground">Projects under 80% utilization</p>
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
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Bar dataKey="allocated" fill="#3B82F6" name="Allocated" />
                <Bar dataKey="spent" fill="#EF4444" name="Spent" />
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                  const spent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
                  const overAmount = spent - budget.totalBudget;
                  const overPercentage = ((spent / budget.totalBudget) - 1) * 100;
                  
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
              <TrendingDown className="w-5 h-5 text-blue-500" />
              Under-utilized Budgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {underBudgetProjects.length > 0 ? (
              <div className="space-y-3">
                {underBudgetProjects.slice(0, 5).map((budget) => {
                  const spent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
                  const utilization = (spent / budget.totalBudget) * 100;
                  
                  return (
                    <div key={budget._id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{budget.projectName}</p>
                        <p className="text-sm text-gray-600">
                          {utilization.toFixed(1)}% utilized
                        </p>
                      </div>
                      <Badge variant="secondary">Under-utilized</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No under-utilized budgets</p>
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
              const spent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
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