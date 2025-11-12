"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import { Eye, EyeOff, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

// Extended security settings type with additional properties
interface ExtendedSecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  lastPasswordChange?: Date | string;
  loginAttempts?: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireStrongPassword: boolean;
  passwordHistory: number;
}

const defaultSecuritySettings: ExtendedSecuritySettings = {
  twoFactorEnabled: false,
  sessionTimeout: 30, // 30 minutes default
  maxLoginAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  requireStrongPassword: true,
  passwordHistory: 3, // Remember last 3 passwords
};

// Password strength requirements
const passwordRequirements = [
  { id: 'length', description: 'At least 8 characters', regex: /.{8,}/ },
  { id: 'uppercase', description: 'At least one uppercase letter', regex: /[A-Z]/ },
  { id: 'lowercase', description: 'At least one lowercase letter', regex: /[a-z]/ },
  { id: 'number', description: 'At least one number', regex: /[0-9]/ },
  { id: 'special', description: 'At least one special character', regex: /[^A-Za-z0-9]/ }
];

export default function SecuritySettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 2FA state
  const [showQrCode, setShowQrCode] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // Advanced security state
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    passwordRequirements.forEach(req => {
      if (req.regex.test(newPassword)) {
        strength++;
      }
    });
    
    setPasswordStrength(strength);
  }, [newPassword]);
  
  // Real-time security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useRealTimeSetting('twoFactorEnabled', false);
  const [sessionTimeout, setSessionTimeout] = useRealTimeSetting('sessionTimeout', 30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useRealTimeSetting('maxLoginAttempts', 5);
  const [lockoutDuration, setLockoutDuration] = useRealTimeSetting('lockoutDuration', 30);
  const [requireStrongPassword, setRequireStrongPassword] = useRealTimeSetting('requireStrongPassword', true);
  const [passwordHistory, setPasswordHistory] = useRealTimeSetting('passwordHistory', 3);
  
  // Combine into securitySettings object for compatibility
  const securitySettings = {
    twoFactorEnabled,
    sessionTimeout,
    maxLoginAttempts,
    lockoutDuration,
    requireStrongPassword,
    passwordHistory
  };
  
  // Handle any Date objects that might come from the API
  const [lastPasswordChange, setLastPasswordChange] = useState<Date | string | undefined>();
  
  useEffect(() => {
    if (lastPasswordChange && lastPasswordChange instanceof Date) {
      // Convert Date objects to ISO strings for consistency
      setLastPasswordChange(lastPasswordChange.toISOString());
    }
  }, [lastPasswordChange]);
  
  // Prompt before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  // Handle setting changes with unsaved changes tracking
  const handleToggleTwoFactor = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    if (enabled && !twoFactorEnabled) {
      setShowQrCode(true);
    } else if (!enabled) {
      setShowQrCode(false);
    }
    setHasUnsavedChanges(true);
  };
  
  const updateSettings = (updates: Partial<ExtendedSecuritySettings>) => {
    // This function is kept for compatibility but settings are now handled individually
    setHasUnsavedChanges(true);
  };
  const validatePassword = () => {
    // Clear previous errors
    setPasswordError('');
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return false;
    }
    
    // Check basic length requirement
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    
    // If strong passwords are required, check against requirements
    if (requireStrongPassword && passwordStrength < 4) {
      setPasswordError("Password doesn't meet strength requirements");
      return false;
    }
    
    return true;
  };
  
  const handleSaveSettings = async () => {
    toast({
      title: "Success",
      description: "Security settings are automatically saved",
    });
    setHasUnsavedChanges(false);
  };
  
  const handleVerifyTwoFactor = async () => {
    try {
      setIsLoading(true);
      
      // Call API to verify 2FA code
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          code: twoFactorCode
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to verify 2FA code');
      }
      
      // Hide QR code and clear code
      setShowQrCode(false);
      setTwoFactorCode('');
      
      toast({
        title: "Success",
        description: "Two-factor authentication enabled successfully",
      });
      
      // Save the updated settings
      await handleSaveSettings();
      
    } catch (error) {
      console.error('Failed to verify 2FA code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify 2FA code",
        variant: "destructive",
      });
      
      // Revert 2FA setting since verification failed
      updateSettings({ twoFactorEnabled: false });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      // Call API to change password
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      // Password change successful
      
      // Settings are auto-saved
      
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return 'Never';
    
    return new Date(typeof dateString === 'string' ? dateString : dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Loading security settings...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {hasUnsavedChanges && (
        <Alert className="mb-4 border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="ml-2 text-amber-800">
            You have unsaved changes. Please save your settings before leaving this page.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password strength meter */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Password strength:</span>
                      <span className="text-xs">
                        {passwordStrength === 0 && "Very weak"}
                        {passwordStrength === 1 && "Weak"}
                        {passwordStrength === 2 && "Fair"}
                        {passwordStrength === 3 && "Good"}
                        {passwordStrength === 4 && "Strong"}
                        {passwordStrength === 5 && "Very strong"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          passwordStrength === 0 ? "bg-red-500 w-1/5" : 
                          passwordStrength === 1 ? "bg-orange-500 w-2/5" : 
                          passwordStrength === 2 ? "bg-yellow-500 w-3/5" : 
                          passwordStrength === 3 ? "bg-blue-500 w-4/5" : 
                          "bg-green-500 w-full"
                        }`}
                      ></div>
                    </div>
                    
                    {/* Password requirements */}
                    {requireStrongPassword && (
                      <div className="mt-2 text-xs space-y-1">
                        {passwordRequirements.map(req => (
                          <div key={req.id} className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              req.regex.test(newPassword) ? "bg-green-500" : "bg-gray-300"
                            }`}></div>
                            <span>{req.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                )}
              </div>
              
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Changing Password...
                  </>
                ) : "Change Password"}
              </Button>
            </div>
            

          </div>
        </CardContent>
      </Card>
      
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorEnabled" className="text-base">Enable Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Secure your account with an additional verification step</p>
              </div>
              <Switch
                id="twoFactorEnabled"
                checked={twoFactorEnabled}
                onCheckedChange={handleToggleTwoFactor}
              />
            </div>
            
            {showQrCode && (
              <div className="p-4 bg-muted rounded-md space-y-4">
                <p className="text-sm">
                  Scan this QR code with your authenticator app, then enter the code below to enable two-factor authentication.
                </p>
                <div className="flex justify-center">
                  {/* Placeholder for QR code */}
                  <div className="bg-white p-4 border">
                    <div className="w-32 h-32 grid grid-cols-5 grid-rows-5 gap-1">
                      {Array(25).fill(0).map((_, i) => (
                        <div 
                          key={i} 
                          className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="twoFactorCode"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                    <Button onClick={handleVerifyTwoFactor} disabled={twoFactorCode.length !== 6}>
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {twoFactorEnabled && !showQrCode && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm">
                  Two-factor authentication is enabled. You'll need to enter a verification code
                  from your authenticator app each time you sign in.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    Show recovery codes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowQrCode(true)}>
                    Reconfigure
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Session Timeout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Session Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <span>{sessionTimeout} minutes</span>
              </div>
              <Slider
                id="sessionTimeout"
                min={5}
                max={120}
                step={5}
                value={[sessionTimeout]}
                onValueChange={(value) => setSessionTimeout(value[0])}
              />
              <p className="text-sm text-muted-foreground">
                Your session will expire after {sessionTimeout} minutes of inactivity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Advanced Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
            <ShieldCheck className="mr-2 h-5 w-5" />
            Advanced Security Settings
            <Button variant="ghost" size="sm" className="ml-2">
              {showAdvanced ? "Hide" : "Show"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <div className="space-y-6">
              {/* Password Requirements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireStrongPassword" className="text-base">Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce complex password requirements
                    </p>
                  </div>
                  <Switch
                    id="requireStrongPassword"
                    checked={requireStrongPassword}
                    onCheckedChange={setRequireStrongPassword}
                  />
                </div>
              </div>
              
              {/* Login Attempts */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                  <span>{maxLoginAttempts} attempts</span>
                </div>
                <Slider
                  id="maxLoginAttempts"
                  min={3}
                  max={10}
                  step={1}
                  value={[maxLoginAttempts]}
                  onValueChange={(value) => setMaxLoginAttempts(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Account will be locked after {maxLoginAttempts} failed login attempts
                </p>
              </div>
              
              {/* Lockout Duration */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="lockoutDuration">Account Lockout Duration</Label>
                  <span>{lockoutDuration} minutes</span>
                </div>
                <Slider
                  id="lockoutDuration"
                  min={5}
                  max={60}
                  step={5}
                  value={[lockoutDuration]}
                  onValueChange={(value) => setLockoutDuration(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Locked accounts will be automatically unlocked after {lockoutDuration} minutes
                </p>
              </div>
              
              {/* Password History */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="passwordHistory">Password History</Label>
                  <span>{passwordHistory} passwords</span>
                </div>
                <Slider
                  id="passwordHistory"
                  min={0}
                  max={10}
                  step={1}
                  value={[passwordHistory]}
                  onValueChange={(value) => setPasswordHistory(value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  {passwordHistory === 0
                    ? "Password history tracking is disabled"
                    : `Cannot reuse the last ${passwordHistory} passwords`}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving || !hasUnsavedChanges}
          size="lg"
        >
          {isSaving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving...
            </>
          ) : "Save Security Settings"}
        </Button>
      </div>
    </div>
  );
}