'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Shield, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole = [], 
  requiredPermissions = [],
  fallbackPath = '/login'
}: ProtectedRouteProps) => {
  const { loading, isAuthenticated, user, checkAuth } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (!loading && !isAuthenticated) {
          const authenticated = await checkAuth();
          if (!authenticated) {
            setAuthError('Authentication required');
            router.push(fallbackPath);
            return;
          }
        }

        // Check role-based access
        if (isAuthenticated && user && requiredRole.length > 0) {
          const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
          if (!requiredRole.includes(userRole?.toLowerCase() || '')) {
            setAuthError('Insufficient permissions');
            return;
          }
        }

        // Check permission-based access
        if (isAuthenticated && user && requiredPermissions.length > 0) {
          const hasPermission = requiredPermissions.some(permission => {
            // Root bypasses all permission checks
            if (user.role?.name === 'Root') return true;
            
            // Check for wildcard permission
            if (user.role?.permissions?.includes('*')) return true;
            
            // Check user permissions
            const userPermissions = user.permissions || user.role?.permissions || [];
            return userPermissions.includes(permission);
          });
          
          if (!hasPermission) {
            setAuthError('Required permissions not found');
            return;
          }
        }

        setAuthError(null);
      } catch (error) {
        console.error('Auth verification error:', error);
        setAuthError('Authentication verification failed');
      }
    };

    verifyAuth();
  }, [isAuthenticated, loading, router, checkAuth, user, requiredRole, requiredPermissions, fallbackPath]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await checkAuth();
      setAuthError(null);
    } catch (error) {
      console.error('Retry failed:', error);
      setAuthError('Retry failed. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animate-reverse mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Verifying Access</h3>
            <p className="text-sm text-muted-foreground">Please wait while we authenticate your session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto">
              {authError.includes('permission') ? (
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground">{authError}</p>
              
              {requiredRole.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Required role: {requiredRole.join(', ')}
                </p>
              )}
              
              {requiredPermissions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Required permissions: {requiredPermissions.join(', ')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {retryCount < 3 && (
                <Button 
                  onClick={handleRetry} 
                  disabled={isRetrying}
                  className="w-full"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Sign In Again
              </Button>
            </div>

            {retryCount >= 3 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p>If you continue to experience issues, please contact your system administrator.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render children if authenticated and authorized
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
