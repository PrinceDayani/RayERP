// frontend/src/components/settings/ProfileSettings.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from 'react-hot-toast';
import { useRealTimeSetting } from '@/lib/realTimeSettings';
import { CheckCircle } from 'lucide-react';

interface UserProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  bio?: string;
}

export default function ProfileSettings() {
  
  // Real-time settings with auto-save
  const [firstName, setFirstName, firstNameLoading] = useRealTimeSetting('firstName', '');
  const [lastName, setLastName, lastNameLoading] = useRealTimeSetting('lastName', '');
  const [email, setEmail, emailLoading] = useRealTimeSetting('email', '');
  const [phone, setPhone, phoneLoading] = useRealTimeSetting('phone', '');
  const [jobTitle, setJobTitle, jobTitleLoading] = useRealTimeSetting('jobTitle', '');
  const [bio, setBio, bioLoading] = useRealTimeSetting('bio', '');
  
  const isLoading = firstNameLoading || lastNameLoading || emailLoading || phoneLoading || jobTitleLoading || bioLoading;
  const [saveIndicator, setSaveIndicator] = React.useState(false);
  
  // Show save indicator when data changes
  const showSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };
  
  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    showSaveIndicator();
  };
  
  if (isLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="flex items-center gap-6 p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <div className="h-28 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-11 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Auto-save indicator */}
      {saveIndicator && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-950 px-4 py-2 rounded-full border border-green-200 dark:border-green-800 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">Saved</span>
        </div>
      )}
      
      {/* Profile Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-blue-100 dark:border-blue-900">
        <div className="relative group">
          <Avatar className="h-28 w-28 ring-4 ring-white dark:ring-slate-800 shadow-xl">
            <AvatarImage src="/placeholder-avatar.png" />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {firstName?.[0]}{lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span className="text-white text-xs font-medium">Change</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-semibold">{firstName} {lastName}</h3>
          <p className="text-sm text-muted-foreground mt-1">{email}</p>
          <Button variant="outline" type="button" className="mt-3 hover:bg-white dark:hover:bg-slate-800">Upload New Photo</Button>
        </div>
      </div>
      
      {/* Name Fields */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={handleInputChange(setFirstName)}
              placeholder="Enter first name"
              className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={handleInputChange(setLastName)}
              placeholder="Enter last name"
              className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Contact Fields */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              placeholder="your.email@example.com"
              className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={handleInputChange(setPhone)}
              placeholder="+1 (555) 000-0000"
              className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Job Title */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Professional</h4>
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-sm font-medium">Job Title</Label>
          <Input
            id="jobTitle"
            value={jobTitle}
            onChange={handleInputChange(setJobTitle)}
            placeholder="e.g., Senior Developer"
            className="h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
          <Textarea
            id="bio"
            rows={5}
            value={bio}
            onChange={handleInputChange(setBio)}
            placeholder="Tell us about yourself, your interests, and what you do..."
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground">{bio?.length || 0} characters</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <span>All changes are automatically saved as you type</span>
      </div>
    </div>
  );
}