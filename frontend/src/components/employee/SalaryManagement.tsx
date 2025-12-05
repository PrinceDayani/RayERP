"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Coins, Edit, Eye, EyeOff, Lock, TrendingUp, Calendar, FileText } from 'lucide-react';
import salaryAPI from '@/lib/api/salaryAPI';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';

interface SalaryManagementProps {
  employeeId: string;
  employeeName: string;
  currentSalary?: number;
  onSalaryUpdate?: (newSalary: number) => void;
}

export default function SalaryManagement({ 
  employeeId, 
  employeeName, 
  currentSalary,
  onSalaryUpdate 
}: SalaryManagementProps) {
  const { formatAmount } = useCurrency();
  const { hasPermission } = useAuth();
  const [salary, setSalary] = useState<number | null>(currentSalary || null);
  const [loading, setLoading] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    salary: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const canViewSalary = hasPermission('employees.view_salary');
  const canEditSalary = hasPermission('employees.edit_salary');

  useEffect(() => {
    if (canViewSalary && !currentSalary) {
      fetchSalary();
    } else if (currentSalary) {
      setSalary(currentSalary);
    }
  }, [employeeId, canViewSalary, currentSalary]);

  const fetchSalary = async () => {
    try {
      setLoading(true);
      const response = await salaryAPI.getSalary(employeeId);
      if (response.success) {
        setSalary(response.data.salary);
      }
    } catch (error: any) {
      console.error('Error fetching salary:', error);
      if (error.message?.includes('Insufficient permissions')) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view salary information",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSalary = () => {
    setEditForm({
      salary: salary?.toString() || '',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSalaryUpdate = async () => {
    if (!editForm.salary || parseFloat(editForm.salary) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid salary amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await salaryAPI.updateSalary(employeeId, {
        salary: parseFloat(editForm.salary),
        effectiveDate: editForm.effectiveDate,
        reason: editForm.reason
      });

      if (response.success) {
        setSalary(response.data.newSalary);
        setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: `Salary updated successfully for ${employeeName}`,
        });
        
        if (onSalaryUpdate) {
          onSalaryUpdate(response.data.newSalary);
        }
      }
    } catch (error: any) {
      console.error('Error updating salary:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update salary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canViewSalary) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Salary Information</p>
              <p className="text-sm text-muted-foreground">Access Restricted</p>
              <Badge variant="destructive" className="mt-2">
                Requires: employees.view_salary
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-600" />
              Salary Information
            </div>
            {canEditSalary && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditSalary}
                disabled={loading}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Salary
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Annual Salary</p>
                  <div className="flex items-center gap-3">
                    {showSalary ? (
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        {salary ? formatAmount(salary) : 'N/A'}
                      </p>
                    ) : (
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                        ••••••
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSalary(!showSalary)}
                      className="hover:bg-green-100 dark:hover:bg-green-900/20"
                    >
                      {showSalary ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {showSalary && salary && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                    <p className="font-semibold">{formatAmount(salary / 12)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Daily (approx)</p>
                    <p className="font-semibold">{formatAmount(salary / 365)}</p>
                  </div>
                </div>
              )}

              {!canEditSalary && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                  <Lock className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    You can view but not edit salary information
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Update Salary - {employeeName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="salary" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                New Salary Amount
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="Enter new salary"
                value={editForm.salary}
                onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                className="mt-2"
                min="0"
                step="1000"
              />
              {editForm.salary && parseFloat(editForm.salary) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly: {formatAmount(parseFloat(editForm.salary) / 12)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="effectiveDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Effective Date
              </Label>
              <Input
                id="effectiveDate"
                type="date"
                value={editForm.effectiveDate}
                onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="reason" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reason for Change (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Annual increment, Promotion, Performance bonus"
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>

            {salary && editForm.salary && parseFloat(editForm.salary) !== salary && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Salary Change Summary
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-semibold">{formatAmount(salary)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New:</span>
                  <span className="font-semibold text-green-600">{formatAmount(parseFloat(editForm.salary))}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t">
                  <span className="text-muted-foreground">Difference:</span>
                  <span className={`font-semibold ${parseFloat(editForm.salary) > salary ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(editForm.salary) > salary ? '+' : ''}
                    {formatAmount(parseFloat(editForm.salary) - salary)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSalaryUpdate}
              disabled={loading || !editForm.salary || parseFloat(editForm.salary) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Update Salary
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
