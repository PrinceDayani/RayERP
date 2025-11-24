"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, apiRequest } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { departmentApi } from '@/lib/api/departments';

export default function CreateEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    departments: [] as string[],
    position: '',
    salary: '',
    hireDate: '',
    status: 'active',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    skills: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('API object:', api);
      console.log('API employees:', (api as any).employees);
      
      const submitData = {
        ...formData,
        salary: parseFloat(formData.salary),
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean)
      };

      if ((api as any).employees && (api as any).employees.create) {
        await (api as any).employees.create(submitData);
      } else {
        // Fallback to direct apiRequest
        await apiRequest('/api/employees', {
          method: 'POST',
          body: JSON.stringify(submitData)
        });
      }
      
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      
      router.push('/dashboard/employees');
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Employee</h1>
          <p className="text-gray-600">Create a new employee record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="departments">Departments (Optional - Select multiple if overseeing multiple departments)</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.departments.map((dept, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm">
                        {dept}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            departments: prev.departments.filter((_, i) => i !== idx)
                          }))}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Select onValueChange={(value) => {
                    if (!formData.departments.includes(value)) {
                      setFormData(prev => ({
                        ...prev,
                        departments: [...prev.departments, value]
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.filter(dept => !formData.departments.includes(dept.name)).map((dept) => (
                        <SelectItem key={dept._id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => handleInputChange('status', value)} defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  placeholder="JavaScript, React, Node.js"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergencyName">Name</Label>
                <Input
                  id="emergencyName"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/employees">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
