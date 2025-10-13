"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar } from "lucide-react";
import { projectFinanceApi } from "@/lib/api/projectFinanceApi";
import { getAllProjects, type Project } from "@/lib/api/projectsAPI";
import { ProjectLedgerEntry } from "@/types/project-finance.types";

const ProjectLedgerPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [ledgerEntries, setLedgerEntries] = useState<ProjectLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchLedgerEntries();
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

  const fetchLedgerEntries = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const data = await projectFinanceApi.getLedgerEntries(selectedProject);
      setLedgerEntries(data);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVoucherTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'receipt': return 'bg-green-100 text-green-800';
      case 'payment': return 'bg-red-100 text-red-800';
      case 'journal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold">Project Ledger</h1>
              <p className="text-muted-foreground">Detailed journal entries and transaction history</p>
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
              <div className="text-center">Loading ledger entries...</div>
            </CardContent>
          </Card>
        ) : ledgerEntries.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction History
                <Badge variant="secondary">{ledgerEntries.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.accountName}</div>
                          <div className="text-sm text-muted-foreground">{entry.accountCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={entry.description}>
                          {entry.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={getVoucherTypeColor(entry.voucherType)} variant="secondary">
                            {entry.voucherType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{entry.voucherNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? (
                          <span className="font-medium text-green-600">
                            ${entry.debit.toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? (
                          <span className="font-medium text-red-600">
                            ${entry.credit.toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        entry.balance > 0 ? 'text-blue-600' : entry.balance < 0 ? 'text-red-600' : ''
                      }`}>
                        ${entry.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedProject ? 'No Transactions Found' : 'Select a Project'}
                </h3>
                <p className="text-muted-foreground">
                  {selectedProject 
                    ? 'This project has no ledger entries yet'
                    : 'Choose a project to view its transaction history'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProjectLedgerPage;