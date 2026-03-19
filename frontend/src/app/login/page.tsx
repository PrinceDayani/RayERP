"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, ArrowLeft, CheckCircle, AlertCircle, Mail, Lock, Zap, Shield, BarChart3 } from "lucide-react";

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for registration success
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error("Login form error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: "Real-time Analytics & Insights" },
    { icon: Shield, text: "Enterprise-grade Security" },
    { icon: BarChart3, text: "Complete Business Management" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ─── Brand Panel (Left) ─── */}
      <div className="relative hidden lg:flex lg:w-[48%] auth-gradient-bg items-center justify-center overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-white/10 blur-2xl" style={{ animation: 'auth-float 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-white/10 blur-2xl" style={{ animation: 'auth-float 10s ease-in-out infinite 2s' }} />
          <div className="absolute top-[50%] left-[60%] w-32 h-32 rounded-full bg-white/5 blur-xl" style={{ animation: 'auth-float 7s ease-in-out infinite 4s' }} />
          <div className="absolute top-[70%] left-[20%] w-20 h-20 rounded-full bg-white/10 blur-lg" style={{ animation: 'auth-float 9s ease-in-out infinite 1s' }} />
          <div className="absolute top-[10%] right-[30%] w-24 h-24 rounded-full bg-white/5 blur-xl" style={{ animation: 'auth-float 11s ease-in-out infinite 3s' }} />
        </div>

        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />

        {/* Brand Content */}
        <div className="relative z-10 max-w-md px-8 text-white">
          <div className="flex items-center gap-3 mb-8" style={{ animation: 'auth-fade-in-up 0.6s ease-out both' }}>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-white/20 p-2.5 shadow-xl">
              <Image src="/RAYlogo.webp" alt="RayERP Logo" width={64} height={64} className="object-contain" priority />
            </div>
            <span className="text-2xl font-bold tracking-tight">RayERP</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ animation: 'auth-fade-in-up 0.6s ease-out 0.1s both' }}>
            Streamline Your <br />
            <span className="text-white/80">Business Operations</span>
          </h1>

          <p className="text-lg text-white/70 mb-10 leading-relaxed" style={{ animation: 'auth-fade-in-up 0.6s ease-out 0.2s both' }}>
            Manage your entire organization with one powerful, integrated platform.
          </p>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                style={{ animation: `auth-fade-in-up 0.6s ease-out ${0.3 + i * 0.1}s both` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-5 w-5 text-white/90" />
                </div>
                <span className="text-sm font-medium text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Form Panel (Right) ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-background p-4 sm:p-8 overflow-hidden">
        {/* Mobile ambient background */}
        <div className="absolute inset-0 z-0 lg:hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-50" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl opacity-50" />
        </div>


        {/* Top navigation */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-muted-foreground lg:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
          <ThemeToggle />
        </div>

        {/* Form container */}
        <div className="w-full max-w-[420px] relative z-10 pt-16 sm:pt-0">
          {/* Success Message */}
          {showSuccess && (
            <Alert className="mb-6 border-green-300/50 bg-green-50/80 dark:bg-green-950/30 dark:border-green-800/50 backdrop-blur-sm" style={{ animation: 'auth-fade-in-up 0.4s ease-out' }}>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Account created successfully! Please sign in with your credentials.
              </AlertDescription>
            </Alert>
          )}

          {/* Glassmorphic Card */}
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl shadow-primary/5 p-6 sm:p-8 dark:bg-black/40 dark:border-white/10 dark:shadow-white/5" style={{ animation: 'auth-fade-in-up 0.5s ease-out' }}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-xl shadow-primary/10 mb-6 p-3">
                <Image src="/RAYlogo.webp" alt="RayERP Logo" width={72} height={72} className="object-contain" priority />
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.1s both' }}>
                Welcome Back
              </h2>
              <p className="text-muted-foreground mt-2 text-sm" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.15s both' }}>
                Sign in to your RayERP account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.2s both' }}>
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-muted/30 border-border/50 text-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-white/10"
                />
              </div>

              <div className="space-y-2" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.25s both' }}>
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl bg-muted/30 border-border/50 pr-11 text-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-white/10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.3s both' }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-1.5 pt-1">
                        <span className="auth-loading-dot"></span>
                        <span className="auth-loading-dot"></span>
                        <span className="auth-loading-dot"></span>
                      </div>
                      <span className="ml-1">Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-7" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.35s both' }}>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/70 dark:bg-black/40 backdrop-blur-sm px-3 text-muted-foreground dark:text-white/60 font-medium">New to RayERP?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.4s both' }}>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-base border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 dark:border-white/10 dark:text-white dark:hover:bg-white/5 dark:hover:border-white/20"
                onClick={() => router.push("/signup")}
                disabled={isLoading}
              >
                Create Account
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.5s both' }}>
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} RayERP. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
