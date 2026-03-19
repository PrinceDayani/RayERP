'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary/10 to-primary/5 opacity-30" />
        </div>
      </div>

      <div className="text-center space-y-8 max-w-md mx-auto">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center space-x-6">
            <div className="h-32 w-32 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-primary/10 p-4 border border-white/20">
              <Image src="/RAYlogo.webp" alt="RayERP Logo" width={96} height={96} className="object-contain" priority />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                RayERP
              </h1>
              <p className="text-muted-foreground text-xl mt-1">Enterprise Resource Planning</p>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <LoadingSpinner
          size="xl"
          text="Loading RayERP..."
          variant="default"
        />

        {/* Loading Messages */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground animate-pulse">
            Initializing your workspace...
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"
            style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}
