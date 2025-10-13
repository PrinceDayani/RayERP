"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { projectFinanceApi } from "@/lib/api/projectFinanceApi";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import { ProjectBalanceSheet } from "@/types/project-finance.types";

const BalanceSheetPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [balanceSheetData, setBalanceSheetData] = useState<ProjectBalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBalanceSheetData();
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

  const fetchBalanceSheetData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await projectFinanceApi.getBalanceSheet(selectedProject);
      setBalanceSheetData(data);
    } catch (error) {
      console.error('Error fetching balance sheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Balance Sheet</h1>
              <p className="text-muted-foreground">View project assets, liabilities, and equity</p>
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
              <div className="text-center">Loading balance sheet data...</div>
            </CardContent>
          </Card>
        ) : balanceSheetData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Assets</h4>
                  {balanceSheetData.assets.current.map((asset, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{asset.name}</span>
                      <span>${asset.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Fixed Assets</h4>
                  {balanceSheetData.assets.fixed.map((asset, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{asset.name}</span>
                      <span>${asset.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Assets</span>
                  <span className="text-green-600">${balanceSheetData.assets.total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Liabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Liabilities</h4>
                  {balanceSheetData.liabilities.current.map((liability, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{liability.name}</span>
                      <span>${liability.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Long-term Liabilities</h4>
                  {balanceSheetData.liabilities.longTerm.map((liability, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{liability.name}</span>
                      <span>${liability.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Liabilities</span>
                  <span className="text-red-600">${balanceSheetData.liabilities.total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Equity Items</h4>
                  {balanceSheetData.equity.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Equity</span>
                  <span className="text-blue-600">${balanceSheetData.equity.total.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Liab. + Equity</span>
                  <span>${(balanceSheetData.liabilities.total + balanceSheetData.equity.total).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {balanceSheetData.assets.total === (balanceSheetData.liabilities.total + balanceSheetData.equity.total) ? 
                    "✓ Balance sheet balances" : "⚠ Balance sheet does not balance"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project to view its balance sheet
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BalanceSheetPage;