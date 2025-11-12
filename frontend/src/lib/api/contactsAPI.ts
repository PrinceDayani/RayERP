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
  createdAt?: Date;
  updatedAt?: Date;
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

export const contactsAPI = {
  getAll: getContacts,
  getById: getContact,
  create: createContact,
  update: updateContact,
  delete: deleteContact,
  search: searchContacts
};

export default contactsAPI;