import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface Assignment {
  id: string;
  userId: string;
  resourceType: 'project' | 'task' | 'budget' | 'report' | 'document';
  resourceId: string;
  permissions: string[];
  assignedBy: string;
  assignedAt: string;
}

export function useUserAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch user assignments
    const fetchAssignments = async () => {
      try {
        const data = await apiRequest(`/users/${(user as any)._id || (user as any).id}/assignments`);
        setAssignments(data);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  const hasAccess = (resourceType: string, resourceId: string) => {
    return assignments.some(
      assignment => 
        assignment.resourceType === resourceType && 
        assignment.resourceId === resourceId
    );
  };

  const getPermissions = (resourceType: string, resourceId: string) => {
    const assignment = assignments.find(
      a => a.resourceType === resourceType && a.resourceId === resourceId
    );
    return assignment?.permissions || [];
  };

  return {
    assignments,
    loading,
    hasAccess,
    getPermissions
  };
}
