'use client';

import React, { useState } from 'react';
import ContactForm from '@/components/Forms/ContactForm';
import { createContact, Contact } from '@/lib/api/index';
import Layout from '@/components/Layout';

export default function NewContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Contact) => {
    try {
      setIsLoading(true);
      await createContact(data);
      setError(null);
    } catch (err) {
      console.error('Error creating contact:', err);
      setError('Failed to create contact. Please try again.');
      throw err; // Rethrow to prevent navigation in the form component
    } finally {
      setIsLoading(false);
    }
  };

  return (<Layout>
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Add New Contact</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContactForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div></Layout>
  );
}