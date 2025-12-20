'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdvancedFilters {
  module: string;
  action: string;
  status: string;
  userSearch: string;
  ipAddress: string;
  riskLevel: string;
  startDate: string;
  endDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilters) => void;
  currentFilters: AdvancedFilters;
}

export default function AdvancedFilterModal({ open, onClose, onApply, currentFilters }: Props) {
  const [filters, setFilters] = useState<AdvancedFilters>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: AdvancedFilters = {
      module: 'all',
      action: 'all',
      status: 'all',
      userSearch: '',
      ipAddress: '',
      riskLevel: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="adv-module">Module</Label>
            <Select value={filters.module} onValueChange={(value) => setFilters({ ...filters, module: value })}>
              <SelectTrigger id="adv-module">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Voucher">Voucher</SelectItem>
                <SelectItem value="Budget">Budget</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-action">Action</Label>
            <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
              <SelectTrigger id="adv-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger id="adv-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-user">User Email</Label>
            <Input
              id="adv-user"
              placeholder="Search by email..."
              value={filters.userSearch}
              onChange={(e) => setFilters({ ...filters, userSearch: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-ip">IP Address</Label>
            <Input
              id="adv-ip"
              placeholder="e.g., 192.168.1.1"
              value={filters.ipAddress}
              onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-risk">Risk Level</Label>
            <Select value={filters.riskLevel} onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}>
              <SelectTrigger id="adv-risk">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-start">Start Date</Label>
            <Input
              id="adv-start"
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-end">End Date</Label>
            <Input
              id="adv-end"
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset All
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
