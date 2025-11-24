"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  FileText, 
  BarChart3,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";

const ProjectFinancePage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const financeReports = [
    {
      title: "Profit & Loss",
      description: "View project revenue, expenses, and profitability",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Trial Balance", 
      description: "Review account balances and ensure books balance",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Balance Sheet",
      description: "View project assets, liabilities, and equity",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Cash Flow",
      description: "Track cash inflows and outflows by activity",
      icon: Coins,
      color: "text-orange-600"
    },
    {
      title: "Project Ledger",
      description: "Detailed journal entries and transaction history",
      icon: FileText,
      color: "text-gray-600"
    }
  ];

  return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Finance</h1>
            <p className="text-muted-foreground">Access financial reports and analysis for your projects</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select a Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Choose a project below to access its complete financial dashboard with all reports and analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project._id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/dashboard/projects/${project._id}?tab=finance`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Budget: ${project.budget?.toLocaleString() || 0}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No projects found. Create a project first to access finance features.</p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/projects/create')}>
                  Create Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Finance Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {financeReports.map((report, index) => {
                const IconComponent = report.icon;
                const getReportPath = (title: string) => {
                  switch (title) {
                    case "Profit & Loss":
                      return "/dashboard/finance/profit-loss";
                    case "Trial Balance":
                      return "/dashboard/finance/trial-balance";
                    case "Balance Sheet":
                      return "/dashboard/finance/balance-sheet";
                    case "Cash Flow":
                      return "/dashboard/finance/cash-flow";
                    case "Project Ledger":
                      return "/dashboard/finance/project-ledger";
                    default:
                      return "/dashboard/projects/ledger";
                  }
                };
                return (
                  <Card key={index} className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(getReportPath(report.title))}>
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-6 w-6 ${report.color} mt-1`} />
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default ProjectFinancePage;
