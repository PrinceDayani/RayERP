'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BudgetTemplate } from '@/lib/api/budgetTemplateAPI';
import { Users, Lock } from 'lucide-react';

interface TemplateDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  template: BudgetTemplate | null;
}

export default function TemplateDetailsDialog({ open, onClose, template }: TemplateDetailsDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.templateName}
            {template.isPublic ? (
              <Users className="w-4 h-4 text-blue-600" />
            ) : (
              <Lock className="w-4 h-4 text-gray-600" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Description</h4>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Category</h4>
              <p className="text-sm">{template.category}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Total Amount</h4>
              <p className="text-sm">${template.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Created By</h4>
              <p className="text-sm">{template.createdBy.name}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Usage Count</h4>
              <p className="text-sm">{template.usageCount} times</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Budget Categories</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Category</th>
                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                    <th className="text-right p-3 text-sm font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {template.categories.map((cat, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 text-sm">{cat.categoryName}</td>
                      <td className="p-3 text-sm text-right">${cat.allocatedAmount.toLocaleString()}</td>
                      <td className="p-3 text-sm text-right">{cat.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
