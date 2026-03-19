"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  EyeOff,
  UserPlus,
  Building2,
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Lock,
  User,
  Mail,
  Layers,
  Users,
  Settings
} from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const { register, error: authError, isLoading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check if this is the initial setup
  useEffect(() => {
    const checkInitialSetup = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/initial-setup`);
        const data = await response.json();
        setIsInitialSetup(data.isInitialSetup);
      } catch (err) {
        console.error("Error checking initial setup:", err);
        setIsInitialSetup(false);
      }
    };

    checkInitialSetup();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Very Weak';
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await register(name, email, password);

      if (success) {
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || authError || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Layers, text: "Integrated Modules for Every Department" },
    { icon: Users, text: "Role-based Access Control" },
    { icon: Settings, text: "Fully Configurable Workflows" },
  ];

  const isSubmitting = loading || authLoading;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ─── Brand Panel (Left) ─── */}
      <div className="relative hidden lg:flex lg:w-[48%] auth-gradient-bg items-center justify-center overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[12%] left-[8%] w-56 h-56 rounded-full bg-white/10 blur-2xl" style={{ animation: 'auth-float 9s ease-in-out infinite' }} />
          <div className="absolute bottom-[18%] right-[12%] w-44 h-44 rounded-full bg-white/10 blur-2xl" style={{ animation: 'auth-float 11s ease-in-out infinite 1.5s' }} />
          <div className="absolute top-[55%] left-[55%] w-36 h-36 rounded-full bg-white/5 blur-xl" style={{ animation: 'auth-float 8s ease-in-out infinite 3s' }} />
          <div className="absolute top-[75%] left-[25%] w-24 h-24 rounded-full bg-white/10 blur-lg" style={{ animation: 'auth-float 10s ease-in-out infinite 2s' }} />
          <div className="absolute top-[8%] right-[25%] w-28 h-28 rounded-full bg-white/5 blur-xl" style={{ animation: 'auth-float 12s ease-in-out infinite 4s' }} />
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
            Start Your <br />
            <span className="text-white/80">Journey Today</span>
          </h1>

          <p className="text-lg text-white/70 mb-10 leading-relaxed" style={{ animation: 'auth-fade-in-up 0.6s ease-out 0.2s both' }}>
            Join thousands of businesses already transforming their operations with RayERP.
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
          {/* Glassmorphic Card */}
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl shadow-primary/5 p-6 sm:p-8 dark:bg-black/40 dark:border-white/10 dark:shadow-white/5" style={{ animation: 'auth-fade-in-up 0.5s ease-out' }}>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-xl shadow-primary/10 mb-6 p-3">
                {isInitialSetup ? (
                  <Shield className="h-10 w-10 text-primary" />
                ) : (
                  <Image src="/RAYlogo.webp" alt="RayERP Logo" width={72} height={72} className="object-contain" priority />
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.1s both' }}>
                {isInitialSetup ? 'Create Admin Account' : 'Create Account'}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.15s both' }}>
                {isInitialSetup
                  ? 'Set up your RayERP system administrator account'
                  : 'Join RayERP and start managing your business'
                }
              </p>
            </div>

            {/* Initial Setup Notice */}
            {isInitialSetup && (
              <Alert className="mb-5 border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-xl">
                <Shield className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-primary text-sm">Initial System Setup</p>
                    <p className="text-xs text-muted-foreground">
                      This account will have root access to configure and manage the entire system.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {(error || authError) && (
              <Alert variant="destructive" className="mb-5 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || authError}</AlertDescription>
              </Alert>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.2s both' }}>
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-12 rounded-xl bg-muted/30 border-border/50 text-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-white/10"
                />
              </div>

              <div className="space-y-2" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.25s both' }}>
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
                  disabled={isSubmitting}
                  className="h-12 rounded-xl bg-muted/30 border-border/50 text-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-white/10"
                />
              </div>

              <div className="space-y-2" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.3s both' }}>
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isSubmitting}
                    className="h-12 rounded-xl bg-muted/30 border-border/50 pr-11 text-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-white/10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {password && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength</span>
                      <span className={`font-medium ${passwordStrength < 50 ? 'text-red-500' :
                        passwordStrength < 75 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.35s both' }}>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-12 rounded-xl bg-muted/30 border-border/50 pr-11 text-sm transition-all duration-300 focus:bg-background focus:shadow-md focus:shadow-primary/10 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:bg-white/10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1 pt-0.5">
                    <CheckCircle className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <div style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.4s both' }} className="pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting || password !== confirmPassword}
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-1.5 pt-1">
                        <span className="auth-loading-dot"></span>
                        <span className="auth-loading-dot"></span>
                        <span className="auth-loading-dot"></span>
                      </div>
                      <span className="ml-1">Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {isInitialSetup ? 'Create Admin Account' : 'Create Account'}
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Login Link */}
            {!isInitialSetup && (
              <>
                <div className="relative my-6" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.45s both' }}>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/70 dark:bg-black/40 backdrop-blur-sm px-3 text-muted-foreground dark:text-white/60 font-medium">Already have an account?</span>
                  </div>
                </div>

                <div style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.5s both' }}>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 dark:border-white/10 dark:text-white dark:hover:bg-white/5 dark:hover:border-white/20"
                    onClick={() => router.push("/login")}
                    disabled={isSubmitting}
                  >
                    Sign In
                  </Button>
                </div>
              </>
            )}

            {/* Initial Setup Info */}
            {isInitialSetup && (
              <div className="mt-5 rounded-xl bg-muted/30 border border-border/40 p-4 dark:bg-white/5 dark:border-white/10" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.45s both' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">Admin Account Privileges</h4>
                </div>
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    Create and manage user accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    Configure system-wide settings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    Access all application features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    Manage roles and permissions
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center" style={{ animation: 'auth-fade-in-up 0.5s ease-out 0.55s both' }}>
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} RayERP. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
