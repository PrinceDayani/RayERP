"use client";

import { useParams } from "next/navigation";
import ProjectActivity from "@/components/projects/ProjectActivity";

export default function ProjectActivityPage() {
  const params = useParams();
  const projectId = params?.id as string;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Activity</h1>
      </div>
      <ProjectActivity projectId={projectId} />
    </div>
  );
}
