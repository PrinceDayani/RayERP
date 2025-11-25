"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Calendar, 
  Users, 
  Target, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Trash2,
  Briefcase,
  TrendingUp
} from "lucide-react";

interface Project {
  _id?: string;
  name: string;
  description: string;
  role: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  technologies: string[];
  teamSize: number;
  achievements: string[];
  challenges: string[];
  clientName?: string;
  projectValue?: number;
  completionPercentage: number;
}

interface ProjectHistoryProps {
  employeeId: string;
  projects: Project[];
  onProjectsUpdate: (projects: Project[]) => void;
  editable?: boolean;
}

const projectStatuses = [
  { value: 'active', label: 'Active', color: 'bg-blue-500', icon: Clock },
  { value: 'completed', label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  { value: 'on-hold', label: 'On Hold', color: 'bg-yellow-500', icon: AlertCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle }
];

export default function ProjectHistory({ employeeId, projects, onProjectsUpdate, editable = false }: ProjectHistoryProps) {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<Project>({
    name: '',
    description: '',
    role: '',
    startDate: '',
    endDate: '',
    status: 'active',
    technologies: [],
    teamSize: 1,
    achievements: [],
    challenges: [],
    clientName: '',
    projectValue: 0,
    completionPercentage: 0
  });

  const getStatusInfo = (status: string) => {
    return projectStatuses.find(s => s.value === status) || projectStatuses[0];
  };

  const getProjectDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const handleAddProject = () => {
    const newProject = {
      ...projectForm,
      technologies: projectForm.technologies.filter(tech => tech.trim()),
      achievements: projectForm.achievements.filter(ach => ach.trim()),
      challenges: projectForm.challenges.filter(ch => ch.trim())
    };
    onProjectsUpdate([...projects, newProject]);
    resetForm();
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm(project);
    setIsAddProjectOpen(true);
  };

  const handleUpdateProject = () => {
    const updatedProjects = projects.map(project => 
      project._id === editingProject?._id ? projectForm : project
    );
    onProjectsUpdate(updatedProjects);
    resetForm();
  };

  const handleDeleteProject = (projectToDelete: Project) => {
    const updatedProjects = projects.filter(project => project._id !== projectToDelete._id);
    onProjectsUpdate(updatedProjects);
  };

  const resetForm = () => {
    setProjectForm({
      name: '',
      description: '',
      role: '',
      startDate: '',
      endDate: '',
      status: 'active',
      technologies: [],
      teamSize: 1,
      achievements: [],
      challenges: [],
      clientName: '',
      projectValue: 0,
      completionPercentage: 0
    });
    setEditingProject(null);
    setIsAddProjectOpen(false);
  };

  const getProjectStats = () => {
    const completed = projects.filter(p => p.status === 'completed').length;
    const active = projects.filter(p => p.status === 'active').length;
    const totalValue = projects.reduce((sum, p) => sum + (p.projectValue || 0), 0);
    const avgCompletion = projects.length > 0 
      ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length 
      : 0;

    return { completed, active, totalValue, avgCompletion };
  };

  const stats = getProjectStats();

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Project History
            </CardTitle>
            {editable && (
              <Button onClick={() => setIsAddProjectOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{Math.round(stats.avgCompletion)}%</div>
              <div className="text-sm text-muted-foreground">Avg Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking project history and achievements</p>
              {editable && (
                <Button onClick={() => setIsAddProjectOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          projects.map((project, index) => {
            const statusInfo = getStatusInfo(project.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{project.name}</h3>
                        <Badge className={`${statusInfo.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{project.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Role:</span>
                          <span>{project.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Duration:</span>
                          <span>{getProjectDuration(project.startDate, project.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Team Size:</span>
                          <span>{project.teamSize} members</span>
                        </div>
                      </div>

                      {project.clientName && (
                        <div className="mb-3">
                          <span className="text-sm font-medium">Client: </span>
                          <span className="text-sm">{project.clientName}</span>
                        </div>
                      )}

                      {project.completionPercentage > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">{project.completionPercentage}%</span>
                          </div>
                          <Progress value={project.completionPercentage} className="h-2" />
                        </div>
                      )}

                      {project.technologies.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Technologies Used</h4>
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech, techIndex) => (
                              <Badge key={techIndex} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {project.achievements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            Key Achievements
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {project.achievements.map((achievement, achIndex) => (
                              <li key={achIndex} className="text-sm text-muted-foreground">
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {project.challenges.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                            Challenges Overcome
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {project.challenges.map((challenge, chIndex) => (
                              <li key={chIndex} className="text-sm text-muted-foreground">
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {editable && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g., E-commerce Platform"
                />
              </div>
              <div>
                <Label>Your Role</Label>
                <Input
                  value={projectForm.role}
                  onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                  placeholder="e.g., Lead Developer, Project Manager"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={projectForm.status} 
                  onValueChange={(value) => setProjectForm({ ...projectForm, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Team Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={projectForm.teamSize}
                  onChange={(e) => setProjectForm({ ...projectForm, teamSize: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Client Name (Optional)</Label>
                <Input
                  value={projectForm.clientName}
                  onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                  placeholder="Client or company name"
                />
              </div>
              <div>
                <Label>Completion %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={projectForm.completionPercentage}
                  onChange={(e) => setProjectForm({ ...projectForm, completionPercentage: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Technologies Used (comma-separated)</Label>
              <Input
                value={projectForm.technologies.join(', ')}
                onChange={(e) => setProjectForm({ 
                  ...projectForm, 
                  technologies: e.target.value.split(',').map(tech => tech.trim()).filter(tech => tech)
                })}
                placeholder="e.g., React, Node.js, MongoDB"
              />
            </div>

            <div>
              <Label>Key Achievements (one per line)</Label>
              <Textarea
                value={projectForm.achievements.join('\n')}
                onChange={(e) => setProjectForm({ 
                  ...projectForm, 
                  achievements: e.target.value.split('\n').filter(ach => ach.trim())
                })}
                placeholder="List your key achievements in this project..."
                rows={3}
              />
            </div>

            <div>
              <Label>Challenges Overcome (one per line)</Label>
              <Textarea
                value={projectForm.challenges.join('\n')}
                onChange={(e) => setProjectForm({ 
                  ...projectForm, 
                  challenges: e.target.value.split('\n').filter(ch => ch.trim())
                })}
                placeholder="List challenges you overcame..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={editingProject ? handleUpdateProject : handleAddProject}>
              {editingProject ? 'Update' : 'Add'} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}