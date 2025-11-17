'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
    
    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, Bugsnag, etc.
      // errorTrackingService.captureException(error);
    }
  }, [error]);

  const handleReportError = () => {
    const subject = encodeURIComponent('Application Error Report');
    const body = encodeURIComponent(`
Error Message: ${error.message}
Error Digest: ${error.digest || 'N/A'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${error.stack || 'No stack trace available'}
    `);
    
    window.open(`mailto:support@rayerp.com?subject=${subject}&body=${body}`);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-red-500/10 to-red-500/5 opacity-30" />
        </div>
      </div>

      <Card className="max-w-2xl w-full shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              An unexpected error has occurred. We apologize for the inconvenience.
            </p>
            {error.digest && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-mono">
                <Bug className="w-3 h-3" />
                Error ID: {error.digest}
              </div>
            )}
          </div>

          {/* Error Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-muted/50 p-4 rounded-lg border">
              <summary className="cursor-pointer font-medium text-sm mb-2 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Technical Details (Development Mode)
              </summary>
              <div className="space-y-3 text-xs">
                <div>
                  <strong>Error Message:</strong>
                  <pre className="mt-1 p-2 bg-background rounded text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {error.message}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-xs whitespace-pre-wrap overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={reset} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              className="w-full"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            
            <Button 
              onClick={handleReportError} 
              className="w-full"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Report Error
            </Button>
          </div>

          {/* Help Information */}
          <div className="text-center text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="font-medium">Need immediate assistance?</p>
            <p>
              Contact our support team at{' '}
              <a 
                href="mailto:support@rayerp.com" 
                className="text-primary hover:underline font-medium"
              >
                support@rayerp.com
              </a>
              {error.digest && ` and include Error ID: ${error.digest}`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}