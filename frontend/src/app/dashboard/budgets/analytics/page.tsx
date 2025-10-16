"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Budget } from "@/types/budget";
import BudgetAnalytics from "@/components/budget/BudgetAnalytics";
import Layout from "@/components/Layout";

export default function BudgetAnalyticsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [budgets, statusFilter]);

  const fetchBudgets = async () => {
    try {
      const mockBudgets = [
        {
          _id: '1',
          projectId: 'proj1',
          projectName: 'E-commerce Platform',
          totalBudget: 100000,
          currency: 'USD',
          status: 'approved' as const,
          categories: [
            {
              _id: 'cat1',
              name: 'Development',
              type: 'labor' as const,
              allocatedAmount: 60000,
              spentAmount: 45000,
              items: []
            },
            {
              _id: 'cat2',
              name: 'Infrastructure',
              type: 'equipment' as const,
              allocatedAmount: 25000,
              spentAmount: 20000,
              items: []
            }
          ],
          approvals: [],
          createdBy: 'Mike Johnson',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setBudgets(mockBudgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = budgets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    setFilteredBudgets(filtered);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget Analytics</h1>
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
      </div>

      <BudgetAnalytics budgets={filteredBudgets} />
      </div>
    </Layout>
  );
}