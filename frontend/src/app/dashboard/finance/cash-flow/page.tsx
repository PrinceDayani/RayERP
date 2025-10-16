"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { projectFinanceApi } from "@/lib/api/projectFinanceApi";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import { ProjectCashFlow } from "@/types/project-finance.types";

const CashFlowPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [cashFlowData, setCashFlowData] = useState<ProjectCashFlow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCashFlowData();
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

  const fetchCashFlowData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await projectFinanceApi.getCashFlow(selectedProject);
      setCashFlowData(data);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold">Cash Flow</h1>
              <p className="text-muted-foreground">Track cash inflows and outflows by activity</p>
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
              <div className="text-center">Loading cash flow data...</div>
            </CardContent>
          </Card>
        ) : cashFlowData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Opening Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${cashFlowData.openingBalance.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${
                    cashFlowData.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cashFlowData.netCashFlow > 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                    ${cashFlowData.netCashFlow.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Closing Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${cashFlowData.closingBalance.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Operating Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cash Receipts</span>
                    <span className="font-medium text-green-600">
                      +${cashFlowData.operating.receipts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Payments</span>
                    <span className="font-medium text-red-600">
                      -${cashFlowData.operating.payments.toLocaleString()}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Net Operating</span>
                    <span className={cashFlowData.operating.net > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlowData.operating.net.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Investing Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cash Receipts</span>
                    <span className="font-medium text-green-600">
                      +${cashFlowData.investing.receipts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Payments</span>
                    <span className="font-medium text-red-600">
                      -${cashFlowData.investing.payments.toLocaleString()}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Net Investing</span>
                    <span className={cashFlowData.investing.net > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlowData.investing.net.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-600">Financing Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cash Receipts</span>
                    <span className="font-medium text-green-600">
                      +${cashFlowData.financing.receipts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Payments</span>
                    <span className="font-medium text-red-600">
                      -${cashFlowData.financing.payments.toLocaleString()}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Net Financing</span>
                    <span className={cashFlowData.financing.net > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${cashFlowData.financing.net.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project to view its cash flow statement
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CashFlowPage;