"use client";

import { useParams } from "next/navigation";
import ProjectPermissionsManager from "@/components/projects/ProjectPermissionsManager";

export default function ProjectPermissionsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Permissions</h1>
      </div>
      <ProjectPermissionsManager projectId={projectId} employees={[]} selectedTeam={[]} />
    </div>
  );
}
