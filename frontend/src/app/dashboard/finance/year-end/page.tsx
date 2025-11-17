'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertTriangle, Calendar, FileText, Lock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface YearEndTask {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  assignee: string;
}

export default function YearEndPage() {
  const [tasks] = useState<YearEndTask[]>([
    {
      id: '1',
      title: 'Reconcile Bank Accounts',
      description: 'Ensure all bank accounts are reconciled for the fiscal year',
      status: 'Completed',
      priority: 'High',
      dueDate: '2024-03-15',
      assignee: 'Finance Team'
    },
    {
      id: '2',
      title: 'Fixed Asset Verification',
      description: 'Physical verification and depreciation calculation',
      status: 'In Progress',
      priority: 'High',
      dueDate: '2024-03-20',
      assignee: 'Asset Manager'
    },
    {
      id: '3',
      title: 'Inventory Valuation',
      description: 'Year-end inventory count and valuation',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '2024-03-25',
      assignee: 'Inventory Team'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Blocked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Year-End Closing"
        description="Manage fiscal year-end closing activities and compliance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Year-End Closing' }
        ]}
        actions={
          <Button>
            <Lock className="w-4 h-4 mr-2" />
            Close Fiscal Year
          </Button>
        }
      />

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            FY 2023-24 Closing Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'In Progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(t => t.status === 'Pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => t.status === 'Blocked').length}
                </div>
                <div className="text-sm text-muted-foreground">Blocked</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year-End Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Year-End Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {task.status === 'Completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {task.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Assignee: {task.assignee}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-semibold mb-2">Final Balance Sheet</h3>
            <p className="text-sm text-muted-foreground mb-4">Year-end balance sheet preparation</p>
            <Badge className="bg-green-100 text-green-700">Ready</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold mb-2">Profit & Loss Statement</h3>
            <p className="text-sm text-muted-foreground mb-4">Annual P&L statement</p>
            <Badge className="bg-green-100 text-green-700">Ready</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="font-semibold mb-2">Cash Flow Statement</h3>
            <p className="text-sm text-muted-foreground mb-4">Annual cash flow analysis</p>
            <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h3 className="font-semibold mb-2">Tax Returns</h3>
            <p className="text-sm text-muted-foreground mb-4">Annual tax filing preparation</p>
            <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="font-semibold mb-2">Audit Preparation</h3>
            <p className="text-sm text-muted-foreground mb-4">Documents for external audit</p>
            <Badge className="bg-red-100 text-red-700">Not Started</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-indigo-500" />
            <h3 className="font-semibold mb-2">Compliance Reports</h3>
            <p className="text-sm text-muted-foreground mb-4">Regulatory compliance documentation</p>
            <Badge className="bg-blue-100 text-blue-700">In Review</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}