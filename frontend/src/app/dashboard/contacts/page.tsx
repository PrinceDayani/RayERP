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
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" onClick={handleImportClick} className="hover:bg-primary/5">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            
            <Button onClick={() => router.push('/dashboard/contacts/new')} className="btn-primary-gradient">
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-modern hover-lift border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-3xl font-bold text-foreground">{allContacts.length}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Active database</p>
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
              
              {/* Action Buttons */}
              <div className="flex gap-2">
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
            </div>
          </div>
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
                  <Card key={contact._id} className="card-modern hover-lift group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-semibold text-lg">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
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
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/contacts/edit/${contact._id}`)}
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
                                  onClick={() => setContactToDelete(contact._id!)}
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
                        <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <a href={`tel:${contact.phone}`} className="text-foreground hover:text-primary transition-colors font-medium">
                            {contact.phone}
                          </a>
                        </div>
                        
                        {contact.email && (
                          <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <a 
                              href={`mailto:${contact.email}`} 
                              className="text-foreground hover:text-primary transition-colors font-medium truncate"
                              title={contact.email}
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
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