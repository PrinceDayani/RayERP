"use client";

import { useParams } from "next/navigation";
import ProjectFiles from "@/components/projects/ProjectFiles";

export default function ProjectFilesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Files</h1>
      </div>
      <ProjectFiles projectId={projectId} />
    </div>
  );
}
