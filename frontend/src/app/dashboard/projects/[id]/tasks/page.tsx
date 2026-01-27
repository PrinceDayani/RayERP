"use client";

import { useParams } from "next/navigation";
import TaskManagement from "@/components/projects/TaskManagement";

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.id as string;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Tasks</h1>
      </div>
      <TaskManagement projectId={projectId} showProjectTasks={true} />
    </div>
  );
}
