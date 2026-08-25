'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, RotateCw } from 'lucide-react';

/**
 * Boundary for every page under /dashboard. Without it a single component
 * throwing takes down the whole application shell and shows Next's blank
 * global-error screen, which hides the message that would explain the failure.
 */
export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Dashboard page error:', error);
  }, [error]);

  return (
    <div className="flex-1 p-6">
      <Card className="mx-auto max-w-2xl border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            This page hit an error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The rest of the application is still working. You can retry this page or go back.
          </p>

          {error.message && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Error</p>
              <p className="overflow-x-auto rounded bg-red-50 p-2 font-mono text-xs text-red-600 dark:bg-red-950/40">
                {error.message}
              </p>
            </div>
          )}

          {/* The digest is the only handle on the server-side stack in a
              production build, so it must be visible to report a bug. */}
          {error.digest && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Reference</p>
              <p className="rounded bg-muted p-2 font-mono text-xs">{error.digest}</p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="rounded border border-slate-200 p-2 dark:border-slate-700">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Stack trace
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={reset} className="gap-2">
              <RotateCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
