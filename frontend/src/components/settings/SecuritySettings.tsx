"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import securityAPI, {
  type LoginHistoryEntry,
  type PolicyLimits,
  type SecurityPolicy,
  type TwoFactorStatus
} from '@/lib/api/securityAPI';
import { useAuth } from '@/contexts/AuthContext';
import { isSessionExpiredError } from '@/lib/api/api';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  ShieldOff,
  Smartphone
} from 'lucide-react';

const PASSWORD_RULES = [
  { id: 'length', description: 'At least 8 characters', test: /.{8,}/ },
  { id: 'uppercase', description: 'An uppercase letter', test: /[A-Z]/ },
  { id: 'lowercase', description: 'A lowercase letter', test: /[a-z]/ },
  { id: 'number', description: 'A number', test: /[0-9]/ },
  { id: 'special', description: 'A special character', test: /[^A-Za-z0-9]/ }
];

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const STRENGTH_STYLES = [
  'bg-red-500 w-1/5',
  'bg-orange-500 w-2/5',
  'bg-yellow-500 w-3/5',
  'bg-blue-500 w-4/5',
  'bg-green-500 w-full',
  'bg-green-600 w-full'
];

type EnrolStep = 'idle' | 'password' | 'scan' | 'codes';

export default function SecuritySettings() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManagePolicy = hasPermission('settings.edit');

  // These calls opt out of the client's automatic logout so a mistyped password
  // or code cannot sign the user out, which means a genuinely dead session has
  // to be handled here instead.
  const handledSessionExpiry = (error: unknown): boolean => {
    if (!isSessionExpiredError(error)) return false;
    toast.error('Your session expired. Please sign in again.');
    router.push('/login');
    return true;
  };

  /* ---------------- password change ---------------- */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  /* ---------------- two-factor ---------------- */
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [enrolStep, setEnrolStep] = useState<EnrolStep>('idle');
  const [enrolPassword, setEnrolPassword] = useState('');
  const [enrolCode, setEnrolCode] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [disarmPassword, setDisarmPassword] = useState('');
  const [disarmCode, setDisarmCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  /* ---------------- policy + history ---------------- */
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [limits, setLimits] = useState<PolicyLimits>({});
  const [policyDraft, setPolicyDraft] = useState<SecurityPolicy | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);

  const strength = useMemo(
    () => (newPassword ? PASSWORD_RULES.filter(rule => rule.test.test(newPassword)).length : 0),
    [newPassword]
  );

  const loadTwoFactor = useCallback(async () => {
    try {
      setTwoFactor(await securityAPI.getTwoFactorStatus());
    } catch {
      setTwoFactor(null);
    } finally {
      setTwoFactorLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadTwoFactor();
    securityAPI
      .getLoginHistory()
      .then(entries => { if (active) setHistory(entries); })
      .catch(() => { if (active) setHistory([]); });
    return () => { active = false; };
  }, [loadTwoFactor]);

  useEffect(() => {
    if (!canManagePolicy) return;
    securityAPI
      .getSecurityPolicy()
      .then(({ policy: loaded, limits: loadedLimits }) => {
        setPolicy(loaded);
        setPolicyDraft(loaded);
        setLimits(loadedLimits || {});
      })
      .catch(() => setPolicy(null));
  }, [canManagePolicy]);

  /* ---------------- handlers ---------------- */

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Choose a password different from your current one');
      return;
    }

    setChangingPassword(true);
    try {
      await securityAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed');
    } catch (error: any) {
      if (handledSessionExpiry(error)) return;
      // The server owns the policy, so its message is the authoritative one.
      setPasswordError(error?.response?.data?.message || 'Could not change your password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleStartEnrolment = async () => {
    setTwoFactorBusy(true);
    try {
      const { secret, otpauthUrl } = await securityAPI.setupTwoFactor(enrolPassword);
      setManualSecret(secret);
      setQrDataUrl(await QRCode.toDataURL(otpauthUrl, { width: 220, margin: 1 }));
      setEnrolStep('scan');
      setEnrolPassword('');
    } catch (error: any) {
      if (handledSessionExpiry(error)) return;
      toast.error(error?.response?.data?.message || 'Could not start enrolment');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleConfirmEnrolment = async () => {
    setTwoFactorBusy(true);
    try {
      const codes = await securityAPI.enableTwoFactor(enrolCode);
      setRecoveryCodes(codes);
      setEnrolStep('codes');
      setEnrolCode('');
      setManualSecret('');
      setQrDataUrl('');
      await loadTwoFactor();
      toast.success('Two-factor authentication enabled');
    } catch (error: any) {
      if (handledSessionExpiry(error)) return;
      toast.error(error?.response?.data?.message || 'That code was not accepted');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleDisable = async () => {
    setTwoFactorBusy(true);
    try {
      await securityAPI.disableTwoFactor(disarmPassword, disarmCode);
      setDisarmPassword('');
      setDisarmCode('');
      setShowDisable(false);
      await loadTwoFactor();
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      if (handledSessionExpiry(error)) return;
      toast.error(error?.response?.data?.message || 'Could not disable two-factor authentication');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setTwoFactorBusy(true);
    try {
      const codes = await securityAPI.regenerateRecoveryCodes(disarmPassword, disarmCode);
      setRecoveryCodes(codes);
      setEnrolStep('codes');
      setDisarmPassword('');
      setDisarmCode('');
      await loadTwoFactor();
    } catch (error: any) {
      if (handledSessionExpiry(error)) return;
      toast.error(error?.response?.data?.message || 'Could not regenerate recovery codes');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!policyDraft) return;
    setSavingPolicy(true);
    try {
      const saved = await securityAPI.updateSecurityPolicy(policyDraft);
      setPolicy(saved);
      setPolicyDraft(saved);
      toast.success('Security policy updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update the security policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast.success('Recovery codes copied');
    } catch {
      toast.error('Copy failed - select and copy them manually');
    }
  };

  const policyDirty =
    policy && policyDraft && (Object.keys(policyDraft) as Array<keyof SecurityPolicy>).some(
      key => policyDraft[key] !== policy[key]
    );

  const setPolicyField = (key: keyof SecurityPolicy, value: number | boolean) =>
    setPolicyDraft(current => (current ? { ...current, [key]: value } : current));

  return (
    <div className="space-y-8">
      {/* ─── Change password ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            {policy
              ? `Minimum ${policy.minPasswordLength} characters${
                  policy.requireStrongPassword ? ', with mixed case, a number and a symbol' : ''
                }`
              : 'Your organisation password rules are enforced when you save'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {newPassword && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Strength</span>
                  <span>{STRENGTH_LABELS[strength]}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className={`h-1.5 rounded-full transition-all ${STRENGTH_STYLES[strength]}`} />
                </div>
                <div className="space-y-1 pt-1">
                  {PASSWORD_RULES.map(rule => (
                    <div key={rule.id} className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          rule.test.test(newPassword) ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                      <span className="text-muted-foreground">{rule.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="gap-2"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {changingPassword ? 'Changing…' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* ─── Two-factor ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Two-Factor Authentication
            {twoFactor?.enabled && (
              <Badge className="ml-2 bg-green-600 hover:bg-green-600">Enabled</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Require a code from your authenticator app in addition to your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFactorLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking status…
            </div>
          ) : !twoFactor ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Could not read your two-factor status.</AlertDescription>
            </Alert>
          ) : !twoFactor.available ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is not available: the server has no encryption key configured for it.
                Ask an administrator to set <code>TWO_FACTOR_ENCRYPTION_KEY</code>.
              </AlertDescription>
            </Alert>
          ) : enrolStep === 'codes' ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Save these recovery codes somewhere safe. Each works once, and they are the only way in if you
                  lose your device. <strong>They will not be shown again.</strong>
                </AlertDescription>
              </Alert>
              <div
                role="region"
                aria-live="polite"
                aria-label="Recovery codes"
                className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-800/50"
              >
                {recoveryCodes.map(code => (
                  <span key={code}>{code}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyRecoveryCodes} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Codes
                </Button>
                <Button onClick={() => { setEnrolStep('idle'); setRecoveryCodes([]); }} className="gap-2">
                  <Check className="h-4 w-4" />
                  I've Saved Them
                </Button>
              </div>
            </div>
          ) : twoFactor.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Authenticator app</p>
                  <p className="text-xs text-muted-foreground">
                    Enrolled{' '}
                    {twoFactor.enrolledAt ? new Date(twoFactor.enrolledAt).toLocaleDateString() : ''} ·{' '}
                    {twoFactor.recoveryCodesRemaining} recovery code
                    {twoFactor.recoveryCodesRemaining === 1 ? '' : 's'} left
                  </p>
                </div>
                <Switch checked onCheckedChange={() => setShowDisable(true)} />
              </div>

              {twoFactor.recoveryCodesRemaining <= 2 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are running low on recovery codes. Generate a new set below.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-medium">
                  {showDisable ? 'Disable two-factor authentication' : 'Generate new recovery codes'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Confirm with your password and a current code from your authenticator app.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={disarmPassword}
                    onChange={e => setDisarmPassword(e.target.value)}
                  />
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={disarmCode}
                    onChange={e => setDisarmCode(e.target.value.trim())}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {showDisable ? (
                    <>
                      <Button
                        variant="destructive"
                        onClick={handleDisable}
                        disabled={twoFactorBusy || !disarmPassword || disarmCode.length !== 6}
                        className="gap-2"
                      >
                        {twoFactorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                        Disable Two-Factor
                      </Button>
                      <Button variant="ghost" onClick={() => setShowDisable(false)} disabled={twoFactorBusy}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleRegenerateCodes}
                      disabled={twoFactorBusy || !disarmPassword || disarmCode.length !== 6}
                      className="gap-2"
                    >
                      {twoFactorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      Generate New Recovery Codes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : enrolStep === 'scan' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this with Google Authenticator, 1Password, Authy or any TOTP app, then enter the code it
                shows.
              </p>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Two-factor QR code" width={220} height={220} />
                )}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</p>
                  <code className="mt-1 block break-all font-mono text-xs">{manualSecret}</code>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="enrolCode">Verification code</Label>
                  <Input
                    id="enrolCode"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={enrolCode}
                    onChange={e => setEnrolCode(e.target.value.trim())}
                    className="w-40 text-center tracking-[0.3em]"
                  />
                </div>
                <Button
                  onClick={handleConfirmEnrolment}
                  disabled={twoFactorBusy || enrolCode.length !== 6}
                  className="gap-2"
                >
                  {twoFactorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Confirm
                </Button>
                <Button variant="ghost" onClick={() => setEnrolStep('idle')} disabled={twoFactorBusy}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : enrolStep === 'password' ? (
            <div className="space-y-3">
              <Label htmlFor="enrolPassword">Confirm your password to continue</Label>
              <div className="flex flex-wrap gap-3">
                <Input
                  id="enrolPassword"
                  type="password"
                  autoComplete="current-password"
                  value={enrolPassword}
                  onChange={e => setEnrolPassword(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={handleStartEnrolment} disabled={twoFactorBusy || !enrolPassword} className="gap-2">
                  {twoFactorBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                  Continue
                </Button>
                <Button variant="ghost" onClick={() => { setEnrolStep('idle'); setEnrolPassword(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="space-y-1">
                <p className="text-sm font-medium">Authenticator app</p>
                <p className="text-xs text-muted-foreground">
                  Not enabled. Anyone with your password can sign in.
                </p>
              </div>
              <Button onClick={() => setEnrolStep('password')} className="gap-2">
                <Smartphone className="h-4 w-4" />
                Set Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Organisation policy (admins only) ─── */}
      {canManagePolicy && policyDraft && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Organisation Security Policy
            </CardTitle>
            <CardDescription>
              These rules are enforced on the server for every account in the organisation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Minimum password length</Label>
                <Input
                  id="minPasswordLength"
                  type="number"
                  min={limits.minPasswordLength?.min ?? 8}
                  max={limits.minPasswordLength?.max ?? 128}
                  value={policyDraft.minPasswordLength}
                  onChange={e => setPolicyField('minPasswordLength', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordHistoryCount">Passwords remembered</Label>
                <Input
                  id="passwordHistoryCount"
                  type="number"
                  min={limits.passwordHistoryCount?.min ?? 0}
                  max={limits.passwordHistoryCount?.max ?? 24}
                  value={policyDraft.passwordHistoryCount}
                  onChange={e => setPolicyField('passwordHistoryCount', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">0 allows immediate reuse</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Failed attempts before lockout</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min={limits.maxLoginAttempts?.min ?? 0}
                  max={limits.maxLoginAttempts?.max ?? 20}
                  value={policyDraft.maxLoginAttempts}
                  onChange={e => setPolicyField('maxLoginAttempts', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">0 disables lockout</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDurationMinutes">Lockout duration (minutes)</Label>
                <Input
                  id="lockoutDurationMinutes"
                  type="number"
                  min={limits.lockoutDurationMinutes?.min ?? 1}
                  max={limits.lockoutDurationMinutes?.max ?? 1440}
                  value={policyDraft.lockoutDurationMinutes}
                  onChange={e => setPolicyField('lockoutDurationMinutes', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sessionTimeoutMinutes">Idle session timeout (minutes)</Label>
                <Input
                  id="sessionTimeoutMinutes"
                  type="number"
                  min={limits.sessionTimeoutMinutes?.min ?? 0}
                  max={limits.sessionTimeoutMinutes?.max ?? 43200}
                  value={policyDraft.sessionTimeoutMinutes}
                  onChange={e => setPolicyField('sessionTimeoutMinutes', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  0 disables idle expiry. Sessions still expire at the token lifetime regardless.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="space-y-1">
                <Label htmlFor="requireStrongPassword" className="cursor-pointer text-sm font-medium">
                  Require strong passwords
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enforce mixed case, a number and a special character
                </p>
              </div>
              <Switch
                id="requireStrongPassword"
                checked={policyDraft.requireStrongPassword}
                onCheckedChange={checked => setPolicyField('requireStrongPassword', checked)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPolicyDraft(policy)} disabled={!policyDirty || savingPolicy}>
                Discard
              </Button>
              <Button onClick={handleSavePolicy} disabled={!policyDirty || savingPolicy} className="gap-2">
                {savingPolicy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Recent sign-ins ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Sign-Ins
          </CardTitle>
          <CardDescription>The last ten sessions created on your account</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sign-in history recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map(entry => (
                <div
                  key={entry._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">{new Date(entry.timestamp).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.ipAddress}
                      {entry.location ? ` · ${entry.location}` : ''}
                    </p>
                  </div>
                  {entry.success && <Badge variant="outline">Active</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
