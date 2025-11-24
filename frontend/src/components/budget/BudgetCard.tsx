"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Budget } from "@/types/budget";
import { formatCurrency } from "@/utils/currency";

interface BudgetCardProps {
  budget: Budget;
  onUpdate: () => void;
}

export default function BudgetCard({ budget, onUpdate }: BudgetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const spentPercentage = (totalSpent / budget.totalBudget) * 100;

  const handleApprove = async () => {
    try {
      await fetch(`/api/budgets/${budget._id}/approve`, { method: "POST" });
      onUpdate();
    } catch (error) {
      console.error("Error approving budget:", error);
    }
  };

  const handleReject = async () => {
    try {
      await fetch(`/api/budgets/${budget._id}/reject`, { method: "POST" });
      onUpdate();
    } catch (error) {
      console.error("Error rejecting budget:", error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{budget.projectName}</CardTitle>
          <Badge className={getStatusColor(budget.status)}>
            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Budget</span>
          <span className="font-semibold">{formatCurrency(budget.totalBudget, budget.currency)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent</span>
          <span className="font-semibold">{formatCurrency(totalSpent, budget.currency)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{spentPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={spentPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {budget.categories.slice(0, 4).map((category) => (
            <div key={category._id} className="flex justify-between">
              <span className="text-gray-600 capitalize">{category.type}</span>
              <span>{formatCurrency(category.allocatedAmount, budget.currency, true, true)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            View Project Budget
          </Button>
          {budget.status === "pending" && (
            <>
              <Button variant="outline" size="sm" onClick={handleApprove}>
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReject}>
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
