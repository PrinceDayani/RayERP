'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, CheckCircle, XCircle, RotateCcw, Search } from 'lucide-react';
import { getBudgetsByStatus, unapproveBudget, unrejectBudget } from '@/lib/api/budgetAPI';
import { Budget } from '@/types/budget';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApprovedBudgetsPage() {
  const [approvedBudgets, setApprovedBudgets] = useState<Budget[]>([]);
  const [rejectedBudgets, setRejectedBudgets] = useState<Budget[]>([]);
  const [filteredApproved, setFilteredApproved] = useState<Budget[]>([]);
  const [filteredRejected, setFilteredRejected] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [approvedBudgets, rejectedBudgets, searchQuery]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [approved, rejected] = await Promise.all([
        getBudgetsByStatus('approved'),
        getBudgetsByStatus('rejected')
      ]);
      setApprovedBudgets(approved);
      setRejectedBudgets(rejected);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    const filterFn = (budget: Budget) =>
      budget.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.currency.toLowerCase().includes(searchQuery.toLowerCase());

    setFilteredApproved(approvedBudgets.filter(filterFn));
    setFilteredRejected(rejectedBudgets.filter(filterFn));
  };

  const handleUnapprove = async (budgetId: string) => {
    if (confirm('Are you sure you want to unapprove this budget?')) {
      try {
        await unapproveBudget(budgetId, { comments: 'Budget unapproved by admin' });
        fetchBudgets();
      } catch (error) {
        console.error('Error unapproving budget:', error);
      }
    }
  };

  const handleUnreject = async (budgetId: string) => {
    if (confirm('Are you sure you want to unreject this budget?')) {
      try {
        await unrejectBudget(budgetId, { comments: 'Budget unrejected by admin' });
        fetchBudgets();
      } catch (error) {
        console.error('Error unrejecting budget:', error);
      }
    }
  };

  const BudgetCard = ({ budget }: { budget: Budget }) => {
    const actualSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const remainingBudget = budget.totalBudget - actualSpent;
    const utilizationPercentage = budget.totalBudget > 0 ? (actualSpent / budget.totalBudget) * 100 : 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{budget.projectName}</h3>
              <p className="text-sm text-gray-600">
                Created: {new Date(budget.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge className={budget.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {budget.status === 'approved' ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-600">Total Budget</span>
              <p className="font-semibold">{budget.currency} {budget.totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Spent</span>
              <p className="font-semibold">{budget.currency} {actualSpent.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Remaining</span>
              <p className="font-semibold">{budget.currency} {remainingBudget.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Utilization</span>
              <p className="font-semibold">{utilizationPercentage.toFixed(1)}%</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/budgets/${budget._id}`)}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            {(user?.role.name === 'Root' || user?.role.name === 'Super Admin' || user?.role.name === 'Admin' || user?.role.name === 'Manager') && (
              <Button variant="outline" size="sm" onClick={() => budget.status === 'approved' ? handleUnapprove(budget._id) : handleUnreject(budget._id)}>
                <RotateCcw className="w-4 h-4 mr-1" />
                {budget.status === 'approved' ? 'Unapprove' : 'Unreject'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Approved & Rejected Budgets</h1>
          <Button onClick={() => router.push('/dashboard/budgets')}>Back to All Budgets</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search budgets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
        </div>

        <Tabs defaultValue="approved" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approved">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved ({filteredApproved.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="w-4 h-4 mr-2" />
              Rejected ({filteredRejected.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approved" className="space-y-4">
            {filteredApproved.length > 0 ? (
              filteredApproved.map((budget) => <BudgetCard key={budget._id} budget={budget} />)
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No approved budgets found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {filteredRejected.length > 0 ? (
              filteredRejected.map((budget) => <BudgetCard key={budget._id} budget={budget} />)
            ) : (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No rejected budgets found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}
