"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Search, Trash2, Star, StarOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, any>;
  isFavorite: boolean;
  createdAt: string;
}

interface SavedSearchesManagerProps {
  currentFilters: Record<string, any>;
  onApplySearch: (filters: Record<string, any>) => void;
}

export function SavedSearchesManager({ currentFilters, onApplySearch }: SavedSearchesManagerProps) {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    const stored = localStorage.getItem("task-saved-searches");
    if (stored) {
      setSavedSearches(JSON.parse(stored));
    }
  };

  const saveSavedSearches = (searches: SavedSearch[]) => {
    localStorage.setItem("task-saved-searches", JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast({ title: "Error", description: "Search name is required", variant: "destructive" });
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: currentFilters,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    saveSavedSearches(updated);
    setSearchName("");
    setSaveDialogOpen(false);
    toast({ title: "Success", description: "Search saved successfully" });
  };

  const handleDeleteSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    saveSavedSearches(updated);
    toast({ title: "Success", description: "Search deleted" });
  };

  const handleToggleFavorite = (id: string) => {
    const updated = savedSearches.map(s =>
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    );
    saveSavedSearches(updated);
  };

  const handleApplySearch = (search: SavedSearch) => {
    onApplySearch(search.filters);
    setOpen(false);
    toast({ title: "Success", description: `Applied search: ${search.name}` });
  };

  const getFilterSummary = (filters: Record<string, any>) => {
    const parts: string[] = [];
    if (filters.status) parts.push(`Status: ${filters.status}`);
    if (filters.priority) parts.push(`Priority: ${filters.priority}`);
    if (filters.assignedTo) parts.push(`Assignee: ${filters.assignedTo}`);
    if (filters.taskType) parts.push(`Type: ${filters.taskType}`);
    if (filters.assignmentType) parts.push(`Assignment: ${filters.assignmentType}`);
    return parts.length > 0 ? parts.join(" • ") : "No filters";
  };

  const favorites = savedSearches.filter(s => s.isFavorite);
  const others = savedSearches.filter(s => !s.isFavorite);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
          <Search className="h-4 w-4" />
          Saved Searches ({savedSearches.length})
        </Button>
        <Button variant="outline" onClick={() => setSaveDialogOpen(true)} className="gap-2">
          <Save className="h-4 w-4" />
          Save Current
        </Button>
      </div>

      {/* Saved Searches List Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Saved Searches
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No saved searches yet</p>
                <p className="text-sm">Save your current filters to quickly access them later</p>
              </div>
            ) : (
              <>
                {favorites.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      Favorites
                    </h4>
                    {favorites.map(search => (
                      <Card key={search.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">{search.name}</h5>
                                <Badge variant="secondary" className="text-xs">
                                  {Object.keys(search.filters).length} filters
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {getFilterSummary(search.filters)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Saved: {new Date(search.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFavorite(search.id)}
                              >
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApplySearch(search)}
                              >
                                Apply
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSearch(search.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {others.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">All Searches</h4>
                    {others.map(search => (
                      <Card key={search.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium">{search.name}</h5>
                                <Badge variant="secondary" className="text-xs">
                                  {Object.keys(search.filters).length} filters
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {getFilterSummary(search.filters)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Saved: {new Date(search.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFavorite(search.id)}
                              >
                                <StarOff className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApplySearch(search)}
                              >
                                Apply
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSearch(search.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Current Search
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchName">Search Name *</Label>
              <Input
                id="searchName"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., High Priority Tasks"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Current Filters:</p>
              <p className="text-xs text-muted-foreground">
                {getFilterSummary(currentFilters)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>Save Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
