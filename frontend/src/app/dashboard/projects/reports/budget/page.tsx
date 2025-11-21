"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, ArrowLeft, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { useRouter } from "next/navigation";
import { getAllProjects } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";

const BudgetAnalysisPage = () => {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("all");

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsData, budgetsData] = await Promise.all([
        getAllProjects(),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/all`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
        }).then(r => r.json()).catch(() => [])
      ]);
      
      setProjects(projectsData || []);
      setBudgets(budgetsData || []);
    } catch (error) {
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getBudgetMetrics = () => {
    const totalBudget = budgets.reduce((sum, b: any) => sum + (b.totalBudget || 0), 0);
    const totalSpent = budgets.reduce((sum, b: any) => sum + (b.actualSpent || 0), 0);
    const totalRemaining = budgets.reduce((sum, b: any) => sum + (b.remainingBudget || 0), 0);
    const avgUtilization = budgets.reduce((sum, b: any) => sum + (b.utilizationPercentage || 0), 0) / budgets.length || 0;
    const overBudgetCount = budgets.filter((b: any) => (b.utilizationPercentage || 0) > 100).length;
    
    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      avgUtilization,
      overBudgetCount,
      utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  };

  const getBudgetStatusData = () => {
    const statusCounts = budgets.reduce((acc: any, budget: any) => {
      acc[budget.status] = (acc[budget.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      value: budgets.filter((b: any) => b.status === status).reduce((sum, b: any) => sum + (b.totalBudget || 0), 0)
    }));
  };

  const getUtilizationData = () => {
    return budgets.map((budget: any) => ({
      name: budget.projectName || 'Unknown Project',
      budgeted: budget.totalBudget || 0,
      spent: budget.actualSpent || 0,
      utilization: budget.utilizationPercentage || 0
    })).slice(0, 10);
  };

  const metrics = getBudgetMetrics();
  const statusData = getBudgetStatusData();
  const utilizationData = getUtilizationData();

  if (loading) {
    return <div className="flex justify-center p-8">Loading budget data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              Budget Analysis
            </h1>
            <p className="text-muted-foreground">Financial performance and budget utilization</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-3xl font-bold">${metrics.totalBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold">${metrics.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-red-600">{metrics.utilizationRate.toFixed(1)}% utilized</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                <p className="text-3xl font-bold">${metrics.totalRemaining.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Over Budget</p>
                <p className="text-3xl font-bold">{metrics.overBudgetCount}</p>
                <p className="text-xs text-orange-600">Projects</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, value }) => `${status}: $${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="utilization" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Project</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Total Budget</th>
                  <th className="text-left p-2">Spent</th>
                  <th className="text-left p-2">Remaining</th>
                  <th className="text-left p-2">Utilization</th>
                  <th className="text-left p-2">Health</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget: any) => (
                  <tr key={budget._id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{budget.projectName}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        budget.status === 'approved' ? 'bg-green-100 text-green-700' :
                        budget.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        budget.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {budget.status}
                      </span>
                    </td>
                    <td className="p-2">${(budget.totalBudget || 0).toLocaleString()}</td>
                    <td className="p-2">${(budget.actualSpent || 0).toLocaleString()}</td>
                    <td className="p-2">${(budget.remainingBudget || budget.totalBudget || 0).toLocaleString()}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (budget.utilizationPercentage || 0) > 100 ? 'bg-red-600' :
                              (budget.utilizationPercentage || 0) > 80 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(budget.utilizationPercentage || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{(budget.utilizationPercentage || 0).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (budget.utilizationPercentage || 0) > 100 ? 'bg-red-100 text-red-700' :
                        (budget.utilizationPercentage || 0) > 80 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {(budget.utilizationPercentage || 0) > 100 ? 'Over Budget' :
                         (budget.utilizationPercentage || 0) > 80 ? 'At Risk' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetAnalysisPage;