'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const popularPages = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/dashboard/projects', icon: FileQuestion },
    { name: 'Finance', href: '/dashboard/finance', icon: FileQuestion },
    { name: 'Employees', href: '/dashboard/employees', icon: FileQuestion },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary/10 to-primary/5 opacity-30" />
        </div>
      </div>

      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-6">
          <div className="relative">
            <div className="text-9xl font-bold text-primary/20 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <FileQuestion className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground">Page Not Found</h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button asChild className="flex items-center gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Popular Pages */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Popular Pages</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {popularPages.map((page) => (
                  <Button
                    key={page.href}
                    variant="ghost"
                    asChild
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5"
                  >
                    <Link href={page.href}>
                      <page.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{page.name}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a 
              href="mailto:support@rayerp.com" 
              className="text-primary hover:underline font-medium"
            >
              support@rayerp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
