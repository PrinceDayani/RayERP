"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign } from "lucide-react";
import { projectFinanceApi } from "@/lib/api/projectFinanceApi";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import { ProjectProfitLoss } from "@/types/project-finance.types";

const ProfitLossPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [profitLossData, setProfitLossData] = useState<ProjectProfitLoss | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProfitLossData();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData || []);
      if (projectsData?.length > 0) {
        setSelectedProject(projectsData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProfitLossData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await projectFinanceApi.getProfitLoss(selectedProject);
      setProfitLossData(data);
    } catch (error) {
      console.error('Error fetching profit & loss data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold">Profit & Loss</h1>
              <p className="text-muted-foreground">View project revenue, expenses, and profitability</p>
            </div>
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading profit & loss data...</div>
            </CardContent>
          </Card>
        ) : profitLossData ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${profitLossData.revenue.contractValue.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${(profitLossData.expenses.directCosts + profitLossData.expenses.indirectCosts + profitLossData.expenses.overheads).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${profitLossData.netProfit.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profitLossData.profitMargin.toFixed(2)}% margin
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Contract Value</span>
                    <span className="font-medium">${profitLossData.revenue.contractValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billed Amount</span>
                    <span className="font-medium text-green-600">${profitLossData.revenue.billedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unbilled Amount</span>
                    <span className="font-medium text-orange-600">${profitLossData.revenue.unbilledAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Direct Costs</span>
                    <span className="font-medium">${profitLossData.expenses.directCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indirect Costs</span>
                    <span className="font-medium">${profitLossData.expenses.indirectCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overheads</span>
                    <span className="font-medium">${profitLossData.expenses.overheads.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Gross Profit</span>
                    <span className="text-green-600">${profitLossData.grossProfit.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project to view its profit & loss statement
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProfitLossPage;