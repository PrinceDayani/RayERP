// path: frontend/src/lib/contactsAPI.ts
import api from './api';

export interface Contact {
  _id?: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  reference?: string;
  alternativePhone?: string;
  
  // Advanced categorization fields
  contactType?: 'company' | 'personal' | 'vendor' | 'client' | 'partner';
  department?: string;
  role?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'inactive' | 'archived';
  
  // Additional contact info
  website?: string;
  linkedIn?: string;
  twitter?: string;
  birthday?: Date;
  anniversary?: Date;
  
  // Business details
  industry?: string;
  companySize?: string;
  annualRevenue?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactFilterOptions {
  companies: string[];
  departments: string[];
  roles: string[];
  industries: string[];
  tags: string[];
  contactTypes: string[];
  priorities: string[];
  statuses: string[];
}

export interface ContactStats {
  total: number;
  byType: Array<{
    type: string;
    priority: string;
    status: string;
  }>;
}

export interface ContactFilterParams {
  contactType?: string;
  company?: string;
  department?: string;
  role?: string;
  priority?: string;
  status?: string;
  tags?: string[];
  industry?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Get all contacts
export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get('/contacts');
  return response.data;
};

// Get a single contact
export const getContact = async (id: string): Promise<Contact> => {
  const response = await api.get(`/contacts/${id}`);
  return response.data;
};

// Create a new contact
export const createContact = async (contactData: Contact): Promise<Contact> => {
  const response = await api.post('/contacts', contactData);
  return response.data;
};

// Update an existing contact
export const updateContact = async (id: string, contactData: Partial<Contact>): Promise<Contact> => {
  const response = await api.put(`/contacts/${id}`, contactData);
  return response.data;
};

// Delete a contact
export const deleteContact = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};

// Search contacts
export const searchContacts = async (query: string): Promise<Contact[]> => {
  const response = await api.get(`/contacts/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

// Filter contacts with advanced options
export const filterContacts = async (params: ContactFilterParams): Promise<{
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  const response = await api.get(`/contacts/filter?${queryParams.toString()}`);
  return response.data;
};

// Get contact statistics and filter options
export const getContactStats = async (): Promise<{
  stats: ContactStats;
  filterOptions: ContactFilterOptions;
}> => {
  const response = await api.get('/contacts/stats');
  return response.data;
};

export const contactsAPI = {
  getAll: getContacts,
  getById: getContact,
  create: createContact,
  update: updateContact,
  delete: deleteContact,
  search: searchContacts,
  filter: filterContacts,
  getStats: getContactStats
};

// Health check function
export const checkContactsAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/contacts/stats');
    return response.status === 200;
  } catch (error) {
    console.error('Contacts API health check failed:', error);
    return false;
  }
};

export default contactsAPI;