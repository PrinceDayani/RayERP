"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Users } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useUserAssignments } from '@/hooks/useUserAssignments';
import { PermissionGate } from '@/components/PermissionGate';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  dueDate: string;
  assignedMembers: number;
}

export function AssignedProjectList() {
  const { user } = useAuth();
  const { assignments, loading } = useUserAssignments();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user || loading) return;

    // Get project assignments
    const projectAssignments = assignments.filter(a => a.resourceType === 'project');
    
    // Mock project data for demonstration
    const fetchProjects = async () => {
      try {
        const projectData = [
          {
            id: '1',
            name: 'Sample Project',
            description: 'A sample project for demonstration',
            status: 'active',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            assignedMembers: 3
          }
        ];
        setProjects(projectData);
      } catch (error) {
        console.error('Failed to fetch assigned projects:', error);
      }
    };

    // Always show sample data for demonstration
    fetchProjects();
  }, [user, assignments, loading]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No projects assigned to you</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            <CardDescription>{project.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Due: {new Date(project.dueDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                {project.assignedMembers} members
              </div>
              <PermissionGate permission="projects.view">
                <Button className="w-full" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Project
                </Button>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}