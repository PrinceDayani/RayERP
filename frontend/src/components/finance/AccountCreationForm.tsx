'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCreateAccountTypeShortcut } from '@/hooks/useKeyboardShortcuts';
import { toast } from '@/hooks/use-toast';
import AccountCreationForm from '@/components/common/AccountCreationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

interface FinanceAccountCreationFormProps {
  onAccountCreated?: (account: any) => void;
  duplicateFrom?: any;
}

export default function FinanceAccountCreationForm({ onAccountCreated, duplicateFrom }: FinanceAccountCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [accountTypes, setAccountTypes] = useState([
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' }
  ]);
  const [groups, setGroups] = useState<Array<{ value: string; label: string }>>([]);
  const [subGroups, setSubGroups] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showSubGroupDialog, setShowSubGroupDialog] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: '', description: '', nature: 'debit' as 'debit' | 'credit' });
  const [newGroupData, setNewGroupData] = useState({ code: '', name: '', type: 'assets' as 'assets' | 'liabilities' | 'income' | 'expenses', description: '' });
  const [newSubGroupData, setNewSubGroupData] = useState({ code: '', name: '', groupId: '', description: '' });
  const [linkToContact, setLinkToContact] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });

  useCreateAccountTypeShortcut(() => setShowTypeDialog(true));

  useEffect(() => {
    fetchAccountTypes();
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      
      console.log('Fetching groups...');
      const response = await fetch(`${API_URL}/api/general-ledger/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      console.log('Groups response:', data);
      
      if (response.ok && data.success) {
        const groupList = data.data || data.groups || [];
        console.log('Setting groups:', groupList);
        setGroups(groupList.map((g: any) => ({ value: g._id, label: g.name })));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchSubGroups = async (groupId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/general-ledger/sub-groups?groupId=${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSubGroups(data.data.map((sg: any) => ({ value: sg._id, label: sg.name })));
        }
      }
    } catch (error) {
      console.error('Error fetching sub-groups:', error);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchSubGroups(selectedGroup);
    } else {
      setSubGroups([]);
    }
  }, [selectedGroup]);

  const fetchAccountTypes = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/accounts/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const uniqueTypes = Array.from(
            new Map(data.data.map((t: any) => [t.value.toUpperCase(), { value: t.value.toUpperCase(), label: t.label }])).values()
          ) as { value: string; label: string; }[];
          setAccountTypes(uniqueTypes);
        }
      }
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name || !newGroupData.code) {
      toast({ title: 'Error', description: 'Code and name are required', variant: 'destructive' });
      return;
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      console.log('Creating group:', newGroupData);
      const response = await fetch(`${API_URL}/api/general-ledger/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGroupData)
      });
      
      const data = await response.json();
      console.log('Create group response:', data);
      
      if (response.ok && data.success) {
        toast({ title: 'Success', description: 'Group created successfully' });
        setShowGroupDialog(false);
        setNewGroupData({ code: '', name: '', type: 'assets', description: '' });
        await fetchGroups();
      } else {
        throw new Error(data.message || 'Failed to create group');
      }
    } catch (error: any) {
      console.error('Create group error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateSubGroup = async () => {
    if (!newSubGroupData.name || !newSubGroupData.code || !newSubGroupData.groupId) {
      toast({ title: 'Error', description: 'Code, name, and group are required', variant: 'destructive' });
      return;
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`${API_URL}/api/general-ledger/sub-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSubGroupData)
      });
      
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Success', description: 'Sub-group created successfully' });
        setShowSubGroupDialog(false);
        setNewSubGroupData({ code: '', name: '', groupId: '', description: '' });
        if (selectedGroup) fetchSubGroups(selectedGroup);
      } else {
        throw new Error(data.message || 'Failed to create sub-group');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateType = async () => {
    const name = newTypeData.name.trim();
    
    // Validation
    if (!name) {
      toast({ title: 'Error', description: 'Type name is required', variant: 'destructive' });
      return;
    }
    
    if (name.length < 2 || name.length > 50) {
      toast({ title: 'Error', description: 'Name must be between 2 and 50 characters', variant: 'destructive' });
      return;
    }
    
    if (newTypeData.description && newTypeData.description.length > 200) {
      toast({ title: 'Error', description: 'Description must be less than 200 characters', variant: 'destructive' });
      return;
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({ title: 'Error', description: 'Authentication required', variant: 'destructive' });
        return;
      }
      
      const response = await fetch(`${API_URL}/api/accounts/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newTypeData, name })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Account type created successfully' });
        setShowTypeDialog(false);
        setNewTypeData({ name: '', description: '', nature: 'debit' });
        fetchAccountTypes();
      } else {
        throw new Error(data.message || 'Failed to create type');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create account type', variant: 'destructive' });
    }
  };

  const accountFormSections = useMemo(() => [
    {
      id: 'basic',
      label: 'Basic Info',
      fields: [
        { name: 'code', label: 'Account Code', type: 'text' as const, placeholder: 'Auto-generated' },
        { name: 'name', label: 'Account Name', type: 'text' as const, required: true, placeholder: 'Enter account name' },
        { name: 'type', label: 'Account Type', type: 'select' as const, required: true, options: accountTypes },
        { name: 'groupId', label: 'Group', type: 'select' as const, options: groups, onChange: (value: string) => setSelectedGroup(value) },
        { name: 'subGroupId', label: 'Sub Group', type: 'select' as const, options: subGroups },
        { name: 'subType', label: 'Sub Type', type: 'text' as const, placeholder: 'e.g., Current Assets' },
        { name: 'openingBalance', label: 'Opening Balance', type: 'number' as const, step: 0.01, placeholder: '0.00' },
        { name: 'currency', label: 'Currency', type: 'select' as const, options: [
          { value: 'INR', label: 'INR' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }
        ], defaultValue: 'INR' },
        { name: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Account description' }
      ]
    },
    {
      id: 'contact',
      label: 'Contact',
      fields: [
        { name: 'contactInfo.primaryEmail', label: 'Primary Email', type: 'email' as const, placeholder: 'email@example.com' },
        { name: 'contactInfo.primaryPhone', label: 'Primary Phone', type: 'text' as const, placeholder: '+91-XXXXXXXXXX' },
        { name: 'contactInfo.mobile', label: 'Mobile', type: 'text' as const, placeholder: '+91-XXXXXXXXXX' },
        { name: 'contactInfo.address', label: 'Address', type: 'textarea' as const, placeholder: 'Complete address' },
        { name: 'contactInfo.city', label: 'City', type: 'text' as const, placeholder: 'City' },
        { name: 'contactInfo.state', label: 'State', type: 'text' as const, placeholder: 'State' },
        { name: 'contactInfo.pincode', label: 'PIN Code', type: 'text' as const, placeholder: 'PIN Code' }
      ]
    },
    {
      id: 'tax',
      label: 'Tax & GST',
      fields: [
        { name: 'taxInfo.gstNo', label: 'GST Number', type: 'text' as const, placeholder: 'GSTIN' },
        { name: 'taxInfo.panNo', label: 'PAN Number', type: 'text' as const, placeholder: 'PAN' },
        { name: 'taxInfo.taxRate', label: 'Tax Rate (%)', type: 'number' as const, step: 0.01, min: 0, max: 100 },
        { name: 'taxInfo.tdsApplicable', label: 'TDS Applicable', type: 'switch' as const },
        { name: 'taxInfo.tdsRate', label: 'TDS Rate (%)', type: 'number' as const, step: 0.01, min: 0, max: 100 },
        { name: 'taxInfo.tdsSection', label: 'TDS Section', type: 'text' as const, placeholder: 'e.g., 194C' }
      ]
    },
    {
      id: 'bank',
      label: 'Bank Details',
      fields: [
        { name: 'bankDetails.bankName', label: 'Bank Name', type: 'text' as const, placeholder: 'Bank name' },
        { name: 'bankDetails.branch', label: 'Branch', type: 'text' as const, placeholder: 'Branch name' },
        { name: 'bankDetails.accountNumber', label: 'Account Number', type: 'text' as const, placeholder: 'Account number' },
        { name: 'bankDetails.ifscCode', label: 'IFSC Code', type: 'text' as const, placeholder: 'IFSC Code' },
        { name: 'bankDetails.accountType', label: 'Account Type', type: 'select' as const, options: [
          { value: 'savings', label: 'Savings' },
          { value: 'current', label: 'Current' },
          { value: 'cc', label: 'Cash Credit' },
          { value: 'od', label: 'Overdraft' }
        ]}
      ]
    }
  ], [accountTypes, groups, subGroups]);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      
      // Normalize type to uppercase
      if (formData.type) {
        formData.type = formData.type.toUpperCase();
      }
      
      // Set default currency if not provided
      if (!formData.currency) {
        formData.currency = 'INR';
      }
      
      // Create contact if linkToContact is enabled
      let contactId = null;
      if (linkToContact) {
        if (!contactData.name || !contactData.phone) {
          toast({ title: "Error", description: "Contact name and phone are required", variant: "destructive" });
          setLoading(false);
          return;
        }
        
        const contactResponse = await fetch(`${API_URL}/api/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...contactData,
            isCustomer,
            visibilityLevel: 'personal',
            contactType: isCustomer ? 'client' : 'personal',
            status: 'active'
          })
        });
        
        const contactResult = await contactResponse.json();
        if (contactResult.success) {
          contactId = contactResult.data._id;
          toast({ title: "Success", description: `Contact created${isCustomer ? ' as customer' : ''}` });
        } else {
          throw new Error(contactResult.message || 'Failed to create contact');
        }
      }
      
      // Create account with contact link
      const accountPayload = {
        ...formData,
        contactId,
        linkedContact: contactId
      };
      
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(accountPayload)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Account created successfully" });
        onAccountCreated?.(data.data);
      } else {
        throw new Error(data.message || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      toast({ title: "Error", description: error.message || "Failed to create account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="linkToContact"
            checked={linkToContact}
            onChange={(e) => setLinkToContact(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <Label htmlFor="linkToContact" className="text-sm font-medium cursor-pointer">
            Link this account to a contact
          </Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowGroupDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowSubGroupDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Group
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowTypeDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </div>
      
      <AccountCreationForm
        sections={accountFormSections}
        onSubmit={handleSubmit}
        initialData={duplicateFrom}
        loading={loading}
      />
      
      {linkToContact && (
        <div className="mt-6 p-6 border rounded-lg bg-blue-50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900">Contact Details</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCustomer"
                checked={isCustomer}
                onChange={(e) => setIsCustomer(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="isCustomer" className="text-sm font-medium text-blue-900 cursor-pointer">
                Mark as Customer
              </Label>
            </div>
          </div>
          <p className="text-sm text-blue-700">This contact will be automatically created and linked to this account.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-blue-900">Contact Name *</Label>
              <Input
                value={contactData.name}
                onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                placeholder="Enter contact name"
                required
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-blue-900">Phone *</Label>
              <Input
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                placeholder="+91-XXXXXXXXXX"
                required
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-blue-900">Email</Label>
              <Input
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                placeholder="email@example.com"
                className="bg-white"
              />
            </div>
            <div>
              <Label className="text-blue-900">Company</Label>
              <Input
                value={contactData.company}
                onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                placeholder="Company name"
                className="bg-white"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-blue-900">Address</Label>
              <Input
                value={contactData.address}
                onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                placeholder="Complete address"
                className="bg-white"
              />
            </div>
          </div>
          
          {isCustomer && (
            <div className="p-3 bg-green-100 border border-green-300 rounded-md">
              <p className="text-sm text-green-800 font-medium">
                ✓ This contact will be marked as a customer and will appear in invoice creation.
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <Input value={newGroupData.code} onChange={(e) => setNewGroupData({ ...newGroupData, code: e.target.value })} placeholder="e.g., CASH" />
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={newGroupData.name} onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })} placeholder="e.g., Cash" />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={newGroupData.type} onValueChange={(v: any) => setNewGroupData({ ...newGroupData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="liabilities">Liabilities</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newGroupData.description} onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubGroupDialog} onOpenChange={setShowSubGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sub-Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <Input value={newSubGroupData.code} onChange={(e) => setNewSubGroupData({ ...newSubGroupData, code: e.target.value })} placeholder="e.g., PCASH" />
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={newSubGroupData.name} onChange={(e) => setNewSubGroupData({ ...newSubGroupData, name: e.target.value })} placeholder="e.g., Petty Cash" />
            </div>
            <div>
              <Label>Group *</Label>
              <Select value={newSubGroupData.groupId} onValueChange={(v) => setNewSubGroupData({ ...newSubGroupData, groupId: v })}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newSubGroupData.description} onChange={(e) => setNewSubGroupData({ ...newSubGroupData, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubGroupDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateSubGroup}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type Name *</Label>
              <Input
                value={newTypeData.name}
                onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                placeholder="e.g., Fixed Assets"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newTypeData.description}
                onChange={(e) => setNewTypeData({ ...newTypeData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Nature *</Label>
              <Select value={newTypeData.nature} onValueChange={(v: 'debit' | 'credit') => setNewTypeData({ ...newTypeData, nature: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit (Assets, Expenses)</SelectItem>
                  <SelectItem value="credit">Credit (Liabilities, Revenue, Equity)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateType}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
