'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ContactForm from '@/components/Forms/ContactForm';
import { getContact, updateContact, Contact } from '@/lib/api/index';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function EditContactPage() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const contactId = params?.id as string;

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setIsFetching(true);
        const data = await getContact(contactId);
        setContact(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError('Failed to load contact details. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };

    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  const handleSubmit = async (data: Contact) => {
    try {
      setIsLoading(true);
      setError(null);
      await updateContact(contactId, data);
      // Success - navigation will happen in ContactForm
    } catch (err: any) {
      console.error('Error updating contact:', err);
      
      // Provide more specific error messages
      if (err?.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid contact data. Please check your inputs.');
      } else if (err?.response?.status === 401) {
        setError('You are not authorized to update this contact. Please log in again.');
      } else if (err?.response?.status === 404) {
        setError('Contact not found. It may have been deleted.');
      } else if (err?.code === 'ERR_NETWORK' || err?.name === 'NetworkError') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err?.response?.data?.message || 'Failed to update contact. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/contacts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/contacts')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {contact && (
        <ContactForm 
          initialData={contact} 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
        />
      )}
    </div>
  );
}