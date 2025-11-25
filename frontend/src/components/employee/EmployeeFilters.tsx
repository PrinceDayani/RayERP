"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Users, Calendar, MapPin, Briefcase } from "lucide-react";

interface FilterState {
  search: string;
  department: string;
  position: string;
  status: string;
  hireYear: string;
  skills: string[];
}

interface EmployeeFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  departments: string[];
  positions: string[];
  skills: string[];
}

export default function EmployeeFilters({ 
  filters, 
  onFiltersChange, 
  departments, 
  positions, 
  skills 
}: EmployeeFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addSkillFilter = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      updateFilter('skills', [...filters.skills, skill]);
    }
  };

  const removeSkillFilter = (skill: string) => {
    updateFilter('skills', filters.skills.filter(s => s !== skill));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      department: '',
      position: '',
      status: '',
      hireYear: '',
      skills: []
    });
  };

  const hasActiveFilters = filters.search || filters.department || filters.position || 
                          filters.status || filters.hireYear || filters.skills.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Primary Search */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                <Search className="w-4 h-4 inline mr-1" />
                Search Employees
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, ID, email, or department..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearAllFilters} className="text-red-600">
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <Users className="w-4 h-4 inline mr-1" />
                    Department
                  </Label>
                  <Select value={filters.department} onValueChange={(value) => updateFilter('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Position
                  </Label>
                  <Select value={filters.position} onValueChange={(value) => updateFilter('position', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All positions</SelectItem>
                      {positions.map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Status
                  </Label>
                  <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Hire Year
                  </Label>
                  <Select value={filters.hireYear} onValueChange={(value) => updateFilter('hireYear', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All years</SelectItem>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Skills Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer">
                      {skill}
                      <X 
                        className="w-3 h-3 ml-1" 
                        onClick={() => removeSkillFilter(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addSkillFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add skill filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.filter(skill => !filters.skills.includes(skill)).map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.department && (
                <Badge variant="outline">Department: {filters.department}</Badge>
              )}
              {filters.position && (
                <Badge variant="outline">Position: {filters.position}</Badge>
              )}
              {filters.status && (
                <Badge variant="outline">Status: {filters.status}</Badge>
              )}
              {filters.hireYear && (
                <Badge variant="outline">Hired: {filters.hireYear}</Badge>
              )}
              {filters.skills.map(skill => (
                <Badge key={skill} variant="outline">Skill: {skill}</Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}