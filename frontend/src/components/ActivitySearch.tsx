"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

interface ActivitySearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export const ActivitySearch = forwardRef<HTMLInputElement, ActivitySearchProps>(
  ({ searchQuery, onSearchChange, onClearSearch }, ref) => {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={ref}
              placeholder="Search all activities... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
              aria-label="Search all activities"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={onClearSearch}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to clear search
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
);

ActivitySearch.displayName = 'ActivitySearch';
