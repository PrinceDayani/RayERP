'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModulePermissionGuardProps {
  children: React.ReactNode;
  module: string;
  requiredPermissions: string[];
  moduleName?: string;
}

export default function ModulePermissionGuard({ 
  children, 
  module,
  requiredPermissions,
  moduleName
}: ModulePermissionGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { hasAnyPermission, hasMinimumLevel } = usePermissions();

  // Check if user has required permissions
  const hasAccess = hasMinimumLevel(80) || hasAnyPermission(requiredPermissions);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="max-w-md w-full border-destructive/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <Shield className="w-12 h-12 text-destructive" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {moduleName || module} Access Required
              </h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access this module. 
                Please contact your administrator to request access.
              </p>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium text-foreground mb-1">Required Permissions (any):</p>
                <ul className="text-muted-foreground space-y-1">
                  {requiredPermissions.map(perm => (
                    <li key={perm}>• {perm}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
