"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Filter, Save, Trash2, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AdvancedFiltersProps {
  onFilterChange: (filters: any) => void;
  module: string;
}

export function AdvancedFilters({ onFilterChange, module }: AdvancedFiltersProps) {
  const { toast } = useToast();
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [currentFilters, setCurrentFilters] = useState<any>({
    search: "",
    status: "all",
    location: "",
    minBudget: "",
    maxBudget: "",
    minEmployees: "",
    maxEmployees: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/advanced/filters?module=${module}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSavedFilters(data.data);
      }
    } catch (error) {
      console.error('Failed to load filters');
    }
  };

  const saveFilter = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/advanced/filters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: filterName, module, filters: currentFilters })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Filter saved" });
        loadSavedFilters();
        setShowSaveDialog(false);
        setFilterName("");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save filter", variant: "destructive" });
    }
  };

  const deleteFilter = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/advanced/filters/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success", description: "Filter deleted" });
        loadSavedFilters();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete filter", variant: "destructive" });
    }
  };

  const applyFilter = (filter: any) => {
    setCurrentFilters(filter.filters);
    onFilterChange(filter.filters);
  };

  const handleFilterChange = (key: string, value: any) => {
    const updated = { ...currentFilters, [key]: value };
    setCurrentFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const cleared = {
      search: "",
      status: "all",
      location: "",
      minBudget: "",
      maxBudget: "",
      minEmployees: "",
      maxEmployees: "",
      sortBy: "createdAt",
      sortOrder: "desc"
    };
    setCurrentFilters(cleared);
    onFilterChange(cleared);
  };

  const activeFilterCount = Object.values(currentFilters).filter(v => v && v !== "all" && v !== "createdAt" && v !== "desc").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        <Select onValueChange={(value) => {
          const filter = savedFilters.find(f => f._id === value);
          if (filter) applyFilter(filter);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Load saved filter" />
          </SelectTrigger>
          <SelectContent>
            {savedFilters.map(filter => (
              <SelectItem key={filter._id} value={filter._id}>
                {filter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(true)}>
          <Save className="w-4 h-4 mr-2" /> Save
        </Button>

        {activeFilterCount > 0 && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" /> Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search departments..."
                  value={currentFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={currentFilters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Filter by location"
                  value={currentFilters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Budget</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={currentFilters.minBudget}
                  onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Budget</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={currentFilters.maxBudget}
                  onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Min Employees</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={currentFilters.minEmployees}
                  onChange={(e) => handleFilterChange('minEmployees', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Employees</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={currentFilters.maxEmployees}
                  onChange={(e) => handleFilterChange('maxEmployees', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={currentFilters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="employeeCount">Employee Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select value={currentFilters.sortOrder} onValueChange={(v) => handleFilterChange('sortOrder', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Filter name (e.g., Active High Budget Departments)"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={saveFilter} disabled={!filterName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
