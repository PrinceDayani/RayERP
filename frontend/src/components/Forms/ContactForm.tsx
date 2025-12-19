'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/lib/api/index';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X, User, Mail, Phone, Building2, MapPin, FileText, Tag, AlertTriangle, Globe, Linkedin, Twitter, Calendar, Briefcase, Star, TrendingUp, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactFormProps {
  initialData?: Contact;
  onSubmit: (data: Contact) => Promise<void>;
  isLoading: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Contact>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    notes: '',
    tags: [],
    reference: '',
    alternativePhone: '',
    visibilityLevel: 'personal',
    department: '',
    contactType: 'personal',
    role: '',
    priority: 'medium',
    status: 'active',
    website: '',
    linkedIn: '',
    twitter: '',
    industry: '',
    companySize: '',
    annualRevenue: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        setDepartmentError(null);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDepartments(Array.isArray(data) ? data : []);
        } else {
          setDepartmentError('Failed to load departments');
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartmentError('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.visibilityLevel) {
      newErrors.visibilityLevel = 'Visibility level is required';
    }
    
    if (formData.visibilityLevel === 'departmental' && !formData.department) {
      newErrors.department = 'Department is required for departmental contacts';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Validate website URL format
    if (formData.website && formData.website.trim() && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    // Validate LinkedIn URL format
    if (formData.linkedIn && formData.linkedIn.trim() && !/^https?:\/\/(www\.)?linkedin\.com\//.test(formData.linkedIn)) {
      newErrors.linkedIn = 'Please enter a valid LinkedIn URL';
    }
    
    // Validate Twitter handle format
    if (formData.twitter && formData.twitter.trim() && !/^@?[A-Za-z0-9_]+$/.test(formData.twitter)) {
      newErrors.twitter = 'Please enter a valid Twitter handle (e.g., @username)';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await onSubmit(formData);
      router.push('/dashboard/contacts');
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {initialData ? 'Edit Contact' : 'Add New Contact'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Visibility Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Visibility Level *</Label>
              <Select 
                value={formData.visibilityLevel} 
                onValueChange={(value) => handleSelectChange('visibilityLevel', value)}
                required
              >
                <SelectTrigger className={errors.visibilityLevel ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select visibility level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal - Only visible to you</SelectItem>
                  <SelectItem value="departmental">Departmental - Visible to your department</SelectItem>
                  <SelectItem value="universal">Universal - Visible to everyone</SelectItem>
                </SelectContent>
              </Select>
              {errors.visibilityLevel && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.visibilityLevel}
                </p>
              )}
            </div>

            {formData.visibilityLevel === 'departmental' && (
              <div className="space-y-2">
                <Label>Department *</Label>
                {loadingDepartments ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading departments...</span>
                  </div>
                ) : departmentError ? (
                  <div className="p-2 border border-red-200 rounded-md bg-red-50 text-red-600 text-sm">
                    {departmentError}
                  </div>
                ) : departments.length === 0 ? (
                  <div className="p-2 border rounded-md bg-muted text-sm text-muted-foreground">
                    No departments available
                  </div>
                ) : (
                  <Select 
                    value={typeof formData.department === 'string' ? formData.department : formData.department?._id} 
                    onValueChange={(value) => handleSelectChange('department', value)}
                    disabled={loadingDepartments}
                  >
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.department && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.department}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Contact Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Contact Type</Label>
              <Select value={formData.contactType} onValueChange={(value) => handleSelectChange('contactType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isCustomer"
                checked={formData.isCustomer || false}
                onChange={(e) => setFormData(prev => ({ ...prev, isCustomer: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="isCustomer" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Mark as Customer
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Customers can be selected when creating invoices
            </p>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company || ''}
                onChange={handleChange}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">
                Position/Title
              </Label>
              <Input
                id="position"
                name="position"
                value={formData.position || ''}
                onChange={handleChange}
                placeholder="Enter job title or position"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role
            </Label>
            <Input
              id="role"
              name="role"
              value={formData.role || ''}
              onChange={handleChange}
              placeholder="Enter role or responsibility"
            />
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry
              </Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry || ''}
                onChange={handleChange}
                placeholder="Enter industry"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">
                Company Size
              </Label>
              <Input
                id="companySize"
                name="companySize"
                value={formData.companySize || ''}
                onChange={handleChange}
                placeholder="e.g., 50-100 employees"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="Enter full address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativePhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Alternative Phone
              </Label>
              <Input
                id="alternativePhone"
                name="alternativePhone"
                type="tel"
                value={formData.alternativePhone || ''}
                onChange={handleChange}
                placeholder="Enter alternative phone number"
              />
            </div>
          </div>

          {/* Social Media & Web */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                placeholder="https://example.com"
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.website}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedIn" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedIn"
                name="linkedIn"
                value={formData.linkedIn || ''}
                onChange={handleChange}
                placeholder="LinkedIn profile URL"
                className={errors.linkedIn ? 'border-red-500' : ''}
              />
              {errors.linkedIn && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.linkedIn}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter
              </Label>
              <Input
                id="twitter"
                name="twitter"
                value={formData.twitter || ''}
                onChange={handleChange}
                placeholder="@username"
                className={errors.twitter ? 'border-red-500' : ''}
              />
              {errors.twitter && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.twitter}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">
              Reference/How did you meet?
            </Label>
            <Input
              id="reference"
              name="reference"
              value={formData.reference || ''}
              onChange={handleChange}
              placeholder="e.g., LinkedIn, Conference, Referral from John Doe"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Add any additional notes or comments"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter"
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/contacts')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Contact' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
