'use client';

import React, { useState } from 'react';
import ContactForm from '@/components/Forms/ContactForm';
import { createContact, Contact } from '@/lib/api/index';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function NewContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (data: Contact) => {
    try {
      setIsLoading(true);
      setError(null);
      await createContact(data);
      // Success - navigation will happen in ContactForm
    } catch (err: any) {
      console.error('Error creating contact:', err);
      
      // Provide more specific error messages
      if (err?.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid contact data. Please check your inputs.');
      } else if (err?.response?.status === 401) {
        setError('You are not authorized to create contacts. Please log in again.');
      } else if (err?.response?.status === 409) {
        setError('A contact with this phone number already exists.');
      } else if (err?.code === 'ERR_NETWORK' || err?.name === 'NetworkError') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err?.response?.data?.message || 'Failed to create contact. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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
      
      <ContactForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}