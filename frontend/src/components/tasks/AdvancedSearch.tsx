'use client';

import { useState } from 'react';
import { Search, Filter, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SearchFilters {
  query?: string;
  assignee?: string;
  project?: string;
  status?: string[];
  priority?: string[];
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onSave?: (name: string, filters: SearchFilters) => void;
}

export default function AdvancedSearch({ onSearch, onSave }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleSave = () => {
    if (saveName && onSave) {
      onSave(saveName, filters);
      setSaveName('');
      setShowSave(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    onSearch({});
  };

  const activeFilterCount = Object.keys(filters).filter(k => filters[k as keyof SearchFilters]).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={filters.query || ''}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status?.[0]} onValueChange={(v) => setFilters({ ...filters, status: [v] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={filters.priority?.[0]} onValueChange={(v) => setFilters({ ...filters, priority: [v] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSave(!showSave)}>
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          </div>

          {showSave && (
            <div className="flex gap-2">
              <Input
                placeholder="Search name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <Button size="sm" onClick={handleSave}>Save</Button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <Badge variant="secondary">
              Query: {filters.query}
              <button onClick={() => setFilters({ ...filters, query: undefined })} className="ml-2">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.status?.map(s => (
            <Badge key={s} variant="secondary">
              Status: {s}
              <button onClick={() => setFilters({ ...filters, status: undefined })} className="ml-2">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.priority?.map(p => (
            <Badge key={p} variant="secondary">
              Priority: {p}
              <button onClick={() => setFilters({ ...filters, priority: undefined })} className="ml-2">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
