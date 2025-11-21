'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, Send, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Calendar, User } from 'lucide-react';
import { getBudget, submitForApproval } from '@/lib/api/budgetAPI';
import { Budget } from '@/types/budget';

export default function BudgetDetailPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  useEffect(() => {
    if (budgetId) {
      fetchBudget();
    }
  }, [budgetId]);

  const fetchBudget = async () => {
    try {
      const data = await getBudget(budgetId);
      setBudget(data);
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!budget) return;
    try {
      await submitForApproval(budget._id);
      fetchBudget();
    } catch (error) {
      console.error('Error submitting for approval:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!budget) {
    return <div className="flex justify-center items-center h-64">Budget not found</div>;
  }

  // Calculate derived values
  const actualSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  const remainingBudget = budget.totalBudget - actualSpent;
  const utilizationPercentage = budget.totalBudget > 0 ? (actualSpent / budget.totalBudget) * 100 : 0;

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/budgets')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budgets
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{budget.projectName}</h1>
              <p className="text-gray-600">Budget Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(budget.status)}
            <Badge className={getStatusColor(budget.status)}>
              {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budget.currency} {budget.totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budget.currency} {actualSpent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budget.currency} {remainingBudget.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{utilizationPercentage.toFixed(1)}%</div>
              <Progress value={utilizationPercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Currency:</span>
                <span className="font-medium">{budget.currency}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="font-medium capitalize">{budget.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Created by:</span>
                <span className="font-medium">
                  {budget.createdBy || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Created:</span>
                <span className="font-medium">{new Date(budget.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {budget.categories.length > 0 ? (
                <div className="space-y-4">
                  {budget.categories.map((category, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge variant="outline" className="capitalize">{category.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Allocated:</span>
                          <p className="font-medium">{budget.currency} {category.allocatedAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Spent:</span>
                          <p className="font-medium">{budget.currency} {category.spentAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      {category.items.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Items ({category.items.length})</p>
                          <div className="space-y-1">
                            {category.items.slice(0, 3).map((item, itemIndex) => (
                              <div key={itemIndex} className="text-xs text-gray-600 flex justify-between">
                                <span>{item.name}</span>
                                <span>{budget.currency} {item.totalCost.toLocaleString()}</span>
                              </div>
                            ))}
                            {category.items.length > 3 && (
                              <p className="text-xs text-gray-500">+{category.items.length - 3} more items</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No categories defined</p>
              )}
            </CardContent>
          </Card>
        </div>

        {budget.approvals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budget.approvals.map((approval, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(approval.status)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{approval.userName}</p>
                          <p className="text-sm text-gray-600 capitalize">{approval.status}</p>
                        </div>
                        {approval.approvedAt && (
                          <p className="text-sm text-gray-500">
                            {new Date(approval.approvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {approval.comments && (
                        <p className="text-sm text-gray-700 mt-2">{approval.comments}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          {budget.status === 'draft' && (
            <>
              <Button onClick={() => router.push(`/dashboard/budgets/${budget._id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Budget
              </Button>
              <Button onClick={handleSubmitForApproval}>
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            </>
          )}
        </div>
      </div>
  );
}