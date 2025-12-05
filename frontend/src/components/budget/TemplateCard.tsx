'use client';

import { BudgetTemplate } from '@/lib/api/budgetTemplateAPI';
import { Button } from '@/components/ui/button';
import { Copy, Eye, Users, Lock } from 'lucide-react';

interface TemplateCardProps {
  template: BudgetTemplate;
  onClone: (template: BudgetTemplate) => void;
  onView: (template: BudgetTemplate) => void;
}

export default function TemplateCard({ template, onClone, onView }: TemplateCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{template.templateName}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {template.isPublic ? (
            <Users className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Category:</span>
          <span className="font-medium">{template.category}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-medium">${template.totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Categories:</span>
          <span className="font-medium">{template.categories.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Used:</span>
          <span className="font-medium">{template.usageCount} times</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        By {template.createdBy.name} • {new Date(template.createdAt).toLocaleDateString()}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onClone(template)} className="flex-1">
          <Copy className="w-3 h-3 mr-1" />
          Clone
        </Button>
        <Button size="sm" variant="outline" onClick={() => onView(template)}>
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
      </div>
    </div>
  );
}
