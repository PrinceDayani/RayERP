"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Budget } from "@/types/budget";
import BudgetAnalytics from "@/components/budget/BudgetAnalytics";
import { RefreshCw, TrendingUp, Calendar, DollarSign, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { checkBackendHealth, checkAuthToken } from "@/utils/healthCheck";

export default function BudgetAnalyticsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      // Check backend health first
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        alert('Backend server is not responding. Please make sure the server is running on port 5000.');
        return;
      }
      
      // Check authentication
      const { hasToken } = checkAuthToken();
      if (!hasToken) {
        alert('No authentication token found. Please log in first.');
        return;
      }
      
      // Proceed with fetching data
      fetchBudgets();
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [budgets, statusFilter, categoryFilter]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      
      if (!token) {
        console.error('No authentication token found');
        alert('Please log in to access budgets');
        return;
      }

      console.log('Fetching budgets with token:', token ? 'Token exists' : 'No token');
      
      const [budgetRes, projectRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budgets/all`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      console.log('Budget response status:', budgetRes.status);
      console.log('Project response status:', projectRes.status);
      
      if (budgetRes.ok) {
        const data = await budgetRes.json();
        console.log('Budgets loaded:', data);
        // Handle different response formats
        const budgetsArray = Array.isArray(data) ? data : (data.data || data.budgets || []);
        setBudgets(budgetsArray);
        console.log('Budgets array length:', budgetsArray.length);
      } else {
        const errorText = await budgetRes.text();
        console.error('Budget fetch failed:', budgetRes.status, errorText);
        alert(`Failed to fetch budgets: ${budgetRes.status} - ${errorText}`);
      }
      
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProjects(projectData.data || projectData);
        console.log('Projects loaded:', (projectData.data || projectData).length);
      } else {
        const errorText = await projectRes.text();
        console.error('Project fetch failed:', projectRes.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = budgets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(budget => 
        budget.categories.some(cat => cat.type === categoryFilter)
      );
    }

    setFilteredBudgets(filtered);
  };

  const uniqueCategories = budgets && budgets.length > 0 ? Array.from(
    new Set(budgets.flatMap(b => b.categories?.map(c => c.type) || []))
  ) : [];

  const projectBudgetData = (projects && budgets) ? projects.map(project => {
    const projectBudgets = budgets.filter(b => b.projectId === project._id);
    const totalBudget = projectBudgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
    const totalSpent = projectBudgets.reduce((sum, b) => 
      sum + (b.categories?.reduce((s, c) => s + (c.spentAmount || 0), 0) || 0), 0
    );
    return {
      name: project.name,
      budget: totalBudget,
      spent: totalSpent,
      remaining: totalBudget - totalSpent,
      utilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }).filter(p => p.budget > 0) : [];

  const monthlyTrend = budgets && budgets.length > 0 ? budgets.reduce((acc: any[], budget) => {
    const month = new Date(budget.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find(item => item.month === month);
    const spent = budget.categories?.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0) || 0;
    
    if (existing) {
      existing.allocated += budget.totalBudget || 0;
      existing.spent += spent;
    } else {
      acc.push({ month, allocated: budget.totalBudget || 0, spent });
    }
    return acc;
  }, []) : [];

  const topSpendingProjects = projectBudgetData
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const budgetEfficiency = projectBudgetData.map(p => ({
    project: p.name,
    efficiency: p.budget > 0 ? ((p.budget - p.spent) / p.budget * 100).toFixed(1) : 0
  }));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p>Loading budget analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Analytics</h1>
        <Button onClick={fetchBudgets} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Per Project</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BudgetAnalytics budgets={filteredBudgets} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectBudgetData.length}</div>
                <p className="text-xs text-muted-foreground">With budgets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projectBudgetData.length > 0 
                    ? (projectBudgetData.reduce((sum, p) => sum + p.utilization, 0) / projectBudgetData.length).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Across projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{projectBudgetData.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{projectBudgetData.reduce((sum, p) => sum + p.spent, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All projects</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectBudgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
                    <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Spending Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSpendingProjects} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Budget Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="project" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="efficiency" fill="#10B981" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Budget Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectBudgetData.map((project, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{project.name}</h4>
                      <span className="text-sm font-medium">
                        {project.utilization.toFixed(1)}% utilized
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                      <div>
                        <p className="text-gray-600">Budget</p>
                        <p className="font-semibold">₹{project.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Spent</p>
                        <p className="font-semibold text-red-600">₹{project.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Remaining</p>
                        <p className="font-semibold text-green-600">₹{project.remaining.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(project.utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="allocated" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Allocated" />
                  <Area type="monotone" dataKey="spent" stackId="2" stroke="#EF4444" fill="#EF4444" name="Spent" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending vs Allocation Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="allocated" stroke="#3B82F6" strokeWidth={2} name="Allocated" />
                  <Line type="monotone" dataKey="spent" stroke="#EF4444" strokeWidth={2} name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
