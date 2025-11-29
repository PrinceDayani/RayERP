'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Copy, Save, RefreshCw, Building2, CreditCard, FileText, MapPin, Phone, Mail, Banknote } from 'lucide-react';
import { PANInput } from '@/components/ui/pan-input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

interface AccountFormData {
  code: string;
  name: string;
  type: string;
  subType: string;
  category: string;
  description: string;
  notes: string;
  openingBalance: number;
  currency: string;
  isActive: boolean;
  contactInfo: {
    primaryEmail: string;
    secondaryEmail: string;
    primaryPhone: string;
    secondaryPhone: string;
    mobile: string;
    fax: string;
    website: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  taxInfo: {
    gstNo: string;
    panNo: string;
    aadharNo: string;
    tanNo: string;
    cinNo: string;
    taxRate: number;
    tdsApplicable: boolean;
    tdsRate: number;
    tdsSection: string;
    tdsCategory: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    accountType: string;
    swiftCode: string;
  };
  creditLimit: number;
  tags: string[];
  isUniversal: boolean;
}

interface AccountType {
  value: string;
  label: string;
  description: string;
}

export default function UniversalAccountCreator({ onAccountCreated, duplicateFrom }: {
  onAccountCreated?: (account: any) => void;
  duplicateFrom?: any;
}) {
  const [formData, setFormData] = useState<AccountFormData>({
    code: '',
    name: '',
    type: '',
    subType: '',
    category: '',
    description: '',
    notes: '',
    openingBalance: 0,
    currency: 'INR',
    isActive: true,
    contactInfo: {
      primaryEmail: '',
      secondaryEmail: '',
      primaryPhone: '',
      secondaryPhone: '',
      mobile: '',
      fax: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    },
    taxInfo: {
      gstNo: '',
      panNo: '',
      aadharNo: '',
      tanNo: '',
      cinNo: '',
      taxRate: 0,
      tdsApplicable: false,
      tdsRate: 0,
      tdsSection: '',
      tdsCategory: 'individual'
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branch: '',
      accountType: 'savings',
      swiftCode: ''
    },
    creditLimit: 0,
    tags: [],
    isUniversal: false
  });

  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(false);
  const [codeEditable, setCodeEditable] = useState(false);

  useEffect(() => {
    fetchAccountTypes();
    if (duplicateFrom) {
      populateFromDuplicate(duplicateFrom);
    }
  }, [duplicateFrom]);

  const fetchAccountTypes = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/accounts/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAccountTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const populateFromDuplicate = (account: any) => {
    setFormData({
      ...formData,
      ...account,
      code: '', // Will be auto-generated
      name: `${account.name} (Copy)`,
      contactInfo: account.contactInfo || formData.contactInfo,
      taxInfo: account.taxInfo || formData.taxInfo,
      bankDetails: account.bankDetails || formData.bankDetails
    });
  };

  const generateAccountCode = async () => {
    if (!formData.type) {
      toast({
        title: "Error",
        description: "Please select account type first",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: formData.type, name: 'temp' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, code: data.data.code }));
        // Delete the temporary account
        await fetch(`${API_URL}/api/accounts/${data.data._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Account created successfully"
        });
        onAccountCreated?.(data.data);
        resetForm();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      code: '',
      name: '',
      description: '',
      notes: '',
      openingBalance: 0,
      contactInfo: {
        ...formData.contactInfo,
        primaryEmail: '',
        primaryPhone: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
      },
      taxInfo: {
        ...formData.taxInfo,
        gstNo: '',
        panNo: '',
        tdsApplicable: false,
        tdsRate: 0,
        tdsSection: ''
      },
      bankDetails: {
        ...formData.bankDetails,
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branch: ''
      }
    });
  };

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof AccountFormData],
        [field]: value
      }
    }));
  };

  const tdsCategories = [
    { value: 'individual', label: 'Individual' },
    { value: 'company', label: 'Company' },
    { value: 'firm', label: 'Firm' },
    { value: 'other', label: 'Other' }
  ];

  const bankAccountTypes = [
    { value: 'savings', label: 'Savings' },
    { value: 'current', label: 'Current' },
    { value: 'cc', label: 'Cash Credit' },
    { value: 'od', label: 'Overdraft' }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Universal Account Creator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create comprehensive account with all details
            </p>
          </div>
          <Badge variant="outline">Finance Mode</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Address</TabsTrigger>
              <TabsTrigger value="tax">Tax & GST</TabsTrigger>
              <TabsTrigger value="bank">Bank Details</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Account Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Auto-generated"
                      readOnly={!codeEditable}
                      className={!codeEditable ? 'bg-muted' : ''}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCodeEditable(!codeEditable)}
                    >
                      {codeEditable ? 'Lock' : 'Edit'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAccountCode}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter account name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Account Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subType">Sub Type</Label>
                  <Input
                    id="subType"
                    value={formData.subType}
                    onChange={(e) => setFormData(prev => ({ ...prev, subType: e.target.value }))}
                    placeholder="e.g., Current Assets, Fixed Assets"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Cash & Bank, Inventory"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Opening Balance</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    step="0.01"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Account description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes or instructions"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryEmail">Primary Email</Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    value={formData.contactInfo.primaryEmail}
                    onChange={(e) => updateFormData('contactInfo', 'primaryEmail', e.target.value)}
                    placeholder="primary@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryEmail">Secondary Email</Label>
                  <Input
                    id="secondaryEmail"
                    type="email"
                    value={formData.contactInfo.secondaryEmail}
                    onChange={(e) => updateFormData('contactInfo', 'secondaryEmail', e.target.value)}
                    placeholder="secondary@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryPhone">Primary Phone</Label>
                  <Input
                    id="primaryPhone"
                    value={formData.contactInfo.primaryPhone}
                    onChange={(e) => updateFormData('contactInfo', 'primaryPhone', e.target.value)}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.contactInfo.mobile}
                    onChange={(e) => updateFormData('contactInfo', 'mobile', e.target.value)}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.contactInfo.website}
                    onChange={(e) => updateFormData('contactInfo', 'website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.contactInfo.fax}
                    onChange={(e) => updateFormData('contactInfo', 'fax', e.target.value)}
                    placeholder="Fax number"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Address Details</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.contactInfo.address}
                    onChange={(e) => updateFormData('contactInfo', 'address', e.target.value)}
                    placeholder="Complete address"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.contactInfo.city}
                      onChange={(e) => updateFormData('contactInfo', 'city', e.target.value)}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={formData.contactInfo.state}
                      onValueChange={(value) => updateFormData('contactInfo', 'state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.contactInfo.country}
                      onChange={(e) => updateFormData('contactInfo', 'country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input
                      id="pincode"
                      value={formData.contactInfo.pincode}
                      onChange={(e) => updateFormData('contactInfo', 'pincode', e.target.value)}
                      placeholder="PIN Code"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tax" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Tax & GST Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNo">GST Number</Label>
                  <Input
                    id="gstNo"
                    value={formData.taxInfo.gstNo}
                    onChange={(e) => updateFormData('taxInfo', 'gstNo', e.target.value)}
                    placeholder="GSTIN"
                  />
                </div>

                <PANInput
                  value={formData.taxInfo.panNo}
                  onChange={(value) => updateFormData('taxInfo', 'panNo', value)}
                  label="PAN Number"
                  placeholder="AAAAA9999A"
                />

                <div className="space-y-2">
                  <Label htmlFor="tanNo">TAN Number</Label>
                  <Input
                    id="tanNo"
                    value={formData.taxInfo.tanNo}
                    onChange={(e) => updateFormData('taxInfo', 'tanNo', e.target.value)}
                    placeholder="TAN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cinNo">CIN Number</Label>
                  <Input
                    id="cinNo"
                    value={formData.taxInfo.cinNo}
                    onChange={(e) => updateFormData('taxInfo', 'cinNo', e.target.value)}
                    placeholder="CIN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxInfo.taxRate}
                    onChange={(e) => updateFormData('taxInfo', 'taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">TDS Configuration</h4>
                    <p className="text-sm text-muted-foreground">Tax Deducted at Source settings</p>
                  </div>
                  <Switch
                    checked={formData.taxInfo.tdsApplicable}
                    onCheckedChange={(checked) => updateFormData('taxInfo', 'tdsApplicable', checked)}
                  />
                </div>

                {formData.taxInfo.tdsApplicable && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="tdsRate">TDS Rate (%)</Label>
                      <Input
                        id="tdsRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.taxInfo.tdsRate}
                        onChange={(e) => updateFormData('taxInfo', 'tdsRate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tdsSection">TDS Section</Label>
                      <Input
                        id="tdsSection"
                        value={formData.taxInfo.tdsSection}
                        onChange={(e) => updateFormData('taxInfo', 'tdsSection', e.target.value)}
                        placeholder="e.g., 194C, 194J"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tdsCategory">TDS Category</Label>
                      <Select
                        value={formData.taxInfo.tdsCategory}
                        onValueChange={(value) => updateFormData('taxInfo', 'tdsCategory', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tdsCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Bank Account Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankDetails.bankName}
                    onChange={(e) => updateFormData('bankDetails', 'bankName', e.target.value)}
                    placeholder="Bank name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={formData.bankDetails.branch}
                    onChange={(e) => updateFormData('bankDetails', 'branch', e.target.value)}
                    placeholder="Branch name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => updateFormData('bankDetails', 'accountNumber', e.target.value)}
                    placeholder="Account number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={(e) => updateFormData('bankDetails', 'ifscCode', e.target.value)}
                    placeholder="IFSC Code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={formData.bankDetails.accountType}
                    onValueChange={(value) => updateFormData('bankDetails', 'accountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    value={formData.bankDetails.swiftCode}
                    onChange={(e) => updateFormData('bankDetails', 'swiftCode', e.target.value)}
                    placeholder="SWIFT Code (for international)"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Universal Account</Label>
                    <p className="text-sm text-muted-foreground">Available across all companies</p>
                  </div>
                  <Switch
                    checked={formData.isUniversal}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUniversal: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">Account is active and can be used</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
              {duplicateFrom && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Copy className="w-3 h-3" />
                  Duplicating from: {duplicateFrom.name}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}