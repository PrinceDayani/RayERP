"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, DollarSign, TrendingUp, AlertTriangle, BarChart3, Send, CheckCircle, XCircle, Clock, FileText, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { Budget } from "@/types/budget";
import BudgetDialog from "@/components/budget/BudgetDialog";
import ProjectBudgetAnalytics from "@/components/budget/ProjectBudgetAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectBudgetPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [budget, setBudget] = useState<Budget | null>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProjectBudget();
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchProjectBudget = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Get the first budget if it's an array, or the budget object
        setBudget(Array.isArray(data) ? data[0] : data);
      } else if (response.status === 404) {
        setBudget(null);
      }
    } catch (error) {
      console.error("Error fetching project budget:", error);
      setBudget(null);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = budget?.categories.reduce((sum, cat) => sum + cat.spentAmount, 0) || 0;
  const spentPercentage = budget ? (totalSpent / budget.totalBudget) * 100 : 0;
  const remainingBudget = budget ? budget.totalBudget - totalSpent : 0;

  const createFromTemplate = () => {
    // Pre-populate with template selection
    setShowDialog(true);
  };

  const duplicateBudget = async () => {
    if (!budget) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const duplicateData = {
        projectId: budget.projectId,
        projectName: `${budget.projectName} (Copy)`,
        totalBudget: budget.totalBudget,
        currency: budget.currency,
        categories: budget.categories.map(cat => ({
          name: cat.name,
          type: cat.type,
          allocatedAmount: cat.allocatedAmount,
          spentAmount: 0,
          items: cat.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost
          }))
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(duplicateData)
      });

      if (response.ok) {
        alert('Budget duplicated successfully!');
        fetchProjectBudget();
      }
    } catch (error) {
      console.error('Error duplicating budget:', error);
    }
  };

  const sendForApproval = async () => {
    if (!budget) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget/${budget._id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Budget sent for approval successfully!');
        fetchProjectBudget();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send budget for approval');
      }
    } catch (error) {
      console.error('Error sending budget for approval:', error);
      alert('Failed to send budget for approval');
    }
  };

  const approveBudget = async () => {
    if (!budget) return;
    const comments = prompt('Add approval comments (optional):');
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget/${budget._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comments })
      });

      if (response.ok) {
        alert('Budget approved successfully!');
        fetchProjectBudget();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve budget');
      }
    } catch (error) {
      console.error('Error approving budget:', error);
      alert('Failed to approve budget');
    }
  };

  const rejectBudget = async () => {
    if (!budget) return;
    const comments = prompt('Add rejection reason (required):');
    if (!comments) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget/${budget._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comments })
      });

      if (response.ok) {
        alert('Budget rejected successfully!');
        fetchProjectBudget();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject budget');
      }
    } catch (error) {
      console.error('Error rejecting budget:', error);
      alert('Failed to reject budget');
    }
  };

  const unapproveBudget = async () => {
    if (!budget) return;
    const comments = prompt('Add reason for unapproving (optional):');
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/budget/${budget._id}/unapprove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comments })
      });

      if (response.ok) {
        alert('Budget unapproved successfully!');
        fetchProjectBudget();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to unapprove budget');
      }
    } catch (error) {
      console.error('Error unapproving budget:', error);
      alert('Failed to unapprove budget');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
      <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Project Budget</h1>
            {budget && (
              <Badge className={
                budget.status === 'approved' ? 'bg-green-100 text-green-800' :
                budget.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                budget.status === 'rejected' ? 'bg-red-100 text-red-800' :
                budget.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }>
                {budget.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                {budget.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                {budget.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                {budget.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
                {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">{project?.name}</p>
        </div>
        <div className="flex gap-2">
          {budget ? (
            <>
              {budget.status === 'draft' && (
                <Button onClick={sendForApproval}>
                  <Send className="w-4 h-4 mr-2" />
                  Send for Approval
                </Button>
              )}
              {budget.status === 'pending' && (
                <>
                  <Button onClick={approveBudget} className="bg-green-600 hover:bg-green-700">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button onClick={rejectBudget} variant="destructive">
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {(budget.status === 'approved' || budget.status === 'rejected') && (
                <Button onClick={unapproveBudget} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Revert to Pending
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDialog(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Budget
              </Button>
              <Button variant="outline" onClick={duplicateBudget}>
                Duplicate
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
              <Button variant="outline" onClick={createFromTemplate}>
                From Template
              </Button>
            </>
          )}
        </div>
      </div>

      {budget ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                <div className="text-2xl font-bold">{budget.currency} {totalSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{spentPercentage.toFixed(1)}% of budget</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{budget.currency} {remainingBudget.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                {budget.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {budget.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                {budget.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                {budget.status === 'draft' && <FileText className="h-4 w-4 text-gray-600" />}
              </CardHeader>
              <CardContent>
                <Badge className={
                  budget.status === 'approved' ? 'bg-green-100 text-green-800' :
                  budget.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  budget.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  budget.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{spentPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={spentPercentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {budget.approvals && budget.approvals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Approval History</CardTitle>
                  {budget.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={approveBudget} className="bg-green-600 hover:bg-green-700">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" onClick={rejectBudget} variant="destructive">
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budget.approvals.map((approval: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-1">
                        {approval.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {approval.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                        {approval.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{approval.userName || 'Unknown User'}</span>
                          <Badge variant="outline" className={
                            approval.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            approval.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }>
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                          </Badge>
                        </div>
                        {approval.comments && (
                          <p className="text-sm text-gray-600 mt-1">{approval.comments}</p>
                        )}
                        {approval.approvedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(approval.approvedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {budget.categories.map((category) => {
              const categorySpentPercentage = category.allocatedAmount > 0 
                ? (category.spentAmount / category.allocatedAmount) * 100 
                : 0;

              return (
                <Card key={category._id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg capitalize">{category.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">{category.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Allocated</span>
                      <span className="font-semibold">{budget.currency} {category.allocatedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Spent</span>
                      <span className="font-semibold">{budget.currency} {category.spentAmount.toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{categorySpentPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={categorySpentPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Budget Items</h4>
                      {category.items.map((item) => (
                        <div key={item._id} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-gray-600">{item.description}</p>
                            <p className="text-gray-500">{item.quantity} × {budget.currency}{item.unitCost}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{budget.currency} {item.totalCost.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {budget.approvals && budget.approvals.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Approval Status</CardTitle>
                    {budget.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={approveBudget} className="bg-green-600 hover:bg-green-700">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" onClick={rejectBudget} variant="destructive">
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {budget.approvals.map((approval: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="mt-1">
                          {approval.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {approval.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                          {approval.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{approval.userName || 'Unknown User'}</span>
                            <Badge variant="outline" className={
                              approval.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              approval.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }>
                              {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                            </Badge>
                          </div>
                          {approval.comments && (
                            <p className="text-sm text-gray-600 mt-1">{approval.comments}</p>
                          )}
                          {approval.approvedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(approval.approvedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <ProjectBudgetAnalytics budget={budget} project={project} />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {budget.categories.map((category) => {
                const categorySpentPercentage = category.allocatedAmount > 0 
                  ? (category.spentAmount / category.allocatedAmount) * 100 
                  : 0;

                return (
                  <Card key={category._id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg capitalize">{category.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">{category.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Allocated</span>
                        <span className="font-semibold">{budget.currency} {category.allocatedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Spent</span>
                        <span className="font-semibold">{budget.currency} {category.spentAmount.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{categorySpentPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={categorySpentPercentage} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Budget Items</h4>
                        {category.items.map((item) => (
                          <div key={item._id} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-gray-600">{item.description}</p>
                              <p className="text-gray-500">{item.quantity} × {budget.currency}{item.unitCost}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{budget.currency} {item.totalCost.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Budget Created</h3>
            <p className="text-gray-600 text-center mb-4">
              This project doesn't have a budget yet. Create one to start tracking expenses.
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {project && (
        <BudgetDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={fetchProjectBudget}
          projectId={projectId}
          projectName={project.name}
          budgetId={budget?._id}
          editMode={!!budget}
        />
      )}
      </div>
  );
}