'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getContacts, searchContacts, deleteContact, createContact, Contact } from '@/lib/api/index';
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
  AlertTriangle
} from 'lucide-react';
import Layout from '@/components/Layout';
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
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import Papa, { ParseConfig } from 'papaparse';

type FilterOptions = {
  tags: string[];
  company: string[];
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ tags: [], company: [] });
  const [activeFilters, setActiveFilters] = useState<{
    tags: string[],
    company: string[]
  }>({ tags: [], company: [] });
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const data = await getContacts();
      setContacts(data);
      setAllContacts(data);
      
      // Extract unique filter options
      const tagOptions = new Set<string>();
      const companyOptions = new Set<string>();
      
      data.forEach(contact => {
        if (contact.company) companyOptions.add(contact.company);
        if (contact.tags && contact.tags.length > 0) {
          contact.tags.forEach(tag => tagOptions.add(tag));
        }
      });
      
      setFilterOptions({
        tags: Array.from(tagOptions),
        company: Array.from(companyOptions)
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to load contacts. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setIsRefreshing(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        setIsLoading(true);
        const results = await searchContacts(searchQuery);
        setContacts(results);
      } catch (err) {
        setError('Search failed. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      applyFilters(allContacts);
    }
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
    } catch (err) {
      setError('Failed to delete contact. Please try again.');
      console.error(err);
    }
  };

  const applyFilters = (contactsToFilter: Contact[]) => {
    if (activeFilters.tags.length === 0 && activeFilters.company.length === 0) {
      setContacts(contactsToFilter);
      return;
    }

    const filtered = contactsToFilter.filter(contact => {
      const companyMatch = activeFilters.company.length === 0 || 
        (contact.company && activeFilters.company.includes(contact.company));
      
      const tagMatch = activeFilters.tags.length === 0 || 
        (contact.tags && contact.tags.some(tag => activeFilters.tags.includes(tag)));
      
      return companyMatch && tagMatch;
    });
    
    setContacts(filtered);
  };

  const toggleFilter = (type: 'tags' | 'company', value: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...prev[type]];
      const index = currentFilters.indexOf(value);
      
      if (index === -1) {
        currentFilters.push(value);
      } else {
        currentFilters.splice(index, 1);
      }
      
      const newFilters = {
        ...prev,
        [type]: currentFilters
      };
      
      // Apply the updated filters
      applyFilters(searchQuery ? allContacts.filter(c => {
        const name = c.name?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        const company = c.company?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               phone.includes(query) || 
               company.includes(query);
      }) : allContacts);
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setActiveFilters({ tags: [], company: [] });
    setContacts(allContacts);
  };

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

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-muted-foreground">Manage your contact database</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportContacts}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            
            <Button onClick={() => router.push('/dashboard/contacts/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-semibold text-foreground">{allContacts.length}</p>
                </div>
                <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center">
                  <Users className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-2xl font-semibold text-foreground">{filterOptions.company.length}</p>
                </div>
                <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center">
                  <Building2 className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Tags</p>
                  <p className="text-2xl font-semibold text-foreground">{filterOptions.tags.length}</p>
                </div>
                <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center">
                  <Tag className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
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

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-muted-foreground" size={18} />
                  </div>
                  <button type="submit" hidden>Search</button>
                </div>
              </form>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className={countActiveFilters() > 0 ? 'border-primary text-primary' : ''}>
                      <Filter className="mr-2 h-4 w-4" /> 
                      Filters
                      {countActiveFilters() > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
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
            </div>
          </div>
        ) : (
          <>
            {/* Contacts Grid */}
            {contacts.length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">No contacts found</p>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || countActiveFilters() > 0
                        ? 'Try changing your search criteria or filters'
                        : 'Get started by adding your first contact'
                      }
                    </p>
                    <Button onClick={() => router.push('/dashboard/contacts/new')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact) => (
                  <Card key={contact._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate text-foreground">
                            {contact.name}
                          </CardTitle>
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
                        
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/contacts/edit/${contact._id}`)}
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
                                  onClick={() => setContactToDelete(contact._id!)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Contact</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Phone className="text-muted-foreground mr-2 h-4 w-4" />
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                        
                        {contact.email && (
                          <div className="flex items-center">
                            <Mail className="text-muted-foreground mr-2 h-4 w-4" />
                            <a 
                              href={`mailto:${contact.email}`} 
                              className="text-primary hover:underline truncate"
                              title={contact.email}
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-secondary/80"
                              onClick={() => toggleFilter('tags', tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{contact.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Notes preview */}
                      {contact.notes && (
                        <div>
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
      </div>
      
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
    </Layout>
  );
}