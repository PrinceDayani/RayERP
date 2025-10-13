'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ContactForm from '@/components/Forms/ContactForm';
import { getContact, updateContact, Contact } from '@/lib/api/index';
import Layout from '@/components/Layout';

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
      await updateContact(contactId, data);
      setError(null);
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact. Please try again.');
      throw err; // Rethrow to prevent navigation in the form component
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (<Layout>
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div></Layout>
    );
  }

  if (error && !contact) {
    return (<Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <div className="mt-3">
            <button
              onClick={() => router.push('/contacts')}
              className="text-blue-600 hover:underline"
            >
              Back to Contacts
            </button>
          </div>
        </div>
      </div></Layout>
    );
  }

  return (<Layout>
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Edit Contact</h1>
      
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
    </div></Layout>
  );
}