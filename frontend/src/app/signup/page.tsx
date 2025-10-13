'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Eye, EyeOff, UserPlus, Building2, Shield } from 'lucide-react';

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

  // Check if this is the initial setup
  useEffect(() => {
    const checkInitialSetup = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/initial-setup`);
        const data = await response.json();
        setIsInitialSetup(data.isInitialSetup);
      } catch (err) {
        console.error("Error checking initial setup:", err);
        // Default to false if there's an error
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use the AuthContext register function
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

  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Signup Card */}
      <div className="w-full max-w-md">
        <div className="bg-theme-secondary border border-border rounded-lg shadow-theme-medium p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                {isInitialSetup ? (
                  <Shield className="h-8 w-8 text-primary" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-theme-heading mb-2">
              {isInitialSetup ? 'Create Admin Account' : 'Create Account'}
            </h1>
            <p className="text-theme-secondary text-sm">
              {isInitialSetup 
                ? 'Set up your RestlessERP system administrator account'
                : 'Join RestlessERP and start managing your business'
              }
            </p>
          </div>

          {/* Initial Setup Notice */}
          {isInitialSetup && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-md">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-theme-primary text-sm">Initial System Setup</p>
                  <p className="text-theme-secondary text-xs mt-1">
                    This account will have root access to configure and manage the entire system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-3 bg-theme-danger border border-destructive/20 rounded-md">
              <p className="text-theme-danger text-sm text-center">{error || authError}</p>
            </div>
          )}
        
          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-theme-primary text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-theme-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || authLoading}
              />
            </div>
            
            <div>
              <label className="block text-theme-primary text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-theme-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || authLoading}
              />
            </div>
            
            <div>
              <label className="block text-theme-primary text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-md text-theme-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading || authLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-theme-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || authLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-theme-primary text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-md text-theme-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || authLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-theme-primary transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading || authLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading || authLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading || authLoading 
                ? 'Creating account...' 
                : isInitialSetup 
                  ? 'Create Admin Account' 
                  : 'Create Account'}
            </button>
          </form>
          
          {/* Login Link */}
          {!isInitialSetup && (
            <div className="mt-6 text-center">
              <p className="text-theme-secondary text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors focus:outline-none focus:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* Initial Setup Info */}
          {isInitialSetup && (
            <div className="mt-6 p-4 bg-muted/50 rounded-md">
              <h4 className="text-theme-primary text-sm font-medium mb-2">Admin Account Privileges:</h4>
              <ul className="text-theme-secondary text-xs space-y-1">
                <li>• Create and manage user accounts</li>
                <li>• Configure system-wide settings</li>
                <li>• Access all application features</li>
                <li>• Manage roles and permissions</li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-theme-secondary text-xs">
            © 2024 RestlessERP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}