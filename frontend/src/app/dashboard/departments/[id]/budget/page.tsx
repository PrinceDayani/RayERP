"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    Loader2,
    Save,
    AlertCircle,
    Calendar,
    PieChart,
    ExternalLink
} from "lucide-react";
import { SectionLoader } from '@/components/PageLoader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { departmentApi, Department } from "@/lib/api/departments";
import { BudgetAdjustment } from "@/types/department";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import CurrencySwitcher from "@/components/budget/CurrencySwitcher";

export default function DepartmentBudgetPage() {
    const params = useParams();
    const { toast } = useToast();
    const { formatAmount } = useGlobalCurrency();
    const [department, setDepartment] = useState<Department | null>(null);
    const [budgetRecord, setBudgetRecord] = useState<any>(null);
    const [approvalStatus, setApprovalStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
    const [budgetAdjustment, setBudgetAdjustment] = useState<BudgetAdjustment>({
        amount: 0,
        reason: "",
        type: "increase",
    });

    const [budgetHistory, setBudgetHistory] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);

    useEffect(() => {
        loadDepartment();
        loadBudgetData();
        loadBudgetRecord();
    }, [params.id]);

    const loadDepartment = async () => {
        try {
            setLoading(true);
            const response = await departmentApi.getById(params.id as string);
            setDepartment(response.data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load department",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadBudgetData = async () => {
        try {
            const [budgetRes, expensesRes] = await Promise.allSettled([
                departmentApi.getBudgetHistory(params.id as string).catch(() => ({ data: [] })),
                departmentApi.getExpenses(params.id as string).catch(() => ({ data: [] })),
            ]);

            if (budgetRes.status === 'fulfilled') {
                const budgetData = budgetRes.value.data?.data || budgetRes.value.data;
                setBudgetHistory(Array.isArray(budgetData) ? budgetData : []);
            } else {
                setBudgetHistory([]);
            }

            if (expensesRes.status === 'fulfilled') {
                const expenseData = expensesRes.value.data?.data || expensesRes.value.data;
                setExpenses(Array.isArray(expenseData) ? expenseData : []);
            } else {
                setExpenses([]);
            }
        } catch (error: any) {
            // Silently handle errors - endpoints may not exist yet
            setBudgetHistory([]);
            setExpenses([]);
        }
    };

    const loadBudgetRecord = async () => {
        try {
            const token = localStorage.getItem('auth-token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            
            // Get department budget record
            const budgetRes = await fetch(`${API_URL}/api/department-budgets?departmentId=${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => null);
            
            if (!budgetRes || !budgetRes.ok) return;
            
            const budgetData = await budgetRes.json();
            
            if (budgetData.success && budgetData.data?.length > 0) {
                const budget = budgetData.data[0];
                setBudgetRecord(budget);
                
                // Get approval workflow status
                const approvalRes = await fetch(`${API_URL}/api/approval-workflow/entity/DepartmentBudget/${budget._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null);
                
                if (approvalRes && approvalRes.ok) {
                    const approvalData = await approvalRes.json();
                    if (approvalData.success) {
                        setApprovalStatus(approvalData.data);
                    }
                }
            }
        } catch (error) {
            // Silently handle - budget may not exist yet
        }
    };

    const handleAdjustBudget = async () => {
        if (!department || budgetAdjustment.amount === 0 || !budgetAdjustment.reason) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            await departmentApi.adjustBudget(params.id as string, budgetAdjustment);
            toast({
                title: "Success",
                description: "Budget adjusted successfully",
            });
            setIsAdjustDialogOpen(false);
            setBudgetAdjustment({ amount: 0, reason: "", type: "increase" });
            await loadDepartment();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to adjust budget",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !department) {
        return <SectionLoader />;
    }

    const currentUtilization = (Array.isArray(budgetHistory) && budgetHistory.length > 0)
        ? budgetHistory[budgetHistory.length - 1]?.utilization || 0
        : 0;
    const currentSpent = (Array.isArray(budgetHistory) && budgetHistory.length > 0)
        ? budgetHistory[budgetHistory.length - 1]?.spent || 0
        : 0;
    const currentRemaining = (Array.isArray(budgetHistory) && budgetHistory.length > 0)
        ? budgetHistory[budgetHistory.length - 1]?.remaining || 0
        : department.budget;
    const monthlyAverage = (Array.isArray(budgetHistory) && budgetHistory.length > 0)
        ? budgetHistory.reduce((sum, item) => sum + (item.spent || 0), 0) / budgetHistory.length
        : 0;

    return (
        <div className="space-y-6">
            {/* Header with Currency Switcher */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-[#970E2C] via-[#800020] to-[#970E2C] bg-clip-text text-transparent">Budget Management</h2>
                        {budgetRecord && (
                            <Badge variant={budgetRecord.status === 'approved' ? 'default' : budgetRecord.status === 'draft' ? 'secondary' : 'outline'} className="px-3 py-1">
                                {budgetRecord.status}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-2 text-base">Track and manage department budget allocation</p>
                </div>
                <div className="flex items-center gap-2">
                    <CurrencySwitcher />
                    <Link href={`/dashboard/department-budgets?departmentId=${params.id}`}>
                        <Button variant="outline" className="h-11 hover:bg-[#970E2C]/5 hover:border-[#970E2C]/30">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View in Budget Module
                        </Button>
                    </Link>
                    <Button onClick={() => setIsAdjustDialogOpen(true)} className="h-11 bg-gradient-to-r from-[#970E2C] to-[#800020] hover:from-[#800020] hover:to-[#970E2C] text-white shadow-lg shadow-[#970E2C]/20 transition-all">
                        <Wallet className="w-4 h-4 mr-2" />
                        Adjust Budget
                    </Button>
                </div>
            </div>

            {/* Approval Status Alert */}
            {approvalStatus && approvalStatus.status === 'pending' && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-orange-900 dark:text-orange-100">Budget Pending Approval</p>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Level {approvalStatus.currentLevel} of {approvalStatus.requiredLevels} - Waiting for approval
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Premium Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Budget */}
                <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Total Budget</p>
                                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{formatAmount(department.budget)}</p>
                                <p className="text-xs text-muted-foreground mt-2">Annual allocation</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                <Wallet className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Spent This Month */}
                <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Spent This Month</p>
                                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{formatAmount(currentSpent)}</p>
                                <Badge variant="secondary" className="text-xs bg-[#970E2C]/10 text-[#970E2C] border-[#970E2C]/20 mt-2">
                                    {currentUtilization}% utilized
                                </Badge>
                            </div>
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                <TrendingDown className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Remaining */}
                <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Remaining</p>
                                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{formatAmount(currentRemaining)}</p>
                                <p className="text-xs text-muted-foreground mt-2">Available balance</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                <Wallet className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Average */}
                <Card className="group relative overflow-hidden border-0 shadow-lg shadow-[#970E2C]/10 hover:shadow-xl hover:shadow-[#970E2C]/20 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#970E2C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#970E2C] uppercase tracking-wide">Monthly Average</p>
                                <p className="text-4xl font-bold mt-3 bg-gradient-to-r from-[#970E2C] to-[#800020] bg-clip-text text-transparent">{formatAmount(monthlyAverage)}</p>
                                <p className="text-xs text-muted-foreground mt-2">Avg spending rate</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#970E2C] to-[#800020] shadow-lg shadow-[#970E2C]/30">
                                <Calendar className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="utilization" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl border border-border/50">
                    <TabsTrigger value="utilization" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Budget Utilization</TabsTrigger>
                    <TabsTrigger value="breakdown" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Expense Breakdown</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#970E2C] data-[state=active]:to-[#800020] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#970E2C]/20 hover:bg-background/50 transition-all">Adjustment History</TabsTrigger>
                </TabsList>

                {/* Budget Utilization Tab */}
                <TabsContent value="utilization">
                    <Card className="glass-morphism">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Monthly Budget Utilization</CardTitle>
                            <CardDescription>Track spending trends across months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {budgetHistory.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            <TableHead>Allocated</TableHead>
                                            <TableHead>Spent</TableHead>
                                            <TableHead>Remaining</TableHead>
                                            <TableHead>Utilization</TableHead>
                                            <TableHead>Progress</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {budgetHistory.map((month, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{month.month}</TableCell>
                                                <TableCell>{formatAmount(month.allocated)}</TableCell>
                                                <TableCell>{formatAmount(month.spent)}</TableCell>
                                                <TableCell className="text-green-600">{formatAmount(month.remaining)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={month.utilization > 85 ? "destructive" : month.utilization > 70 ? "default" : "secondary"}>
                                                        {month.utilization}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Progress value={month.utilization} className="w-[100px]" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No budget utilization data available</p>
                                    <p className="text-xs text-muted-foreground mt-2">Budget history will appear here once available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Expense Breakdown Tab */}
                <TabsContent value="breakdown">
                    <Card className="glass-morphism">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <PieChart className="w-5 h-5 text-[#970E2C]" />
                                Expense Breakdown by Category
                            </CardTitle>
                            <CardDescription>Current month spending distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {expenses.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>% of Budget</TableHead>
                                            <TableHead>Trend</TableHead>
                                            <TableHead>Distribution</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.map((expense, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{expense.category}</TableCell>
                                                <TableCell>{formatAmount(expense.amount)}</TableCell>
                                                <TableCell>{expense.percentage}%</TableCell>
                                                <TableCell>
                                                    {expense.trend === "up" && <TrendingUp className="w-4 h-4 text-red-500 inline" />}
                                                    {expense.trend === "down" && <TrendingDown className="w-4 h-4 text-green-500 inline" />}
                                                    {expense.trend === "stable" && <Minus className="w-4 h-4 text-gray-500 inline" />}
                                                    <span className="ml-2 text-xs text-muted-foreground capitalize">{expense.trend}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Progress value={expense.percentage} className="w-[120px]" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No expense data available</p>
                                    <p className="text-xs text-muted-foreground mt-2">Expense breakdown will appear here once available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Adjustment History Tab */}
                <TabsContent value="history">
                    <Card className="glass-morphism">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Budget Adjustment History</CardTitle>
                            <CardDescription>Recent budget changes and modifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No adjustment history available</p>
                                <p className="text-xs text-muted-foreground mt-2">Budget adjustments will appear here once made</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Adjust Budget Dialog */}
            <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Department Budget</DialogTitle>
                        <DialogDescription>
                            Increase or decrease the department's annual budget
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <Select
                                value={budgetAdjustment.type}
                                onValueChange={(value: "increase" | "decrease") =>
                                    setBudgetAdjustment({ ...budgetAdjustment, type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="increase">
                                        <div className="flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-green-500" />
                                            Increase
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="decrease">
                                        <div className="flex items-center gap-2">
                                            <Minus className="w-4 h-4 text-red-500" />
                                            Decrease
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                min="0"
                                value={budgetAdjustment.amount}
                                onChange={(e) =>
                                    setBudgetAdjustment({ ...budgetAdjustment, amount: Number(e.target.value) })
                                }
                                placeholder="Enter amount"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                value={budgetAdjustment.reason}
                                onChange={(e) =>
                                    setBudgetAdjustment({ ...budgetAdjustment, reason: e.target.value })
                                }
                                placeholder="Explain the reason for this adjustment"
                                rows={3}
                            />
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">New Budget:</p>
                            <p className="text-xl font-bold">
                                {formatAmount(
                                    department.budget +
                                    (budgetAdjustment.type === "increase" ? 1 : -1) * budgetAdjustment.amount
                                )}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAdjustDialogOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAdjustBudget} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            Save Adjustment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
