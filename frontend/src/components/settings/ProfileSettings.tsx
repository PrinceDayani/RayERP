// frontend/src/components/settings/ProfileSettings.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { getSettings, bulkUpdateSettings } from '@/lib/api/index';
import { SettingScope, UserProfileSettings } from '@/types/settings';

export default function ProfileSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a simpler form handling approach without react-hook-form
  const [formData, setFormData] = useState<UserProfileSettings>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    bio: ''
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserProfileSettings, string>>>({});
  
  // Load existing profile settings
  useEffect(() => {
    async function loadProfileSettings() {
      try {
        setIsLoading(true);
        const settings = await getSettings(SettingScope.USER, 'profile', 'keyValue');
        
        if (settings && settings.profile) {
          setFormData(settings.profile as UserProfileSettings);
        }
      } catch (error) {
        console.error('Failed to load profile settings:', error);
        toast({
          title: "Error",
          description: "Failed to load profile settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfileSettings();
  }, [toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name as keyof UserProfileSettings]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof UserProfileSettings, string>> = {};
    
    if (!formData.firstName) {
      errors.firstName = "First name is required";
    }
    
    if (!formData.lastName) {
      errors.lastName = "Last name is required";
    }
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Save all profile settings
      await bulkUpdateSettings([
        { key: 'profile', value: formData }
      ], SettingScope.USER);
      
      toast({
        title: "Success",
        description: "Profile settings updated successfully",
      });
    } catch (error) {
      console.error('Failed to update profile settings:', error);
      toast({
        title: "Error",
        description: "Failed to update profile settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Avatar */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src="/placeholder-avatar.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Button variant="outline" type="button">Change Avatar</Button>
      </div>
      
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
          />
          {formErrors.firstName && (
            <p className="text-sm text-red-500">{formErrors.firstName}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
          />
          {formErrors.lastName && (
            <p className="text-sm text-red-500">{formErrors.lastName}</p>
          )}
        </div>
      </div>
      
      {/* Contact Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          {formErrors.email && (
            <p className="text-sm text-red-500">{formErrors.email}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      {/* Job Title */}
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          name="jobTitle"
          value={formData.jobTitle || ''}
          onChange={handleInputChange}
        />
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio || ''}
          onChange={handleInputChange}
        />
      </div>
      
      {/* Submit Button */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}