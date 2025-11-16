'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Shield, Zap, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push(user ? '/dashboard' : '/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl">
            <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary/10 to-primary/5 opacity-30" />
          </div>
        </div>

        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  RayERP
                </h1>
                <p className="text-muted-foreground text-lg">Enterprise Resource Planning</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          <div className="space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animate-reverse mx-auto"></div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">
                {loading ? 'Initializing RayERP...' : 'Redirecting...'}
              </p>
              <p className="text-muted-foreground">
                {user ? 'Taking you to your dashboard' : 'Please sign in to continue'}
              </p>
            </div>

            {/* Feature highlights while loading */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 opacity-60">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium">HR Management</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium">Finance & Accounting</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium">Project Management</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-sm font-medium">Security & Compliance</p>
              </div>
            </div>
          </div>

          {/* Fallback actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/login')}
              className="flex items-center gap-2"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/signup')}
              className="flex items-center gap-2"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // This should not render as we redirect immediately
  return null;
}