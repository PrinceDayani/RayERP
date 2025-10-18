"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";
import { projectFinanceApi } from "@/lib/api/projectFinanceApi";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import { ProjectTrialBalance } from "@/types/project-finance.types";

const TrialBalancePage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [trialBalanceData, setTrialBalanceData] = useState<ProjectTrialBalance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTrialBalanceData();
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

  const fetchTrialBalanceData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await projectFinanceApi.getTrialBalance(selectedProject);
      setTrialBalanceData(data);
    } catch (error) {
      console.error('Error fetching trial balance data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
  
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Trial Balance</h1>
              <p className="text-muted-foreground">Review account balances and ensure books balance</p>
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
              <div className="text-center">Loading trial balance data...</div>
            </CardContent>
          </Card>
        ) : trialBalanceData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Debits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${trialBalanceData.totalDebits.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${trialBalanceData.totalCredits.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trialBalanceData.totalDebits === trialBalanceData.totalCredits ? 
                      "✓ Books are balanced" : "⚠ Books are not balanced"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalanceData.accounts.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.accountCode}</TableCell>
                        <TableCell>{account.accountName}</TableCell>
                        <TableCell className="text-right">
                          {account.debit > 0 ? `$${account.debit.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.credit > 0 ? `$${account.credit.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-600' : ''
                        }`}>
                          ${account.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project to view its trial balance
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default TrialBalancePage;