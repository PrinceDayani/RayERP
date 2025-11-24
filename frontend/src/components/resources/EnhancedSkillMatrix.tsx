'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SkillMatrix, SkillLevel, SkillFilters, SkillGapAnalysis, ProjectSkillMatch, SkillDistribution } from '@/types/resource';
import { resourceApi } from '@/lib/api/resources';
import { projectsAPI } from '@/lib/api/projectsAPI';
import { Search, Filter, TrendingUp, Users, Target, BarChart3, Edit2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import SkillAnalyticsCharts from './SkillAnalyticsCharts';
import SkillGapAnalysisView from './SkillGapAnalysisView';
import ProjectSkillMatchView from './ProjectSkillMatchView';

interface EnhancedSkillMatrixProps {
  matrix: SkillMatrix[];
  allSkills: string[];
}

const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const getSkillLevelColor = (level: SkillLevel | null) => {
  switch (level) {
    case 'Beginner': return 'bg-red-100 text-red-800 border-red-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Expert': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
};

export default function EnhancedSkillMatrix({ matrix: initialMatrix, allSkills: initialSkills }: EnhancedSkillMatrixProps) {
  const [matrix, setMatrix] = useState<SkillMatrix[]>(initialMatrix);
  const [allSkills, setAllSkills] = useState<string[]>(initialSkills);
  const [filters, setFilters] = useState<SkillFilters>({});
  const [editingCell, setEditingCell] = useState<{ employeeId: string; skill: string } | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<SkillGapAnalysis[]>([]);
  const [projectMatches, setProjectMatches] = useState<ProjectSkillMatch[]>([]);
  const [skillDistribution, setSkillDistribution] = useState<SkillDistribution[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
    loadSkillAnalytics();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ status: 'active' });
      setProjects(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadSkillAnalytics = async () => {
    try {
      const [gapRes, distRes] = await Promise.all([
        resourceApi.getSkillGapAnalysis(),
        resourceApi.getSkillDistribution()
      ]);
      setGapAnalysis(gapRes?.data || []);
      setSkillDistribution(distRes?.data || []);
    } catch (error) {
      console.error('Failed to load skill analytics:', error);
    }
  };

  const loadProjectSkillMatch = async (projectId: string) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await resourceApi.getProjectSkillMatch(projectId);
      setProjectMatches(response?.data || []);
    } catch (error) {
      console.error('Failed to load project skill match:', error);
      toast({ title: "Error", description: "Failed to load project skill matching", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilters: SkillFilters) => {
    setFilters(newFilters);
    try {
      const response = await resourceApi.getSkillMatrix(newFilters);
      setMatrix(response?.data?.matrix || []);
      setAllSkills(response?.data?.allSkills || []);
    } catch (error) {
      console.error('Failed to filter skill matrix:', error);
    }
  };

  const handleSkillUpdate = async (employeeId: string, skill: string, level: SkillLevel) => {
    try {
      await resourceApi.updateEmployeeSkill(employeeId, skill, level);
      
      // Update local state
      setMatrix(prev => prev.map(emp => 
        emp.employee._id === employeeId 
          ? {
              ...emp,
              skills: emp.skills.map(s => 
                s.skill === skill ? { ...s, level, lastUpdated: new Date().toISOString() } : s
              )
            }
          : emp
      ));
      
      setEditingCell(null);
      toast({ title: "Success", description: "Skill level updated successfully" });
      
      // Reload analytics
      loadSkillAnalytics();
    } catch (error) {
      console.error('Failed to update skill:', error);
      toast({ title: "Error", description: "Failed to update skill level", variant: "destructive" });
    }
  };

  const filteredMatrix = useMemo(() => {
    return matrix.filter(emp => {
      if (filters.search && !emp.employee.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.department && emp.employee.department !== filters.department) {
        return false;
      }
      if (filters.employee && emp.employee._id !== filters.employee) {
        return false;
      }
      if (filters.skill) {
        const hasSkill = emp.skills.some(s => s.skill === filters.skill && s.level);
        if (!hasSkill) return false;
      }
      if (filters.level) {
        const hasLevel = emp.skills.some(s => s.level === filters.level);
        if (!hasLevel) return false;
      }
      return true;
    });
  }, [matrix, filters]);

  const departments = useMemo(() => {
    const depts = new Set(matrix.map(emp => emp.employee.department).filter(Boolean));
    return Array.from(depts);
  }, [matrix]);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Skill Matrix</h2>
          <p className="text-muted-foreground">Manage team skills with levels and analytics</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Skill Analytics</DialogTitle>
              </DialogHeader>
              <SkillAnalyticsCharts distribution={skillDistribution} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            
            <Select value={filters.department || ''} onValueChange={(value) => handleFilterChange({ ...filters, department: value === 'all' ? undefined : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.skill || ''} onValueChange={(value) => handleFilterChange({ ...filters, skill: value === 'all' ? undefined : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map(skill => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.level || ''} onValueChange={(value) => handleFilterChange({ ...filters, level: value === 'all' ? undefined : (value as SkillLevel) })}>
              <SelectTrigger>
                <SelectValue placeholder="Proficiency Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {skillLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => handleFilterChange({})}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Skill Matrix
          </TabsTrigger>
          <TabsTrigger value="gap-analysis" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Gap Analysis
          </TabsTrigger>
          <TabsTrigger value="project-match" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Project Match
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Team Skill Matrix ({filteredMatrix.length} employees)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-3 text-left bg-muted/50 min-w-[200px]">Employee</th>
                      {allSkills.map((skill) => (
                        <th key={skill} className="border p-3 text-center text-sm bg-muted/50 min-w-[120px]">
                          {skill}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatrix.map((row) => (
                      <tr key={row.employee._id} className="hover:bg-muted/20">
                        <td className="border p-3">
                          <div>
                            <div className="font-medium">{row.employee.name}</div>
                            <div className="text-xs text-muted-foreground">{row.employee.position}</div>
                            {row.employee.department && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {row.employee.department}
                              </Badge>
                            )}
                          </div>
                        </td>
                        {allSkills.map((skill) => {
                          const skillData = row.skills.find(s => s.skill === skill);
                          const isEditing = editingCell?.employeeId === row.employee._id && editingCell?.skill === skill;
                          
                          return (
                            <td key={skill} className="border p-2 text-center">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={skillData?.level || 'none'}
                                    onValueChange={(value) => {
                                      if (value && value !== 'none') {
                                        handleSkillUpdate(row.employee._id, skill, value as SkillLevel);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      {skillLevels.map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingCell(null)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div 
                                  className="group cursor-pointer"
                                  onClick={() => setEditingCell({ employeeId: row.employee._id, skill })}
                                >
                                  {skillData?.level ? (
                                    <Badge 
                                      variant="outline" 
                                      className={`${getSkillLevelColor(skillData.level)} text-xs group-hover:opacity-80`}
                                    >
                                      {skillData.level}
                                      <Edit2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Badge>
                                  ) : (
                                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                      <span className="text-xs">None</span>
                                      <Edit2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity inline" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gap-analysis">
          <SkillGapAnalysisView gapAnalysis={gapAnalysis} />
        </TabsContent>

        <TabsContent value="project-match">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Select Project</label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project to analyze skill matching" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => loadProjectSkillMatch(selectedProject)}
                    disabled={!selectedProject || loading}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Match'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {projectMatches.length > 0 && (
              <ProjectSkillMatchView matches={projectMatches} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <SkillAnalyticsCharts distribution={skillDistribution} />
        </TabsContent>
      </Tabs>
    </div>
  );
}