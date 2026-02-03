'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { fetchWithRetry } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const fetchCsrfToken = async (): Promise<string> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csrf/token`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.csrfToken;
};

const validatePassword = (password: string): { valid: boolean; message: string; strength: number } => {
  const trimmed = password.trim();
  if (trimmed.length < 8) return { valid: false, message: 'Password must be at least 8 characters', strength: 0 };
  if (trimmed.length > 128) return { valid: false, message: 'Password too long (max 128 characters)', strength: 0 };
  
  let strength = 0;
  if (/[a-z]/.test(trimmed)) strength++;
  if (/[A-Z]/.test(trimmed)) strength++;
  if (/[0-9]/.test(trimmed)) strength++;
  if (/[^a-zA-Z0-9]/.test(trimmed)) strength++;
  
  if (strength < 3) return { valid: false, message: 'Password must contain uppercase, lowercase, and numbers', strength };
  return { valid: true, message: 'Strong password', strength };
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"']/g, '');
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchCsrfToken().then(setCsrfToken).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const currentPassword = sanitizeInput(formData.currentPassword);
    const newPassword = sanitizeInput(formData.newPassword);
    const confirmPassword = sanitizeInput(formData.confirmPassword);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please login again.');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithRetry(
        () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        }),
        { maxAttempts: 3, delayMs: 1000 }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => router.push('/login'), 1500);
          return;
        }
        throw new Error(sanitizeInput(data.message || 'Failed to change password'));
      }

      setSuccess('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
      
      setTimeout(() => {
        router.push('/dashboard/settings');
      }, 2000);
    } catch (err: any) {
      setError(sanitizeInput(err.message || 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#970E2C]/10 via-[#CD2E4F]/10 to-[#E04D68]/10 rounded-3xl blur-3xl"></div>
            <Card className="relative border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#970E2C] to-[#CD2E4F] rounded-2xl shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#970E2C] to-[#CD2E4F] bg-clip-text text-transparent">
                      Change Password
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#970E2C]" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters including uppercase, lowercase, and numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Success Alert */}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-400 animate-in slide-in-from-top-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="pr-10 bg-white dark:bg-slate-800"
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      const validation = validatePassword(e.target.value);
                      setPasswordStrength(validation.strength);
                    }}
                    className="pr-10 bg-white dark:bg-slate-800"
                    placeholder="Enter your new password"
                    required
                    minLength={8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level
                              ? passwordStrength === 4
                                ? 'bg-green-500'
                                : passwordStrength === 3
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      passwordStrength === 4 ? 'text-green-600 dark:text-green-400' :
                      passwordStrength === 3 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {passwordStrength === 4 && '✓ Strong password'}
                      {passwordStrength === 3 && '○ Good password - consider adding special characters'}
                      {passwordStrength < 3 && '✕ Weak - must include uppercase, lowercase, and numbers'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pr-10 bg-white dark:bg-slate-800"
                    placeholder="Confirm your new password"
                    required
                    minLength={8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#970E2C] to-[#CD2E4F] hover:from-[#CD2E4F] hover:to-[#E04D68] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-6 border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#970E2C]" />
              Password Security Tips
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#970E2C] mt-0.5">•</span>
                <span>Use a unique password that you don't use for other accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#970E2C] mt-0.5">•</span>
                <span>Include a mix of uppercase, lowercase, numbers, and special characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#970E2C] mt-0.5">•</span>
                <span>Avoid using personal information like names, birthdays, or common words</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#970E2C] mt-0.5">•</span>
                <span>Consider using a password manager to generate and store strong passwords</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}
