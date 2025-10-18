//path: frontend/src/app/dashboard/projects/reports/page.tsx
"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProjectReports from "@/components/projects/ProjectReports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ProjectReportsPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
        <div className="flex h-screen items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Access Required</h2>
              <p className="text-muted-foreground mb-4">Please log in to access Project Reports</p>
              <Button onClick={() => router.push("/login")}>Login</Button>
            </CardContent>
          </Card>
        </div>
    
    );
  }

  return (
      <div className="flex-1 space-y-6 p-6">
        <ProjectReports />
      </div>
  );
};

export default ProjectReportsPage;