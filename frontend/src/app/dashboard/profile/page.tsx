"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Edit2, Save, X, Download, Camera, User, Mail, Phone, Building2, Calendar, Shield, Briefcase, MapPin, Loader2, Info, FileText, Linkedin, Github, Twitter, Globe, ExternalLink, Plus, Trash2, Upload, File, Bell, Clock, Users, FolderKanban, Share2, QrCode, Printer, FileJson, History, Monitor, LogOut } from "lucide-react";
import { PasswordChangeDialog } from "@/components/settings/PasswordChangeDialog";
import type { ProfileData, ProfileFormData, Project, Role, Skill, Document, NotificationSettings, LoginHistory, ActiveSession } from "@/types/employee-profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
];

const ROLE_COLORS: Record<string, string> = {
  root: "bg-red-500",
  super_admin: "bg-purple-500",
  superadmin: "bg-purple-500",
  admin: "bg-orange-500",
  manager: "bg-green-500",
  default: "bg-blue-500"
};

const SKILL_LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-gray-500",
  Intermediate: "bg-blue-500",
  Advanced: "bg-green-500",
  Expert: "bg-purple-500"
};

const getRoleColor = (role: string | Role): string => {
  const roleName = (typeof role === "string" ? role : role?.name || "").toLowerCase();
  return ROLE_COLORS[roleName] || ROLE_COLORS.default;
};

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    phone: "",
    skills: [],
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    bio: "",
    socialLinks: {},
    notificationSettings: {
      email: { projectUpdates: true, taskAssignments: true, mentions: true, weeklyDigest: true, systemAlerts: true },
      sms: { urgentTasks: false, deadlineReminders: false, projectUpdates: false, taskAssignments: false, mentions: false, systemAlerts: false }
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [validationErrors, setValidationErrors] = useState<{ phone?: string; name?: string }>({});

  useEffect(() => {
    fetchCompleteProfile();
    fetchLoginHistory();
    fetchActiveSessions();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchCompleteProfile = async () => {
    setError(null);
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }
      const response = await fetch(`${API_URL}/api/users/profile/complete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
        } else if (response.status === 404) {
          setError("Profile not found.");
        } else {
          setError(`Failed to load profile (${response.status})`);
        }
        return;
      }
      const data = await response.json();
      setProfileData(data);
      setDocuments(data.employee?.documents || []);
      setFormData({
        name: data.user.name || "",
        phone: data.employee?.phone || "",
        skills: Array.isArray(data.employee?.skills) 
          ? data.employee.skills.map((s: any) => 
              typeof s === 'string' ? { skill: s, level: 'Intermediate' as const } : s
            )
          : [],
        address: data.employee?.address || { street: "", city: "", state: "", zipCode: "", country: "" },
        bio: data.employee?.bio || "",
        socialLinks: data.employee?.socialLinks || {},
        notificationSettings: data.employee?.notificationSettings || {
          email: { projectUpdates: true, taskAssignments: true, mentions: true, weeklyDigest: true, systemAlerts: true },
          sms: { urgentTasks: false, deadlineReminders: false, projectUpdates: false, taskAssignments: false, mentions: false, systemAlerts: false }
        },
        timezone: data.employee?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch (error) {
      setError("Network error. Please check your connection.");
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    // Enhanced phone validation: supports international formats
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    return cleaned;
  };

  const validateURL = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateName = (name: string): boolean => {
    return name.trim().length > 0;
  };

  const handleFormChange = (updates: Partial<ProfileFormData>) => {
    const newFormData = { ...formData, ...updates };
    
    // Deduplicate skills by name
    if (updates.skills) {
      const seen = new Set<string>();
      const uniqueSkills = updates.skills.filter(s => {
        if (s.skill && !seen.has(s.skill.toLowerCase())) {
          seen.add(s.skill.toLowerCase());
          return true;
        }
        return false;
      });
      newFormData.skills = uniqueSkills;
    }
    
    // Format phone number
    if (updates.phone !== undefined) {
      newFormData.phone = formatPhoneNumber(updates.phone);
    }
    
    setFormData(newFormData);
    setHasUnsavedChanges(true);
    
    const errors: { phone?: string; name?: string } = {};
    if (updates.phone !== undefined) {
      if (!validatePhone(newFormData.phone)) errors.phone = "Invalid phone format (e.g., +1234567890)";
    }
    if (updates.name !== undefined) {
      if (!validateName(updates.name)) errors.name = "Name is required";
    }
    setValidationErrors(prev => ({ ...prev, ...errors }));
  };

  const handleSave = async () => {
    if (!validateName(formData.name)) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast({ title: "Error", description: "Please fix validation errors", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        toast({ title: "Error", description: "Authentication required", variant: "destructive" });
        return;
      }
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.message || "Failed to update profile", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Profile updated successfully" });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      fetchCompleteProfile();
    } catch (error) {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: Document['type']) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only PDF, DOC, DOCX, JPG, PNG files allowed", variant: "destructive" });
      e.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
      e.target.value = '';
      return;
    }

    setUploadingDoc(true);
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        toast({ title: "Error", description: "Authentication required", variant: "destructive" });
        return;
      }
      const formData = new FormData();
      formData.append("document", file);
      formData.append("type", docType);
      const response = await fetch(`${API_URL}/api/users/profile/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.message || "Failed to upload document", variant: "destructive" });
        return;
      }
      const result = await response.json();
      setDocuments(prev => [...prev, result.document]);
      toast({ title: "Success", description: "Document uploaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDocumentDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_URL}/api/users/profile/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
        return;
      }
      setDocuments(prev => prev.filter(d => d._id !== docId));
      toast({ title: "Success", description: "Document deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocTypeColor = (type: Document['type']): string => {
    switch (type) {
      case 'Resume': return 'bg-blue-500';
      case 'Certificate': return 'bg-green-500';
      case 'ID': return 'bg-orange-500';
      case 'Other': return 'bg-gray-500';
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, and WebP images are allowed", variant: "destructive" });
      e.target.value = '';
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        toast({ title: "Error", description: "Authentication required", variant: "destructive" });
        return;
      }
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch(`${API_URL}/api/users/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.message || "Failed to upload image", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Profile picture uploaded" });
      fetchCompleteProfile();
    } catch (error) {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const generateResume = () => {
    if (!profileData) return;
    const { user, employee, projects } = profileData;
    const resumeContent = `
${user.name}
${user.email} | ${employee?.phone || 'N/A'}

${'='.repeat(60)}
PROFESSIONAL SUMMARY
${'='.repeat(60)}
Position: ${employee?.position || 'Employee'}
Department: ${employee?.department || 'N/A'}
Joined: ${employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
Employee ID: ${employee?.employeeId || 'N/A'}

${'='.repeat(60)}
SKILLS
${'='.repeat(60)}
${employee?.skills?.join(', ') || 'No skills listed'}

${'='.repeat(60)}
PROJECTS (${projects?.length || 0})
${'='.repeat(60)}
${projects?.map((p: any) => `
• ${p.name}
  Status: ${p.status} | Progress: ${p.progress}%
  Duration: ${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}
  Priority: ${p.priority}`).join('\n') || 'No projects assigned'}
    `.trim();

    const blob = new Blob([resumeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.name.replace(/\s+/g, "_")}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Resume downloaded successfully" });
  };

  const exportAsPDF = () => {
    window.print();
    toast({ title: "Info", description: "Use 'Save as PDF' in print dialog" });
  };

  const exportAsDOC = () => {
    if (!profileData) return;
    const { user, employee, projects } = profileData;
    const docContent = `${user.name}\r\n${user.email} | ${employee?.phone || 'N/A'}\r\n\r\nPROFESSIONAL SUMMARY\r\nPosition: ${employee?.position || 'Employee'}\r\nDepartment: ${employee?.department || 'N/A'}\r\nJoined: ${employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}\r\nEmployee ID: ${employee?.employeeId || 'N/A'}\r\n\r\nSKILLS\r\n${employee?.skills?.join(', ') || 'No skills listed'}\r\n\r\nPROJECTS (${projects?.length || 0})\r\n${projects?.map((p: any) => `• ${p.name}\r\n  Status: ${p.status} | Progress: ${p.progress}%\r\n  Duration: ${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}\r\n  Priority: ${p.priority}`).join('\r\n') || 'No projects assigned'}`;
    const blob = new Blob([docContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.name.replace(/\s+/g, "_")}_Resume.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Resume exported as DOC" });
  };

  const exportProfileJSON = () => {
    if (!profileData) return;
    const exportData = { user: profileData.user, employee: profileData.employee, projects: profileData.projects, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profileData.user.name.replace(/\s+/g, "_")}_Profile.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Profile exported as JSON" });
  };

  const copyProfileURL = () => {
    const profileURL = `${window.location.origin}/profile/${profileData?.user._id}`;
    navigator.clipboard.writeText(profileURL);
    toast({ title: "Success", description: "Profile URL copied to clipboard" });
  };

  const generateQRCode = () => {
    const profileURL = `${window.location.origin}/profile/${profileData?.user._id}`;
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileURL)}`;
    window.open(qrURL, '_blank');
    toast({ title: "Success", description: "QR Code opened in new tab" });
  };

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;
      const response = await fetch(`${API_URL}/api/users/login-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch login history');
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;
      const response = await fetch(`${API_URL}/api/users/active-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch active sessions');
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_URL}/api/users/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Session revoked successfully" });
        fetchActiveSessions();
      } else {
        toast({ title: "Error", description: "Failed to revoke session", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4" role="alert" aria-live="assertive">
              <p className="text-destructive font-medium">{error}</p>
              <Button onClick={fetchCompleteProfile} aria-label="Retry loading profile">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Skeleton className="h-28 w-28 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { user, employee, projects } = profileData;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and view your work history</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <PasswordChangeDialog />
          {employee && (
            <Button onClick={generateResume} variant="outline" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Download Resume
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} aria-label="Edit profile information" className="flex-1 sm:flex-none">
              <Edit2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={loading} aria-label="Save profile changes" className="flex-1 sm:flex-none">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4 mr-2" aria-hidden="true" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => {
                if (hasUnsavedChanges && !confirm("You have unsaved changes. Are you sure you want to cancel?")) {
                  return;
                }
                setIsEditing(false);
                setHasUnsavedChanges(false);
                setValidationErrors({});
              }} disabled={loading} aria-label="Cancel editing" className="flex-1 sm:flex-none">
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative mx-auto sm:mx-0">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl">
                {employee?.avatarUrl ? (
                  <img src={`${API_URL}${employee.avatarUrl}`} alt="Profile" className="object-cover" />
                ) : (
                  <AvatarFallback className={`${getRoleColor(user?.role)} text-white text-4xl font-bold`}>
                    {employee?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              {isEditing && (
                <>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    aria-label="Upload profile picture"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                    disabled={uploading}
                    aria-label={uploading ? "Uploading profile picture" : "Change profile picture"}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                  </Button>
                </>
              )}
            </div>
              <div className="space-y-2 text-center sm:text-left">
                <CardTitle className="text-2xl sm:text-3xl">{user?.name}</CardTitle>
                <p className="text-lg text-muted-foreground">{employee?.position || "Employee"}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    {typeof user?.role === "string" ? user.role : user?.role?.name || "user"}
                  </Badge>
                  {employee?.status && <Badge className="capitalize">{employee.status}</Badge>}
                </div>
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                Full Name
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input 
                    id="profile-name" 
                    value={formData.name} 
                    onChange={(e) => handleFormChange({ name: e.target.value })} 
                    aria-required="true"
                    className={validationErrors.name ? "border-destructive" : ""}
                    aria-invalid={!!validationErrors.name}
                    aria-describedby={validationErrors.name ? "name-error" : undefined}
                  />
                  {validationErrors.name && (
                    <p id="name-error" className="text-xs text-destructive" role="alert">{validationErrors.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-medium">{user?.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
                <span className="inline-flex items-center gap-1 text-xs" title="Email cannot be changed for security reasons">
                  <Info className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Email cannot be changed for security reasons</span>
                </span>
              </Label>
              <p className="text-lg font-medium" id="profile-email">{user?.email}</p>
              {isEditing && (
                <p className="text-xs text-muted-foreground">Email cannot be changed for security reasons</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Phone
              </Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input 
                    id="profile-phone"
                    value={formData.phone} 
                    onChange={(e) => handleFormChange({ phone: e.target.value })}
                    className={validationErrors.phone ? "border-destructive" : ""}
                    aria-invalid={!!validationErrors.phone}
                    aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                  />
                  {validationErrors.phone && (
                    <p id="phone-error" className="text-xs text-destructive" role="alert">{validationErrors.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-medium">{employee?.phone || "Not provided"}</p>
              )}
            </div>
          </div>

          <Separator />
          <div className="space-y-2">
            <Label htmlFor="profile-bio" className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              About Me
            </Label>
            {isEditing ? (
              <div className="space-y-1">
                <Textarea
                  id="profile-bio"
                  placeholder="Tell us about yourself, your expertise, and what you're passionate about..."
                  value={formData.bio}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 500);
                    handleFormChange({ bio: value });
                  }}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            ) : (
              <p className="text-lg whitespace-pre-wrap">
                {formData.bio || "No bio provided"}
              </p>
            )}
          </div>

          <Separator />
          <div className="space-y-4">
            <Label className="text-muted-foreground">Social Links (Optional)</Label>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2 text-sm">
                    <Linkedin className="h-4 w-4" aria-hidden="true" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.socialLinks.linkedin || ""}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="flex items-center gap-2 text-sm">
                    <Github className="h-4 w-4" aria-hidden="true" />
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    value={formData.socialLinks.github || ""}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2 text-sm">
                    <Twitter className="h-4 w-4" aria-hidden="true" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/username"
                    value={formData.socialLinks.twitter || ""}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio" className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                    Portfolio
                  </Label>
                  <Input
                    id="portfolio"
                    placeholder="https://yourwebsite.com"
                    value={formData.socialLinks.portfolio || ""}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, portfolio: e.target.value } })}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {formData.socialLinks.linkedin && (
                  <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {formData.socialLinks.github && (
                  <a href={formData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Github className="h-4 w-4" />
                    GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {formData.socialLinks.twitter && (
                  <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Twitter className="h-4 w-4" />
                    Twitter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {formData.socialLinks.portfolio && (
                  <a href={formData.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Globe className="h-4 w-4" />
                    Portfolio
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {!formData.socialLinks.linkedin && !formData.socialLinks.github && !formData.socialLinks.twitter && !formData.socialLinks.portfolio && (
                  <p className="text-muted-foreground">No social links provided</p>
                )}
              </div>
            )}
          </div>

          {employee && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </Label>
                  <p className="text-lg font-medium">{employee?.department || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Position
                  </Label>
                  <p className="text-lg font-medium">{employee?.position || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Hire Date
                  </Label>
                  <p className="text-lg font-medium">
                    {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Employee ID</Label>
                  <p className="text-lg font-medium">{employee?.employeeId || "N/A"}</p>
                </div>
              </div>

              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Skills & Proficiency</Label>
                  {isEditing && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          skills: [...formData.skills, { skill: "", level: "Intermediate" }]
                        });
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    {formData.skills.map((skill, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Skill name"
                          value={skill.skill}
                          onChange={(e) => {
                            const newSkills = [...formData.skills];
                            newSkills[idx] = { ...newSkills[idx], skill: e.target.value };
                            handleFormChange({ skills: newSkills });
                          }}
                          className="flex-1"
                        />
                        <Select
                          value={skill.level}
                          onValueChange={(value: any) => {
                            const newSkills = [...formData.skills];
                            newSkills[idx] = { ...newSkills[idx], level: value };
                            setFormData({ ...formData, skills: newSkills });
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newSkills = formData.skills.filter((_, i) => i !== idx);
                            setFormData({ ...formData, skills: newSkills });
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.skills.length === 0 && (
                      <p className="text-sm text-muted-foreground">No skills added. Click "Add Skill" to get started.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.length > 0 ? (
                      formData.skills.map((skill, idx) => (
                        <Badge key={idx} className={`${SKILL_LEVEL_COLORS[skill.level]} text-white`}>
                          {skill.skill} • {skill.level}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No skills listed</p>
                    )}
                  </div>
                )}
              </div>

              {employee?.address && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Street"
                          value={formData.address.street}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                        />
                        <Input
                          placeholder="City"
                          value={formData.address.city}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                        />
                        <Input
                          placeholder="State"
                          value={formData.address.state}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                        />
                        <Input
                          placeholder="Zip Code"
                          value={formData.address.zipCode}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                        />
                        <Input
                          placeholder="Country"
                          value={formData.address.country}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                        />
                      </div>
                    ) : (
                      <p className="text-lg">
                        {[employee.address.street, employee.address.city, employee.address.state, employee.address.zipCode, employee.address.country]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {employee?.supervisor && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Reporting Structure
                    </Label>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {employee.supervisor.name?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.supervisor.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.supervisor.position || "Supervisor"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Project Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project: Project) => (
                <div key={project._id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                      <Badge variant={project.priority === "high" ? "destructive" : "outline"}>
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Progress: <span className="font-medium text-foreground">{project.progress}%</span></span>
                    {project.team && project.team.length > 0 && (
                      <span className="text-muted-foreground">Team: <span className="font-medium text-foreground">{project.team.length} members</span></span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/projects/${project._id}`}>
                      View Project
                    </Button>
                    {project.team && project.team.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/projects/${project._id}#team`}>
                        <Users className="h-4 w-4 mr-2" />
                        View Team
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Email Notifications</Label>
              <div className="space-y-3">
                {[
                  { key: 'projectUpdates', label: 'Project Updates', desc: 'Get notified about project status changes' },
                  { key: 'taskAssignments', label: 'Task Assignments', desc: 'Receive alerts when tasks are assigned to you' },
                  { key: 'mentions', label: 'Mentions', desc: 'Get notified when someone mentions you' },
                  { key: 'systemAlerts', label: 'System Alerts', desc: 'Important system notifications and updates' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notificationSettings?.email[key as keyof NotificationSettings['email']] ?? true}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            notificationSettings: {
                              ...formData.notificationSettings!,
                              email: {
                                ...formData.notificationSettings!.email,
                                [key]: e.target.checked
                              }
                            }
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">SMS Notifications</Label>
              <div className="space-y-3">
                {[
                  { key: 'projectUpdates', label: 'Project Updates', desc: 'Get SMS for critical project changes' },
                  { key: 'taskAssignments', label: 'Task Assignments', desc: 'Receive SMS when urgent tasks are assigned' },
                  { key: 'mentions', label: 'Mentions', desc: 'Get SMS when mentioned in important discussions' },
                  { key: 'systemAlerts', label: 'System Alerts', desc: 'Critical system notifications via SMS' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notificationSettings?.sms[key as keyof NotificationSettings['sms']] ?? false}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            notificationSettings: {
                              ...formData.notificationSettings!,
                              sms: {
                                ...formData.notificationSettings!.sms,
                                [key]: e.target.checked
                              }
                            }
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <Label className="text-base font-semibold">Timezone</Label>
              </div>
              <Select
                value={formData.timezone}
                onValueChange={(value) => {
                  setFormData({ ...formData, timezone: value });
                  setHasUnsavedChanges(true);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Current time: {new Date().toLocaleString('en-US', { timeZone: formData.timezone })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Resume', 'Certificate', 'ID', 'Other'].map((type) => (
                <div key={type}>
                  <input
                    type="file"
                    id={`doc-${type}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentUpload(e, type as Document['type'])}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById(`doc-${type}`)?.click()}
                    disabled={uploadingDoc}
                  >
                    {uploadingDoc ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {type}
                  </Button>
                </div>
              ))}
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge className={`${getDocTypeColor(doc.type)} text-white text-xs`}>{doc.type}</Badge>
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`${API_URL}${doc.url}`, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDocumentDelete(doc._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="h-5 w-5" />
                <Label className="text-base font-semibold">Login History</Label>
              </div>
              {loginHistory.length > 0 ? (
                <div className="space-y-2">
                  {loginHistory.map((login) => (
                    <div key={login._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{new Date(login.timestamp).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {login.ipAddress} • {login.userAgent.split(' ')[0]}
                        </p>
                      </div>
                      <Badge variant={login.success ? "default" : "destructive"}>
                        {login.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No login history available</p>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-5 w-5" />
                <Label className="text-base font-semibold">Active Sessions</Label>
              </div>
              {activeSessions.length > 0 ? (
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div key={session._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.deviceInfo}</p>
                          {session.current && <Badge variant="outline">Current</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.deviceInfo} • {session.ipAddress}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                      {!session.current && (
                        <Button size="sm" variant="ghost" onClick={() => revokeSession(session._id)}>
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No active sessions</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Export & Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Export Profile</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" onClick={exportAsPDF} className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" onClick={exportAsDOC} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  DOC
                </Button>
                <Button variant="outline" onClick={generateResume} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
                <Button variant="outline" onClick={exportProfileJSON} className="w-full">
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-base font-semibold mb-3 block">Share Profile</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" onClick={copyProfileURL} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Profile URL
                </Button>
                <Button variant="outline" onClick={generateQRCode} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: Project) => (
                <Card key={project._id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status:</span>
                      <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Priority:</span>
                      <Badge variant={project.priority === "high" ? "destructive" : "outline"}>
                        {project.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Progress:</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
