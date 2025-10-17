'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ContactForm from '@/components/Forms/ContactForm';
import { createContact, Contact } from '@/lib/api/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function NewContactPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: Contact) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await createContact(data);
      
      setSuccess(true);
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        router.push('/dashboard/contacts');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating contact:', err);
      
      // Handle different types of errors
      if (err.response?.status === 401) {
        setError('You are not authorized. Please log in again.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid contact data. Please check your inputs.');
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to create contact. Please try again.');
      }
      
      throw err; // Rethrow to prevent navigation in the form component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Contact</h1>
        <p className="text-muted-foreground mt-2">
          Create a new contact to add to your address book.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Contact created successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}