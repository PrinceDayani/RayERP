'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VersionHistoryPanel } from '@/components/budget/VersionHistoryPanel';
import { GitBranch, History, RotateCcw, Search } from 'lucide-react';

export default function BudgetRevisionsPage() {
  const [budgetId, setBudgetId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = () => {
    if (budgetId.trim()) {
      setShowHistory(true);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budget Revisions</h1>
        <p className="text-muted-foreground mt-2">
          Track budget versions and restore previous revisions
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Version Control</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Automatic</div>
            <p className="text-xs text-muted-foreground">Every approved change creates a version</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">History Tracking</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Complete</div>
            <p className="text-xs text-muted-foreground">Full audit trail of all changes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restore</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Any Version</div>
            <p className="text-xs text-muted-foreground">Rollback to previous versions</p>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Version Control Features</CardTitle>
          <CardDescription>How budget versioning works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <GitBranch className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Automatic Versioning</h4>
                <p className="text-sm text-muted-foreground">
                  New version created automatically when budget is revised and approved
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <History className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Complete History</h4>
                <p className="text-sm text-muted-foreground">
                  View all previous versions with timestamps, amounts, and revision reasons
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <RotateCcw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Version Restoration</h4>
                <p className="text-sm text-muted-foreground">
                  Restore any previous version - creates new version based on old data
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Budget */}
      <Card>
        <CardHeader>
          <CardTitle>View Budget History</CardTitle>
          <CardDescription>Enter budget ID to view version history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Budget ID..."
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      {showHistory && budgetId && (
        <VersionHistoryPanel 
          budgetId={budgetId} 
          onRestore={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
