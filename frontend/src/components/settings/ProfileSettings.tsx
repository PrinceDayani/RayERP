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
    return <div className="animate-pulse space-y-6">
      <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      {saveIndicator && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          Auto-saved
        </div>
      )}
      
      {/* Profile Avatar */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src="/placeholder-avatar.png" />
          <AvatarFallback>{firstName?.[0]}{lastName?.[0]}</AvatarFallback>
        </Avatar>
        <Button variant="outline" type="button">Change Avatar</Button>
      </div>
      
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={handleInputChange(setFirstName)}
            placeholder="Enter first name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={handleInputChange(setLastName)}
            placeholder="Enter last name"
          />
        </div>
      </div>
      
      {/* Contact Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={handleInputChange(setEmail)}
            placeholder="Enter email address"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={handleInputChange(setPhone)}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      {/* Job Title */}
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          value={jobTitle}
          onChange={handleInputChange(setJobTitle)}
          placeholder="Enter job title"
        />
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={handleInputChange(setBio)}
          placeholder="Tell us about yourself"
        />
      </div>
      
      <div className="text-sm text-gray-500">
        Changes are automatically saved as you type
      </div>
    </div>
  );
}