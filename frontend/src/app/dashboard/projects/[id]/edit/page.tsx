"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getProjectById, updateProject, type Project } from "@/lib/api/projectsAPI";
import { toast } from "@/components/ui/use-toast";
import ProjectForm from "@/components/projects/ProjectForm";

const EditProjectPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
    }
  }, [isAuthenticated, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (formData: any) => {
    try {
      setUpdating(true);
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget || 0,
        progress: formData.progress || 0,
        client: formData.client,
        manager: formData.manager,
        team: formData.team || [],
        tags: formData.tags || [],
      };
      
      const updatedProject = await updateProject(projectId, updateData);
      setProject(updatedProject);
      
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  if (!isAuthenticated) {
    return (
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-4">Please log in to edit projects</p>
              <Button onClick={() => router.push("/login")}>Login</Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="flex justify-center p-8">Loading project details...</div>
    );
  }

  if (!project) {
    return (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
    );
  }

  return (
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground">Update project details and settings</p>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              project={{
                name: project.name,
                description: project.description,
                status: project.status,
                priority: project.priority,
                budget: project.budget,
                progress: project.progress,
                startDate: project.startDate,
                endDate: project.endDate,
                client: project.client,
                manager: project.manager,
                team: project.team,
                tags: project.tags,
              }}
              onSubmit={handleUpdateProject}
              onCancel={handleCancel}
              loading={updating}
              submitText="Update Project"
            />
          </CardContent>
        </Card>
      </div>
  );
};

export default EditProjectPage;