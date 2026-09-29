"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { errorMessage, organizationAPI, type OrganizationProfile } from "@/lib/api/organizationAPI";
import { useCanManageOrganization } from "../_components/useCanManageOrganization";
import ProjectDefaults from "../_components/ProjectDefaults";

const MAX_LOGO_BYTES = 300 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const ADDRESS_FIELDS: { key: keyof OrganizationProfile["address"]; label: string; wide?: boolean }[] = [
  { key: "line1", label: "Address line 1", wide: true },
  { key: "line2", label: "Address line 2", wide: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "postalCode", label: "Postal code" },
  { key: "country", label: "Country" },
];

export default function OrganizationProfilePage() {
  const canManage = useCanManageOrganization();
  const { hasPermission, isRoot } = usePermissions();
  const canEditSettings = isRoot || hasPermission(PERMISSIONS.EDIT_SETTINGS);

  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    organizationAPI.getProfile().then(setProfile).catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed) return <p className="text-sm text-muted-foreground">The organisation profile could not be loaded. Refresh to try again.</p>;
  if (!profile) return <Skeleton className="h-96 w-full" />;

  const set = <K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) =>
    setProfile(prev => prev && { ...prev, [key]: value });
  const setAddress = (key: keyof OrganizationProfile["address"], value: string) =>
    setProfile(prev => prev && { ...prev, address: { ...prev.address, [key]: value } });

  const pickLogo = (file?: File) => {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return toast.error("Logo must be a PNG, JPEG or WebP image");
    if (file.size > MAX_LOGO_BYTES) return toast.error("Logo must be under 300 KB");
    const reader = new FileReader();
    reader.onload = () => set("logo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { timezone: _timezone, ...fields } = profile;
      setProfile(await organizationAPI.updateProfile(fields));
      toast.success("Organisation profile saved");
    } catch (error) {
      toast.error(errorMessage(error, "Could not save the organisation profile"));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: "companyName" | "legalName" | "phone" | "email" | "website" | "gstin" | "pan" | "cin", label: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`org-${key}`}>{label}</Label>
      <Input
        id={`org-${key}`}
        value={profile[key]}
        disabled={!canManage}
        onChange={e => set(key, e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Company identity</CardTitle>
          <CardDescription>Shown on emails, invoices and reports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_220px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("companyName", "Display name")}
            {field("legalName", "Registered legal name")}
            {field("email", "Email")}
            {field("phone", "Phone")}
            <div className="sm:col-span-2">{field("website", "Website", "Include https://")}</div>
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex h-32 items-center justify-center rounded-lg border bg-muted/30 p-2">
              {profile.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logo} alt="Company logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2">
                <input ref={fileInput} type="file" accept={LOGO_TYPES.join(",")} className="hidden" onChange={e => pickLogo(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => fileInput.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                {profile.logo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => set("logo", "")} aria-label="Remove logo">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">PNG, JPEG or WebP, under 300 KB.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registered address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {ADDRESS_FIELDS.map(({ key, label, wide }) => (
              <div key={key} className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={`org-address-${key}`}>{label}</Label>
                <Input
                  id={`org-address-${key}`}
                  value={profile.address[key]}
                  disabled={!canManage}
                  onChange={e => setAddress(key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tax & registration</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {field("gstin", "GSTIN")}
              {field("pan", "PAN")}
              {field("cin", "CIN")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial & regional</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-fiscal">Fiscal year starts (DD-MM)</Label>
                <Input id="org-fiscal" value={profile.fiscalYearStart} maxLength={5} disabled={!canManage} onChange={e => set("fiscalYearStart", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-currency">Base currency</Label>
                <Input id="org-currency" value={profile.currency} maxLength={3} disabled={!canManage} onChange={e => set("currency", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>Business timezone</Label>
                <Input value={profile.timezone} disabled />
                <p className="text-xs text-muted-foreground">Set per deployment (APP_TIMEZONE).</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {canManage && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </div>
      )}

      {canEditSettings && <ProjectDefaults />}
    </div>
  );
}
