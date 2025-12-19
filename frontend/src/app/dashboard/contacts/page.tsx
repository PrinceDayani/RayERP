'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocketContext } from '@/contexts/socket/SocketContext';
import { getContacts, searchContacts, deleteContact, createContact, Contact, filterContacts, getContactStats, ContactFilterOptions, ContactStats, ContactFilterParams } from '@/lib/api/index';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Filter,
  Download,
  Upload,
  X,
  ChevronDown,
  RefreshCw,
  Users,
  Building2,
  Tag,
  FileText,
  AlertTriangle,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  TrendingUp,
  Briefcase,
  Star,
  Archive,
  Eye,
  MoreVertical
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Papa, { ParseConfig } from 'papaparse';
import ContactsDiagnostic from '@/components/ContactsDiagnostic';

type FilterOptions = {
  tags: string[];
  company: string[];
  departments: Array<string | { _id: string; name: string }>;
  roles: string[];
  contactTypes: string[];
  priorities: string[];
  statuses: string[];
  industries: string[];
};

const CONTACT_TYPE_COLORS: Record<string, string> = {
  company: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  personal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  vendor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  client: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  partner: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    tags: [], company: [], departments: [], roles: [], contactTypes: [],
    priorities: [], statuses: [], industries: []
  });
  const [contactStats, setContactStats] = useState<ContactStats>({ total: 0, byType: [] });
  const [advancedFilters, setAdvancedFilters] = useState<ContactFilterParams>({});
  const [currentView, setCurrentView] = useState<'all' | 'company' | 'personal' | 'vendor' | 'client' | 'partner'>('all');
  const [activeFilters, setActiveFilters] = useState<{
    tags: string[],
    company: string[]
  }>({ tags: [], company: [] });
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    fetchContacts();
  }, []);

  // Real-time socket listeners with proper state updates
  useEffect(() => {
    if (!socket) return;

    const handleContactCreated = (newContact: Contact) => {
      setContacts(prev => {
        const exists = prev.some(c => c._id === newContact._id);
        return exists ? prev : [newContact, ...prev];
      });
      setAllContacts(prev => {
        const exists = prev.some(c => c._id === newContact._id);
        return exists ? prev : [newContact, ...prev];
      });
    };

    const handleContactUpdated = (updatedContact: Contact) => {
      setContacts(prev => {
        const exists = prev.some(c => c._id === updatedContact._id);
        if (exists) {
          return prev.map(c => c._id === updatedContact._id ? updatedContact : c);
        } else {
          // Contact became visible (e.g., changed to universal), add it
          return [updatedContact, ...prev];
        }
      });
      setAllContacts(prev => {
        const exists = prev.some(c => c._id === updatedContact._id);
        if (exists) {
          return prev.map(c => c._id === updatedContact._id ? updatedContact : c);
        } else {
          return [updatedContact, ...prev];
        }
      });
    };

    const handleContactDeleted = (contactId: string) => {
      setContacts(prev => prev.filter(c => c._id !== contactId));
      setAllContacts(prev => prev.filter(c => c._id !== contactId));
    };

    socket.on('contact:created', handleContactCreated);
    socket.on('contact:updated', handleContactUpdated);
    socket.on('contact:deleted', handleContactDeleted);

    return () => {
      socket.off('contact:created', handleContactCreated);
      socket.off('contact:updated', handleContactUpdated);
      socket.off('contact:deleted', handleContactDeleted);
    };
  }, [socket]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [contactsData, statsData] = await Promise.all([
        getContacts(),
        getContactStats()
      ]);

      setContacts(contactsData || []);
      setAllContacts(contactsData || []);
      setContactStats(statsData?.stats || { total: 0, byType: [] });

      // Set enhanced filter options with fallbacks
      setFilterOptions({
        tags: statsData?.filterOptions?.tags || [],
        company: statsData?.filterOptions?.companies || [],
        departments: statsData?.filterOptions?.departments || [],
        roles: statsData?.filterOptions?.roles || [],
        contactTypes: statsData?.filterOptions?.contactTypes || ['personal', 'company', 'vendor', 'client', 'partner'],
        priorities: statsData?.filterOptions?.priorities || ['low', 'medium', 'high', 'critical'],
        statuses: statsData?.filterOptions?.statuses || ['active', 'inactive', 'archived'],
        industries: statsData?.filterOptions?.industries || []
      });

    } catch (err: any) {
      console.error('Error fetching contacts:', err);

      // Provide more specific error messages
      if (err?.response?.status === 401) {
        setError('You are not authorized to view contacts. Please log in again.');
      } else if (err?.code === 'ERR_NETWORK' || err?.name === 'NetworkError') {
        setError('Network error. Please check your connection and server status.');
      } else {
        setError(err?.response?.data?.message || 'Failed to load contacts. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setIsRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by useEffect
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id);
      const updatedContacts = contacts.filter(contact => contact._id !== id);
      setContacts(updatedContacts);
      setAllContacts(allContacts.filter(contact => contact._id !== id));
      setSuccess('Contact deleted successfully');
      setContactToDelete(null);

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting contact:', err);

      if (err?.response?.status === 404) {
        setError('Contact not found. It may have already been deleted.');
      } else if (err?.response?.status === 401) {
        setError('You are not authorized to delete this contact.');
      } else {
        setError(err?.response?.data?.message || 'Failed to delete contact. Please try again.');
      }
    }
  };

  // Remove applyFilters function as it's now inline in useEffect

  const toggleFilter = (type: 'tags' | 'company', value: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...prev[type]];
      const index = currentFilters.indexOf(value);

      if (index === -1) {
        currentFilters.push(value);
      } else {
        currentFilters.splice(index, 1);
      }

      return {
        ...prev,
        [type]: currentFilters
      };
    });
  };

  useEffect(() => {
    let filtered = allContacts;

    // Apply view filter first
    if (currentView !== 'all') {
      filtered = filtered.filter(c => (c.contactType || 'personal') === currentView);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const name = c.name?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        const company = c.company?.toLowerCase() || '';
        const department = typeof c.department === 'string' ? c.department?.toLowerCase() : (c.department?.name?.toLowerCase() || '');
        const role = c.role?.toLowerCase() || '';

        return name.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          company.includes(query) ||
          department.includes(query) ||
          role.includes(query);
      });
    }

    // Apply advanced filters
    if (advancedFilters.company) {
      filtered = filtered.filter(c => c.company?.toLowerCase().includes(advancedFilters.company!.toLowerCase()));
    }
    if (advancedFilters.department) {
      const deptId = typeof advancedFilters.department === 'string' ? advancedFilters.department : '';
      filtered = filtered.filter(c => {
        const contactDept = typeof c.department === 'object' ? c.department?._id : c.department;
        return contactDept === deptId;
      });
    }
    if (advancedFilters.role) {
      filtered = filtered.filter(c => c.role?.toLowerCase().includes(advancedFilters.role!.toLowerCase()));
    }
    if (advancedFilters.priority) {
      filtered = filtered.filter(c => (c.priority || 'medium') === advancedFilters.priority);
    }
    if (advancedFilters.status) {
      filtered = filtered.filter(c => (c.status || 'active') === advancedFilters.status);
    }
    if (advancedFilters.visibilityLevel) {
      filtered = filtered.filter(c => (c.visibilityLevel || 'personal') === advancedFilters.visibilityLevel);
    }

    // Apply legacy active filters inline to avoid dependency issues
    if (activeFilters.tags.length === 0 && activeFilters.company.length === 0) {
      setContacts(filtered);
      return;
    }

    const finalFiltered = filtered.filter(contact => {
      const companyMatch = activeFilters.company.length === 0 ||
        (contact.company && activeFilters.company.includes(contact.company));

      const tagMatch = activeFilters.tags.length === 0 ||
        (contact.tags && contact.tags.some(tag => activeFilters.tags.includes(tag)));

      return companyMatch && tagMatch;
    });

    setContacts(finalFiltered);
  }, [activeFilters, searchQuery, allContacts, currentView, advancedFilters]);

  const clearFilters = () => {
    setActiveFilters({ tags: [], company: [] });
    setAdvancedFilters({});
    setSearchQuery('');
    setCurrentView('all');
  };

  const getContactTypeStats = useMemo(() => {
    if (!Array.isArray(allContacts)) return {};
    return allContacts.reduce((acc, contact) => {
      const type = contact.contactType || 'personal';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allContacts]);

  const exportContacts = () => {
    try {
      const dataToExport = contacts.map(contact => ({
        Name: contact.name,
        Email: contact.email || '',
        Phone: contact.phone,
        Company: contact.company || '',
        Position: contact.position || '',
        Address: contact.address || '',
        Notes: contact.notes || '',
        Tags: contact.tags ? contact.tags.join(', ') : ''
      }));

      const csv = Papa.unparse(dataToExport);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('Contacts exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export contacts. Please try again.');
      console.error(err);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;

        Papa.parse<any>(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            if (results.errors.length > 0) {
              setError(`Error parsing CSV: ${results.errors[0].message}`);
              return;
            }

            const importedContacts = results.data.map((row: any) => {
              const name = row.Name || row.name || row.NAME || '';
              const email = row.Email || row.email || row.EMAIL || '';
              const phone = row.Phone || row.phone || row.PHONE || '';
              const company = row.Company || row.company || row.COMPANY || '';
              const position = row.Position || row.position || row.POSITION || row.Title || row.title || '';
              const address = row.Address || row.address || row.ADDRESS || '';
              const notes = row.Notes || row.notes || row.NOTES || '';
              const tags = (row.Tags || row.tags || row.TAGS || '')
                .split(',')
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag !== '');

              if (!name || !phone) {
                throw new Error('Name and phone are required for all contacts');
              }

              return {
                name,
                email,
                phone,
                company,
                position,
                address,
                notes,
                tags
              };
            });

            let successCount = 0;
            let errorCount = 0;

            for (const contact of importedContacts) {
              try {
                await createContact(contact);
                successCount++;
              } catch (err) {
                console.error('Failed to import contact:', contact, err);
                errorCount++;
              }
            }

            const updatedContacts = await getContacts();
            setContacts(updatedContacts);
            setAllContacts(updatedContacts);

            if (errorCount > 0) {
              setError(`Imported ${successCount} contacts with ${errorCount} errors.`);
            } else {
              setSuccess(`Successfully imported ${successCount} contacts.`);
              setTimeout(() => setSuccess(null), 3000);
            }

            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          },
          error: (error: Error, file: File) => {
            setError(`Error parsing CSV: ${error.message}`);
          }
        });
      } catch (err: any) {
        setError(`Import failed: ${err.message}`);
        console.error(err);
      }
    };

    reader.readAsText(file);
  };

  const countActiveFilters = () => {
    return activeFilters.tags.length + activeFilters.company.length;
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c._id!));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedContacts.length} selected contacts?`)) {
      try {
        await Promise.all(selectedContacts.map(id => deleteContact(id)));
        const updatedContacts = contacts.filter(c => !selectedContacts.includes(c._id!));
        setContacts(updatedContacts);
        setAllContacts(allContacts.filter(c => !selectedContacts.includes(c._id!)));
        setSelectedContacts([]);
        setSuccess(`Successfully deleted ${selectedContacts.length} contacts`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete some contacts. Please try again.');
      }
    }
  };

  const exportSelectedContacts = () => {
    const contactsToExport = contacts.filter(c => selectedContacts.includes(c._id!));
    if (contactsToExport.length === 0) return;

    const dataToExport = contactsToExport.map(contact => ({
      Name: contact.name,
      Email: contact.email || '',
      Phone: contact.phone,
      Company: contact.company || '',
      Position: contact.position || '',
      Address: contact.address || '',
      Notes: contact.notes || '',
      Tags: contact.tags ? contact.tags.join(', ') : ''
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `selected_contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess(`Exported ${contactsToExport.length} selected contacts`);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Contacts
          </h1>
          <p className="text-muted-foreground mt-1">Manage your contact database with advanced filtering and search</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          {selectedContacts.length > 0 && (
            <div className="flex gap-2 mr-2">
              <Button variant="outline" size="sm" onClick={exportSelectedContacts}>
                <Download className="mr-2 h-4 w-4" /> Export Selected ({selectedContacts.length})
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hover:bg-primary/5">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportContacts}>
                <FileText className="mr-2 h-4 w-4" />
                Export All to CSV
              </DropdownMenuItem>
              {selectedContacts.length > 0 && (
                <DropdownMenuItem onClick={exportSelectedContacts}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Selected ({selectedContacts.length})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={handleImportClick} className="hover:bg-primary/5">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>

          <div className="flex items-center gap-2 mr-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button onClick={() => router.push('/dashboard/contacts/new')} className="btn-primary-gradient">
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      {/* Contact Type Tabs */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All ({allContacts.length})
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company ({getContactTypeStats.company || 0})
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personal ({getContactTypeStats.personal || 0})
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Vendor ({getContactTypeStats.vendor || 0})
          </TabsTrigger>
          <TabsTrigger value="client" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Client ({getContactTypeStats.client || 0})
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Partner ({getContactTypeStats.partner || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={currentView} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                    <p className="text-3xl font-bold text-foreground">{allContacts.length}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {contacts.length !== allContacts.length ? `${contacts.length} filtered` : 'Active database'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern hover-lift border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Companies</p>
                    <p className="text-3xl font-bold text-foreground">{filterOptions.company.length}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Organizations</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern hover-lift border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Tags</p>
                    <p className="text-3xl font-bold text-foreground">{filterOptions.tags.length}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Categories</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedContacts.length > 0 && (
              <Card className="card-modern hover-lift border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Selected</p>
                      <p className="text-3xl font-bold text-foreground">{selectedContacts.length}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Ready for action</p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                      <Checkbox className="h-6 w-6 text-orange-600 dark:text-orange-400" checked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error/Success Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <AlertDescription className="flex justify-between items-center">
            <span>{success}</span>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Contacts Summary */}
      {selectedContacts.length > 0 && (
        <Card className="card-modern border-orange-200 bg-orange-50/50 dark:bg-orange-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Checkbox className="h-4 w-4 text-orange-600" checked />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Choose an action to perform on selected contacts
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportSelectedContacts}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedContacts([])}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search contacts by name, email, phone, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus:bg-background h-11"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-muted-foreground h-4 w-4" />
                </div>
                <button type="submit" hidden>Search</button>
              </div>
            </form>

            {/* Advanced Filter Controls */}
            <div className="flex flex-wrap gap-2">
              <Select value={advancedFilters.company || 'all'} onValueChange={(value) =>
                setAdvancedFilters(prev => ({ ...prev, company: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {filterOptions.company.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={advancedFilters.department || 'all'} onValueChange={(value) =>
                setAdvancedFilters(prev => ({ ...prev, department: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {filterOptions.departments.map(dept => (
                    <SelectItem key={typeof dept === 'string' ? dept : dept._id} value={typeof dept === 'string' ? dept : dept._id}>
                      {typeof dept === 'string' ? dept : dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={advancedFilters.role || 'all'} onValueChange={(value) =>
                setAdvancedFilters(prev => ({ ...prev, role: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {filterOptions.roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={advancedFilters.priority || 'all'} onValueChange={(value) =>
                setAdvancedFilters(prev => ({ ...prev, priority: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={advancedFilters.status || 'all'} onValueChange={(value) =>
                setAdvancedFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={advancedFilters.visibilityLevel || 'all'} onValueChange={(value) =>
                setAdvancedFilters(prev => ({ ...prev, visibilityLevel: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="universal">🌐 Universal</SelectItem>
                  <SelectItem value="departmental">🏢 Departmental</SelectItem>
                  <SelectItem value="personal">👤 Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {contacts.length > 0 && (
                <div
                  onClick={selectAllContacts}
                  className="flex items-center gap-2 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              )}

              <Button
                variant="outline"
                onClick={refreshData}
                disabled={isRefreshing}
                className="hover:bg-primary/5"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`hover:bg-primary/5 ${countActiveFilters() > 0 ? 'border-primary text-primary bg-primary/5' : ''}`}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {countActiveFilters() > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                        {countActiveFilters()}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-foreground">Filter Contacts</h3>
                      {countActiveFilters() > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Clear all
                        </Button>
                      )}
                    </div>

                    {/* Company Filter */}
                    {filterOptions.company.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Company</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {filterOptions.company.map((company) => (
                            <div key={company} className="flex items-center space-x-2">
                              <Checkbox
                                id={`company-${company}`}
                                checked={activeFilters.company.includes(company)}
                                onCheckedChange={() => toggleFilter('company', company)}
                              />
                              <label
                                htmlFor={`company-${company}`}
                                className="text-sm text-foreground cursor-pointer"
                              >
                                {company}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags Filter */}
                    {filterOptions.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Tags</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {filterOptions.tags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={activeFilters.tags.includes(tag)}
                                onCheckedChange={() => toggleFilter('tags', tag)}
                              />
                              <label
                                htmlFor={`tag-${tag}`}
                                className="text-sm text-foreground cursor-pointer"
                              >
                                {tag}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Filters Display */}
          {countActiveFilters() > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              {activeFilters.company.map(company => (
                <Badge key={`company-${company}`} variant="secondary" className="flex items-center gap-1">
                  Company: {company}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => toggleFilter('company', company)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {activeFilters.tags.map(tag => (
                <Badge key={`tag-${tag}`} variant="secondary" className="flex items-center gap-1">
                  Tag: {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => toggleFilter('tags', tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6">
                Clear all filters
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading contacts...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take a few moments</p>
          </div>
        </div>
      ) : error ? (
        <Card className="card-modern">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">Error Loading Contacts</p>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {error}
              </p>
              <div className="flex gap-3 justify-center mb-6">
                <Button onClick={refreshData} className="btn-primary-gradient">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
                <Button variant="outline" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
              <ContactsDiagnostic />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Contacts Grid */}
          {contacts.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-foreground mb-2">No contacts found</p>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchQuery || countActiveFilters() > 0
                      ? 'Try adjusting your search criteria or clearing filters to see more results'
                      : 'Get started by adding your first contact to build your network'
                    }
                  </p>
                  <Button onClick={() => router.push('/dashboard/contacts/new')} className="btn-primary-gradient">
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <Card key={contact._id} className={`card-modern hover-lift group cursor-pointer transition-all ${selectedContacts.includes(contact._id!) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`} onClick={() => router.push(`/dashboard/contacts/${contact._id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleContactSelection(contact._id!);
                            }}
                            className="flex-shrink-0"
                          >
                            <Checkbox
                              checked={selectedContacts.includes(contact._id!)}
                            />
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-semibold text-lg">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate text-foreground">
                            {contact.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-xs ${CONTACT_TYPE_COLORS[contact.contactType || 'personal'] || 'bg-gray-100 text-gray-800'}`}>
                              {contact.contactType || 'personal'}
                            </Badge>
                            <Badge className={`text-xs ${PRIORITY_COLORS[contact.priority || 'medium'] || 'bg-yellow-100 text-yellow-800'}`}>
                              {contact.priority || 'medium'}
                            </Badge>
                            {contact.visibilityLevel && (
                              <Badge className={`text-xs ${contact.visibilityLevel === 'universal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                  contact.visibilityLevel === 'departmental' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                {contact.visibilityLevel === 'universal' ? '🌐 Universal' :
                                  contact.visibilityLevel === 'departmental' ? '🏢 Departmental' :
                                    '👤 Personal'}
                              </Badge>
                            )}
                          </div>
                          {contact.company && (
                            <CardDescription className="flex items-center mt-1">
                              <Building2 className="h-4 w-4 mr-1" />
                              {contact.company}
                            </CardDescription>
                          )}
                          {contact.position && (
                            <p className="text-sm text-muted-foreground mt-1">{contact.position}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/contacts/edit/${contact._id}`);
                                }}
                                className="hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Contact</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContactToDelete(contact._id!);
                                }}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Contact</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-foreground font-medium">
                            {contact.phone}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${contact.phone}`);
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>

                      {contact.email && (
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span
                              className="text-foreground font-medium truncate"
                              title={contact.email}
                            >
                              {contact.email}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${contact.email}`);
                            }}
                            className="hover:bg-green-50 hover:text-green-600 flex-shrink-0"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {contact.address && (
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                              <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span
                              className="text-foreground font-medium truncate"
                              title={contact.address}
                            >
                              {contact.address}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(contact.address || '')}`);
                            }}
                            className="hover:bg-orange-50 hover:text-orange-600 flex-shrink-0"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Department and Role */}
                    {(contact.department || contact.role) && (
                      <div className="flex flex-wrap gap-2">
                        {contact.department && (
                          <Badge variant="outline" className="text-xs">
                            Dept: {typeof contact.department === 'string' ? contact.department : contact.department.name}
                          </Badge>
                        )}
                        {contact.role && (
                          <Badge variant="outline" className="text-xs">
                            Role: {contact.role}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Customer Status */}
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-foreground font-medium">
                          Customer Status
                        </span>
                      </div>
                      <Checkbox
                        checked={contact.isCustomer || false}
                        className="h-5 w-5"
                        readOnly
                      />
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {contact.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => toggleFilter('tags', tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-muted">
                            +{contact.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Notes preview */}
                    {contact.notes && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {contact.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && handleDelete(contactToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
