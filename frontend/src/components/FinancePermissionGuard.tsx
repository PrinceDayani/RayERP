'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinancePermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export default function FinancePermissionGuard({ 
  children, 
  requiredPermission 
}: FinancePermissionGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Root has access to everything
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name || '';
  const isRoot = roleName.toLowerCase() === 'root';
  
  // Check if user has finance module access
  const hasFinanceAccess = isRoot || hasAnyPermission(['finance.view', 'finance.manage']);
  
  // Check specific permission if provided
  const hasSpecificPermission = requiredPermission 
    ? hasPermission(requiredPermission) 
    : true;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return null;
  }

  // Check finance module access
  if (!hasFinanceAccess) {
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
                Finance Access Required
              </h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access the Finance module. 
                Please contact your administrator to request access.
              </p>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium text-foreground mb-1">Required Permissions:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• finance.view (View finance data)</li>
                  <li>• finance.manage (Manage finance operations)</li>
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

  // Check specific permission if required
  if (requiredPermission && !isRoot && !hasSpecificPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <Card className="max-w-md w-full border-yellow-500/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-yellow-500/10 rounded-full">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Insufficient Permissions
              </h2>
              <p className="text-muted-foreground mb-4">
                You have access to the Finance module, but this specific action requires additional permissions.
              </p>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium text-foreground mb-1">Required Permission:</p>
                <p className="text-muted-foreground">• {requiredPermission}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/finance')}
                className="flex-1"
              >
                Finance Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required permissions
  return <>{children}</>;
}
