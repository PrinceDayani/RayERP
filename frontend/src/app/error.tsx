'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RotateCw } from 'lucide-react';

/**
 * Catches errors on routes outside /dashboard (login, signup, shared files).
 * The dashboard has its own boundary; this one is the last stop before Next's
 * blank global-error screen.
 */
export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This page could not be displayed. Try again, or return to the dashboard.
          </p>

          {error.message && (
            <p className="overflow-x-auto rounded bg-red-50 p-2 font-mono text-xs text-red-600 dark:bg-red-950/40">
              {error.message}
            </p>
          )}

          {error.digest && (
            <p className="rounded bg-muted p-2 font-mono text-xs">Reference: {error.digest}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={reset} className="gap-2">
              <RotateCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href="/dashboard">
                <Home className="h-4 w-4" />
                Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
