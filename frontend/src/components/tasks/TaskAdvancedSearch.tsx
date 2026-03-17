"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { tasksAPI } from "@/lib/api/tasksAPI";
import { toast } from "@/components/ui/use-toast";
import { Search, Save, Trash2, Filter } from "lucide-react";

interface SavedSearch {
  _id: string;
  name: string;
  filters: any;
  createdAt: Date;
}

interface TaskAdvancedSearchProps {
  onSearch?: (filters: any) => void;
}

export function TaskAdvancedSearch({ onSearch }: TaskAdvancedSearchProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignee: "",
    project: "",
    taskType: "",
    dueDateFrom: "",
    dueDateTo: "",
    tags: "",
  });

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const data = await tasksAPI.getSavedSearches();
      setSavedSearches(data);
    } catch (error) {
      console.error("Failed to fetch saved searches:", error);
    }
  };

  const handleSearch = () => {
    onSearch?.(filters);
    setShowDialog(false);
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;

    try {
      await tasksAPI.saveSearch(searchName, filters);
      toast({ title: "Success", description: "Search saved" });
      setSearchName("");
      setShowSaveDialog(false);
      fetchSavedSearches();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save search", variant: "destructive" });
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    onSearch?.(search.filters);
    setShowDialog(false);
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      await tasksAPI.deleteSavedSearch(id);
      toast({ title: "Success", description: "Search deleted" });
      fetchSavedSearches();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete search", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setFilters({
      search: "",
      status: "",
      priority: "",
      assignee: "",
      project: "",
      taskType: "",
      dueDateFrom: "",
      dueDateTo: "",
      tags: "",
    });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowDialog(true)}>
        <Filter className="h-4 w-4 mr-2" />
        Advanced Search
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="space-y-2">
                <Label>Saved Searches</Label>
                <div className="grid gap-2">
                  {savedSearches.map((search) => (
                    <Card key={search._id} className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1" onClick={() => handleLoadSearch(search)}>
                            <p className="font-medium">{search.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(search.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSearch(search._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Search Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Keyword</Label>
                <Input
                  id="search"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search tasks..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskType">Task Type</Label>
                <Select value={filters.taskType} onValueChange={(value) => setFilters({ ...filters, taskType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDateFrom">Due Date From</Label>
                <Input
                  id="dueDateFrom"
                  type="date"
                  value={filters.dueDateFrom}
                  onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDateTo">Due Date To</Label>
                <Input
                  id="dueDateTo"
                  type="date"
                  value={filters.dueDateTo}
                  onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={filters.tags}
                  onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save Search
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchName">Search Name</Label>
              <Input
                id="searchName"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter search name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
