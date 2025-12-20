'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface ApprovalFilters {
  status?: string;
  entityType?: string;
  priority?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface Props {
  onFilterChange: (filters: ApprovalFilters) => void;
  onReset: () => void;
}

export default function ApprovalFilters({ onFilterChange, onReset }: Props) {
  const [filters, setFilters] = useState<ApprovalFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof ApprovalFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
        <Filter className="w-4 h-4 mr-2" />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type</Label>
            <Select value={filters.entityType} onValueChange={(v) => handleFilterChange('entityType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="JOURNAL">Journal</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="VOUCHER">Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <Select value={filters.priority} onValueChange={(v) => handleFilterChange('priority', v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', Number(e.target.value))}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
