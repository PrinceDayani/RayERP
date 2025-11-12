'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          onClick={() => router.back()} 
          variant="outline" 
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Task</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Task Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Edit className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Task Editor Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              The task editing functionality is currently under development.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
                variant="outline"
              >
                View Task Details
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/tasks')}
              >
                Back to Tasks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}