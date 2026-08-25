// frontend/src/components/settings/ProfileSettings.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import toast from 'react-hot-toast';
import api from '@/lib/api/api';
import { AlertCircle, Loader2, Save, Upload } from 'lucide-react';

const BIO_MAX_LENGTH = 500;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Mirrors the backend's accepted phone shape so the user is told before the
// request goes out rather than after a 400.
const PHONE_PATTERN = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

interface ProfileForm {
  name: string;
  phone: string;
  bio: string;
  timezone: string;
}

const EMPTY_FORM: ProfileForm = { name: '', phone: '', bio: '', timezone: '' };

/** Uploads are served from the backend origin, so relative paths need prefixing. */
const resolveAssetUrl = (url?: string) => {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;
};

/** Established initials pattern: first letter of the first two name parts. */
const initialsOf = (name: string) =>
  (name || '')
    .split(' ')
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

export default function ProfileSettings() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<ProfileForm>(EMPTY_FORM);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [hasEmployeeRecord, setHasEmployeeRecord] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoadError(null);
      const { data } = await api.get('/users/profile/complete');

      const employee = data?.employee ?? data?.data?.employee ?? null;
      const user = data?.user ?? data?.data?.user ?? data;

      const loaded: ProfileForm = {
        name: user?.name || '',
        phone: employee?.phone || '',
        bio: employee?.bio || '',
        timezone: employee?.timezone || ''
      };

      setForm(loaded);
      setBaseline(loaded);
      setEmail(user?.email || '');
      setRole(user?.role?.name || user?.role || '');
      setAvatarUrl(resolveAssetUrl(employee?.avatarUrl));
      setHasEmployeeRecord(Boolean(employee));
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.message || 'Could not load your profile. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isDirty = useMemo(
    () => (Object.keys(form) as Array<keyof ProfileForm>).some(key => form[key] !== baseline[key]),
    [form, baseline]
  );

  const setField = (key: keyof ProfileForm) => (value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    setFieldErrors(current => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof ProfileForm, string>> = {};

    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length > 50) {
      errors.name = 'Name cannot be more than 50 characters';
    }

    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      errors.phone = 'Enter a valid phone number';
    }

    if (form.bio.length > BIO_MAX_LENGTH) {
      errors.bio = `Bio must be ${BIO_MAX_LENGTH} characters or less`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Only send what changed; the endpoint treats every field as optional.
      const changes: Record<string, string> = {};
      (Object.keys(form) as Array<keyof ProfileForm>).forEach(key => {
        if (form[key] !== baseline[key]) changes[key] = form[key];
      });

      await api.put('/users/profile', changes);

      setBaseline(form);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so re-picking the same file fires change again.
    event.target.value = '';
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Choose a JPEG, PNG, WebP or GIF image');
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const { data } = await api.post('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(resolveAssetUrl(data?.avatarUrl));
      toast.success('Photo updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not upload your photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="flex items-center gap-6 rounded-2xl bg-slate-100 p-6 dark:bg-slate-800">
          <div className="h-28 w-28 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-11 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-11 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={loadProfile}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Identity header */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-[#970E2C]/5 to-[#CD2E4F]/5 p-6 dark:border-slate-700 sm:flex-row">
        <Avatar className="h-28 w-28 shadow-xl ring-4 ring-white dark:ring-slate-800">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={form.name} />}
          <AvatarFallback className="bg-gradient-to-br from-[#970E2C] to-[#CD2E4F] text-2xl text-white">
            {initialsOf(form.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-semibold">{form.name || 'Unnamed user'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          {role && <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{role}</p>}

          <Button
            variant="outline"
            type="button"
            disabled={uploading}
            className="mt-3 gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload New Photo'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      {!hasEmployeeRecord && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This account has no HR record, so phone, bio and timezone are not stored for it. Your name is saved
            normally.
          </AlertDescription>
        </Alert>
      )}

      {/* Personal */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Personal Information
        </h4>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.name}
              maxLength={50}
              onChange={e => setField('name')(e.target.value)}
              placeholder="Your full name"
              aria-invalid={Boolean(fieldErrors.name)}
              className="h-11"
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={email} disabled readOnly className="h-11" />
            <p className="text-xs text-muted-foreground">
              Contact an administrator to change the address you sign in with.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</h4>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={form.phone}
              disabled={!hasEmployeeRecord}
              onChange={e => setField('phone')(e.target.value)}
              placeholder="+91 98765 43210"
              aria-invalid={Boolean(fieldErrors.phone)}
              className="h-11"
            />
            {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={form.timezone}
              disabled={!hasEmployeeRecord}
              onChange={e => setField('timezone')(e.target.value)}
              placeholder="Asia/Kolkata"
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h4>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={5}
            value={form.bio}
            disabled={!hasEmployeeRecord}
            maxLength={BIO_MAX_LENGTH}
            onChange={e => setField('bio')(e.target.value)}
            placeholder="A short description of your role and responsibilities"
            aria-invalid={Boolean(fieldErrors.bio)}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            {fieldErrors.bio ? (
              <p className="text-xs text-destructive">{fieldErrors.bio}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">
              {form.bio.length} / {BIO_MAX_LENGTH}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        <Button
          variant="ghost"
          onClick={() => { setForm(baseline); setFieldErrors({}); }}
          disabled={!isDirty || saving}
        >
          Discard
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
