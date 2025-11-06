'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getContact, deleteContact, Contact } from '@/lib/api/index';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  FileText, 
  Tag, 
  User,
  RefreshCw,
  AlertTriangle,
  Calendar
} from 'lucide-react';

export default function ContactDetailPage() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteContact(contactId);
      router.push('/dashboard/contacts');
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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

  if (!contact) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/contacts')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/contacts/edit/${contactId}`)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Contact Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-primary font-semibold text-2xl">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-2xl">{contact.name}</CardTitle>
                  {contact.position && contact.company && (
                    <p className="text-muted-foreground">
                      {contact.position} at {contact.company}
                    </p>
                  )}
                  {contact.position && !contact.company && (
                    <p className="text-muted-foreground">{contact.position}</p>
                  )}
                  {!contact.position && contact.company && (
                    <p className="text-muted-foreground">{contact.company}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${contact.phone}`} className="font-medium hover:text-primary">
                      {contact.phone}
                    </a>
                  </div>
                </div>
                
                {contact.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${contact.email}`} className="font-medium hover:text-primary">
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Company & Address */}
              {(contact.company || contact.address) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contact.company && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{contact.company}</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.address && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{contact.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.alternativePhone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                        <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alternative Phone</p>
                        <a href={`tel:${contact.alternativePhone}`} className="font-medium hover:text-primary">
                          {contact.alternativePhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Notes */}
          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Reference */}
          {contact.reference && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{contact.reference}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {contact.updatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(contact.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}