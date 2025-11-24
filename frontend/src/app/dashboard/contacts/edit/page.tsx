'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import Layout from '@/components/Layout';

// Define types
interface ContactData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  // add other contact fields as needed
}

// Loading component
function ContactEditLoading() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </Layout>
  );
}

// Content component with useSearchParams
function ContactEditContent() {
  const { useState, useEffect } = React;
  const { useRouter, useSearchParams } = require('next/navigation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId: string | null = searchParams?.get('id');
  
  const [contact, setContact] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const ContactForm = require('@/components/Forms/ContactForm').default;
  const { getContact, updateContact } = require('@/lib/api/index');
  const { ArrowLeft } = require('lucide-react');

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) {
        setError('Contact ID is missing');
        setIsFetching(false);
        return;
      }

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

    fetchContact();
  }, [contactId]);

  const handleSubmit = async (data: ContactData) => {
    if (!contactId) {
      setError('Contact ID is missing');
      return;
    }

    try {
      setIsLoading(true);
      await updateContact(contactId, data);
      setError(null);
      router.push('/dashboard/contact');
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact. Please try again.');
      throw err; // Rethrow to prevent navigation in the form component
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <div className="mt-3">
            <button
              onClick={() => router.push('/dashboard/contact')}
              className="text-blue-600 hover:underline"
            >
              Back to Contacts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/dashboard/contact')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-1" /> Back to Contacts
        </button>
        <h1 className="text-2xl font-bold">Edit Contact</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6">
        {contact && (
          <ContactForm 
            initialData={contact} 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function DashboardEditContactPage() {
  return (
    <Layout>
      <Suspense fallback={<ContactEditLoading />}>
        <ContactEditContent />
      </Suspense>
    </Layout>
  );
}