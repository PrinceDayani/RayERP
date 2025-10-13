'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getContact, deleteContact } from '@/lib/api/index';
import { FiEdit2, FiTrash2, FiArrowLeft, FiPhone, FiMail, FiMapPin, FiBriefcase, FiTag } from 'react-icons/fi';

export default function ContactDetailPage() {
  const [contact, setContact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams() as { id: string };
  const router = useRouter();
  const contactId = params.id;

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setIsLoading(true);
        const data = await getContact(contactId);
        setContact(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError('Failed to load contact details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contactId);
        router.push('/contacts');
      } catch (err) {
        setError('Failed to delete contact. Please try again.');
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error || 'Contact not found'}
          <div className="mt-3">
            <button
              onClick={() => router.push('/contacts')}
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
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.push('/contacts')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-1" /> Back to Contacts
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/contacts/edit/${contactId}`)}
                className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
                title="Edit Contact"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                title="Delete Contact"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>

          {contact.company && (
            <p className="text-gray-600 mt-1">
              {contact.position ? `${contact.position} at ` : ''}{contact.company}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <FiPhone className="text-gray-500 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Phone</p>
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </div>

              {contact.email && (
                <div className="flex items-start">
                  <FiMail className="text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline break-all">
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.company && (
                <div className="flex items-start">
                  <FiBriefcase className="text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Company</p>
                    <p>{contact.company}</p>
                    {contact.position && (
                      <p className="text-gray-600 text-sm">{contact.position}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {contact.address && (
                <div className="flex items-start">
                  <FiMapPin className="text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Address</p>
                    <p>{contact.address}</p>
                  </div>
                </div>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <div className="flex items-start">
                  <FiTag className="text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contact.tags.map((tag: string, index: number) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {contact.notes && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 font-medium mb-2">Notes</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="whitespace-pre-line">{contact.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}